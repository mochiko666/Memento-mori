const endpoint = "https://ja.wikipedia.org/w/api.php";
/**
 * @param limit Number to fetch. Default is 1.
 * @returns String URL for a random article fetched from wikipedia.
 */
async function getRandomArticle(limit = 1) {
    const url = new URL(endpoint);
    url.searchParams.set("action", "query");
    url.searchParams.set("list", "random");
    url.searchParams.set("rnlimit", limit.toString());
    url.searchParams.set("format", "json");
    try {
        const res = await fetch(url.href);
        const data = await res.json();
        const article = data.query.random[0];
        if (!article)
            return;
        const pageUrl = buildURL(article.title);
        return pageUrl;
    }
    catch {
        return;
    }
}
const buildURL = (title) => `https://ja.wikipedia.org/wiki/${encodeURIComponent(title)}`;
export { getRandomArticle };
//# sourceMappingURL=wikipedia.js.map