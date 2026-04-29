"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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

export default function RichMessage({ content }: RichMessageProps) {
  const chart = tryParseChart(content);
  const markdownWithoutChart = content.replace(/```chart\s*[\s\S]*?```/, "");

  return (
    <div className="space-y-4">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="leading-7">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-bold">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => (
            <ul className="ml-5 list-disc space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="ml-5 list-decimal space-y-1">{children}</ol>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-neutral-600 pl-4 text-neutral-400">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="border-neutral-800" />,
          code: ({ children, className }) => {
            const inline = !className;

            if (inline) {
              return (
                <code className="rounded bg-neutral-800 px-1.5 py-0.5 text-sm text-neutral-100">
                  {children}
                </code>
              );
            }

            return (
              <pre className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950 p-4 text-sm">
                <code className={className}>{children}</code>
              </pre>
            );
          },
          table: ({ children }) => (
            <div className="overflow-x-auto rounded-xl border border-neutral-800">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-neutral-800 px-3 py-2 text-left">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-neutral-800 px-3 py-2">
              {children}
            </td>
          ),
        }}
      >
        {markdownWithoutChart}
      </ReactMarkdown>

      {chart && (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
          <p className="mb-4 text-sm font-medium text-neutral-300">
            {chart.title || "Chart"}
          </p>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              {chart.type === "line" ? (
                <LineChart data={chart.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={chart.xKey || "name"} />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey={chart.yKey || "value"}
                    strokeWidth={2}
                  />
                </LineChart>
              ) : (
                <BarChart data={chart.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={chart.xKey || "name"} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey={chart.yKey || "value"} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}