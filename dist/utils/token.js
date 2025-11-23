import {} from "discord.js";
import { promises as fs } from "fs";
import path from "path";
const tokensPath = path.join(process.cwd(), "tokens.json");
async function readTokens(wrapped = false, path = tokensPath) {
    try {
        const raw = await fs.readFile(path, "utf-8");
        const file = JSON.parse(raw);
        return wrapped ? new TokenFileWrapper(file, path) : file;
    }
    catch (e) {
        if (e?.code === "ENOENT")
            return wrapped ? new TokenFileWrapper({}, path) : {};
        throw e;
    }
}
async function saveTokens(tokens, path) {
    const tmpPath = path || tokensPath + ".tmp";
    await fs.writeFile(tmpPath, JSON.stringify(tokens, null, 2));
    await fs.rename(tmpPath, tokensPath);
}
async function setToken(userId, data) {
    const { access_token, refresh_token, expires_in } = data;
    const tokens = await readTokens();
    tokens[userId] = {
        access_token: access_token,
        refresh_token: refresh_token,
        expires_in: Date.now() + expires_in * 1000,
    };
    await saveTokens(tokens);
}
async function getToken(userId) {
    const tokens = await readTokens();
    return tokens[userId] || null;
}
async function deleteToken(userId) {
    const tokens = await readTokens();
    delete tokens[userId];
    await saveTokens(tokens);
}
const isValid = (data) => Date.now() < data.expires_in;
/**
 * Checks if the token is valid by user id.
 * @returns A promise that if successful, returns boolean
 *          indicating whether the user's token exists and is valid or not.
 */
async function isValidById(userId) {
    let data = await getToken(userId);
    if (!data)
        return false;
    let { expires_in } = data;
    return Date.now() < expires_in;
}
/**
 * Decodes base64url buffered text to {@link SpotifyStatePayload}.
 */
function parseState(state) {
    try {
        const json = Buffer.from(state, "base64url").toString();
        const data = JSON.parse(json);
        if (typeof data.user_id === "string" && typeof data.url_state === "string") {
            return data;
        }
        return;
    }
    catch {
        return;
    }
}
const tokenUtils = {
    set: setToken,
    get: getToken,
    delete: deleteToken,
    isValid,
    parse: parseState,
};
class TokenFileWrapper {
    tokenFile;
    filePath;
    constructor(tokenFile, filePath = tokensPath) {
        this.tokenFile = tokenFile;
        this.filePath = filePath;
        for (const [userId, data] of Object.entries(tokenFile))
            this.set(userId, data);
    }
    cache = new Map();
    get file() {
        return this.tokenFile;
    }
    async save() {
        const tmpPath = this.filePath + ".tmp";
        await fs.writeFile(tmpPath, JSON.stringify(this.file, null, 2));
        await fs.rename(tmpPath, this.filePath);
    }
    set = (userId, data) => this.cache.set(userId, new UserTokenDataWrapper(userId, data, this));
    has = (userId) => this.cache.has(userId);
    get = (userId) => this.cache.get(userId);
    /**
     * Adds user token data to the token file.
     * @returns A promise that if successful, returns true.
     *          if the user id already existed in the cache, returns false.
     */
    async add(userId, data) {
        if (this.cache.has(userId))
            return false;
        this.set(userId, data);
        await this.save();
        return true;
    }
    /**
     * Deletes the user's token data from the token file.
     * @returns true if the user id in the cache existed and has been removed,
     *          or false if the user id does not exist.
     */
    async delete(userId) {
        const existed = this.cache.delete(userId);
        if (existed)
            await this.save();
        return existed;
    }
}
class UserTokenDataWrapper {
    userId;
    tokenData;
    file;
    constructor(userId, tokenData, file) {
        this.userId = userId;
        this.tokenData = tokenData;
        this.file = file;
    }
    get access_token() {
        return this.data.access_token;
    }
    get refresh_token() {
        return this.data.refresh_token;
    }
    get expires_in() {
        return this.data.expires_in;
    }
    get data() {
        return this.tokenData;
    }
    async setAccessToken(access_token) {
        this.data.access_token = access_token;
        await this.file.save();
    }
    async setRefreshToken(refresh_token) {
        this.data.refresh_token = refresh_token;
        await this.file.save();
    }
    async setExpiresIn(timestamp) {
        this.data.expires_in = timestamp;
        await this.file.save();
    }
    async set(data) {
        Object.assign(this.data, data);
        await this.file.save();
    }
    delete = async () => await this.file.delete(this.userId);
    /**
     * Refreshes the access token if expired.
     * @param spotifyApi {@link SpotifyWebApi}.
     * @param set Whether to set the access token to spotifyApi. Default is false.
     * @returns A promise that if successful, resolves to the new access token.
     *          If the promise rejected, returns undefined.
     */
    async refreshAccessToken(spotifyApi, set = false) {
        let token;
        if (this.isValid())
            token = this.data.access_token;
        else
            try {
                let originalRefreshToken = spotifyApi.getRefreshToken();
                spotifyApi.setRefreshToken(this.data.refresh_token);
                let { access_token, refresh_token, expires_in } = (await spotifyApi.refreshAccessToken())
                    .body;
                await this.set({
                    access_token,
                    ...(refresh_token ? { refresh_token } : {}),
                    expires_in: Date.now() + expires_in * 1000,
                });
                //Reset api wrapper's refresh token as it was
                if (originalRefreshToken)
                    spotifyApi.setRefreshToken(originalRefreshToken);
                else
                    spotifyApi.resetRefreshToken();
                token = access_token;
            }
            catch {
                return;
            }
        if (set && !spotifyApi.getAccessToken())
            spotifyApi.setAccessToken(token);
        return token;
    }
    isValid = () => Date.now() < this.expires_in - 666; //subtract 666ms from expiration time for safety
}
export { deleteToken, getToken, isValid, isValidById, parseState, readTokens, saveTokens, setToken, TokenFileWrapper, tokenUtils, };
//# sourceMappingURL=token.js.map