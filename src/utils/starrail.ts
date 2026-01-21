import {
  ContainerBuilder as CanvasContainerBuilder,
  FileComponentBuilder,
  makeRGB,
  makeRGBA,
  RectComponentBuilder,
  TextComponentBuilder,
  type RGBTuple,
  type ShadowOption,
} from "@mochiko666/canvas_utils";
import { createCanvas, loadImage, registerFont } from "canvas";
import { ContainerBuilder, SectionBuilder, TextDisplayBuilder } from "discord.js";
import { readFile } from "fs/promises";
import { resolve } from "path";
import { MihomoAPI } from "../classes/mihomo.js";
import type {
  MihomoCharacter,
  MihomoRelic,
  MihomoSubAffix,
  MihomoWeights,
} from "../types/mihomo.js";
import { COGNOSPHERE, defaultStats, fontPath } from "../variables/starrail.js";
import { percentDisplay } from "./number.js";

export const buildFooter = () => new TextDisplayBuilder().setContent(COGNOSPHERE);
export async function createCharacterPanel(
  characters: MihomoCharacter[],
): Promise<Buffer<ArrayBufferLike>> {
  registerFont(MihomoAPI.resourcePath("font", "RPG_JP.ttf"), {
    family: "StarRail",
  });
  const canvas = createCanvas(734, 684);
  const ctx = canvas.getContext("2d");

  const bgBuffer = await readFile(resolve("resources", "starrail", "basesheet.png"));
  const background = await loadImage(bgBuffer);
  ctx.drawImage(background, 0, 0);

  ctx.shadowColor = "black";
  ctx.textAlign = "center";
  for (const c of characters) {
    const [pos] = c.pos;

    const chBuffer = await readFile(MihomoAPI.resourcePath(c.preview));
    const portrait = await loadImage(chBuffer);
    if (pos < 3) {
      //Support Characters
      //draw characters images
      const imagePos = { size: { x: 211, y: 299 }, offset: { x: 15, y: 63 }, uv: 246 };
      ctx.drawImage(
        portrait,
        imagePos.offset.x + pos * imagePos.uv,
        imagePos.offset.y,
        imagePos.size.x,
        imagePos.size.y,
      );

      //draw text backgrounds
      ctx.fillStyle = "#000000A8";
      const textbgPos = { size: { x: 241, y: 80 }, offset: { x: 1, y: 282 }, uv: 245 };
      ctx.fillRect(
        textbgPos.offset.x + pos * textbgPos.uv,
        textbgPos.offset.y,
        textbgPos.size.x,
        textbgPos.size.y,
      );

      //draw characters names
      ctx.fillStyle = "#e4e0db";
      ctx.font = "30px StarRail";
      const namePos = { offset: { x: 120, y: 320 } };
      ctx.fillText(
        c.name,
        namePos.offset.x + pos * textbgPos.uv,
        namePos.offset.y,
        textbgPos.size.x,
      );

      //draw characters levels below
      ctx.fillStyle = "#c1b7ad";
      ctx.font = "25px StarRail";
      const lvPosY = 350;
      ctx.fillText(
        "Lv: " + c.level,
        namePos.offset.x + pos * textbgPos.uv,
        lvPosY,
        textbgPos.size.x,
      );
    } else {
      //Starfaring Companions
      const posResolved = pos - 3;
      const uv = 147;
      //draw characters images
      const imagePos = { size: { x: 144, y: 196 }, offset: { x: 2, y: 450 } };
      ctx.drawImage(
        portrait,
        imagePos.offset.x + posResolved * uv,
        imagePos.offset.y,
        imagePos.size.x,
        imagePos.size.y,
      );

      //draw text backgrounds
      ctx.fillStyle = "#00000080";
      const textbgPos = { size: { x: 144, y: 60 }, offset: { x: 2, y: 627 } };
      ctx.fillRect(
        textbgPos.offset.x + posResolved * uv,
        textbgPos.offset.y,
        textbgPos.size.x,
        textbgPos.size.y,
      );

      //draw characters names
      ctx.fillStyle = "#e4e0db";
      ctx.font = "20px StarRail";
      const namePos = { offset: { x: 74, y: 655 } };
      ctx.fillText(c.name, namePos.offset.x + posResolved * uv, namePos.offset.y, textbgPos.size.x);

      //draw characters levels below
      ctx.fillStyle = "#c1b7ad";
      ctx.font = "15px StarRail";
      const lvPosY = 675;
      ctx.fillText("Lv: " + c.level, namePos.offset.x + posResolved * uv, lvPosY, textbgPos.size.x);
    }
  }

  return canvas.toBuffer();
}

