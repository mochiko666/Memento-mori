import { createCanvasFromContainer } from "@mochiko666/canvas_utils";
import {
  ActionRowBuilder,
  AttachmentBuilder,
  ComponentType,
  ContainerBuilder,
  EmbedBuilder,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  type ChatInputCommandInteraction,
  type InteractionEditReplyOptions,
  type InteractionReplyOptions,
  type User,
} from "discord.js";
import { MihomoAPI } from "../classes/mihomo.js";
import type { MihomoParsedData } from "../types/mihomo.js";
import {
  buildContainerFromCharacter,
  buildFooter,
  createCharacterPanel,
} from "../utils/starrail.js";
import { COGNOSPHERE } from "../variables/starrail.js";

const data = new SlashCommandBuilder()
  .setName("starrail")
  .setDescription("Star Rail features.")
  .addSubcommand((subcommand) =>
    subcommand
      .setName("profile")
      .setDescription("Get a player's profile.")
      .addStringOption((option) =>
        option
          .setName("uid")
          .setDescription("The player's UID. If omitted, your registered UID is used instead."),
      )
      .addBooleanOption((option) =>
        option
          .setName("update")
          .setDescription("Whether to show the latest or cached info. Defaults to false."),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("character")
      .setDescription("Get a player's character info.")
      .addStringOption((option) =>
        option
          .setName("uid")
          .setDescription("The player's UID. If omitted, your registered UID is used instead."),
      )
      .addIntegerOption((option) =>
        option
          .setName("index")
          .setDescription(
            "The character's position to show. Support Characters: 1 - 3, Starfaring Companions: 4 - 8",
          )
          .setMinValue(1)
          .setMaxValue(8),
      )
      .addBooleanOption((option) =>
        option
          .setName("update")
          .setDescription("Whether to show the latest or cached info. Defaults to false."),
      )
      .addBooleanOption((option) =>
        option
          .setName("mild")
          .setDescription("Whether to calculate Relics scores mildly. Defaults to false."),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("register")
      .setDescription("Register your UID.")
      .addStringOption((option) =>
        option.setName("uid").setDescription("Your UID.").setRequired(true),
      ),
  );

async function execute(interaction: ChatInputCommandInteraction) {
  let reply: string | InteractionReplyOptions = "";
  const subcommand = interaction.options.getSubcommand();
  const { user } = interaction;
  const { id } = user;

  const { MihomoApi } = await import("../index.js");
  switch (subcommand) {
    case "profile": {
      await interaction.deferReply();
      const uid = interaction.options.getString("uid") || MihomoApi.user.cache.get(id);
      const update = interaction.options.getBoolean("update") ?? false;
      if (!uid) {
        reply = "You have not registered your UID yet. Please do /starrail register.";
        break;
      }

      const { player } = await MihomoApi.parsedData.fetch(uid, update);
      const { nickname, avatar, level, world_level, space_info } = player;
      const { universe_level, avatar_count, light_cone_count, relic_count, achievement_count } =
        space_info;
      const { accentColor } = user;
      const embed = new EmbedBuilder()
        .setTitle(`${nickname}'s StarRail Info`)
        .setDescription(`UID: ${uid}`)
        .setThumbnail(MihomoAPI.resourceURL(avatar.icon))
        .addFields(
          { name: "Trailblaze Level", value: level.toString(), inline: true },
          { name: "Equilibrium Level", value: world_level.toString(), inline: true },
          {
            name: "Universe Level",
            value: universe_level.toString(),
            inline: true,
          },
          {
            name: "Characters Count",
            value: avatar_count.toString(),
            inline: true,
          },
          {
            name: "Light Cones Count",
            value: light_cone_count.toString(),
            inline: true,
          },
          {
            name: "Relics Count",
            value: relic_count.toString(),
            inline: true,
          },
          {
            name: "Achievements Count",
            value: achievement_count.toString(),
            inline: true,
          },
        )
        .setColor(accentColor || "#ed86d3")
        .setFooter({ text: COGNOSPHERE });

      reply = { embeds: [embed] };
      break;
    }

    case "character": {
      await interaction.deferReply();
      const uid = interaction.options.getString("uid") || MihomoApi.user.cache.get(id);
      const update = interaction.options.getBoolean("update") ?? false;
      if (!uid) {
        reply = "You have not registered your UID yet. Please do /starrail register.";
        break;
      }

      const index = interaction.options.getInteger("index");
      const mild = interaction.options.getBoolean("mild") ?? false;
      const data = await MihomoApi.parsedData.fetch(uid, update);
      if (index) {
        // show detail for specified character
        reply = await createCardReply(data, index - 1, MihomoApi, user, mild);
      } else {
        // show user's characters panel
        const panel = await createPanelReply(data, user);
        const response = await interaction.editReply(panel);
        const collector = response.createMessageComponentCollector({
          componentType: ComponentType.StringSelect,
          time: 120_000, //2 mins
        });
        if (!collector) throw new Error("Failed to create collector.");
        collector.on("collect", async (i) => {
          const [selection] = i.values;
          if (!selection) throw new Error("Failed to get user selection.");

          await i.deferReply();
          const reply = await createCardReply(data, Number(selection), MihomoApi, user, mild);
          await i.editReply(reply);
        });
      }
      break;
    }

    case "register": {
      const uid = interaction.options.getString("uid", true);
      await MihomoApi.user.set(id, uid);

      reply = { content: "Successfully registered.", flags: "Ephemeral" };
      break;
    }
  }

  if (interaction.replied) return;
  if (interaction.deferred) await interaction.followUp(reply);
  else await interaction.reply(reply);
}

async function createPanelReply(
  { player, characters }: MihomoParsedData,
  user: User,
): Promise<InteractionEditReplyOptions> {
  const container = new ContainerBuilder()
    .setAccentColor(user.accentColor ?? [237, 134, 211])
    .addSectionComponents((section) =>
      section
        .addTextDisplayComponents((text) => text.setContent(`**${player.nickname}'s Characters**`))
        .setThumbnailAccessory((thumbnail) => thumbnail.setURL("attachment://avatar.png")),
    )
    .addMediaGalleryComponents((media) =>
      media.addItems((item) => item.setURL("attachment://panel.png")),
    );

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("character")
    .setPlaceholder("Choose one.")
    .addOptions(
      characters.map(({ name, pos }) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(name)
          .setDescription(name)
          .setValue(pos.toString()),
      ),
    );
  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

  const panel = await createCharacterPanel(characters);
  const attachments = [
    new AttachmentBuilder(panel).setName("panel.png"),
    new AttachmentBuilder(MihomoAPI.resourcePath(player.avatar.icon)).setName("avatar.png"),
  ];
  return { components: [container, row], files: attachments, flags: "IsComponentsV2" };
}

async function createCardReply(
  { player, characters }: MihomoParsedData,
  index: number,
  api: MihomoAPI,
  user: User,
  mild: boolean,
): Promise<string | (InteractionReplyOptions & InteractionEditReplyOptions)> {
  const character = characters.find(({ pos }) => pos[0] === index);
  if (!character) return "Any character is not set at the specified index.";
  const cardContainer = buildContainerFromCharacter(character, api, mild);
  const card = await createCanvasFromContainer(cardContainer.build());
  const container = new ContainerBuilder()
    .setAccentColor(user.accentColor ?? [237, 134, 211])
    .addSectionComponents((section) =>
      section
        .addTextDisplayComponents((text) =>
          text.setContent(`### **${player.nickname}'s ${character.name}**`),
        )
        .setThumbnailAccessory((thumbnail) => thumbnail.setURL("attachment://avatar.png")),
    )
    .addMediaGalleryComponents((media) =>
      media.addItems((item) => item.setURL("attachment://card.png")),
    )
    .addTextDisplayComponents(buildFooter());
  const attachments = [
    new AttachmentBuilder(card.toBuffer()).setName("card.png"),
    new AttachmentBuilder(MihomoAPI.resourcePath(player.avatar.icon)).setName("avatar.png"),
  ];
  return { components: [container], files: attachments, flags: "IsComponentsV2" };
}

export { data, execute };
