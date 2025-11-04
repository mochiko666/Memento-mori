import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import express from "express";
import SpotifyWebApi from "spotify-web-api-node";
const data = new SlashCommandBuilder()
    .setName("spotify")
    .setDescription("Fetch your top Spotify tracks. Need to authorize first.")
    .addStringOption((option) => option
    .setName("time_range")
    .setDescription("Select the time range for top tracks. Default is short term.")
    .addChoices({ name: "Short Term (4 weeks)", value: "short_term" }, { name: "Medium Term (6 months)", value: "medium_term" }, { name: "Long Term (several years)", value: "long_term" }));
async function execute(interaction) {
    await interaction.deferReply({ flags: "Ephemeral" });
    let time_range = (interaction.options.getString("time_range") || "short_term");
    let spotifyApi = new SpotifyWebApi({
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
        redirectUri: process.env.SPOTIFY_REDIRECT_URI,
    });
    const app = express();
    // 1. 認証URLを表示
    app.get("/", (req, res) => {
        const scopes = ["playlist-read-private", "user-read-private", "user-library-read", "user-top-read"];
        const authorizeURL = spotifyApi.createAuthorizeURL(scopes, "state123");
        res.redirect(authorizeURL);
    });
    // 2. 認証後のコールバック
    app.get("/callback", async (req, res) => {
        let { code } = req.query;
        if (!code || typeof code !== "string") {
            res.status(400).send("Invalid code");
            return;
        }
        try {
            let { body } = await spotifyApi.authorizationCodeGrant(code);
            spotifyApi.setAccessToken(body.access_token);
            spotifyApi.setRefreshToken(body.refresh_token);
            res.send("<script>window.close()</script>");
            let { items } = (await spotifyApi.getMyTopTracks({ time_range: time_range, limit: 4 })).body;
            let tracks = items.map((track) => ({
                title: track.name,
                artists: track.artists.map((artist) => artist.name).join(", "),
                link: track.external_urls.spotify,
            }));
            let me = await spotifyApi.getMe();
            let { spotify } = me.body.external_urls;
            let user = await interaction.user.fetch(true);
            let avatar_url = user.displayAvatarURL();
            let { accentColor } = user;
            let embed = new EmbedBuilder()
                .setTitle("Your Top Spotify Tracks")
                .setDescription(`in the ${time_range.replace("_", " ")}`)
                .setURL(spotify)
                .setThumbnail(avatar_url)
                .setColor(accentColor || "#ed86d3");
            tracks.forEach((track, i) => {
                embed.addFields({ name: `__***${i + 1}.***__`, value: `[**${track.title}**](${track.link})    by ${track.artists}` });
            });
            await interaction.deleteReply();
            await interaction.followUp({ embeds: [embed] });
        }
        catch (err) {
            res.status(500).send("認証エラー: " + err);
            await interaction.editReply("Failed to authenticate.");
        }
        finally {
            server.close();
        }
    });
    const server = app.listen(process.env.SPOTIFY_AUTH_PORT, async () => {
        await interaction.editReply(`Authenticate [here](${process.env.SPOTIFY_AUTH_URL})`);
    });
    setTimeout(() => {
        server.close();
        return;
    }, 13 * 1000);
}
export { data, execute };
//# sourceMappingURL=spotify.js.map