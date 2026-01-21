import type { MihomoAPI } from "../classes/mihomo.ts";
import type { MihomoRelicType } from "../enums/mihomo.ts";

interface description {
  desc: string;
}
interface level {
  level: number;
}
interface iconPath extends icon {
  id: string;
  /**
   * The localed text.
   */
  name: string;
  /**
   * The path for StarRailRes. Use {@link MihomoAPI.resourceURL} to get raw resouce URL.
   */
  icon: string;
}
interface iconWithLevel extends iconPath, level {}
interface BaseSubject extends iconWithLevel, path {
  /**
   * The path of the subject.
   */
  path: iconPath;
  /**
   * The path for the portrait image file of the subject.
   */
  portrait: string;
  /**
   * The path for the preview image file of the subject.
   */
  preview: string;
  /**
   * The Base Stats of the subject.
   */
  attributes: MihomoAttribute[];
  /**
   * The Stats Buffs of the subject.
   */
  properties: MihomoProperty[];
}
interface BaseStatObject {
  /**
   * The localed text.
   */
  name: string;
  /**
   * The Stat name.
   * @example "hp"
   */
  field: BaseStatField | string;
}
type BaseStatField = "hp" | "atk" | "def" | "spd";

interface MihomoPlayer extends level {
  /**
   * The player's uid.
   */
  uid: string;
  /**
   * The player's display name.
   */
  nickname: string;
  /**
   * The player's Equilibrium level. Can be between 1 and 70.
   */
  world_level: number;
  /**
   * The number of the player's friends.
   */
  friend_count: number;
  /**
   * The player's avatar.
   */
  avatar: iconPath;
  /**
   * The player's self-introduction.
   */
  signature: string;
  is_display: boolean;
  space_info: {
    memory_data: {
      level: number;
      chaos_id: number | null;
      chaos_level: number;
      chaos_star_count: number;
    };
    universe_level: number;
    avatar_count: number;
    light_cone_count: number;
    relic_count: number;
    achievement_count: number;
    book_count: number;
    music_count: number;
  };
}

interface MihomoCharacter extends BaseSubject {
  /**
   * The character's Rarity.
   */
  rarity: 4 | 5;
  /**
   * The character's Eidolon level.
   */
  rank: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /**
   * The times of Ascentions of the character.
   */
  promotion: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /**
   * Whether the character is applied its enhance or not.
   * Only can be true on the specific characters like Blade, Jingliu.
   */
  enhanced: boolean;
  /**
   * The graphics for each Eidolon.
   */
  rank_icons: string[];
  /**
   * The element of the character.
   */
  element: MihomoElement;
  /**
   * The character's abilities.
   */
  skills: MihomoSkill[];
  /**
   * The character's Traces including locked ones.
   */
  skill_trees: MihomoSkillTree[];
  /**
   * Relics equipped by the character.
   */
  relics: MihomoRelic[];
  /**
   * Enabled relic set bonuses on the character.
   */
  relic_sets: MihomoRelicSet[];
  /**
   * Total stats of the character.
   */
  statistics: MihomoAttribute[];
  /**
   * Total stats buffs from talents, light cone, relics, and relic set bonus.
   */
  additions: MihomoAttribute[];
  /**
   * The light cone equipped by the character. if none equipped, the value is undefined.
   */
  light_cone?: MihomoLightCone;
  /**
   * The character's position in Support Character and Starfaring Companions.
   */
  pos: [0 | 1 | 2 | 3 | 4 | 5 | 6 | 7];
}

interface MihomoElement extends iconPath {
  color: string;
}

interface MihomoSkill extends iconWithLevel, description {
  /**
   * The max level of the Skill.
   */
  max_level: number;
  /**
   * The element of the Skill.
   */
  element: MihomoElement | null;
  /**
   * The type of the Skill.
   * @example "Normal"
   */
  type: string | SkillType;
  /**
   * The localed type name of the Skill.
   */
  type_text: string;
  /**
   * The effect of the Skill.
   * @example "SingleAttack"
   */
  effect: string | SkillEffect;
  /**
   * The localed effect name of the Skill.
   */
  effect_text: string;
  /**
   * The description showed when Brief Description is toggled on.
   */
  simple_desc: string;
}
type SkillType = "Normal" | "BPSkill" | "Ultra" | "Talent" | "MazeNormal" | "Maze";
type SkillEffect =
  | "SingleAttack"
  | "Blast"
  | "AoEAttack"
  | "Bounce"
  | "Support"
  | "MazeAttack"
  | "Enhance";

