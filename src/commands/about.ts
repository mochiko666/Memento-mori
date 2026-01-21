import { type ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

const data = new SlashCommandBuilder()
  .setName("about")
  .setDescription("Show info about this bot.");

async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.reply(
    [
      "License: This bot is licensed under [AGPL-3.0](https://github.com/mochiko666/Memento-mori/blob/master/LICENSE).",
      "Credits: https://github.com/mochiko666/Memento-mori/blob/master/CREDITS.md",
    ].join("\n"),
  );
}

export { data, execute };
