import { SlashCommandBuilder, GuildChannel, User, Message } from "discord.js";
import fs from "fs";
const messages = ["Memento mori.", "Remember that you will die.", "お前はいずれ死ぬのだ。それを忘れるな？"];

async function mori(target) {
  let rand = Math.random();
  let message = messages[rand < 0.06 ? 2 : rand < 0.13 ? 1 : 0];
  if ([GuildChannel, User].some((t) => target instanceof t)) await target.send(message);
  else if (target instanceof Message) await target.reply(message);
};

const data = new SlashCommandBuilder()
  .setName("mori")
  .setDescription("Sends you a Memento mori message via DM and adds you to the mori reminder list.")
  .addBooleanOption((option) => 
    option.setName("boolean").setDescription("Whether you want to receive daily reminders.").setRequired(true)
  );

async function execute(interaction) {
  await interaction.reply("ok i got it");
  await mori(interaction.user);
  let userId = interaction.user.id;
  if (fs.existsSync("list.txt")) {
    if (fs.readFileSync("list.txt", "utf-8").split("\n").includes(userId)) return;
    fs.appendFileSync("list.txt", `\n${userId}`, "utf-8");
  } else fs.writeFileSync("list.txt", `${userId}`, "utf-8");
};

export { data, execute, mori };
