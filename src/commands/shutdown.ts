import { type ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

const data = new SlashCommandBuilder()
  .setName("shutdown")
  .setDescription("Shut down the bot (admin only)");

async function execute(interaction: ChatInputCommandInteraction) {
  const { ADMIN_ID } = process.env;
  if (!ADMIN_ID) {
    await interaction.reply(
      "Admin id is not set, so for security, this command is being not available."
    );
    return;
  }
  if (interaction.user.id === ADMIN_ID) {
    await interaction.reply("Shutting down...");
    process.emit("beforeExit", 0);
  } else await interaction.reply("Sorry, but you do not have permission to use this command.");
}

export { data, execute };
