import { NextRequest, NextResponse } from "next/server";

// Cache previews for 10 minutes so repeated renders don't re-fetch
export const revalidate = 600;

function extractMeta(html: string, prop: string): string | undefined {
  // Matches both property="…" and name="…" in either attribute order
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`,
      "i"
    ),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return undefined;
}

function extractTitle(html: string): string | undefined {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m?.[1]?.trim();
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  // Only allow http/https URLs
  if (!/^https?:\/\//i.test(url)) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        // Twitterbot UA makes most sites serve OG meta tags
        "User-Agent": "Twitterbot/1.0",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(6000),
      // Don't follow infinite redirects
      redirect: "follow",
    });

    if (!res.ok) {
      return NextResponse.json(
        { url, error: `Upstream ${res.status}` },
        { status: 502 }
      );
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      // Binary or non-HTML resource — return bare URL info
      return NextResponse.json({ url });
    }

    // Read only the first 50 KB — OG tags are always in <head>
    const reader = res.body?.getReader();
    let html = "";
    let bytes = 0;
    const limit = 50_000;

    if (reader) {
      const decoder = new TextDecoder();
      while (bytes < limit) {
        const { done, value } = await reader.read();
        if (done) break;
        html += decoder.decode(value, { stream: true });
        bytes += value.byteLength;
        // Stop once we've passed </head>
        if (html.includes("</head>")) break;
      }
      reader.cancel();
    }

    const ogTitle = extractMeta(html, "og:title");
    const twitterTitle = extractMeta(html, "twitter:title");
    const ogDesc = extractMeta(html, "og:description");
    const twitterDesc = extractMeta(html, "twitter:description");
    const ogImage = extractMeta(html, "og:image");
    const twitterImage = extractMeta(html, "twitter:image");
    const siteName = extractMeta(html, "og:site_name");
    const pageTitle = extractTitle(html);

    const payload = {
      url,
      title: ogTitle ?? twitterTitle ?? pageTitle,
      description: ogDesc ?? twitterDesc,
      image: ogImage ?? twitterImage,
      siteName,
    };

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ url, error: message }, { status: 502 });
  }
}