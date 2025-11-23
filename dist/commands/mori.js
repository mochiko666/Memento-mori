import { SlashCommandBuilder } from "discord.js";
import { memento } from "../utils/mori.js";
const data = new SlashCommandBuilder()
    .setName("mori")
    .setDescription("Manage daily mori reminder settings")
    .addSubcommand((subcommand) => subcommand
    .setName("user")
    .setDescription("Get or edit mori reminder settings for a user")
    .addBooleanOption((option) => option.setName("enable").setDescription("Whether to receive daily reminders."))
    .addUserOption((option) => option.setName("target").setDescription("The user('s ID) to affect. Default is yourself.")))
    .addSubcommand((subcommand) => subcommand.setName("list").setDescription("Get mori reminder list"));
async function execute(interaction) {
    let subcommand = interaction.options.getSubcommand();
    let { moriUsers } = await import("../index.js");
    let reply = "";
    switch (subcommand) {
        case "user":
            let user = interaction.options.getUser("target") || interaction.user;
            let enabled = interaction.options.getBoolean("enabled");
            if (user.bot)
                reply = "Sorry, but bots cannot be set for daily mori reminders.";
            else if (enabled === null) {
                let isEnabled = moriUsers.has(user.id) ? "enabled" : "disabled";
                reply = `@${user.username} is ${isEnabled} for daily mori reminders.`;
            }
            else {
                reply = "ok i got it";
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
            let { ids } = moriUsers;
            if (ids.length === 0) {
                reply = "No users are set for daily mori reminders.";
                break;
            }
            let list = ids.map((id) => `<@${id}>`).join("\n");
            await interaction.reply(`Users set for daily mori reminders:\n${list}`); // <@1234567890>\n<@0987654321>
            break;
    }
    await interaction.reply(reply);
}
export { data, execute };
//# sourceMappingURL=mori.js.map