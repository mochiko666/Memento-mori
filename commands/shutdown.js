import { SlashCommandBuilder } from "discord.js";

const data = new SlashCommandBuilder()
  .setName("shutdown")
  .setDescription("Shut down the bot (admin only)");

async function execute(interaction) {
  if (interaction.user.id === process.env.ADMIN_ID) {
    await interaction.reply("Shutting down...");
    process.emit("shutdown", 0);
  } else interaction.reply("Sorry, but you do not have permission to use this command.");
}

export { data, execute };
