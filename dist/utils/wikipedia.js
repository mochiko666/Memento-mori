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
    url.searchParams.set("rnnamespace", "0");
    url.searchParams.set("format", "json");
    try {
        const res = await fetch(url.href);
        const data = await res.json();
        const [article] = data.query.random;
        if (!article)
            return;
        const pageUrl = buildURL(article.title);
        return pageUrl;
    }
    catch {
        return;
    }
}
async function getArticleWithCategory(category, randomized = false) {
    const url = new URL(endpoint);
    url.searchParams.set("action", "query");
    url.searchParams.set("list", "categorymembers");
    url.searchParams.set("cmlimit", randomized ? "max" : "1");
    url.searchParams.set("cmtitle", `Category:${category}`);
    url.searchParams.set("format", "json");
    try {
        const res = await fetch(url.href).then((res) => res.json());
        const { categorymembers } = res.query;
        const index = randomized ? Math.floor(Math.random() * categorymembers.length) : 0;
        const article = categorymembers[index];
        if (!article)
            return;
        const pageUrl = buildURL(article.title);
        return pageUrl;
    }
    catch {
        return;
    }
}
/**
 * @param query Query to search for.
 * @param randomized Whether to get a random article from the search results. Default is false.
 * @param threshold Maximum number of search results to consider when randomized is true.
 * @returns String URL for a random article fetched from wikipedia.
 */
async function searchArticle(query, randomized = false, threshold) {
    const url = new URL(endpoint);
    url.searchParams.set("action", "query");
    url.searchParams.set("list", "search");
    url.searchParams.set("srsearch", query);
    url.searchParams.set("srlimit", "1");
    url.searchParams.set("srnamespace", "0");
    url.searchParams.set("format", "json");
    try {
        const res = await fetch(url.href).then((res) => res.json());
        let { search, searchinfo } = res.query;
        if (randomized) {
            const { totalhits } = searchinfo;
            const offset = Math.floor(Math.random() * (threshold ? Math.min(totalhits, threshold) : totalhits));
            url.searchParams.set("sroffset", offset.toString());
            search = (await fetch(url.href).then((res) => res.json())).query.search;
        }
        const [article] = search;
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
export { getArticleWithCategory, getRandomArticle, searchArticle };
//# sourceMappingURL=wikipedia.js.map