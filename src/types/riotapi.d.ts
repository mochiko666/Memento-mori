import type { RegionPlatform } from "../enums/riotapi.ts";

interface puuid {
  puuid: string;
}

interface AccountDto extends puuid {
  gameName: string;
  tagLine: string;
}
interface RegionDto extends puuid {
  game: "lol";
  region: RegionPlatform;
}
interface SummonerDto extends puuid {
  profileIconId: number;
  revisionDate: number;
  summonerLevel: number;
}
interface MatchDto {
  metadata: MetadataDto;
  info: InfoDto;
}
interface MetadataDto {
  dataVersion: string;
  matchId: string;
  participants: string[];
}
interface InfoDto {
  endOfGameResult: string;
  gameCreation: number;
  gameDuration: number;
  gameEndTimestamp: number;
  gameId: number;
  gameMode: string;
  gameName: string;
  gameStartTimestamp: number;
  gameType: string;
  gameVersion: string;
  mapId: number;
  participants: ParticipantDto[];
  platformId: string;
  queueId: number;
  teams: TeamDto[];
  tournamentCode: string;
}
interface ParticipantDto extends puuid {
  teamId: number;
  lane: "TOP" | "MIDDLE" | "BOTTOM" | "JUNGLE" | "NONE";
  role: "SOLO" | "CARRY" | "SPPORT" | "DUO" | "DUO_CARRY" | "DUO_SUPPORT" | "NONE";
  teamPosition: "TOP" | "MIDDLE" | "BOTTOM" | "JUNGLE" | "UTILITY";
  assists: number;
  kills: number;
  deaths: number;
  totalDamageDealt: number;
  totalDamageTaken: number;
  totalHealsOnTeammates: number;
  totalMinionsKilled: number;
  totalTimeCCDealt: number;
  goldEarned: number;
  championId: number;
  championName: string;
  win: boolean;
}
interface TeamDto {
  bans: BanDto[];
  objectives: ObjectivesDto;
  teamId: number;
  win: boolean;
}
interface BanDto {
  championId: number;
  pickTurn: number;
}
interface ObjectivesDto {
  baron: ObjectiveDto;
  champion: ObjectiveDto;
  dragon: ObjectiveDto;
  inhibitor: ObjectiveDto;
  riftHerald: ObjectiveDto;
  tower: ObjectiveDto;
}
interface ObjectiveDto {
  first: boolean;
  kills: number;
}
interface ChampionMasteryDto extends puuid {
  championId: number;
  championLevel: number;
  championPoints: number;
  lastPlayTime: number;
  championPointsSinceLastLevel: number;
  championPointsUntilNextLevel: number;
  markRequiredForNextLevel: number;
  chestGranted: boolean;
  tokensEarned: number;
  nextSeasonMilestones: NextSeasonMilestonesDto;
}
interface NextSeasonMilestonesDto {
  requireGradeCounts: Record<string, number>;
  rewardMarks: number;
  bonus: boolean;
  totalGamesRequires: number;
}
interface LeagueEntryDto extends puuid {
  leagueId: string;
  queueType: LoLRankedQueueType;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  veteran: boolean;
  inactive: boolean;
  freshBlood: boolean;
  hotStreak: boolean;
  miniSeries?: MiniSeriesDto;
}
type LoLRankedQueueType = "RANKED_SOLO_5x5" | "RANKED_FLEX_SR" | "RANKED_FLEX_TT";
interface MiniSeriesDto {
  losses: number;
  progress: string;
  target: number;
  wins: number;
}

interface LoLBattleStats {
  position: LoLPositionRates;
  kills: number;
  deaths: number;
  assists: number;
  wins: number;
  champions: Map<string, ChampionStats>;
}
type LoLPositionRates = [Top: number, Mid: number, Bot: number, Jun: number, Uti: number];

interface ChampionStats {
  championId: number;
  picks: number;
  wins: number;
  kills: number;
  deaths: number;
  assists: number;
}

type RiotUserName = `${string}#${number}`;