interface MihomoSkillTree extends Omit<iconWithLevel, "name"> {
  anchor: string;
  max_level: number;
  parent: string | null;
}

interface MihomoRelic extends iconWithLevel {
  /**
   * Number indicating Head, Arm, Torso, Legs, Orb or Rope.
   */
  type: MihomoRelicType;
  /**
   * ID of the Relic Set.
   */
  set_id: string; //"115"
  /**
   * The localed name of the Relic Set.
   */
  set_name: string;
  /**
   * The Rarity of the Relic.
   */
  rarity: 3 | 4 | 5;
  /**
   * The Main Option of the Relic.
   */
  main_affix: MihomoProperty;
  /**
   * The Sub Options of the Relic.
   */
  sub_affix: MihomoSubAffix[];
}

interface MihomoAttribute extends Omit<MihomoProperty, "type"> {}

interface MihomoProperty extends BaseStatObject, Omit<iconPath, "id"> {
  /**
   * The type of the Stat.
   * @example "HPDelta"
   */
  type: string;
  /**
   * The Stat name.
   * @example "hp"
   */
  field: BaseStatField | string;
  /**
   * The value of the Stat.
   */
  value: number;
  /**
   * The displayed value of the Stat.
   */
  display: string;
  /**
   * Whether the Stat is a percentage, like Crit Rate.
   */
  percent: boolean;
}

type MihomoSubAffixType =
  | "HPDelta"
  | "AttackDelta"
  | "DefenceDelta"
  | "HPAddedRatio"
  | "AttackAddedRatio"
  | "DefenceAddedRatio"
  | "SpeedDelta"
  | "CriticalChanceBase"
  | "CriticalDamageBase"
  | "StatusProbabilityBase"
  | "StatusResistanceBase"
  | "BreakDamageAddedRatioBase";
interface MihomoSubAffix extends MihomoProperty {
  /**
   * The type of the Stat.
   * @example "HPDelta"
   */
  type: MihomoSubAffixType;
  /**
   * Number of Hits on the Sub Option.
   */
  count: 1 | 2 | 3 | 4 | 5 | 6;
  /**
   * The step of the initial value of the Sub Option.
   */
  step: number;
}

interface MihomoRelicSet extends iconPath, description, properties {
  /**
   * Number of the Relic Set bonus.
   */
  num: 2 | 4;
}

interface MihomoLightCone extends BaseSubject {
  /**
   * The Rarity of the Light Cone.
   */
  rarity: 3 | 4 | 5;
  /**
   * The Rank of the Light Cone, increased by Superimposition.
   */
  rank: 1 | 2 | 3 | 4 | 5;
  /**
   * The times of Ascensions of the Light Cone.
   */
  promotion: 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

interface MihomoParsedData {
  /**
   * The player data response.
   */
  player: MihomoPlayer;
  /**
   * The player's characters data.
   */
  characters: MihomoCharacter[];
}

interface MihomoPropertyLocale extends Omit<MihomoProperty, "value" | "display"> {
  /**
   * Whether the property can be an affix or not.
   */
  affix: boolean;
  /**
   * Whether the property is a ratio or not.
   */
  ratio: boolean;
  /**
   * The order of the property in properties.json.
   */
  order: number;
}

interface MihomoWeights {
  /**
   * The weights of main affix for the character.
   */
  main: MihomoMainAffixWeights;
  /**
   * The weights of sub affix for the character.
   */
  weight: MihomoSubAffixWeights;
  /**
   * The maximum number of the sub affix score. Used to normalize.
   */
  max: number;
}

type MihomoMainAffixWeights = Record<MihomoRelicType, Record<string, number>>;

type MihomoSubAffixWeights = Record<MihomoSubAffixType, number>;