export async function createCharacterDetail(character: MihomoCharacter): Promise<ContainerBuilder> {
  const { name, rarity, rank, level, icon, rank_icons, path, element, light_cone, statistics } =
    character;

  const createSection = (content: string, thumbnailURL?: string) =>
    new SectionBuilder()
      .addTextDisplayComponents((text) => text.setContent(content))
      .setThumbnailAccessory((thumbnail) =>
        thumbnailURL ? thumbnail.setURL(thumbnailURL) : thumbnail,
      );
  const container = new ContainerBuilder()
    .setAccentColor(Number(element.color) || [237, 134, 211])
    .addSectionComponents(
      createSection(`**${name}**`, MihomoAPI.resourceURL(icon)),
      createSection([``].join("\n"), MihomoAPI.resourceURL(path.icon)),
    );
  return container;
}

export function buildContainerFromCharacter(
  character: MihomoCharacter,
  api: MihomoAPI,
  mild: boolean,
): CanvasContainerBuilder {
  const size: Vector2D = [1920, 1080];
  const detail = buildCharacterContainer(character);
  const stats = buildStatsContainer(character, api);
  const lc = buildLCContainer(character, api);
  const relics = buildRelicContainer(character, api, mild);

  const card = new CanvasContainerBuilder()
    .setSize(...size)
    .addContainers(detail, stats, lc, relics);
  return card;
}

function buildCharacterContainer(character: MihomoCharacter) {
  const { name, level, rarity, element, path, portrait } = character;
  const size: Vector2D = [1920, 1080];
  const shadow: RequireOneWith<ShadowOption, "color"> = {
    color: "rgba(0, 0, 0, 0.4)",
    offset: [1, 1],
  };
  const container = new CanvasContainerBuilder()
    .setOffset(0, 0)
    .setSize(...size)
    .addFont("StarRail", fontPath)
    .addFileComponents(
      (file) =>
        file
          .setOffset(0, 0)
          .setSize(...size)
          .setPath(resolve("resources", "starrail", "bg_card.png")),
      (file) =>
        file.setOffset(420, 0).setSize(1080, 1080).setPath(MihomoAPI.resourcePath(portrait)),
      (file) =>
        file
          .setOffset(size[0] / 2 - (64 * rarity) / 2, 35)
          .setSize(320, 64)
          .setPath(MihomoAPI.resourcePath("icon", "deco", `Star${rarity}.png`))
          .setShadow(shadow),
      (file) =>
        file
          .setOffset(365, 30)
          .setSize(100, 100)
          .setPath(MihomoAPI.resourcePath(element.icon))
          .setShadow(shadow),
      (file) =>
        file
          .setOffset(365, 130)
          .setSize(100, 100)
          .setPath(MihomoAPI.resourcePath(path.icon))
          .setShadow(shadow),
    )
    .addTextComponents(
      (text) =>
        text
          .setOffset(30, 110)
          .setText(name)
          .setFont("StarRail", 80)
          .setColor("white")
          .setShadow(shadow),
      (text) =>
        text
          .setOffset(15, 210)
          .setText("Lv. " + level)
          .setFont("StarRail", 66)
          .setColor("white")
          .setShadow(shadow),
    );
  return container;
}

function buildStatsContainer(character: MihomoCharacter, api: MihomoAPI) {
  const { element, statistics } = character;
  const { locales } = api;
  const size: Vector2D = [440, 600];

  const entries = Object.entries(defaultStats);
  const order = entries.toSpliced(entries.length, 0, [`${element.id.toLowerCase()}_dmg`, "0%"]);
  const localesMap = locales.stats.LocalesWithKey("field"); // field: name
  const statsMap = new Map(
    statistics.map((stat) => [
      stat.field,
      stat.field === "spd" ? (Math.floor(stat.value * 10) / 10).toString() : stat.display,
    ]),
  ); // field: value

  const result = order.map(([field, def]) => ({
    name: localesMap.get(field) ?? field,
    value: statsMap.get(field) ?? def,
  })); // {name: MihomoPropertyLocale.name, value: MihomoAttribute.value}[]

  const shadow: RequireOneWith<ShadowOption, "color"> = {
    color: "rgba(0, 0, 0, 0.4)",
    offset: [1, 1],
  };
  const container = new CanvasContainerBuilder()
    .setOffset(15, 250)
    .setSize(...size)
    .addFont("StarRail", fontPath)
    .addFileComponents(
      (file) =>
        file
          .setOffset(0, 0)
          .setSize(...size)
          .setPath(resolve("resources", "starrail", "bg_stats.png")),
      (file) =>
        file
          .setOffset(0, 550)
          .setSize(50, 50)
          .setPath(MihomoAPI.resourcePath("icon", "property", `Icon${element.id}AddedRatio.png`)),
    )
    .addTextComponents(
      ...result.map(({ name }, i) =>
        new TextComponentBuilder()
          .setOffset(60, 38 + i * 50)
          .setText(name)
          .setFont("StarRail", 35)
          .setColor("white")
          .setShadow(shadow),
      ),
      ...result.map(({ value }, i) =>
        new TextComponentBuilder()
          .setOffset(440, 38 + i * 50)
          .setText(value)
          .setFont("StarRail", 35)
          .setColor("white")
          .setTextAlign("right")
          .setShadow(shadow),
      ),
    );
  return container;
}

