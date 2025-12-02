import { type ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { memento } from "../utils/mori.js";

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

const replyMap = {
  hi: "hi babe",
  hello: "hello there",
  hey: "girl i can see your body movin' and it's drivin' me crazy",
  yo: "yo wassup",
  good_morning: "hm. is this morning really good, though?",
  good_afternoon: "so you really spent the first half of your day doing nothing important, eh?",
  good_evening: "the evening is when death comes closer, you know.",
  weird_hello: "h3ll0... I 4m y0ur d34th.",
  weird_yo: "y0... t1m3 t0 d13.",
  memento_mori: "u 2.",
  carpe_diem: "Seize the day, because one day you will surely be seized.",
};

async function execute(interaction: ChatInputCommandInteraction) {
  let message = interaction.options.getString("message", true) as keyof typeof replyMap;
  let rare = Math.random() > 0.966; // ~3.4% chance
  await interaction.reply(rare ? replyMap[message] : memento());
}

export { data, execute };
