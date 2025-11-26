import { Events, type Message, type OmitPartialGroupDMChannel } from "discord.js";
import { memento } from "../utils/mori.js";

export const Handler: EventHandler = {
  name: Events.MessageCreate,
  async execute(message: OmitPartialGroupDMChannel<Message>) {
    if (message.author.bot) return;
    // DM
    if (!message.inGuild()) {
      await message.reply(memento());
      return;
    }
  },
};
