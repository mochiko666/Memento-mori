import {
  EmbedBuilder,
  SlashCommandBuilder,
  type APIEmbedField,
  type AutocompleteInteraction,
  type ChatInputCommandInteraction,
  type InteractionEditReplyOptions,
  type InteractionReplyOptions,
  type User,
} from "discord.js";
import type { RiotUserData } from "../classes/riotapi.js";
import { RoutingRegion } from "../enums/riotapi.js";
import { percentDisplay } from "../utils/number.js";

const data = new SlashCommandBuilder()
  .setName("lol")
  .setDescription("LoL features.")
  .addSubcommandGroup((group) =>
    group
      .setName("me")
      .setDescription("Get or set about you.")
      .addSubcommand((subcommand) =>
        subcommand
          .setName("register")
          .setDescription("Register your Riot account info.")
          .addStringOption((option) =>
            option
              .setName("nametag")
              .setDescription("Your Riot in-game name with #tag. The format is 'name#tag'")
              .setRequired(true)
          )
          .addStringOption((option) =>
            option
              .setName("region")
              .setDescription("The region you belong to.")
              .addChoices(
                Object.values(RoutingRegion).map((region) => ({ name: region, value: region }))
              )
              .setRequired(true)
          )
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("info")
          .setDescription("Show your lol stats. Need to register first.")
          .addBooleanOption((option) =>
            option
              .setName("update")
              .setDescription("Whether to show the latest info. Defaults to false.")
          )
          .addIntegerOption((option) =>
            option
              .setName("least")
              .setDescription("The least number of matches to consider. Defaults to 20.")
              .setMinValue(1)
              .setMaxValue(40)
          )
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("find")
      .setDescription("Show a specified user's LoL stats.")
      .addStringOption((option) =>
        option
          .setName("nametag")
          .setDescription("A Riot in-game name with #tag. The format is 'name#tag'")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("region")
          .setDescription("The region that the user belongs to.")
          .addChoices(
            Object.values(RoutingRegion).map((region) => ({ name: region, value: region }))
          )
          .setRequired(true)
      )
      .addBooleanOption((option) =>
        option
          .setName("update")
          .setDescription("Whether to show the latest info. Defaults to false.")
      )
      .addIntegerOption((option) =>
        option
          .setName("least")
          .setDescription("The least number of matches to consider. Defaults to 20.")
          .setMinValue(1)
          .setMaxValue(40)
      )
  );

async function execute(interaction: ChatInputCommandInteraction) {
  let reply: string | InteractionReplyOptions = "";
  let editReply: string | InteractionEditReplyOptions = "";

  let { riotApi } = await import("../index.js");
  let { id } = interaction.user;
  let subcommand = interaction.options.getSubcommand(true);
  switch (subcommand) {
    case "register": {
      let nametag = interaction.options.getString("nametag", true);
      if (!riotApi.isRiotUserName(nametag)) {
        reply = { content: "Invalid Riot ID format. Expected 'name#tag'.", flags: "Ephemeral" };
        break;
      }
      let region = interaction.options.getString("region", true) as RoutingRegion;
      riotApi.cache.set(nametag, region, id);

      reply = { content: "Successfully registered.", flags: "Ephemeral" };
      break;
    }

    case "info": {
      if (!riotApi.cache.has(id)) {
        reply = "You have not registered yet. Please do /lol me register.";
        break;
      }

      await interaction.deferReply();
      let update = interaction.options.getBoolean("update") ?? false;
      let least = interaction.options.getInteger("least") || 20;

      let riotUser = riotApi.cache.get(id, true);

      let embed = await buildStatsEmbed(riotUser, update, least, interaction.user);
      if (embed) editReply = { embeds: [embed] };
      else editReply = "You have never played any LoL Matches yet.";
      break;
    }
    case "find": {
      let nametag = interaction.options.getString("nametag", true);
      if (!riotApi.isRiotUserName(nametag)) {
        reply = { content: "Invalid Riot ID format. Expected 'name#tag'.", flags: "Ephemeral" };
        break;
      }

      await interaction.deferReply();
      let region = interaction.options.getString("region", true) as RoutingRegion;
      let update = interaction.options.getBoolean("update") ?? false;
      let least = interaction.options.getInteger("least") || 20;

      let riotUser = riotApi.cache.set(nametag, region, id);

      let embed = await buildStatsEmbed(riotUser, update, least, interaction.user);
      if (embed) editReply = { embeds: [embed] };
      else editReply = "The summoner has never played any LoL Matches yet.";
      break;
    }
  }

  if (interaction.deferred || interaction.replied) await interaction.editReply(editReply);
  else await interaction.reply(reply);
}

async function buildStatsEmbed(
  riotUser: RiotUserData,
  update: boolean,
  least: number,
  user?: User
): Promise<EmbedBuilder | null> {
  const { DataDragon } = await import("../index.js");
  const { lol, nametag } = riotUser;
  let { profileIconId, summonerLevel } = await lol.getSummoner(update);
  let iconURL = DataDragon.imgURL("profileicon", profileIconId);

  let avg = await lol.getAvgStats(update, least);
  if (!avg) return null;

  let percent = (n: number) => percentDisplay(n, 1) + "%";
  let avgNum = (n: number) => n.toFixed(2);

  let totalStats: APIEmbedField = {
    name: "Total Stats",
    value: [
      `Win Rate: ${percent(avg.wins)}`,
      `KDA: ${avgNum((avg.kills + avg.assists) / avg.deaths)}`,
      `Avg Kills: ${avgNum(avg.kills)}`,
      `Avg Deaths: ${avgNum(avg.deaths)}`,
      `Avg Assists: ${avgNum(avg.assists)}`,
    ].join("\n"),
    inline: true,
  };

  let posMap = ["Top: ", "Mid: ", "Bot: ", "Jungle: ", "Support: "];
  let posP: APIEmbedField = {
    name: "Team Position (estimated)",
    value: avg.position.map((v, i) => posMap[i] + percent(v)).join("\n"),
    inline: true,
  };
  let userStats: APIEmbedField[] = [totalStats, posP];

  let ranked = await lol.getRankedStats(update);
  let queueMap = {
    RANKED_SOLO_5x5: "Solo/Duo",
    RANKED_FLEX_SR: "Flex",
    RANKED_FLEX_TT: "TFT",
  };
  let rankedStats: APIEmbedField[] = Object.values(ranked).map((stat) => ({
    name: `**${queueMap[stat.queueType]}**`,
    value: [
      `Win Rate: ${percent(Math.round((stat.wins / (stat.wins + stat.losses)) * 1000) / 1000)}`,
      `Total Wins: ${stat.wins}`,
      `Total Losses: ${stat.losses}`,
      `Rank: ${stat.tier + stat.rank}`,
      `Progress: ${stat.leaguePoints} / 100`,
    ].join("\n"),
    inline: true,
  }));

  let { champions } = DataDragon.cache;
  let topChamps = [...avg.champions.entries()]
    .sort(([_a, a], [_b, b]) => b.picks - a.picks)
    .splice(0, 3);
  let champStats: APIEmbedField[] = topChamps.map(([name, stats], i) => ({
    name: `__***${i + 1}.***__ ${champions[name]?.name || name}`,
    value: [
      `Win Rate: ${percent(stats.wins)}`,
      `Pick Rate: ${percent(stats.picks)}`,
      `KDA: ${avgNum((stats.kills + stats.assists) / stats.deaths)}`,
      `Avg Kills: ${avgNum(stats.kills)}`,
      `Avg Deaths: ${avgNum(stats.deaths)}`,
      `Avg Assists: ${avgNum(stats.assists)}`,
    ].join("\n"),
    inline: true,
  }));

  let skin = { name: "", num: 0 };
  let [top] = topChamps[0] || Object.keys(champions);
  let { skins } = await DataDragon.getChampionData(top, update);
  let rand = skins[Math.floor(Math.random() * skins.length)];
  if (rand) skin = rand;

  let embed = new EmbedBuilder()
    .setTitle(`${user ? user.displayName : nametag}'s LoL Stats`)
    .setDescription(`Summoner Id: ${nametag}\nLevel: ${summonerLevel}`)
    .setColor(user ? user.accentColor || "#ed86d3" : "Random")
    .setThumbnail(iconURL)
    .addFields(userStats)
    .addFields({
      name: "**Ranked Stats**",
      value:
        rankedStats.length > 0
          ? ""
          : `${user ? "You have" : "This summoner has"} never played Ranked Matches yet.`,
    })
    .addFields(rankedStats)
    .addFields({
      name: "**Top Picked Champions**",
      value: "",
    })
    .addFields(champStats)
    .setImage(DataDragon.splashImgURL(top, skin.num))
    .setFooter({ text: `${skin.name}   © Riot Games, Inc. All Rights Reserved.` });

  return embed;
}

async function autocomplete(interaction: AutocompleteInteraction) {}

export { autocomplete, data, execute };
