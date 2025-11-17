import { Client, Collection, GatewayIntentBits, Partials } from "discord.js";
import express from "express";
import fs from "fs";
import cron from "node-cron";
import path from "path";
import SpotifyWebApi from "spotify-web-api-node";
import { pathToFileURL } from "url";
import { moriUtils } from "./utils/mori.js";
import { parseState, setToken } from "./utils/token.js";
const { TOKEN, PORT, SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URI } = process.env;
const spotifyApi = new SpotifyWebApi({
    clientId: SPOTIFY_CLIENT_ID,
    clientSecret: SPOTIFY_CLIENT_SECRET,
    redirectUri: SPOTIFY_REDIRECT_URI,
});
const stateMap = new Map();
export { spotifyApi, stateMap };
const app = express();
app.get("/", async (req, res) => {
    const { code, state } = req.query;
    if (code && state && typeof code === "string" && typeof state === "string")
        try {
            let payload = parseState(state);
            if (!payload)
                return res.status(200).json({ status: "error", message: "Invalid state format" });
            let { user_id, url_state } = payload;
            let authorizeData = stateMap.get(user_id);
            if (!authorizeData)
                throw new Error(user_id + " is not set on stateMap.");
            let { channel_id, saved_state } = authorizeData;
            if (url_state !== saved_state)
                return res.status(401).json({ status: "error", message: "Invalid state" });
            let data = await spotifyApi.authorizationCodeGrant(code);
            await setToken(user_id, data.body);
            stateMap.delete(user_id);
            let user = client.users.cache.get(user_id);
            let channel = client.channels.cache.get(channel_id);
            if (!user || !channel || !("send" in channel))
                return;
            await channel.send(`Successfully authorized, ${user.toString()}`);
            const ua = req.headers["user-agent"]?.toLowerCase() ?? "";
            const isMobile = ua.includes("iphone") ||
                ua.includes("ipad") ||
                ua.includes("android") ||
                ua.includes("mobile");
            if (isMobile)
                res.redirect(channel.url);
            else
                res.send(`<script>window.close();</script>`);
            return;
        }
        catch (error) {
            console.error("Error getting Tokens:", error);
            return res.status(500).send("An Error Occured.");
        }
    return res.status(200).json({ status: "ok", message: "still running!" });
});
const server = app.listen(PORT, () => console.log("Listening on port " + PORT));
const { Guilds, GuildMessages, DirectMessages, MessageContent } = GatewayIntentBits;
const { Channel, Message } = Partials;
const client = new Client({
    intents: [Guilds, GuildMessages, DirectMessages, MessageContent],
    partials: [Channel, Message],
});
client.commands = new Collection();
const commandsPath = path.join(import.meta.dirname, "commands"); // ./commands
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js")); // ["mori.js", ...]
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file); // ./commands/mori.js
    const command = await import(pathToFileURL(filePath).href); // file:///./commands/mori.js
    if ("data" in command && "execute" in command)
        client.commands.set(command.data.name, command);
    else
        console.warn(`The command at ${filePath} is missing a required "data" or "execute" property.`);
    console.log("Successfully loaded:", command.data.name);
}
const schedule = cron.schedule("0 6,18 * * *", async () => {
    let userIds = await moriUtils.read();
    for (let id of userIds) {
        let user = await client.users.fetch(id).catch(() => null);
        if (user)
            await user.send(moriUtils.mori());
    }
}, { timezone: "Asia/Tokyo" });
client.once("clientReady", async () => {
    console.log(`Logged in as: ${client.user?.tag}`);
});
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand())
        return;
    let client = interaction.client;
    let command = client.commands.get(interaction.commandName);
    try {
        await command?.execute(interaction);
    }
    catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: "There was an error while executing this command!",
                flags: "Ephemeral",
            });
        }
        else {
            await interaction.reply({
                content: "There was an error while executing this command!",
                flags: "Ephemeral",
            });
        }
    }
});
client.on("messageCreate", async (message) => {
    if (message.author.bot)
        return;
    // DM
    if (!message.inGuild()) {
        await message.reply(moriUtils.mori());
        return;
    }
});
client.login(TOKEN);
async function shutdown(code = 0) {
    try {
        console.log("Shutting down...");
        if (server)
            server.close(() => {
                console.log("HTTP server closed.");
            });
        await schedule.destroy();
        console.log("Cron schedule destroyed.");
        await client.destroy();
        console.log("Discord client destroyed.");
    }
    catch (error) {
        console.error("Error during shutdown:", error);
        code = 1;
    }
    finally {
        console.log("Exiting with code", code);
        process.exit(code);
    }
}
process.on("beforeExit", shutdown);
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
//# sourceMappingURL=index.js.map