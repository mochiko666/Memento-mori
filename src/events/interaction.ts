import { Events, type Interaction } from "discord.js";

export default<EventHandler> {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction) {
    let client = interaction.client as ExtendedClient;
    if (interaction.isChatInputCommand()) {
      let command = client.commands.get(interaction.commandName);

      if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
      }

      try {
        console.log(`Executed command: ${interaction.commandName}, by ${interaction.user.tag}.`);
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: "There was an error while executing this command.",
            flags: "Ephemeral",
          });
        } else {
          await interaction.reply({
            content: "There was an error while executing this command.",
            flags: "Ephemeral",
          });
        }
      }
    } else if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
      }
      if (!command.autocomplete) {
        console.error(
          `The command ${interaction.commandName} does not have an autocomplete handler.`
        );
        return;
      }
      try {
        await command.autocomplete(interaction);
      } catch (error) {
        console.error(error);
      }
    }
  },
};
