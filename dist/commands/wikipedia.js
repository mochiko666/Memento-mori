import { ChannelType, SlashCommandBuilder } from "discord.js";
import { getRandomArticle, searchArticle } from "../utils/wikipedia.js";
const data = new SlashCommandBuilder()
    .setName("wikipedia")
    .setDescription("Get or edit settings for wikipedia function")
    .addSubcommandGroup((group) => group
    .setName("get")
    .setDescription("Get wikipedia articles.")
    .addSubcommand((subcommand) => subcommand.setName("random").setDescription("Get a random article from Wikipedia."))
    .addSubcommand((subcommand) => subcommand
    .setName("search")
    .setDescription("Search for something on Wikipedia.")
    .addStringOption((option) => option.setName("query").setDescription("The word to search for.").setRequired(true))
    .addBooleanOption((option) => option
    .setName("randomized")
    .setDescription("Whether to get a random article from the search results. Default is false."))))
    .addSubcommandGroup((group) => group
    .setName("daily")
    .setDescription("Get or edit daily broadcast settings.")
    .addSubcommand((subcommand) => subcommand
    .setName("set")
    .setDescription("Set up daily broadcast of Today's article.")
    .addBooleanOption((option) => option
    .setName("enable")
    .setDescription("Enable or disable daily broadcast. Default is true."))
    .addChannelOption((channel) => channel
    .setName("channel")
    .setDescription("Where to send the article. Default is here.")
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
                    let randomized = interaction.options.getBoolean("randomized") || false;
                    article = await searchArticle(query, randomized);
                    break;
            }
            if (!article)
                throw new Error("Failed to find an article.");
            await interaction.reply(article);
            break;
        case "daily":
            switch (subcommand) {
                case "set": {
                    let enable = interaction.options.getBoolean("enable") || true;
                    let channel = interaction.options.getChannel("channel") || interaction.channel;
                    if (!channel)
                        throw new Error("Channel not found.");
                    let { id } = channel;
                    if (enable) {
                        if (wikiChannels.has(id))
                            await interaction.reply("The channel is already set.");
                        else {
                            await wikiChannels.add(id);
                            await interaction.reply("ok i got it");
                        }
                    }
                    else if (wikiChannels.has(id))
                        await wikiChannels.delete(id);
                    else
                        await interaction.reply("The channel is not set.");
                    break;
                }
            }
            break;
    }
}
export { data, execute };
//# sourceMappingURL=wikipedia.js.map