"use client";

import { useEffect, useState } from "react";

type OGData = {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  url: string;
};

type LinkPreviewProps = {
  href: string;
  children: React.ReactNode;
};

/**
 * Fetches OG metadata from your own API route `/api/link-preview?url=...`
 * and renders a rich preview card beneath the link.
 *
 * API route implementation is shown at the bottom of this file as a comment.
 */
export default function LinkPreview({ href, children }: LinkPreviewProps) {
  const [og, setOg] = useState<OGData | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!href || !/^https?:\/\//.test(href)) return;

    let cancelled = false;
    setLoading(true);
    setFailed(false);

    fetch(`/api/link-preview?url=${encodeURIComponent(href)}`)
      .then((r) => r.json())
      .then((data: OGData) => {
        if (!cancelled) setOg(data);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [href]);

  const hostname = (() => {
    try {
      return new URL(href).hostname.replace(/^www\./, "");
    } catch {
      return href;
    }
  })();

  return (
    <span style={{ display: "inline" }}>
      {/* The inline hyperlink */}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: "#60a5fa",
          textDecoration: "underline",
          textDecorationColor: "#3b82f680",
          textUnderlineOffset: "2px",
          fontSize: "inherit",
          transition: "color 0.15s",
        }}
        onMouseEnter={(e) => ((e.target as HTMLAnchorElement).style.color = "#93c5fd")}
        onMouseLeave={(e) => ((e.target as HTMLAnchorElement).style.color = "#60a5fa")}
      >
        {children}
      </a>

      {/* Preview card — only rendered if OG data was successfully fetched */}
      {!failed && (
        <span style={{ display: "block", marginTop: "0.5rem" }}>
          {loading && (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem",
                borderRadius: "0.5rem",
                border: "1px solid #262626",
                backgroundColor: "#111111",
              }}
            >
              {/* Skeleton shimmer */}
              <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <span style={skeletonStyle()} />
                <span style={skeletonStyle("60%")} />
              </span>
            </span>
          )}

          {!loading && og && (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                gap: "0.75rem",
                padding: "0.75rem",
                borderRadius: "0.625rem",
                border: "1px solid #262626",
                backgroundColor: "#111111",
                textDecoration: "none",
                transition: "border-color 0.15s, background-color 0.15s",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.borderColor = "#404040";
                el.style.backgroundColor = "#171717";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.borderColor = "#262626";
                el.style.backgroundColor = "#111111";
              }}
            >
              {/* Thumbnail */}
              {og.image && (
                <span
                  style={{
                    flexShrink: 0,
                    width: "4.5rem",
                    height: "4.5rem",
                    borderRadius: "0.375rem",
                    overflow: "hidden",
                    backgroundColor: "#1a1a1a",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={og.image}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => {
                      (e.currentTarget.parentElement as HTMLElement).style.display = "none";
                    }}
                  />
                </span>
              )}

              {/* Text content */}
              <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                {/* Site name / hostname */}
                <span
                  style={{
                    fontSize: "0.75rem",
                    lineHeight: "1.4",
                    color: "#737373",
                    letterSpacing: "0.02em",
                    textTransform: "uppercase",
                    fontWeight: 500,
                  }}
                >
                  {og.siteName || hostname}
                </span>

                {/* Title */}
                {og.title && (
                  <span
                    style={{
                      fontSize: "0.9375rem",
                      lineHeight: "1.4",
                      fontWeight: 600,
                      color: "#e5e5e5",
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {og.title}
                  </span>
                )}

                {/* Description */}
                {og.description && (
                  <span
                    style={{
                      fontSize: "0.8125rem",
                      lineHeight: "1.5",
                      color: "#a3a3a3",
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {og.description}
                  </span>
                )}

                {/* URL pill */}
                <span
                  style={{
                    marginTop: "0.25rem",
                    fontSize: "0.75rem",
                    color: "#525252",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {hostname}
                </span>
              </span>
            </a>
          )}
        </span>
      )}
    </span>
  );
}

function skeletonStyle(width = "80%"): React.CSSProperties {
  return {
    display: "block",
    height: "0.75rem",
    width,
    borderRadius: "0.25rem",
    backgroundColor: "#262626",
    animation: "pulse 1.5s ease-in-out infinite",
  };
}

/*
──────────────────────────────────────────────────────────────────────────────
REQUIRED: API Route — app/api/link-preview/route.ts
──────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Twitterbot/1.0" }, // many sites serve OG to bots
      signal: AbortSignal.timeout(5000),
    });

    const html = await res.text();

    const get = (prop: string) => {
      const m = html.match(
        new RegExp(`<meta[^>]*(?:property|name)=["']${prop}["'][^>]*content=["']([^"']+)["']`, "i")
      ) ?? html.match(
        new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["']${prop}["']`, "i")
      );
      return m?.[1] ?? undefined;
    };

    return NextResponse.json({
      url,
      title: get("og:title") ?? get("twitter:title"),
      description: get("og:description") ?? get("twitter:description"),
      image: get("og:image") ?? get("twitter:image"),
      siteName: get("og:site_name"),
    });
  } catch {
    return NextResponse.json({ url, error: "fetch failed" }, { status: 502 });
  }
}
*/