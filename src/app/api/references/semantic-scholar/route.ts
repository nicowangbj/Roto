import { NextRequest, NextResponse } from "next/server";

interface SemanticScholarAuthor {
  name?: string;
}

interface SemanticScholarPaper {
  paperId?: string;
  title?: string;
  abstract?: string | null;
  year?: number | null;
  url?: string | null;
  citationCount?: number | null;
  authors?: SemanticScholarAuthor[];
  fieldsOfStudy?: string[] | null;
}

function truncate(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trim()}...`;
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("query")?.trim();
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") || 8), 10);

  if (!query) {
    return NextResponse.json({ references: [] });
  }

  const url = new URL("https://api.semanticscholar.org/graph/v1/paper/search");
  url.searchParams.set("query", query);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set(
    "fields",
    "paperId,title,abstract,authors,year,url,citationCount,fieldsOfStudy"
  );

  const headers: HeadersInit = {};
  if (process.env.SEMANTIC_SCHOLAR_API_KEY) {
    headers["x-api-key"] = process.env.SEMANTIC_SCHOLAR_API_KEY;
  }

  try {
    const res = await fetch(url, {
      headers,
      next: { revalidate: 60 * 60 * 24 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { references: [], error: `Semantic Scholar returned ${res.status}` },
        { status: 200 }
      );
    }

    const data = (await res.json()) as { data?: SemanticScholarPaper[] };
    const references = (data.data ?? [])
      .filter((paper) => paper.title)
      .map((paper) => {
        const authors = (paper.authors ?? [])
          .map((author) => author.name)
          .filter((name): name is string => Boolean(name))
          .slice(0, 3);
        const field = paper.fieldsOfStudy?.[0] || "Research paper";
        return {
          title: paper.title || "Untitled paper",
          description:
            paper.abstract?.trim()
              ? truncate(paper.abstract.trim(), 260)
              : "No abstract is available from Semantic Scholar for this paper.",
          difficulty: "Real paper",
          field,
          source: "Semantic Scholar",
          url: paper.url || (paper.paperId ? `https://www.semanticscholar.org/paper/${paper.paperId}` : null),
          year: paper.year ?? null,
          authors,
          citationCount: paper.citationCount ?? 0,
        };
      });

    return NextResponse.json({ references });
  } catch (error) {
    console.error("Semantic Scholar search failed:", error);
    return NextResponse.json({ references: [], error: "Semantic Scholar search failed" });
  }
}
