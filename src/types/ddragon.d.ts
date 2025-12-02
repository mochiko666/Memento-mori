interface withId {
  id: string;
}
interface withName {
  name: string;
}
interface idandname extends withId, withName {}
interface nameanddescription extends withName {
  description: string;
}
interface withImage {
  image: ImageInfo;
}
interface withVersion {
  version: string;
}

type BaseLangs = "ja_JP" | "en_US";

/**
 * Response Json fetched from Data Dragon.
 */
interface DDResponse<T extends SpecifiedChampionData | ChampionData | ItemData>
  extends withVersion {
  type: "champion" | "item";
  format: string;
  data: DDResponseData<T>;
}

/**
 * Curried Record<string, T>.
 */
type DDResponseData<T> = Record<string, T>;

interface BaseChampionData extends idandname, withImage {
  key: string;
  title: string;
  blurb: string;
  tags: "Fighter" | "Mage" | "Assassin" | "Tank" | "Support" | "Marksman"[];
  partype: string;
  stats: StatsData;
}
/**
 * Fetched from https://ddragon.leagueoflegends.com/cdn/{version}/data/{lang}/champion.json
 */
interface ChampionData extends withVersion, BaseChampionData {}
/**
 * Fetched from https://ddragon.leagueoflegends.com/cdn/{version}/data/{lang}/champion/{champion}.json
 */
interface SpecifiedChampionData extends BaseChampionData {
  skins: SkinData[];
  lore: string;
  allytips: string[];
  enemytips: string[];
  info: InfoData;
  spells: SpellData[];
  passive: PassiveData;
  recommended: any[];
}
interface SkinData extends idandname {
  num: number;
  chroma: boolean;
}
interface InfoData {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
}
interface StatsData {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
}
interface SpellData extends withId, PassiveData {
  leveltip: {
    label: string[];
    effect: string[];
  };
  maxrank: number;
  cooldown: number[];
  cooldownBurn: string;
  cost: number[];
  costBurn: string;
  datavalues: any;
  effect: (number[] | null)[];
  effectBurn: (string | null)[];
  vars: any[];
  costType: string;
  maxammo: string;
  range: number[] | string;
  rangeBurn: string;
  image: ImageInfo;
  resource: string;
}
interface PassiveData extends nameanddescription, withImage {}
interface ImageInfo {
  full: string;
  sprite: string;
  group: "champion" | "item";
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Fetched from https://ddragon.leagueoflegends.com/cdn/{version}/data/{lang}/item.json
 */
interface ItemData extends nameanddescription, withImage {
  gold: { base: number; total: number; sell: number; purchasable: boolean };
  colloq: string;
  plaintext: string;
  consumed?: true;
  stacks?: number;
  depth?: number;
  consumeOnFull?: true;
  from?: [];
  into: string[];
  specialRecipe: number;
  inStore?: boolean;
  hideFromAll?: true;
  requiredChampion?: string;
  stats: {
    FlatHPPoolMod?: number;
    rFlatHPModPerLevel?: number;
    FlatMPPoolMod?: number;
    rFlatMPModPerLevel?: number;
    PercentHPPoolMod?: number;
    PercentMPPoolMod?: number;
    FlatHPRegenMod?: number;
    rFlatHPRegenModPerLevel?: number;
    PercentHPRegenMod?: number;
    FlatMPRegenMod?: number;
    rFlatMPRegenModPerLevel?: number;
    PercentMPRegenMod?: number;
    FlatArmorMod?: number;
    rFlatArmorModPerLevel?: number;
    PercentArmorMod?: number;
    rFlatArmorPenetrationMod?: number;
    rFlatArmorPenetrationModPerLevel?: number;
    rPercentArmorPenetrationMod?: number;
    rPercentArmorPenetrationModPerLevel?: number;
    FlatPhysicalDamageMod?: number;
    rFlatPhysicalDamageModPerLevel?: number;
    PercentPhysicalDamageMod?: number;
    FlatMagicDamageMod?: number;
    rFlatMagicDamageModPerLevel?: number;
    PercentMagicDamageMod?: number;
    FlatMovementSpeedMod?: number;
    rFlatMovementSpeedModPerLevel?: number;
    PercentMovementSpeedMod?: number;
    rPercentMovementSpeedModPerLevel?: number;
    FlatAttackSpeedMod?: number;
    PercentAttackSpeedMod?: number;
    rPercentAttackSpeedModPerLevel?: number;
    rFlatDodgeMod?: number;
    rFlatDodgeModPerLevel?: number;
    PercentDodgeMod?: number;
    FlatCritChanceMod?: number;
    rFlatCritChanceModPerLevel?: number;
    PercentCritChanceMod?: number;
    FlatCritDamageMod?: number;
    rFlatCritDamageModPerLevel?: number;
    PercentCritDamageMod?: number;
    FlatBlockMod?: number;
    PercentBlockMod?: number;
    FlatSpellBlockMod?: number;
    rFlatSpellBlockModPerLevel?: number;
    PercentSpellBlockMod?: number;
    FlatEXPBonus?: number;
    PercentEXPBonus?: number;
    rPercentCooldownMod?: number;
    rPercentCooldownModPerLevel?: number;
    rFlatTimeDeadMod?: number;
    rFlatTimeDeadModPerLevel?: number;
    rPercentTimeDeadMod?: number;
    rPercentTimeDeadModPerLevel?: number;
    rFlatGoldPernumbernumberMod?: number;
    rFlatMagicPenetrationMod?: number;
    rFlatMagicPenetrationModPerLevel?: number;
    rPercentMagicPenetrationMod?: number;
    rPercentMagicPenetrationModPerLevel?: number;
    FlatEnergyRegenMod?: number;
    rFlatEnergyRegenModPerLevel?: number;
    FlatEnergyPoolMod?: number;
    rFlatEnergyModPerLevel?: number;
    PercentLifeStealMod?: number;
    PercentSpellVampMod?: number;
  };
  effect: Record<string, string>;
  tags: string[];
  maps: Record<string, boolean>;
}
