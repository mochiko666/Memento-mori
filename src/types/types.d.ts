import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  Client,
  ClientEvents,
  Collection,
  SharedSlashCommand,
  Snowflake,
} from "discord.js";

declare global {
  interface SlashCommand {
    data: SharedSlashCommand;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
    autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
  }
  interface EventHandler {
    name: keyof ClientEvents;
    once?: boolean;
    execute: (...args: any[]) => Promise<void>;
  }

  interface Schedule {
    name: string;
    time: string;
    timezone?: string;
    execute: () => Promise<void>;
  }
  interface ExtendedClient extends Client {
    commands: Collection<string, SlashCommand>;
  }
  interface AuthorizeData {
    saved_state: string;
    channel_id: Snowflake;
  }
  type stateMap = Map<string, AuthorizeData>;
  interface SpotifyStatePayload {
    user_id: Snowflake;
    url_state: string;
  }
  interface UserTokenData {
    access_token: string;
    refresh_token: string;
    /**
     * Time to expiration in milliseconds since midnight, January 1, 1970 Universal Coordinated Time (UTC).
     */
    expires_in: number;
  }
  type TokenFile = Record<Snowflake, UserTokenData>;

  interface WikipediaArticle {
    ns: number;
    title: string;
  }
  interface RandomArticle extends WikipediaArticle {
    id: number;
  }
  interface CategoryMembersArticle extends WikipediaArticle {
    pageid: number;
  }
  interface searchArticle extends CategoryMembersArticle {
    size: number;
    wordcount: number;
    snippet: string;
    timestamp: string;
  }
  interface BaseArticleResponse {
    batchcomplete: string;
  }
  interface RandomArticleResponse extends BaseArticleResponse {
    query: {
      random: RandomArticle[];
    };
    continue: {
      rncontinue: string;
      continue: string;
    };
  }
  interface CategoryMembersResponse extends BaseArticleResponse {
    query: {
      categorymembers: CategoryMembersArticle[];
    };
  }
  interface searchArticleResponse extends BaseArticleResponse {
    continue: {
      sroffset: number;
      continue: string;
    };
    query: {
      searchinfo: {
        totalhits: number;
      };
      search: searchArticle[];
    };
  }

}
