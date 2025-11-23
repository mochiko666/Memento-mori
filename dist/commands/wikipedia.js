import { ChannelType, SlashCommandBuilder } from "discord.js";
import { getRandomArticle, searchArticle } from "../utils/wikipedia.js";
const data = new SlashCommandBuilder()
    .setName("wikipedia")
    .setDescription("Get or edit settings for wikipedia function")
    .addSubcommandGroup((group) => group
    .setName("get")
    .setDescription("Get wikipedia articles.")
    .addSubcommand((subcommand) => subcommand.setName("random").setDescription("Gets a random article from Wikipedia."))
    .addSubcommand((subcommand) => subcommand
    .setName("search")
    .setDescription("Search for something on Wikipedia.")
    .addStringOption((option) => option.setName("query").setDescription("The word to search for.").setRequired(true))))
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
    let subcommandGroup = interaction.options.getSubcommandGroup();
    let subcommand = interaction.options.getSubcommand();
    let { wikiChannels } = await import("../index.js");
    switch (subcommandGroup) {
        case "get":
            let article;
            switch (subcommand) {
                case "random":
                    article = await getRandomArticle();
                    break;
                case "search":
                    let query = interaction.options.getString("query", true);
                    article = await searchArticle(query);
                    break;
            }
            if (!article)
                throw new Error("Failed to find an article.");
            await interaction.reply(article);
            break;
        case "daily":
            switch (subcommand) {
                case "enable": {
                    let channel = interaction.options.getChannel("channel") || interaction.channel;
                    if (!channel)
                        throw new Error("Channel not found.");
                    let { id } = channel;
                    await wikiChannels.add(id);
                    await interaction.reply("ok i got it");
                    break;
                }
                case "disable": {
                    let channel = interaction.options.getChannel("channel") || interaction.channel;
                    if (!channel)
                        throw new Error("Channel not found.");
                    let { id } = channel;
                    if (!wikiChannels.has(id))
                        return interaction.reply("Schedule is not yet set on the channel.");
                    await wikiChannels.delete(id);
                    await interaction.reply("Schedule has been removed successfully.");
                    break;
                }
            }
            break;
    }
}
export { data, execute };
//# sourceMappingURL=wikipedia.js.map