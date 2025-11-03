import { SlashCommandBuilder } from "discord.js";
import { addUserId, mori, readList, removeUserId } from "../utils.js";

const data = new SlashCommandBuilder()
  .setName("mori")
  .setDescription("get or edit daily mori reminder settings")
  .addBooleanOption((option) => option.setName("enabled").setDescription("Whether to receive daily reminders."))
  .addUserOption((option) => option.setName("target").setDescription("The user('s ID) to get or edit. Defaults to yourself."));

async function execute(interaction) {
  let enabled = interaction.options.getBoolean("enabled");
  let userId = interaction.options.getUser("target")?.id || interaction.user.id;
  if (enabled === null || enabled === undefined) {
    let ids = await readList();
    let isEnabled = ids.includes(userId);
    await interaction.reply(`@${interaction.user.username} is ${isEnabled ? "enabled" : "disabled"} for daily mori reminders.`);
  } else if (enabled) {
    await interaction.user.send(mori());
    await addUserId(userId);
  } else {
    await interaction.reply("ok i got it");
    await removeUserId(userId);
  }
}

export { data, execute };
