import type { Snowflake } from "discord.js";
import { RegionPlatform, RoutingRegion } from "../types/enums.js";
import type {
  AccountDto,
  ChampionMasteryDto,
  ChampionStats,
  LeagueEntryDto,
  LoLBattleStats,
  LoLRankedQueueType,
  MatchDto,
  RegionDto,
  SummonerDto,
} from "../types/riotapi.js";
import { notFalsy } from "./typeguards.js";

class RiotAPI {
  private rateLimits: RateLimitBucket = {
    per1s: 0,
    per2m: 0,
    resetTimer1s: null,
    resetTimer2m: null,
    check() {
      if (this.per1s >= 20) throw new Error("Rate limit exceeded: 20 requests per 1s");
      if (this.per2m >= 100) throw new Error("Rate limit exceeded: 100 requests per 2m");
    },
    increment() {
      this.per1s++;
      this.per2m++;

      if (!this.resetTimer1s) {
        this.resetTimer1s = setTimeout(() => {
          this.per1s = 0;
          this.resetTimer1s = null;
        }, 1 * 1000);
      }

      if (!this.resetTimer2m) {
        this.resetTimer2m = setTimeout(() => {
          this.per2m = 0;
          this.resetTimer2m = null;
        }, 2 * 60 * 1000);
      }
    },
  };
  public get count() {
    const { per1s, per2m, resetTimer1s, resetTimer2m } = this.rateLimits;
    return {
      per1s,
      per2m,
      clearTimers: () => {
        if (resetTimer1s) clearTimeout(resetTimer1s);
        if (resetTimer2m) clearTimeout(resetTimer2m);
        this.rateLimits.per1s = 0;
        this.rateLimits.per2m = 0;
        this.rateLimits.resetTimer1s = null;
        this.rateLimits.resetTimer2m = null;
      },
    } as const;
  }

  constructor(private apiKey: string) {}

  private readonly __cache: RiotUserData[] = [];
  public get cache(): RiotAPICache {
    return {
      has: (discordId: Snowflake) => this.__cache.some((d) => d.discordId === discordId),
      hasByName: (nametag: string) => this.__cache.some((d) => d.nametag === nametag),

      get: (discordId: Snowflake, cached?: boolean) =>
        this.__cache.find((d) => d.discordId === discordId)!,
      getByName: (nametag: string, cached?: boolean) =>
        this.__cache.find((d) => d.nametag === nametag)!,

      set: (nametag: string, server: RoutingRegion, discordId?: Snowflake) => {
        const user = this.cache.getByName(nametag, true) || new RiotUserData(nametag, server, this);
        user.discordId = discordId;
        if (!this.cache.hasByName(nametag)) this.__cache.push(user);
        return user;
      },
    };
  }

