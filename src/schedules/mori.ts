import { memento } from "../utils/mori.js";
const name = "mori";
const time = "0 6,18 * * *"; // every day at 06:00 and 18:00

async function execute() {
  const { client, moriUsers } = await import("../index.js"); //avoid circular dependency

  let { cache } = moriUsers;
  for (let id of cache) {
    let user = await client.users.fetch(id).catch(() => undefined);
    if (!user) {
      console.error("Failed to get user with id:", id);
      continue;
    }
    await user.send(memento());
  }
}

export { execute, name, time };
