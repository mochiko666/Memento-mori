import { promises as fs } from "fs";
import path from "path";
const LIST_PATH = path.join(import.meta.dirname, "list.txt");
const messages = ["Memento mori.", "Remember that you will die.", "お前はいずれ死ぬのだ。それを忘れるな？"];
function mori() {
    let rand = Math.random();
    let message = messages[rand < 0.06 ? 2 : rand < 0.13 ? 1 : 0];
    return message || "Memento mori.";
}
async function readList() {
    try {
        const raw = await fs.readFile(LIST_PATH, "utf-8"); // 123456789\n987654321
        return raw.split("\n").map((s) => s.trim()).filter(Boolean); // ["123456789", "987654321"]
    }
    catch (e) {
        if (e?.code === "ENOENT")
            return [];
        throw e;
    }
}
async function saveList(ids) {
    const uniq = Array.from(new Set(ids.map((s) => s.trim()).filter(Boolean))); // remove duplicates and empty strings
    await fs.writeFile(LIST_PATH, uniq.join("\n"), "utf-8"); // "123456789\n987654321"
}
async function addUserId(id) {
    const ids = await readList();
    if (ids.includes(id))
        return;
    ids.push(id);
    await saveList(ids);
}
async function removeUserId(id) {
    const ids = await readList();
    const filtered = ids.filter((x) => x !== id);
    await saveList(filtered);
}
export { mori, readList, saveList, addUserId, removeUserId };
//# sourceMappingURL=utils.js.map