  public async request<T>(component: string, region: RoutingRegion | RegionPlatform): Promise<T> {
    this.rateLimits.check();
    const baseURL = `https://${region}.api.riotgames.com/`;
    const res = await fetch(baseURL + component, {
      headers: { "X-Riot-Token": this.apiKey },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API Error ${res.status}: ${text}`);
    }
    this.rateLimits.increment();
    return res.json();
  }
  public async batch<T>(tasks: (() => Promise<T>)[]): Promise<Awaited<T>[]> {
    let results: Awaited<T>[] = [];
    while (tasks.length > 0) {
      await new Promise((res) => setTimeout(res, this.rateLimits.per1s * 50));
      const batch = tasks.splice(0, 4);
      results.push(...(await Promise.all(batch.map((t) => t()))));
    }
    return results;
  }

  public async getAccount(
    id: string,
    region: RoutingRegion = RoutingRegion.ASIA
  ): Promise<AccountDto> {
    if (!id.includes("#")) throw new Error("Invalid Riot ID format. Expected 'name#tag'.");
    const [name, tag] = id.split("#").map(encodeURIComponent);
    const url = `riot/account/v1/accounts/by-riot-id/${name}/${tag}`;
    return this.request(url, region);
  }

  public readonly lol = {
    getRegion: async (
      puuid: string,
      region: RegionPlatform = RegionPlatform.JP1
    ): Promise<RegionDto> => {
      const url = `riot/account/v1/region/by-game/lol/by-puuid/${encodeURIComponent(puuid)}`;
      return this.request(url, region);
    },
    getSummoner: async (
      puuid: string,
      region: RegionPlatform = RegionPlatform.JP1
    ): Promise<SummonerDto> => {
      const url = `lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(puuid)}`;
      return this.request(url, region);
    },

    getMatchIds: async (
      puuid: string,
      count = 4,
      start = 0,
      region: RoutingRegion = RoutingRegion.ASIA
    ): Promise<string[]> => {
      const url = `lol/match/v5/matches/by-puuid/${puuid}/ids?start=${start}&count=${count}`;
      return this.request(url, region);
    },

    getMatch: async (
      matchId: string,
      region: RoutingRegion = RoutingRegion.ASIA
    ): Promise<MatchDto> => {
      const url = `lol/match/v5/matches/${matchId}`;
      return this.request(url, region);
    },

    getChampionMasteries: async (
      puuid: string,
      region: RegionPlatform = RegionPlatform.JP1
    ): Promise<ChampionMasteryDto[]> => {
      const url = `lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}`;
      return this.request(url, region);
    },

    getChampionMastery: async (
      puuid: string,
      championId: number,
      region: RegionPlatform = RegionPlatform.JP1
    ): Promise<ChampionMasteryDto> => {
      const url = `lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/by-champion/${championId}`;
      return this.request(url, region);
    },
    getTopChampionMasteries: async (
      puuid: string,
      count = 4,
      region: RegionPlatform = RegionPlatform.JP1
    ): Promise<ChampionMasteryDto[]> => {
      const url = `lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/top?count=${count}`;
      return this.request(url, region);
    },
    getRankedStats: async (
      puuid: string,
      region: RegionPlatform = RegionPlatform.JP1
    ): Promise<LeagueEntryDto[]> => {
      const url = `lol/league/v4/entries/by-puuid/${puuid}`;
      return this.request(url, region);
    },
  };
}

interface RateLimitBucket {
  per1s: number;
  per2m: number;
  resetTimer1s: NodeJS.Timeout | null;
  resetTimer2m: NodeJS.Timeout | null;
  check: () => void;
  increment: () => void;
}

class RiotUserData {
  public constructor(
    public readonly nametag: string,
    public readonly server: RoutingRegion,
    private readonly api: RiotAPI,
    public discordId?: Snowflake
  ) {}
  private puuid: string | null = null;
  public async getPuuid(): Promise<string> {
    if (this.puuid) return this.puuid;

    if (!this.nametag.includes("#"))
      throw new Error("Invalid Riot ID format. Expected 'name#tag'.");
    const [name, tag] = this.nametag.split("#").map(encodeURIComponent);
    const url = `riot/account/v1/accounts/by-riot-id/${name}/${tag}`;
    const { puuid } = await this.api.request<AccountDto>(url, this.server);
    this.puuid = puuid;

    return puuid;
  }
  private __lol: LoLUserCache = {
    region: null,
    summoner: null,
    matches: [],
    masteries: new Map(),
    tops: [],
    ranked: {},
  };
  public get lol(): LoLAPI {
    return {
      getRegion: async () => {
        if (this.__lol.region) return this.__lol.region;

        const puuid = await this.getPuuid();
        const url = `riot/account/v1/region/by-game/lol/by-puuid/${encodeURIComponent(puuid)}`;
        const { region } = await this.api.request<RegionDto>(url, this.server);
        this.__lol.region = region;
        return region;
      },

      getSummoner: async (update: boolean = false) => {
        if (this.__lol.summoner && !update) return this.__lol.summoner;

        const puuid = await this.getPuuid();
        const region = await this.lol.getRegion();
        const url = `lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(puuid)}`;
        const summoner = await this.api.request<SummonerDto>(url, region);
        this.__lol.summoner = summoner;
        return summoner;
      },

      getMatchIds: async (count: number = 20, start: number = 0) => {
        const puuid = await this.getPuuid();
        const url = `lol/match/v5/matches/by-puuid/${puuid}/ids?start=${start}&count=${count}`;
        return this.api.request<string[]>(url, this.server);
      },

      getMatch: async (matchId: string) => {
        const { matches } = this.__lol;
        const cached = matches.find((match) => match.metadata.matchId === matchId);
        if (cached) return cached;

        const url = `lol/match/v5/matches/${matchId}`;
        const match = await this.api.request<MatchDto>(url, this.server);
        matches.push(match);
        matches.sort((a, b) => b.info.gameStartTimestamp - a.info.gameStartTimestamp);
        return match;
      },

      getMatches: async (
        update: boolean = false,
        least: number = 20,
        start: number = 0,
        count: number | "max" = "max"
      ) => {
        const cached = this.__lol.matches;
        if (cached.length >= least && !update)
          return count === "max" ? cached.slice(start) : cached.slice(start, start + count);

        const ids = await this.lol.getMatchIds(least, start);
        return this.api.batch(ids.map((id) => () => this.lol.getMatch(id)));
      },
      getAvgStats: async (
        update: boolean = false,
        least: number = 20,
        start: number = 0,
        count: number | "max" = "max"
      ) => {
        const puuid = await this.getPuuid();
        const matches = await this.lol.getMatches(update, least, start, count);

        const participants = matches
          .map(({ info }) => info.participants.find((par) => par.puuid === puuid))
          .filter(notFalsy);

        if (participants.length === 0) return emptyStats();

        const championStats = new Map<string, ChampionStats>();
        const POSITION = ["TOP", "MIDDLE", "BOTTOM", "JUNGLE", "UTILITY"] as const;
        const rows = participants.map((p) => {
          const { championName, teamPosition, championId, assists, kills, deaths, win } = p;

          // champion stats
          const cur = championStats.get(championName) ?? emptyChampionStats(championId);

          cur.picks += 1;
          cur.wins += Number(win);
          cur.kills += kills;
          cur.deaths += deaths;
          cur.assists += assists;
          championStats.set(championName, cur);

          return {
            position: POSITION.map((pos) => Number(teamPosition === pos)),
            assists,
            kills,
            deaths,
            wins: Number(win),
          };
        });

        // --- sum ---
        const sum = rows.reduce(
          (acc, r) => ({
            position: acc.position.map((v, i) => v + r.position[i]!),
            assists: acc.assists + r.assists,
            kills: acc.kills + r.kills,
            deaths: acc.deaths + r.deaths,
            wins: acc.wins + r.wins,
          }),
          emptyStats()
        );

        const len = rows.length;
        const avgTotal = (v: number) => (v > 0 ? Math.round((v / len) * 1000) / 1000 : 0);
        const avgPerChampion = (v: number, picks: number) =>
          v > 0 ? Math.round((v / picks) * 1000) / 1000 : 0;

        return {
          position: sum.position.map(avgTotal),
          assists: avgTotal(sum.assists),
          kills: avgTotal(sum.kills),
          deaths: avgTotal(sum.deaths),
          wins: avgTotal(sum.wins),
          champions: new Map(
            [...championStats.entries()].map(([name, cs]) => [
              name,
              {
                championId: cs.championId,
                picks: avgTotal(cs.picks),
                wins: avgPerChampion(cs.wins, cs.picks),
                kills: avgPerChampion(cs.kills, cs.picks),
                deaths: avgPerChampion(cs.deaths, cs.picks),
                assists: avgPerChampion(cs.assists, cs.picks),
              },
            ])
          ),
        };
      },

      getChampionMasteries: async (update: boolean = false) => {
        if (this.__lol.masteries.size > 0 && !update) return this.__lol.masteries;
        const puuid = await this.getPuuid();
        const region = await this.lol.getRegion();
        const url = `lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}`;
        const masteries = await this.api.request<ChampionMasteryDto[]>(url, region);

        for (const mastery of masteries) this.__lol.masteries.set(mastery.championId, mastery);
        return this.__lol.masteries;
      },

      getChampionMastery: async (championId: number, update: boolean = false) => {
        if (this.__lol.masteries.has(championId) && !update) {
          const mastery = this.__lol.masteries.get(championId);
          if (mastery) return mastery;
        }

        const puuid = await this.getPuuid();
        const region = await this.lol.getRegion();
        const url = `lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/by-champion/${championId}`;
        const mastery = await this.api.request<ChampionMasteryDto>(url, region);

        this.__lol.masteries.set(championId, mastery);
        return mastery;
      },
      getTopChampionMasteries: async (count = 4, update: boolean = false) => {
        if (this.__lol.tops.length >= count && !update)
          return this.__lol.tops.map((id) => this.__lol.masteries.get(id)!);

        const puuid = await this.getPuuid();
        const region = await this.lol.getRegion();
        const url = `lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/top?count=${count}`;
        const tops = await this.api.request<ChampionMasteryDto[]>(url, region);

        for (const mastery of tops) this.__lol.masteries.set(mastery.championId, mastery);
        this.__lol.tops = tops.map((mastery) => mastery.championId);
        return tops;
      },
      getRankedStats: async (update: boolean = false) => {
        if (!update) return this.__lol.ranked;

        const puuid = await this.getPuuid();
        const region = await this.lol.getRegion();
        const url = `lol/league/v4/entries/by-puuid/${puuid}`;
        const stats = await this.api.request<LeagueEntryDto[]>(url, region);

        for (const stat of stats) this.__lol.ranked[stat.queueType] = stat;
        return this.__lol.ranked;
      },
    };
  }
}

const emptyStats = (): LoLBattleStats => ({
  position: [0, 0, 0, 0, 0],
  assists: 0,
  kills: 0,
  deaths: 0,
  wins: 0,
  champions: new Map(),
});

const emptyChampionStats = (championId: number): ChampionStats => ({
  championId,
  picks: 0,
  wins: 0,
  kills: 0,
  deaths: 0,
  assists: 0,
});

interface RiotAPICache {
  has(discordId: Snowflake): boolean;
  hasByName(nametag: string): boolean;

  get(discordId: Snowflake, cached: true): RiotUserData;
  get(discordId: Snowflake, cached?: boolean): RiotUserData | undefined;

  getByName(nametag: string, cached: true): RiotUserData;
  getByName(nametag: string, cached?: boolean): RiotUserData | undefined;

  set(nametag: string, server: RoutingRegion, discordId: Snowflake): RiotUserData;
}

interface LoLUserCache {
  region: RegionPlatform | null;
  summoner: SummonerDto | null;
  matches: MatchDto[];
  masteries: Map<number, ChampionMasteryDto>;
  tops: number[];
  ranked: Partial<Record<LoLRankedQueueType, LeagueEntryDto>>;
}

interface LoLAPI {
  getRegion: () => Promise<RegionPlatform>;
  getSummoner: (update?: boolean) => Promise<SummonerDto>;
  getMatchIds: (count?: number, start?: number) => Promise<string[]>;
  getMatch: (matchId: string) => Promise<MatchDto>;
  getMatches: (
    update?: boolean,
    least?: number,
    start?: number,
    count?: number | "max"
  ) => Promise<MatchDto[]>;
  getChampionMasteries: (update?: boolean) => Promise<ReadonlyMap<number, ChampionMasteryDto>>;
  getChampionMastery: (championId: number, update?: boolean) => Promise<ChampionMasteryDto>;
  getTopChampionMasteries: (count?: number, update?: boolean) => Promise<ChampionMasteryDto[]>;
  getRankedStats: (
    update?: boolean
  ) => Promise<Partial<Record<LoLRankedQueueType, LeagueEntryDto>>>;

  getAvgStats: (
    update?: boolean,
    least?: number,
    start?: number,
    count?: number | "max"
  ) => Promise<LoLBattleStats>;
}

export { RiotAPI, RiotUserData };
