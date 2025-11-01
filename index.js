import { Client, GuildChannel, Message, Partials, User } from "discord.js";
import express from "express";
import fs from "fs";
import cron from "node-cron";
const token = process.env.CLIENT_SECRET;

const messages = ["Memento mori.", "Remember that you will die.", "お前はいずれ死ぬのだ。それを忘れるな？"];
async function mori(target) {
  let rand = Math.random();
  let message = messages[rand < 0.06 ? 2 : rand < 0.13 ? 1 : 0];
  if ([GuildChannel, User].some((t) => target instanceof t)) await target.send(message);
  else if (target instanceof Message) await target.reply(message);
}

const client = new Client({
  intents: ["Guilds", "GuildMessages", "DirectMessages", "MessageContent"],
  partials: [Partials.Channel],
});

client.once("clientReady", () => {
  console.log(`ログイン完了！Bot名: ${client.user.tag}`);
});

cron.schedule(
  "0 6 * * *",
  async () => {
    if (!fs.existsSync("list.txt")) return;
    let userIds = fs.readFileSync("list.txt", "utf-8").split("\n");
    userIds.forEach(async (id) => {
      let user = await client.users.fetch(id).catch(() => null);
      if (user) await mori(user);
    });
  },
  { timezone: "Asia/Tokyo" }
);

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // DM のとき
  if (!message.guild) {
    await mori(message);
    return;
  }

  // サーバー内での特定メッセージに反応
  if (message.content === "Memento mori") {
    await message.reply("ok i got it");
    await mori(message.author);
    let userId = message.author.id;
    if (fs.existsSync("list.txt")) {
      if (fs.readFileSync("list.txt", "utf-8").split("\n").includes(userId)) return;
      fs.appendFileSync("list.txt", `\n${userId}`, "utf-8");
    } else fs.writeFileSync("list.txt", `${userId}`, "utf-8");
  }
});

client.login(token);

const app = express();
app.get("/", (req, res) => res.send("Bot is running!"));
app.listen(8000, () => console.log("ok"));
