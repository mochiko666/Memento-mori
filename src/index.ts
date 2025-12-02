import { Client, Collection, GatewayIntentBits, Partials } from "discord.js";
import express from "express";
import fs from "fs";
import cron from "node-cron";
import path from "path";
import SpotifyWebApi from "spotify-web-api-node";
import { pathToFileURL } from "url";
import { ddragon } from "./utils/ddragon.js";
import { IDManager } from "./utils/mori.js";
import { RiotAPI } from "./utils/riotapi.js";
import { parseState, readTokens } from "./utils/spotify.js";

const {
  TOKEN,
  PORT,
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SPOTIFY_REDIRECT_URI,
  RIOT_API_KEY,
} = process.env;
if (
  !TOKEN ||
  !PORT ||
  !SPOTIFY_CLIENT_ID ||
  !SPOTIFY_CLIENT_SECRET ||
  !SPOTIFY_REDIRECT_URI ||
  !RIOT_API_KEY
) {
  console.error("Required variables are not defined. Use env vars.");
  process.exit(1);
}
const spotifyApi = new SpotifyWebApi({
  clientId: SPOTIFY_CLIENT_ID,
  clientSecret: SPOTIFY_CLIENT_SECRET,
  redirectUri: SPOTIFY_REDIRECT_URI,
});
const stateMap: stateMap = new Map();

fs.mkdirSync(path.resolve("cache"), { recursive: true });
const tokenFile = await readTokens(true);
const moriUsers = await IDManager.init();
const wikiChannels = await IDManager.init(path.resolve("cache", "wikipedia_channels.txt"));

const riotApi = new RiotAPI(RIOT_API_KEY);
const DataDragon = await ddragon.init();

const { Guilds, GuildMessages, DirectMessages, MessageContent } = GatewayIntentBits;
const { Channel, Message } = Partials;
const client = new Client({
  intents: [Guilds, GuildMessages, DirectMessages, MessageContent],
  partials: [Channel, Message],
}) as ExtendedClient;
client.commands = new Collection();
const commandsPath = path.join(import.meta.dirname, "commands"); // ./commands
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js")); // ["mori.js", ...]
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file); // ./commands/mori.js
  const command: SlashCommand = await import(pathToFileURL(filePath).href);
  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
    console.log("Successfully loaded command:", command.data.name);
  } else
    console.warn(`The command at ${filePath} is missing a required "data" or "execute" property.`);
}

const eventsPath = path.join(import.meta.dirname, "events"); // ./events
const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith(".js")); // ["message.js", ...]
for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file); // ./events/message.js
  const event: EventHandler = await import(pathToFileURL(filePath).href);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
  console.log("Successfully loaded event handler:", event.name);
}

const scheduleMap: Record<string, cron.ScheduledTask> = {};

const schedulesPath = path.join(import.meta.dirname, "schedules"); // ./schedules
const scheduleFiles = fs.readdirSync(schedulesPath).filter((file) => file.endsWith(".js")); // ["wikipedia.js", ...]
for (const file of scheduleFiles) {
  const filePath = path.join(schedulesPath, file); // ./schedules/wikipedia.js
  const schedule: Schedule = await import(pathToFileURL(filePath).href);
  scheduleMap[schedule.name] = cron.schedule(schedule.time, schedule.execute, {
    timezone: schedule.timezone || "Asia/Tokyo",
  });
  console.log(`Successfully loaded schedule: ${schedule.name}`);
}

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
      if (!authorizeData) throw new Error(user_id + " is not set on stateMap.");
      let { channel_id, saved_state } = authorizeData;
      if (url_state !== saved_state)
        return res.status(401).json({ status: "error", message: "Invalid state" });

      let data = await spotifyApi.authorizationCodeGrant(code);
      let { access_token, refresh_token, expires_in } = data.body;
      await tokenFile.add(user_id, {
        access_token,
        refresh_token,
        expires_in: Date.now() + expires_in * 1000,
      });
      stateMap.delete(user_id);

      res.send(`<p>Done.</p><script>setTimeout(window.close, 2 * 1000); </script>`);

      let user = client.users.cache.get(user_id);
      let channel = client.channels.cache.get(channel_id);
      if (!user || !channel || !("send" in channel)) return;
      await channel.send(`Successfully authorized, ${user.toString()}`);

      return;
    } catch (error) {
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

    for (const schedule of Object.values(scheduleMap)) schedule.stop();
    console.log("Cron schedule stopped.");

    if (client) await client.destroy();
    console.log("Discord client destroyed.");

    await tokenFile.save();
    console.log("Token file saved.");

    await moriUsers.save();
    console.log("Memento mori user list saved.");
    await wikiChannels.save();
    console.log("Wikipedia channel list saved.");
    riotApi.count.clearTimers();
    console.log("Riot API's reset timer destroyed.")
  } catch (error) {
    console.error("Error during shutdown:", error);
    code = 1;
  } finally {
    console.log("Exiting with code", code);
    process.exit(code);
  }
}

client.login(TOKEN);

export { client, DataDragon, moriUsers, riotApi, spotifyApi, stateMap, tokenFile, wikiChannels };
