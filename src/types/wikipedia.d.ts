interface WikipediaArticle {
  ns: number;
  title: string;
}
interface RandomArticle extends WikipediaArticle {
  id: number;
}
interface CategoryMembersArticle extends WikipediaArticle {
  pageid: number;
}
interface searchArticle extends CategoryMembersArticle {
  size: number;
  wordcount: number;
  snippet: string;
  timestamp: string;
}
interface BaseArticleResponse {
  batchcomplete: string;
}
interface RandomArticleResponse extends BaseArticleResponse {
  query: {
    random: RandomArticle[];
  };
  continue: {
    rncontinue: string;
    continue: string;
  };
}
interface CategoryMembersResponse extends BaseArticleResponse {
  query: {
    categorymembers: CategoryMembersArticle[];
  };
}
interface searchArticleResponse extends BaseArticleResponse {
  continue: {
    sroffset: number;
    continue: string;
  };
  query: {
    searchinfo: {
      totalhits: number;
    };
    search: searchArticle[];
  };
}
