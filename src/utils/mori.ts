import { type Snowflake } from "discord.js";
import { promises as fs } from "fs";
import path from "path";
const LIST_PATH = path.resolve("cache", "mori_users.txt");

const messages = [
  "Memento mori.",
  "Remember that you will die.",
  "お前はいずれ死ぬのだ。それを忘れるな？",
];
function memento(): string {
  let rand = Math.random();
  let message = messages[rand < 0.06 ? 2 : rand < 0.13 ? 1 : 0];
  return message || "Memento mori.";
}

async function readList(path: string | Buffer | URL = LIST_PATH) {
  try {
    const raw = await fs.readFile(path, "utf-8"); // 123456789\n987654321
    return raw
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean); // ["123456789", "987654321"]
  } catch (e: any) {
    if (e?.code === "ENOENT") return [];
    throw e;
  }
}

async function saveList(ids: Snowflake[], path: string | Buffer | URL = LIST_PATH) {
  const uniq = Array.from(new Set(ids.map((s) => s.trim()).filter(Boolean)));
  const tmp = LIST_PATH + ".tmp";
  await fs.writeFile(tmp, uniq.join("\n"), "utf8");
  await fs.rename(tmp, path);
}

async function hasId(id: Snowflake, path: string | Buffer | URL = LIST_PATH) {
  const ids = await readList(path);
  return ids.includes(id);
}

async function addUserId(id: Snowflake, path: string | Buffer | URL = LIST_PATH) {
  const ids = await readList(path);
  if (!ids.includes(id)) ids.push(id);
  await saveList(ids, path);
}

async function removeUserId(id: Snowflake, path: string | Buffer | URL = LIST_PATH) {
  const ids = await readList(path);
  const filtered = ids.filter((x) => x !== id);
  await saveList(filtered);
}

const moriUtils = {
  memento,
  read: readList,
  save: saveList,
  has: hasId,
  add: addUserId,
  remove: removeUserId,
};

class IDManager {
  private cache: Snowflake[] = [];
  public get ids(): readonly Snowflake[] {
    return this.cache;
  }
  public static async init(path: string | Buffer | URL = LIST_PATH) {
    const instance = new IDManager(path);
    await instance.load();
    return instance;
  }
  constructor(readonly path: string | Buffer | URL = LIST_PATH) {}
  public load = async (): Promise<readonly Snowflake[]> => (this.cache = await readList(this.path));
  public save = async (): Promise<void> => await saveList(this.cache, this.path);
  public has = (id: Snowflake): boolean => this.cache.includes(id);
  public async add(id: Snowflake): Promise<void> {
    if (!this.has(id)) this.cache.push(id);
    await this.save();
  }
  public async delete(id: Snowflake): Promise<void> {
    this.cache = this.cache.filter((cachedId) => cachedId !== id);
    await this.save();
  }
}

export { addUserId, hasId, IDManager, memento, moriUtils, readList, removeUserId, saveList };
