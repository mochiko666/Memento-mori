import { Events, type Message, type OmitPartialGroupDMChannel } from "discord.js";
import { memento } from "../utils/mori.js";

const name = Events.MessageCreate;
async function execute(message: OmitPartialGroupDMChannel<Message>) {
  if (message.author.bot) return;
  // DM
  if (!message.inGuild()) {
    await message.reply(memento());
    return;
  }
}

export { name, execute };
