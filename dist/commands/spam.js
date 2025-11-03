import { SlashCommandBuilder } from "discord.js";
import { mori } from "../utils.js";
const data = new SlashCommandBuilder()
    .setName("spam")
    .setDescription("Spam Memento mori messages to a user")
    .addUserOption((option) => option.setName("target").setDescription("The user to spam").setRequired(true))
    .addIntegerOption((option) => option
    .setName("count")
    .setDescription("Number of messages to send. Defaults to 6 times.")
    .setMinValue(1)
    .setMaxValue(666));
async function execute(interaction) {
    let target = interaction.options.getUser("target", true);
    let count = interaction.options.getInteger("count") || 6;
    if (target.bot) {
        await interaction.reply("Sorry, but I cannot spam bots.");
        return;
    }
    await interaction.reply(`Sending ${count} mori messages to @${target.username}...`);
    for (let i = 0; i < count; i++) {
        await target.send(mori());
    }
}
export { data, execute };
//# sourceMappingURL=spam.js.map