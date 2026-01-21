import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  Client,
  ClientEvents,
  Collection,
  SharedSlashCommand,
} from "discord.js";

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
interface ExtendedClient<Ready extends boolean = boolean> extends Client<Ready> {
  commands: Collection<string, SlashCommand>;
}
