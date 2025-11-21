import { ChannelType, SlashCommandBuilder } from "discord.js";
import { getRandomArticle } from "../utils/wikipedia.js";
const data = new SlashCommandBuilder()
    .setName("wikipedia")
    .setDescription("Get or edit settings for wikipedia function")
    .addSubcommand((subcommand) => subcommand.setName("fetch").setDescription("Shows a random article of wikipedia."))
    .addSubcommandGroup((group) => group
    .setName("daily")
    .setDescription("Get or edit daily broadcast settings.")
    .addSubcommand((subcommand) => subcommand
    .setName("enable")
    .setDescription("Schedules to send Today's article to this server.")
    .addChannelOption((channel) => channel
    .setName("channel")
    .setDescription("Where to send the article. Default channel is where the command was executed.")
    .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.GuildMedia)))
    .addSubcommand((subcommand) => subcommand
    .setName("disable")
    .setDescription("Stops broadcasting Today's article.")
    .addChannelOption((channel) => channel
    .setName("channel")
    .setDescription("Where to send the article. Default channel is where the command was executed.")
    .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.GuildMedia))));
async function execute(interaction) {
    let subcommand = interaction.options.getSubcommand();
    let { wikiChannels } = await import("../index.js");
    switch (subcommand) {
        case "fetch": {
            let article = await getRandomArticle();
            if (!article)
                throw new Error("Failed to get an article.");
            await interaction.reply(article);
            break;
        }
        case "enable": {
            let channel = interaction.options.getChannel("channel") || interaction.channel;
            if (!channel)
                throw new Error("Channel not found.");
            let { id } = channel;
            await wikiChannels.add(id);
            interaction.reply("ok i got it");
            break;
        }
        case "disable": {
            let channel = interaction.options.getChannel("channel") || interaction.channel;
            if (!channel)
                throw new Error("Channel not found.");
            let { id } = channel;
            if (!wikiChannels.has(id))
                return interaction.reply("Schedule is not yet set on the channel");
            await wikiChannels.remove(id);
            interaction.reply("Schedule stopped successfully.");
            break;
        }
    }
}
export { data, execute };
//# sourceMappingURL=wikipedia.js.map