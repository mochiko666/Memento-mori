import { type Snowflake } from "discord.js";
import { promises as fs } from "fs";
import path from "path";
import type SpotifyWebApi from "spotify-web-api-node";
const tokensPath = path.join(process.cwd(), "tokens.json");

/**
 * @param wrapped Optional. Whether to convert {@link TokenFile} to {@link TokenFileWrapper}. Default is false.
 */
function readTokens(wrapped: true, path?: string | Buffer | URL): Promise<TokenFileWrapper>;
function readTokens(wrapped?: false, path?: string | Buffer | URL): Promise<TokenFile>;
async function readTokens(wrapped: boolean = false, path: string | Buffer | URL = tokensPath) {
  try {
    const raw = await fs.readFile(path, "utf-8");
    const file = JSON.parse(raw);
    return wrapped ? new TokenFileWrapper(file, path) : file;
  } catch (e: any) {
    if (e?.code === "ENOENT") return wrapped ? new TokenFileWrapper({}, path) : {};
    throw e;
  }
}

async function saveTokens(tokens: TokenFile, path?: string | Buffer | URL): Promise<void> {
  const tmpPath = path || tokensPath + ".tmp";
  await fs.writeFile(tmpPath, JSON.stringify(tokens, null, 2));
  await fs.rename(tmpPath, tokensPath);
}

async function setToken(userId: Snowflake, data: UserTokenData): Promise<void> {
  const { access_token, refresh_token, expires_in } = data;
  const tokens = await readTokens();

  tokens[userId] = {
    access_token: access_token,
    refresh_token: refresh_token,
    expires_in: Date.now() + expires_in * 1000,
  };
  await saveTokens(tokens);
}

async function getToken(userId: Snowflake): Promise<UserTokenData | null> {
  const tokens = await readTokens();
  return tokens[userId] || null;
}

async function deleteToken(userId: Snowflake): Promise<void> {
  const tokens = await readTokens();
  delete tokens[userId];
  await saveTokens(tokens);
}

const isValid = (data: UserTokenData): boolean => Date.now() < data.expires_in;

/**
 * Checks if the token is valid by user id.
 * @returns A promise that if successful, returns boolean
 *          indicating whether the user's token exists and is valid or not.
 */
async function isValidById(userId: Snowflake): Promise<boolean> {
  let data = await getToken(userId);
  if (!data) return false;
  let { expires_in } = data;
  return Date.now() < expires_in;
}

/**
 * Decodes base64url buffered text to {@link SpotifyStatePayload}.
 */
function parseState(state: string): SpotifyStatePayload | undefined {
  try {
    const json = Buffer.from(state, "base64url").toString();
    const data = JSON.parse(json);
    if (typeof data.user_id === "string" && typeof data.url_state === "string") {
      return data;
    }
    return;
  } catch {
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
  public constructor(
    readonly tokenFile: TokenFile,
    readonly filePath: string | Buffer | URL = tokensPath
  ) {
    for (const [userId, data] of Object.entries(tokenFile)) this.set(userId, data);
  }
  private cache = new Map<Snowflake, UserTokenDataWrapper>();
  public get file(): TokenFile {
    return this.tokenFile;
  }
  public async save(): Promise<void> {
    const tmpPath = this.filePath + ".tmp";
    await fs.writeFile(tmpPath, JSON.stringify(this.file, null, 2));
    await fs.rename(tmpPath, this.filePath);
  }
  private set = (userId: Snowflake, data: UserTokenData) =>
    this.cache.set(userId, new UserTokenDataWrapper(userId, data, this));
  public has = (userId: Snowflake): boolean => this.cache.has(userId);
  public get = (userId: Snowflake): UserTokenDataWrapper | undefined => this.cache.get(userId);
  /**
   * Adds user token data to the token file.
   * @returns A promise that if successful, returns true.
   *          if the user id already existed in the cache, returns false.
   */
  public async add(userId: Snowflake, data: UserTokenData): Promise<boolean> {
    if (this.cache.has(userId)) return false;
    this.set(userId, data);
    await this.save();
    return true;
  }
  /**
   * Deletes the user's token data from the token file.
   * @returns true if the user id in the cache existed and has been removed,
   *          or false if the user id does not exist.
   */
  public async delete(userId: Snowflake): Promise<boolean> {
    const existed = this.cache.delete(userId);
    if (existed) await this.save();
    return existed;
  }
}

class UserTokenDataWrapper {
  public constructor(
    readonly userId: Snowflake,
    private tokenData: UserTokenData,
    readonly file: TokenFileWrapper
  ) {}
  public get access_token() {
    return this.data.access_token;
  }
  public get refresh_token() {
    return this.data.refresh_token;
  }
  public get expires_in() {
    return this.data.expires_in;
  }
  public get data() {
    return this.tokenData;
  }
  public async setAccessToken(access_token: string): Promise<void> {
    this.data.access_token = access_token;
    await this.file.save();
  }
  public async setRefreshToken(refresh_token: string): Promise<void> {
    this.data.refresh_token = refresh_token;
    await this.file.save();
  }
  public async setExpiresIn(timestamp: number): Promise<void> {
    this.data.expires_in = timestamp;
    await this.file.save();
  }
  public async set(data: Partial<UserTokenData>): Promise<void> {
    Object.assign(this.data, data);
    await this.file.save();
  }
  public delete = async (): Promise<boolean> => await this.file.delete(this.userId);
  /**
   * Refreshes the access token if expired.
   * @param spotifyApi {@link SpotifyWebApi}.
   * @param set Whether to set the access token to spotifyApi. Default is false.
   * @returns A promise that if successful, resolves to the new access token.
   *          If the promise rejected, returns undefined.
   */
  public async refreshAccessToken(
    spotifyApi: SpotifyWebApi,
    set: boolean = false
  ): Promise<string | undefined> {
    let token: string;
    if (this.isValid()) token = this.data.access_token;
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
        if (originalRefreshToken) spotifyApi.setRefreshToken(originalRefreshToken);
        else spotifyApi.resetRefreshToken();

        token = access_token;
      } catch {
        return;
      }
    if (set && !spotifyApi.getAccessToken()) spotifyApi.setAccessToken(token);
    return token;
  }
  public isValid = () => Date.now() < this.expires_in - 666; //subtract 666ms from expiration time for safety
}

export {
  deleteToken,
  getToken,
  isValid,
  isValidById,
  parseState,
  readTokens,
  saveTokens,
  setToken,
  TokenFileWrapper,
  tokenUtils,
};