function buildLCContainer(character: MihomoCharacter, api: MihomoAPI) {
  const { light_cone } = character;
  const container = new CanvasContainerBuilder();
  if (!light_cone) return container;

  const { name, level, rarity, rank, path, preview, attributes } = light_cone;
  const { locales } = api;
  const size: Vector2D = [500, 241];
  const shadow: RequireOneWith<ShadowOption, "color"> = {
    color: "rgba(0, 0, 0, 0.4)",
    offset: [1, 1],
  };
  container
    .setOffset(20, 855)
    .setSize(...size)
    .addFont("StarRail", fontPath)
    .addFileComponents(
      (file) =>
        file
          .setOffset(0, 0)
          .setSize(...size)
          .setPath(resolve("resources", "starrail", "bg_lc.png")),
      (file) =>
        file
          .setOffset(2, 53)
          .setSize(24, 24)
          .setPath(MihomoAPI.resourcePath(path.icon.split(".").join("Small.")))
          .setShadow(shadow),
      (file) =>
        file
          .setOffset(80, 85)
          .setSize(30, 30)
          .setPath(resolve("resources", "starrail", `superimposition${rank}.png`)),
      (file) => file.setOffset(270, 0).setSize(170, 199).setPath(MihomoAPI.resourcePath(preview)),
      (file) =>
        file
          .setOffset(270 + 170 / 2 - (60 + 15 * rarity), 175)
          .setSize(280, 66)
          .setPath(MihomoAPI.resourcePath("icon", "deco", `Rarity${rarity}.png`))
          .setShadow(shadow),
    )
    .addTextComponents(
      (text) =>
        text
          .setOffset(0, 40)
          .setText(name)
          .setFont("StarRail", 35)
          .setColor("white")
          .setShadow(shadow)
          .setMaxWidth(280),
      (text) =>
        text
          .setOffset(35, 73)
          .setText(path.name)
          .setFont("StarRail", 25)
          .setColor("white")
          .setShadow(shadow),
      (text) =>
        text
          .setOffset(0, 110)
          .setText("Lv. " + level)
          .setFont("StarRail", 25)
          .setColor("white")
          .setShadow(shadow),
      ...attributes.map((stat, i) =>
        new TextComponentBuilder()
          .setOffset(40, 140 + i * 35)
          .setText(locales.stats.locale(stat))
          .setFont("StarRail", 25)
          .setColor("white")
          .setShadow(shadow),
      ),
      ...attributes.map((stat, i) =>
        new TextComponentBuilder()
          .setOffset(270, 140 + i * 35)
          .setText(stat.display)
          .setFont("StarRail", 25)
          .setColor("white")
          .setTextAlign("right")
          .setShadow(shadow),
      ),
    );

  return container;
}

