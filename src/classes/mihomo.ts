import {
  APICacheManager,
  FileCacheManager,
  MapFileManager,
  RecordFileManager,
  type JSONParsed,
} from "@mochiko666/managers";
import { readFileSync, type PathLike } from "fs";
import { readFile } from "fs/promises";
import { resolve } from "path";
import { BaseStatFieldMap, MihomoLangs } from "../enums/mihomo.js";
import { isBaseStat } from "../typeguards/mihomo.js";
import type {
  BaseStatObject,
  BaseSubject,
  iconPath,
  MihomoAttribute,
  MihomoParsedData,
  MihomoProperty,
  MihomoPropertyLocale,
  MihomoSubAffix,
  MihomoWeights,
} from "../types/mihomo.js";

type JSONMihomoWeights = JSONParsed<MihomoWeights>;
export class MihomoAPI {
  public static async init(lang: MihomoLangs | `${MihomoLangs}`): Promise<MihomoAPI> {
    const [user, stats, weights] = await Promise.all([
      MapFileManager.init<string>(resolve("cache", `mihomo_users.txt`)),
      StatsLocaleManager.init(MihomoAPI.resourcePath(`index_min/${lang}/properties.json`)),
      RecordFileManager.init<JSONMihomoWeights>(resolve("StarRailScore", "score.json")),
    ]);
    return new MihomoAPI(lang, user, weights, { stats });
  }
  private constructor(
    public readonly lang: MihomoLangs | `${MihomoLangs}`,
    public readonly user: MapFileManager<string>,
    public readonly weights: RecordFileManager<JSONMihomoWeights>,
    public readonly locales: MihomoLocaleManagers
  ) {}

  public readonly parsedData = new ParsedDataManager(this);
  private readonly baseURL = "https://api.mihomo.me/";
  public async request<T>(component: string): Promise<T> {
    const res = await fetch(this.baseURL + component, {
      method: "GET",
      headers: { "User-Agent": "Memento Mori/1.0.0" },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Mihomo API Error ${res.status}: ${text}`);
    }
    return res.json();
  }

  /**
   * @param path {@link iconPath.icon},
   * {@link BaseSubject.portrait}
   * or {@link BaseSubject.preview}
   * @returns The path for Mihomo resource.
   */
  public static resourcePath = (...path: string[]) => resolve("StarRailRes", ...path);
  /**
   * @param path {@link iconPath.icon}
   * @returns URL for Mihomo raw resource.
   */
  public static resourceURL = (...path: string[]) =>
    "https://github.com/Mar-7th/StarRailRes/blob/master/" + path.join("/") + "?raw=true";
}

interface MihomoLocaleManagers {
  stats: StatsLocaleManager;
}

class ParsedDataManager extends APICacheManager<Map<string, MihomoParsedData>, MihomoAPI> {
  public constructor(api: MihomoAPI, init: Map<string, MihomoParsedData> = new Map()) {
    super(api, init);
  }
  /**
   * @param uid A Star Rail player's UID.
   * @param update Whether to force to update cached data or not.
   * @returns The parsed data of the player.
   */
  public async fetch(uid: string, update: boolean): Promise<MihomoParsedData> {
    if (!update && this.cache.has(uid)) {
      const cache = this.cache.get(uid);
      if (cache) return cache;
    }

    const url = `sr_info_parsed/${uid}?language=${this.api.lang}&is_force_update=${update}`;
    const res = await this.api.request<MihomoParsedData>(url);

    this.__cache.set(uid, res);
    return res;
  }
}

class LocaleFileManager<Locale extends MihomoPropertyLocale> extends FileCacheManager<
  Record<string, Locale>
> {
  public static async init<
    Locale extends MihomoPropertyLocale,
    Self extends LocaleFileManager<Locale>
  >(
    this: new (path: PathLike, init: Record<string, Locale>) => Self,
    path: PathLike
  ): Promise<Self> {
    const raw = await readFile(path, "utf-8");
    return new this(path, JSON.parse(raw));
  }
  public static initSync<
    Locale extends MihomoPropertyLocale,
    Self extends LocaleFileManager<Locale>
  >(this: new (path: PathLike, init: Record<string, Locale>) => Self, path: PathLike): Self {
    const raw = readFileSync(path, "utf-8");
    return new this(path, JSON.parse(raw));
  }
  public async load(): Promise<Record<string, Locale>> {
    const raw = await readFile(this.path, "utf-8");
    return (this.__cache = JSON.parse(raw));
  }

  public find = (predicate: (arg: Locale) => boolean) => Object.values(this.cache).find(predicate);
}

class StatsLocaleManager extends LocaleFileManager<MihomoPropertyLocale> {
  /**
   * @returns Mapping object from the specified value in {@link MihomoPropertyLocale} to the localed name.
   */
  public LocalesWithKey<
    K extends Exclude<keyof MihomoPropertyLocale, "affix" | "ratio" | "percent">
  >(key: K): Map<MihomoPropertyLocale[K], string> {
    return new Map(Object.values(this.cache).map((property) => [property[key], property.name]));
  }
  /**
   * @param stat {@link MihomoAttribute}, {@link MihomoProperty} or {@link MihomoSubAffix}.
   * @returns The localized name of the stat.
   */
  public locale(stat: BaseStatObject): string {
    return isBaseStat(stat.field)
      ? this.cache[BaseStatFieldMap[stat.field]]?.name ?? stat.name
      : stat.name;
  }
}
