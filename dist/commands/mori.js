import { SlashCommandBuilder } from "discord.js";
import { memento } from "../utils/mori.js";
const data = new SlashCommandBuilder()
    .setName("mori")
    .setDescription("Get or edit daily mori reminder settings")
    .addSubcommand((subcommand) => subcommand
    .setName("user")
    .setDescription("Get or edit mori reminder settings for a user")
    .addBooleanOption((option) => option.setName("enabled").setDescription("Whether to receive daily reminders."))
    .addUserOption((option) => option
    .setName("target")
    .setDescription("The user('s ID) to affect. Default is yourself.")))
    .addSubcommand((subcommand) => subcommand.setName("list").setDescription("Get mori reminder list"));
async function execute(interaction) {
    let subcommand = interaction.options.getSubcommand();
    let { moriUsers } = await import("../index.js");
    switch (subcommand) {
        case "user":
            let user = interaction.options.getUser("target") || interaction.user;
            let enabled = interaction.options.getBoolean("enabled");
            if (user.bot)
                await interaction.reply("Sorry, but bots cannot be set for daily mori reminders.");
            else if (enabled === null || enabled === undefined) {
                let isEnabled = moriUsers.has(user.id);
                await interaction.reply(`@${user.username} is ${isEnabled ? "enabled" : "disabled"} for daily mori reminders.`);
            }
            else {
                await interaction.reply("ok i got it");
                if (enabled) {
                    if (user.equals(interaction.user))
                        await user.send(memento());
                    await moriUsers.add(user.id);
                }
                else
                    await moriUsers.delete(user.id);
            }
            break;
        case "list":
            await interaction.reply(moriUsers.ids.map((id) => "@" + id).join("\n") || "No users are set for daily mori reminders."); // @1234567890\n@0987654321
            break;
    }
}
export { data, execute };
//# sourceMappingURL=mori.js.map