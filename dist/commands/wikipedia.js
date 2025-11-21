import { ChannelType, SlashCommandBuilder } from "discord.js";
import cron from "node-cron";
import { getRandomArticle } from "../utils/wikipedia.js";
const data = new SlashCommandBuilder()
    .setName("wikipedia")
    .setDescription("Get or edit settings for wikipedia function")
    .addSubcommand((subcommand) => subcommand
    .setName("enable")
    .setDescription("Schedules to send Today's article to this server. Only 1 schedule can be registered per server.")
    .addIntegerOption((option) => option
    .setName("time")
    .setDescription("When to send the article.")
    .setMinValue(0)
    .setMaxValue(23)
    .setRequired(true))
    .addChannelOption((channel) => channel
    .setName("channel")
    .setDescription("Where to send the article. Default channel is where the command was executed.")
    .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.GuildMedia)))
    .addSubcommand((subcommand) => subcommand.setName("disable").setDescription("Stops broadcasting Today's article."));
async function execute(interaction) {
    let subcommand = interaction.options.getSubcommand();
    let { scheduleMap } = await import("../index.js");
    let schedule = scheduleMap.get("wikipedia");
    switch (subcommand) {
        case "enable":
            let time = interaction.options.getInteger("time");
            let channel = interaction.options.getChannel("channel") || interaction.channel;
            if (!channel || !("send" in channel))
                throw new Error("Channel not found.");
            if (schedule)
                await schedule.destroy();
            scheduleMap.set("wikipedia", cron.schedule(`0 ${time} * * *`, async () => {
                let articleUrl = await getRandomArticle();
                if (!articleUrl)
                    throw new Error("Failed to fetch articles.");
                channel.send(articleUrl);
            }));
            interaction.reply("ok i got it");
            break;
        case "disable":
            if (!schedule)
                return interaction.reply("Schedule is not yet set on this server.");
            await schedule.destroy();
            scheduleMap.delete("wikipedia");
            interaction.reply("Schedule stopped successfully.");
            break;
    }
}
export { data, execute };
//# sourceMappingURL=wikipedia.js.map