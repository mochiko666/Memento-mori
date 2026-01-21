import type { ChampionStats } from "../types/riotapi.js";

export const avgPerChampion = (cs: ChampionStats, v: keyof ChampionStats) =>
  cs[v] > 0 ? Math.round((cs[v] / cs.picks) * 1000) / 1000 : 0;
