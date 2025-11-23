import {} from "discord.js";
import { promises as fs } from "fs";
import path from "path";
const LIST_PATH = path.join(process.cwd(), "mori_users.txt");
const messages = [
    "Memento mori.",
    "Remember that you will die.",
    "お前はいずれ死ぬのだ。それを忘れるな？",
];
function memento() {
    let rand = Math.random();
    let message = messages[rand < 0.06 ? 2 : rand < 0.13 ? 1 : 0];
    return message || "Memento mori.";
}
async function readList(path = LIST_PATH) {
    try {
        const raw = await fs.readFile(path, "utf-8"); // 123456789\n987654321
        return raw
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean); // ["123456789", "987654321"]
    }
    catch (e) {
        if (e?.code === "ENOENT")
            return [];
        throw e;
    }
}
async function saveList(ids, path = LIST_PATH) {
    const uniq = Array.from(new Set(ids.map((s) => s.trim()).filter(Boolean)));
    const tmp = LIST_PATH + ".tmp";
    await fs.writeFile(tmp, uniq.join("\n"), "utf8");
    await fs.rename(tmp, path);
}
async function hasId(id, path = LIST_PATH) {
    const ids = await readList(path);
    return ids.includes(id);
}
async function addUserId(id, path = LIST_PATH) {
    const ids = await readList(path);
    if (!ids.includes(id))
        ids.push(id);
    await saveList(ids, path);
}
async function removeUserId(id, path = LIST_PATH) {
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
    path;
    cache = [];
    get ids() {
        return this.cache;
    }
    constructor(path = LIST_PATH) {
        this.path = path;
    }
    load = async () => (this.cache = await readList(this.path));
    save = async () => await saveList(this.cache, this.path);
    has = (id) => this.cache.includes(id);
    async add(id) {
        if (!this.has(id))
            this.cache.push(id);
        await this.save();
    }
    async delete(id) {
        this.cache = this.cache.filter((cachedId) => cachedId !== id);
        await this.save();
    }
}
export { addUserId, hasId, IDManager, memento, moriUtils, readList, removeUserId, saveList };
//# sourceMappingURL=mori.js.map