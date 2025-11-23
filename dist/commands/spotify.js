import { EmbedBuilder, SlashCommandBuilder, } from "discord.js";
const data = new SlashCommandBuilder()
    .setName("spotify")
    .setDescription("Use Spotify functions.")
    .addSubcommandGroup((group) => group
    .setName("permission")
    .setDescription("Manage your Spotify permissions.")
    .addSubcommand((subcommand) => subcommand
    .setName("authorize")
    .setDescription("Authorize the permission to access your spotify account."))
    .addSubcommand((subcommand) => subcommand
    .setName("deauthorize")
    .setDescription("Revoke the authorization to access your spotify account."))
    .addSubcommand((subcommand) => subcommand
    .setName("list")
    .setDescription("Show the list of users' ids whose token is registered.")))
    .addSubcommandGroup((group) => group
    .setName("info")
    .setDescription("Get Spotify tracks information. Need to authorize if you haven't yet.")
    .addSubcommand((subcommand) => subcommand
    .setName("mytop")
    .setDescription("Fetch your top Spotify tracks. Need to authorize if you haven't yet.")
    .addStringOption((option) => option
    .setName("time_range")
    .setDescription("Select the time range for top tracks. Default is short term.")
    .addChoices({ name: "Short Term (4 weeks)", value: "short_term" }, { name: "Medium Term (6 months)", value: "medium_term" }, { name: "Long Term (several years)", value: "long_term" })))
    .addSubcommand((subcommand) => subcommand
    .setName("search")
    .setDescription("Search for Spotify tracks. Need to authorize if you haven't yet.")
    .addStringOption((option) => option.setName("query").setDescription("The word to search for.").setRequired(true))));
async function execute(interaction) {
    let group = interaction.options.getSubcommandGroup(true);
    let subcommand = interaction.options.getSubcommand();
    let { id } = interaction.user;
    let { spotifyApi, tokenFile } = await import("../index.js");
    let reply = "";
    switch (group) {
        case "permission":
            let { stateMap } = await import("../index.js"); //dynamic import in order to aviod co-import
            switch (subcommand) {
                case "authorize": {
                    if (tokenFile.has(id)) {
                        reply = {
                            content: "You have already authorized the application permission.",
                            flags: "Ephemeral",
                        };
                        break;
                    }
                    let { channelId } = interaction;
                    let state = Math.random().toString(36);
                    let payload = {
                        user_id: id,
                        url_state: state,
                    };
                    let bufferedState = Buffer.from(JSON.stringify(payload)).toString("base64url");
                    stateMap.set(id, { saved_state: state, channel_id: channelId });
                    reply = {
                        content: `Please authorize [here](${spotifyApi.createAuthorizeURL(["user-top-read"], bufferedState)}.)`,
                        flags: "Ephemeral",
                    };
                    break;
                }
                case "deauthorize": {
                    let result = await tokenFile.delete(id);
                    reply = {
                        content: result
                            ? "Authorization successfully revoked."
                            : "You have not authorized yet.",
                        flags: "Ephemeral",
                    };
                    break;
                }
                case "list": {
                    let ids = [...Object.keys(tokenFile.file)]; // ["1234567890", "0987654321"]
                    if (ids.length === 0) {
                        reply = "No users authorized yet.";
                        break;
                    }
                    let list = ids.map((id) => `<@${id}>`).join("\n");
                    reply = `Users who has authorized:\n${list}`; // @1234567890\n@0987654321
                    break;
                }
            }
            break;
        case "info":
            let tokenData = tokenFile.get(id);
            if (!tokenData) {
                reply = {
                    content: "You have not authorized the application permission yet. Please do /spotify permission authorize.",
                    flags: "Ephemeral",
                };
                break;
            }
            let access_token = await tokenData.refreshAccessToken(spotifyApi, true);
            if (!access_token)
                throw new Error("Failed to get access token.");
            switch (subcommand) {
                case "mytop": {
                    let time_range = (interaction.options.getString("time_range") || "short_term");
                    let { items } = (await spotifyApi.getMyTopTracks({ time_range: time_range, limit: 4 }))
                        .body;
                    let tracks = items.map((track) => ({
                        title: track.name,
                        artists: track.artists.map((artist) => artist.name).join(", "),
                        link: track.external_urls.spotify,
                    }));
                    let me = await spotifyApi.getMe();
                    let { spotify } = me.body.external_urls;
                    //discord profile
                    let user = await interaction.user.fetch(true);
                    let avatar_url = user.displayAvatarURL();
                    let { displayName, accentColor } = user;
                    let embed = new EmbedBuilder()
                        .setTitle(`${displayName}'s Top Spotify Tracks`)
                        .setDescription(`in the ${time_range.replace("_", " ")}`)
                        .setURL(spotify)
                        .setThumbnail(avatar_url)
                        .setColor(accentColor || "#ed86d3");
                    tracks.forEach((track, i) => {
                        embed.addFields({
                            name: `__***${i + 1}.***__`,
                            value: `[**${track.title}**](${track.link})      by ${track.artists}`,
                        });
                    });
                    reply = { embeds: [embed] };
                    break;
                }
                case "search": {
                    let query = interaction.options.getString("query", true);
                    let { tracks } = (await spotifyApi.searchTracks(query, { limit: 1 })).body;
                    if (!tracks || tracks.items.length === 0) {
                        reply = "No tracks found.";
                        break;
                    }
                    let [track] = tracks.items;
                    reply = track.external_urls.spotify;
                    break;
                }
            }
            spotifyApi.resetAccessToken();
            break;
    }
    await interaction.reply(reply);
}
export { data, execute };
//# sourceMappingURL=spotify.js.map