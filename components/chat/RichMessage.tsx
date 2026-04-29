"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import LinkPreview from "./LinkPreview";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "highlight.js/styles/github-dark.css";

type RichMessageProps = {
  content: string;
};

function tryParseChart(content: string) {
  const match = content.match(/```chart\s*([\s\S]*?)```/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

function cleanMessageContent(content: string) {
  return content.replace(/<!--[\s\S]*?-->/g, "").trim();
}

export default function RichMessage({ content }: RichMessageProps) {
const cleanedContent = cleanMessageContent(content);
const chart = tryParseChart(cleanedContent);
const markdownWithoutChart = cleanedContent.replace(
  /```chart\s*([\s\S]*?)```/,
  ""
);

  return (
    <div
      className="space-y-4 break-words text-neutral-200"
      style={{
        // Base body: 1rem (16px) — prevents iOS zoom on inputs
        fontSize: "1rem",
        lineHeight: "1.6",
        // Cap line length to 65ch for comfortable reading (~50–75 chars)
        maxWidth: "65ch",
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml={true}
        components={{
          // H1: ~2rem (32px) — maps to 30–50px range
          h1: ({ children }) => (
            <h1
              style={{
                fontSize: "2rem",
                lineHeight: "1.2",
                fontWeight: 700,
                marginTop: "1.5rem",
                marginBottom: "0.5rem",
                color: "#ffffff",
              }}
            >
              {children}
            </h1>
          ),

          // H2: ~1.5rem (24px) — maps to 24–35px range
          h2: ({ children }) => (
            <h2
              style={{
                fontSize: "1.5rem",
                lineHeight: "1.3",
                fontWeight: 600,
                marginTop: "1.25rem",
                marginBottom: "0.4rem",
                color: "#f5f5f5",
              }}
            >
              {children}
            </h2>
          ),

          // H3: ~1.25rem (20px) — maps to 20–28px range
          h3: ({ children }) => (
            <h3
              style={{
                fontSize: "1.25rem",
                lineHeight: "1.35",
                fontWeight: 600,
                marginTop: "1rem",
                marginBottom: "0.35rem",
                color: "#e5e5e5",
              }}
            >
              {children}
            </h3>
          ),

          // H4–H6: slight steps down from H3
          h4: ({ children }) => (
            <h4
              style={{
                fontSize: "1.125rem",
                lineHeight: "1.4",
                fontWeight: 500,
                marginTop: "0.75rem",
                marginBottom: "0.25rem",
                color: "#d4d4d4",
              }}
            >
              {children}
            </h4>
          ),

          // Body paragraphs: 1rem, line-height 1.6
          p: ({ children }) => (
            <p
              style={{
                fontSize: "1rem",
                lineHeight: "1.6",
                marginBottom: "0.75rem",
                color: "#d4d4d4",
              }}
            >
              {children}
            </p>
          ),

          strong: ({ children }) => (
            <strong style={{ fontWeight: 600, color: "#ffffff" }}>
              {children}
            </strong>
          ),

          em: ({ children }) => (
            <em style={{ fontStyle: "italic", color: "#a3a3a3" }}>
              {children}
            </em>
          ),

          ul: ({ children }) => (
            <ul
              style={{
                marginLeft: "1.25rem",
                listStyleType: "disc",
                lineHeight: "1.6",
              }}
              className="space-y-1"
            >
              {children}
            </ul>
          ),

          ol: ({ children }) => (
            <ol
              style={{
                marginLeft: "1.25rem",
                listStyleType: "decimal",
                lineHeight: "1.6",
              }}
              className="space-y-1"
            >
              {children}
            </ol>
          ),

          // List items: same 1rem body size
          li: ({ children }) => (
            <li style={{ fontSize: "1rem", color: "#d4d4d4" }}>{children}</li>
          ),

          blockquote: ({ children }) => (
            <blockquote
              style={{
                borderLeft: "3px solid #404040",
                paddingLeft: "1rem",
                fontSize: "1rem",
                lineHeight: "1.6",
                color: "#a3a3a3",
                fontStyle: "italic",
              }}
            >
              {children}
            </blockquote>
          ),

          hr: () => (
            <hr style={{ borderColor: "#262626", margin: "1.25rem 0" }} />
          ),

          // Inline code: 0.875rem (14px) — secondary/metadata sizing is acceptable here
          // Block code: same, inside a pre
          code: ({ children, className }) => {
            const isInline = !className;

            if (isInline) {
              return (
                <code
                  style={{
                    fontSize: "0.875rem",
                    lineHeight: "1.5",
                    backgroundColor: "#262626",
                    color: "#f5f5f5",
                    padding: "0.1em 0.35em",
                    borderRadius: "0.25rem",
                  }}
                >
                  {children}
                </code>
              );
            }

            return (
              <pre
                style={{
                  fontSize: "0.875rem",
                  lineHeight: "1.6",
                  overflowX: "auto",
                  borderRadius: "0.5rem",
                  border: "1px solid #262626",
                  backgroundColor: "#0a0a0a",
                  padding: "1rem",
                }}
              >
                <code className={className}>{children}</code>
              </pre>
            );
          },

          // Tables: 0.875rem for data-dense contexts (never below 0.75rem / 12px)
          table: ({ children }) => (
            <div
              style={{ overflowX: "auto", borderRadius: "0.5rem", border: "1px solid #262626" }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.875rem",
                  lineHeight: "1.5",
                }}
              >
                {children}
              </table>
            </div>
          ),

          th: ({ children }) => (
            <th
              style={{
                border: "1px solid #262626",
                padding: "0.5rem 0.75rem",
                textAlign: "left",
                color: "#d4d4d4",
                fontWeight: 600,
                backgroundColor: "#171717",
              }}
            >
              {children}
            </th>
          ),

          td: ({ children }) => (
            <td
              style={{
                border: "1px solid #262626",
                padding: "0.5rem 0.75rem",
                color: "#d4d4d4",
              }}
            >
              {children}
            </td>
          ),

          // Links: render a rich preview card beneath the inline anchor
          a: ({ href, children }) => {
            if (!href) {
              return <span>{children}</span>;
            }
            return <LinkPreview href={href}>{children}</LinkPreview>;
          },
        }}
      >
        {markdownWithoutChart}
      </ReactMarkdown>

      {/* Chart Rendering */}
      {chart && (
        <div
          style={{
            borderRadius: "0.75rem",
            border: "1px solid #262626",
            backgroundColor: "#0a0a0a",
            padding: "1rem",
          }}
        >
          {/* Chart title: 0.875rem caption/metadata sizing */}
          <p
            style={{
              fontSize: "0.875rem",
              lineHeight: "1.4",
              fontWeight: 500,
              color: "#737373",
              marginBottom: "0.75rem",
            }}
          >
            {chart.title || "Chart"}
          </p>

          <div style={{ width: "100%", height: 256, minHeight: 256, display: "block", position: "relative" }}>
            <ResponsiveContainer width="100%" height={256}>
              {chart.type === "line" ? (
                <LineChart data={chart.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis
                    dataKey={chart.xKey || "name"}
                    tick={{ fontSize: 12, fill: "#a3a3a3" }}
                  />
                  <YAxis tick={{ fontSize: 12, fill: "#a3a3a3" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#171717",
                      border: "1px solid #404040",
                      borderRadius: "0.375rem",
                      fontSize: "0.8125rem",
                      color: "#e5e5e5",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey={chart.yKey || "value"}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              ) : (
                <BarChart data={chart.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis
                    dataKey={chart.xKey || "name"}
                    tick={{ fontSize: 12, fill: "#a3a3a3" }}
                  />
                  <YAxis tick={{ fontSize: 12, fill: "#a3a3a3" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#171717",
                      border: "1px solid #404040",
                      borderRadius: "0.375rem",
                      fontSize: "0.8125rem",
                      color: "#e5e5e5",
                    }}
                  />
                  <Bar dataKey={chart.yKey || "value"} radius={[3, 3, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}