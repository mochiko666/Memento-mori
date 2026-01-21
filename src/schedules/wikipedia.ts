import { searchArticle } from "../classes/wikipedia.js";

const name = "wikipedia";
const time = "0 20 * * *"; // every day at 20:00

async function execute() {
  const { client, wikiChannels } = await import("../index.js"); //avoid circular dependency

  let { cache } = wikiChannels;
  for (let id of cache) {
    let channel = await client.channels.fetch(id).catch(() => undefined);
    if (!channel || !("send" in channel)) {
      console.error("Failed to get channel with id:", id);
      continue;
    }

    let article = await searchArticle("哲学", true, 666);
    if (!article) {
      console.error("Failed to find an article.");
      continue;
    }
    await channel.send(article);
  }
}

export { execute, name, time };
