import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { memento } from "../utils/mori.js";

const data = new SlashCommandBuilder()
  .setName("mori")
  .setDescription("Use memento mori features.")
  .addSubcommandGroup((group) =>
    group
      .setName("reminder")
      .setDescription("Manage daily mori reminders.")
      .addSubcommand((subcommand) =>
        subcommand
          .setName("set")
          .setDescription("Get or edit mori reminder settings for a user.")
          .addBooleanOption((option) =>
            option.setName("enable").setDescription("Whether to receive daily reminders.")
          )
          .addUserOption((option) =>
            option.setName("target").setDescription("The user to affect. Default is yourself.")
          )
      )
      .addSubcommand((subcommand) =>
        subcommand.setName("list").setDescription("Get mori reminder list.")
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("spam")
      .setDescription("Spam Memento mori messages to a user.")
      .addUserOption((option) =>
        option.setName("target").setDescription("The user to spam.").setRequired(true)
      )
      .addIntegerOption((option) =>
        option
          .setName("count")
          .setDescription("Number of messages to send. Defaults to 6 times.")
          .setMinValue(1)
          .setMaxValue(13)
      )
  );

async function execute(interaction: ChatInputCommandInteraction) {
  let subcommand = interaction.options.getSubcommand();
  let { moriUsers } = await import("../index.js"); // avoid circular dependency
  let reply: string = "";

  switch (subcommand) {
    case "set":
      let user = interaction.options.getUser("target") || interaction.user;
      let enable = interaction.options.getBoolean("enable");
      if (user.bot) reply = "Sorry, but bots cannot be set for daily mori reminders.";
      else if (enable === null) {
        let isEnabled = moriUsers.has(user.id) ? "enabled" : "disabled";
        reply = `@${user.displayName} is ${isEnabled} for daily mori reminders.`;
      } else {
        reply = "ok i got it";
        if (enable) {
          if (user.equals(interaction.user)) await user.send(memento());
          await moriUsers.add(user.id);
        } else await moriUsers.filter((v) => v !== user.id);
      }
      break;
    case "list":
      let { cache } = moriUsers;
      if (cache.length === 0) {
        reply = "No users are set for daily mori reminders.";
        break;
      }
      let list = cache.map((id) => `<@${id}>`).join("\n");
      reply = `Users set for daily mori reminders:\n${list}`; // <@1234567890>\n<@0987654321>
      break;
    case "spam":
      let target = interaction.options.getUser("target", true);
      let count = interaction.options.getInteger("count") || 6;

      if (target.bot) {
        reply = "Sorry, but I cannot spam to bots.";
        break;
      }

      reply = `Spamming ${count} mori messages to ${target.toString()}...`;
      for (let i = 0; i < count; i++) target.send(memento());
      break;
  }
  await interaction.reply(reply);
}

export { data, execute };
