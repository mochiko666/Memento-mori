import { type ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { memento } from "../utils/mori.js";
import { replyMap } from "../variables/greeting.js";

const data = new SlashCommandBuilder()
  .setName("greeting")
  .setDescription("HI")
  .addStringOption((option) =>
    option
      .setName("message")
      .setDescription("WHAT WILL YOU SAY TO ME?")
      .addChoices(
        { name: "HI", value: "hi" },
        { name: "HELLO", value: "hello" },
        { name: "HEY", value: "hey" },
        { name: "YO", value: "yo" },
        { name: "GOOD MORNING", value: "good_morning" },
        { name: "GOOD AFTERNOON", value: "good_afternoon" },
        { name: "GOOD EVENING", value: "good_evening" },
        { name: "HELL0", value: "weird_hello" },
        { name: "Y0", value: "weird_yo" },
        { name: "MEMENTO MORI", value: "memento_mori" },
        { name: "CARPE DIEM", value: "carpe_diem" }
      )
      .setRequired(true)
  );

async function execute(interaction: ChatInputCommandInteraction) {
  let message = interaction.options.getString("message", true) as keyof typeof replyMap;
  let rare = Math.random() > 0.966; // ~3.4% chance
  await interaction.reply(rare ? replyMap[message] : memento());
}

export { data, execute };
