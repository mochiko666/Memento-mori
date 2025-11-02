import { Client, Collection, Partials } from "discord.js";
import express from "express";
import path from "path";
import { pathToFileURL } from "url";
import fs from "fs";
import cron from "node-cron";
import { mori } from "./commands/mori.js";
const token = process.env.CLIENT_SECRET;
const PORT = process.env.PORT || 8000;

const app = express();
app.get("/", (req, res) => res.status(200).json({ status: "ok", message: "still running!" }));
app.listen(PORT, () => console.log("Listening on port " + PORT));

const client = new Client({
  intents: ["Guilds", "GuildMessages", "DirectMessages", "MessageContent"],
  partials: [Partials.Channel],
});
client.commands = new Collection();
const commandsPath = path.join(import.meta.dirname, "commands"); // ../commands
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js")); // ["mori.js", ...]
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file); // ../commands/mori.js
  const command = await import(pathToFileURL(filePath)); // file:///../commands/mori.js
  if ("data" in command && "execute" in command) client.commands.set(command.data.name, command);
  else console.warn(`The command at ${filePath} is missing a required "data" or "execute" property.`);
}

client.once("clientReady", async () => {
  console.log(`ログイン完了！Bot名: ${client.user.tag}`);
  cron.schedule("0 6,18 * * *", async () => {
      if (!fs.existsSync("list.txt")) return;
      let userIds = fs.readFileSync("list.txt", "utf-8").split("\n");
      userIds.forEach(async (id) => {
        let user = await client.users.fetch(id).catch(() => null);
        if (user) await mori(user);
      });
    },
    { timezone: "Asia/Tokyo" }
  );
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand) return;
  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }
  
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command!",
        flags: MessageFlags.Ephemeral,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        flags: MessageFlags.Ephemeral,
      });
    }
  }
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  // DM
  if (!message.guild) {
    await mori(message);
    return;
  }
});

client.login(token);
