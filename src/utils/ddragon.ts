class ddragon {
  public readonly cache: DDCache = { champions: {}, items: {} };

  private constructor(private version: string, private lang: BaseLangs = "ja_JP") {}

  private static baseURL = "https://ddragon.leagueoflegends.com/";
  private static async request(url: string) {
    const res = await fetch(this.baseURL + url);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API Error ${res.status}: ${text}`);
    }
    return res.json();
  }

  private static async getLatestVersion(): Promise<string> {
    const res = await this.request("api/versions.json");
    const [latest]: string[] = res;
    if (!latest) throw new Error("Failed to get the latest DD version.");
    return latest;
  }
  /**
   * Creates a new instance of DDragon wrapper, with data cached.
   * @param lang A supported language, see {@link BaseLangs}.
   */
  public static async init(lang: BaseLangs = "ja_JP"): Promise<ddragon> {
    const latest = await this.getLatestVersion();
    const instance = new ddragon(latest, lang);
    await instance.load(true);
    return instance;
  }
  public async load(
    update: boolean = false
  ): Promise<[DDResponseData<ChampionData>, DDResponseData<ItemData>]> {
    if (update) {
      const latest = await ddragon.getLatestVersion();
      this.version = latest;
    }
    return Promise.all([this.getChampionsData(), this.getItemsData()]);
  }

  /**
   *
   * @param champion The champion's id or key.
   * @param update Whether to return data updated or cached. Defaults to false.
   * @returns The specified champion's {@link SpecifiedChampionData},
   *          that has more information than {@link ChampionData}
   * @example const seraphine = await DD.getChampionData("Seraphine");
   *          const seraphine = await DD.getChampionData(147);
   */
  public async getChampionData(
    champion: string | number,
    update: boolean = false
  ): Promise<SpecifiedChampionData> {
    const { champions } = this.cache;

    if (typeof champion === "number")
      champion = Object.values(champions).find(({ key }) => Number(key) === champion)?.id || "";

    if (!update) {
      const cache = champions[champion];
      if (cache && !("version" in cache)) return cache;
    }

    const res: DDResponse<SpecifiedChampionData> = await ddragon.request(
      `cdn/${this.version}/data/${this.lang}/champion/${champion}.json`
    );
    const { data } = res;
    const result = data[champion]
    if (result) {
      this.cache.champions = Object.assign(champions, data);
      return result;
    } else throw new Error("Failed to get the champion data.");
  }

  public async getChampionsData(): Promise<DDResponseData<ChampionData>> {
    const res: DDResponse<ChampionData> = await ddragon.request(
      `cdn/${this.version}/data/${this.lang}/champion.json`
    );
    const { data } = res;
    this.cache.champions = data;
    return data;
  }
  public async getItemsData(lang: BaseLangs = "ja_JP"): Promise<DDResponseData<ItemData>> {
    const res: DDResponse<ItemData> = await ddragon.request(
      `cdn/${this.version}/data/${lang}/item.json`
    );
    const { data } = res;
    this.cache.items = data;
    return data;
  }

  public imgURL = (
    component: "item" | "spell" | "profileicon" | "map" | "sprite" | "ui",
    id: string | number
  ): string => ddragon.baseURL + `cdn/${this.version}/img/${component}/${id}.png`;
  public splashImgURL = (champion: string, skin: number) =>
    ddragon.baseURL + `cdn/img/champion/splash/${champion}_${skin}.jpg`;
  public loadingImgURL = (champion: string, skin: number) =>
    ddragon.baseURL + `cdn/img/champion/loading/${champion}_${skin}.jpg`;
}

interface DDCache {
  champions: DDResponseData<ChampionData | SpecifiedChampionData>;
  items: DDResponseData<ItemData>;
}

export { ddragon };
