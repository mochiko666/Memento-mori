interface AuthorizeData {
  saved_state: string;
  channel_id: string;
}
interface SpotifyStatePayload {
  user_id: string;
  url_state: string;
}
interface UserTokenData {
  access_token: string;
  refresh_token: string;
  /**
   * Time to expiration in milliseconds since midnight, January 1, 1970 Universal Coordinated Time (UTC).
   */
  expires_in: number;
}
type TokenFile = Record<string, UserTokenData>;
