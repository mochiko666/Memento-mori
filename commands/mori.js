import { SlashCommandBuilder } from "discord.js";
import { addUserId, mori, readList, removeUserId } from "../utils.js";

const data = new SlashCommandBuilder()
  .setName("mori")
  .setDescription("get or edit daily mori reminder settings")
  .addSubcommand((subcommand) =>
    subcommand
      .setName("user")
      .setDescription("get or edit mori reminder settings for a user")
      .addBooleanOption((option) => option.setName("enabled").setDescription("Whether to receive daily reminders."))
      .addUserOption((option) => option.setName("target").setDescription("The user('s ID) to get or edit. Defaults to yourself."))
  )
  .addSubcommand((subcommand) => subcommand.setName("list").setDescription("get mori reminder list"));

async function execute(interaction) {
  let subcommand = interaction.options.getSubcommand();
  switch (subcommand) {
    case "user":
      let user = interaction.options.getUser("target") || interaction.user;
      let enabled = interaction.options.getBoolean("enabled");
      if (user.bot) await interaction.reply("Sorry, but bots cannot be set for daily mori reminders.");

      else if (enabled === null || enabled === undefined) {
        let ids = await readList();
        let isEnabled = ids.includes(user.id);
        await interaction.reply(`@${user.username} is ${isEnabled ? "enabled" : "disabled"} for daily mori reminders.`);
      } else {
        await interaction.reply("ok i got it");
        if (enabled) {
          await user.send(mori());
          await addUserId(user.id);
        } else await removeUserId(user.id);
      }
      break;
    case "list":
      let list = await readList();
      await interaction.reply(list.join("\n") || "No users are set for daily mori reminders.");
      break;
  }
}

export { data, execute };
