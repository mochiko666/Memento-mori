import { Client, Collection, GatewayIntentBits, Partials } from "discord.js";
import express from "express";
import fs from "fs";
import cron from "node-cron";
import path from "path";
import SpotifyWebApi from "spotify-web-api-node";
import { pathToFileURL } from "url";
import { IDManager, memento } from "./utils/mori.js";
import { parseState, readTokens } from "./utils/token.js";
import { searchArticle } from "./utils/wikipedia.js";
const { TOKEN, PORT, SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URI } = process.env;
const spotifyApi = new SpotifyWebApi({
    clientId: SPOTIFY_CLIENT_ID,
    clientSecret: SPOTIFY_CLIENT_SECRET,
    redirectUri: SPOTIFY_REDIRECT_URI,
});
const stateMap = new Map();
const tokenFile = await readTokens(true);
const moriUsers = new IDManager();
const wikiChannels = new IDManager(path.join(process.cwd(), "wikipedia_channels.txt"));
moriUsers.load();
wikiChannels.load();
export { moriUsers, spotifyApi, stateMap, tokenFile, wikiChannels };
const scheduleMap = {
    //memento mori reminder
    mori: cron.schedule("0 6,18 * * *", async () => {
        let { ids } = moriUsers;
        for (let id of ids) {
            let user = await client.users.fetch(id).catch(() => undefined);
            if (!user) {
                console.error("Failed to get user with id:", id);
                continue;
            }
            await user.send(memento());
        }
    }, { timezone: "Asia/Tokyo" }),
    //daily wikipedia article broadcast
    wikipedia: cron.schedule("0 20 * * *", async () => {
        let { ids } = wikiChannels;
        for (let id of ids) {
            let channel = await client.channels.fetch(id).catch(() => undefined);
            if (!channel || !("send" in channel)) {
                console.error("Failed to get channel with id:", id);
                continue;
            }
            let article = await searchArticle("哲学", true, 666);
            if (!article) {
                console.error("Failed to find an article.");
                continue;
            }
            await channel.send(article);
        }
    }, { timezone: "Asia/Tokyo" }),
};
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
client.once("clientReady", async () => {
    console.log(`Logged in as: ${client.user?.tag}`);
});
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand())
        return;
    let client = interaction.client;
    let command = client.commands.get(interaction.commandName);
    try {
        console.log(`Executed command: ${interaction.commandName}, by ${interaction.user.tag}.`);
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
        await message.reply(memento());
        return;
    }
});
client.login(TOKEN);
const app = express();
//server response for health check and oauth2
app.get("/", async (req, res) => {
    const { code, state } = req.query;
    if (typeof code === "string" && typeof state === "string")
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
            await tokenFile.add(user_id, data.body);
            stateMap.delete(user_id);
            res.send(`<p>Done!</p><script>setTimeout(window.close, 4 * 1000); </script>`);
            let user = client.users.cache.get(user_id);
            let channel = client.channels.cache.get(channel_id);
            if (!user || !channel || !("send" in channel))
                return;
            await channel.send(`Successfully authorized, ${user.toString()}`);
            return;
        }
        catch (error) {
            console.error("Error getting Tokens:", error);
            return res.status(500).send("An Error Occured.");
        }
    return res.status(200).json({ status: "ok", message: "still running!" });
});
const server = app.listen(PORT, () => console.log("Listening on port " + PORT));
process.on("beforeExit", shutdown);
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
async function shutdown(code = 0) {
    try {
        console.log("Shutting down...");
        if (server)
            server.close(() => {
                console.log("HTTP server closed.");
            });
        for (const schedule of Object.values(scheduleMap))
            await schedule.destroy();
        console.log("Cron schedule destroyed.");
        if (client)
            await client.destroy();
        console.log("Discord client destroyed.");
        await tokenFile.save();
        console.log("Token file saved.");
        await moriUsers.save();
        console.log("Memento mori user list saved.");
        await wikiChannels.save();
        console.log("Wikipedia channel list saved.");
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
//# sourceMappingURL=index.js.map