function buildRelicContainer(character: MihomoCharacter, api: MihomoAPI, mild: boolean) {
  const { element, relics } = character;
  const { color } = element;
  const eachSize: Vector2D = [400, 150];
  const shadow: RequireOneWith<ShadowOption, "color"> = {
    color: "rgba(0, 0, 0, 0.4)",
    offset: [1, 1],
  };
  const container = new CanvasContainerBuilder()
    .setOffset(1500, 40)
    .setSize(400, 1000)
    .addContainers(
      ...relics.map((relic) => {
        const colorMain = makeRGB(calcMainAffixColor(relic, character, api));
        return new CanvasContainerBuilder()
          .setOffset(0, 170 * (relic.type - 1))
          .setSize(...eachSize)
          .addFont("StarRail", fontPath)
          .addRoundComponents((round) =>
            round
              .setOffset(0, 0)
              .setSize(...eachSize)
              .setRadii(13)
              .setStroke({ color, width: 6, dash: [13, 4] }),
          )
          .addRectComponents(
            ...relic.sub_affix.map((sub, i) => {
              const size: Vector2D = [25, 25];
              const offset: Vector2D = [150, 40 + i * size[1]];
              const color = calcSubAffixColor(sub, character, api);

              return new RectComponentBuilder()
                .setOffset(...offset)
                .setSize(...size)
                .setColor({
                  x0: offset[0],
                  x1: offset[0] + size[0],
                  stops: [
                    { offset: 0, color: makeRGBA(color, 0.6) },
                    { offset: 0.5, color: makeRGBA(color, 0.6) },
                    { offset: 1, color: makeRGBA(color, 0) },
                  ],
                });
            }),
          )
          .addFileComponents(
            (file) =>
              file
                .setOffset(0, 0)
                .setSize(...eachSize)
                .setPath(resolve("resources", "starrail", "bg_relic.png")),
            (file) =>
              file
                .setOffset(10, 0)
                .setSize(128, 128)
                .setPath(MihomoAPI.resourcePath(relic.icon))
                .setShadow(shadow),
            (file) =>
              file
                .setOffset(150, 5)
                .setSize(30, 30)
                .setPath(MihomoAPI.resourcePath(relic.main_affix.icon))
                .setShadow(shadow),
            ...relic.sub_affix.map((sub, i) =>
              new FileComponentBuilder()
                .setOffset(150, 40 + i * 25)
                .setSize(25, 25)
                .setPath(MihomoAPI.resourcePath(sub.icon))
                .setShadow(shadow),
            ),
          )
          .addTextComponents(
            (text) =>
              text
                .setOffset(140, 40)
                .setText("+" + relic.level)
                .setColor("white")
                .setFont("StarRail", 25)
                .setTextAlign("right")
                .setShadow(shadow),
            (text) =>
              text
                .setOffset(74, 145)
                .setText("Score: " + percentDisplay(calcRelicScore(relic, character, api, mild), 1))
                .setColor("white")
                .setFont("StarRail", 20)
                .setTextAlign("center")
                .setShadow(shadow),
            (text) =>
              text
                .setOffset(182, 28)
                .setText(relic.main_affix.name)
                .setColor(colorMain)
                .setFont("StarRail", 20)
                .setMaxWidth(150)
                .setShadow(shadow),
            (text) =>
              text
                .setOffset(385, 28)
                .setText(relic.main_affix.display)
                .setColor(colorMain)
                .setFont("StarRail", 20)
                .setTextAlign("right")
                .setShadow(shadow),
            ...relic.sub_affix.map((sub, i) =>
              new TextComponentBuilder()
                .setOffset(177, 60 + i * 25)
                .setText(sub.name)
                .setColor("white")
                .setFont("StarRail", 20)
                .setShadow(shadow),
            ),
            ...relic.sub_affix.map((sub, i) =>
              new TextComponentBuilder()
                .setOffset(385, 60 + i * 25)
                .setText(sub.display)
                .setColor(makeRGB(calcSubAffixColor(sub, character, api)))
                .setFont("StarRail", 20)
                .setTextAlign("right")
                .setShadow(shadow),
            ),
          );
      }),
    );
  return container;
}

function calcRelicScore(
  relic: MihomoRelic,
  character: MihomoCharacter,
  api: MihomoAPI,
  mild: boolean,
): number {
  const weights = api.weights.get(character.id);
  if (!weights) return 0;

  const main = calcMainAffixScore(relic, weights);
  const sub = calcSubAffixScore(relic, weights);
  const sum = main + sub;
  return mild ? Math.sqrt(sum) : sum;
}

function calcMainAffixScore(relic: MihomoRelic, weights: MihomoWeights): number {
  const { main_affix, level, type } = relic;
  const { main } = weights;
  const normalized = 0.5 * ((level + 1) / 16) * (main[type][main_affix.type] ?? 0);
  return normalized;
}

function calcSubAffixScore(relic: MihomoRelic, weights: MihomoWeights): number {
  const { sub_affix } = relic;
  const { weight, max } = weights;
  const total = sub_affix.reduce((sum, sub) => sum + sub.count * weight[sub.type], 0);
  const normalized = 0.5 * (total / max);
  return normalized;
}

function calcMainAffixColor(
  relic: MihomoRelic,
  character: MihomoCharacter,
  api: MihomoAPI,
): RGBTuple {
  const weights = api.weights.get(character.id);
  if (!weights) return [255, 255, 255];

  const { type, main_affix } = relic;
  const { main } = weights;
  const weight = main[type][main_affix.type] ?? 0;

  return [255, 255 + (199 - 255) * weight, 255 + (88 - 255) * weight];
}

function calcSubAffixColor(
  affix: MihomoSubAffix,
  character: MihomoCharacter,
  api: MihomoAPI,
): RGBTuple {
  const weights = api.weights.get(character.id);
  if (!weights) return [255, 255, 255];

  const weight = weights.weight[affix.type];
  return [255, 255 + (199 - 255) * weight, 255 + (88 - 255) * weight];
}
