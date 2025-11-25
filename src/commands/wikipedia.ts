import { ChannelType, SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { getRandomArticle, searchArticle } from "../utils/wikipedia.js";

const data = new SlashCommandBuilder()
  .setName("wikipedia")
  .setDescription("Use Wikipedia functions.")
  .addSubcommandGroup((group) =>
    group
      .setName("get")
      .setDescription("Get wikipedia articles.")
      .addSubcommand((subcommand) =>
        subcommand.setName("random").setDescription("Get a random article from Wikipedia.")
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("search")
          .setDescription("Search for something on Wikipedia.")
          .addStringOption((option) =>
            option.setName("query").setDescription("The word to search for.").setRequired(true)
          )
          .addBooleanOption((option) =>
            option
              .setName("randomized")
              .setDescription(
                "Whether to get a random article from the search results. Defaults to false."
              )
          )
          .addIntegerOption((option) =>
            option
              .setName("threshold")
              .setDescription(
                "Maximum number of search results to consider when randomized is true. Defaults to all divided by 6."
              )
          )
      )
  )
  .addSubcommandGroup((group) =>
    group
      .setName("daily")
      .setDescription("Get or edit daily broadcast settings.")
      .addSubcommand((subcommand) =>
        subcommand
          .setName("set")
          .setDescription("Set up daily broadcast of Today's article.")
          .addBooleanOption((option) =>
            option
              .setName("enable")
              .setDescription("Enable or disable daily broadcast. Default is true.")
          )
          .addChannelOption((channel) =>
            channel
              .setName("channel")
              .setDescription("Where to send the article. Default is the current channel.")
              .addChannelTypes(
                ChannelType.GuildText,
                ChannelType.GuildAnnouncement,
                ChannelType.GuildMedia
              )
          )
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("list")
          .setDescription("Show the list of channels set for daily broadcast.")
      )
  );

async function execute(interaction: ChatInputCommandInteraction) {
  let group = interaction.options.getSubcommandGroup(true);
  let subcommand = interaction.options.getSubcommand();
  let { wikiChannels } = await import("../index.js");
  let reply: string = "";

  switch (group) {
    case "get":
      let article: string | undefined;
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
      if (!article) reply = "Failed to find an article.";
      else reply = article;
      break;

    case "daily":
      switch (subcommand) {
        case "set":
          let enable = interaction.options.getBoolean("enable") ?? true;
          let channel = interaction.options.getChannel("channel") || interaction.channel;
          if (!channel) throw new Error("Channel not found.");
          let { id } = channel;

          if (enable) {
            if (wikiChannels.has(id)) reply = "The channel is already set.";
            else {
              await wikiChannels.add(id);
              reply = "ok i got it";
            }
          } else if (wikiChannels.has(id)) {
            await wikiChannels.delete(id);
            reply = "The broadcast on the channel has been disabled successfully.";
          } else reply = "The channel is not set.";
          break;
        case "list":
          let { ids } = wikiChannels;
          if (ids.length === 0) {
            reply = "No channels set for daily broadcast.";
            break;
          }
          let list = ids.map((id) => `<#${id}>`).join("\n");
          reply = `Channels set for daily broadcast:\n${list}`;
          break;
      }
      break;
  }
  await interaction.reply(reply);
}

export { data, execute };
