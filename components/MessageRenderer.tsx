"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MessageRenderer({ content }: { content: string }) {
  return (
    <div className="prose prose-invert max-w-none text-sm leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (props) => <h1 className="text-xl font-bold mt-4 mb-2" {...props} />,
          h2: (props) => <h2 className="text-lg font-semibold mt-4 mb-2" {...props} />,
          h3: (props) => <h3 className="text-md font-semibold mt-3 mb-1" {...props} />,
          p: (props) => <p className="mb-2" {...props} />,
          li: (props) => <li className="ml-4 list-disc" {...props} />,
          blockquote: (props) => (
            <blockquote className="border-l-4 border-gray-600 pl-3 italic text-gray-300 my-2" {...props} />
          ),
          code: ({ className, children, ...props }: any) =>
  !className?.includes('language-') ? (
    <code className="bg-gray-800 px-1 rounded text-sm" {...props}>{children}</code>
  ) : (
              <pre className="bg-black p-3 rounded overflow-x-auto my-2">
                <code {...props} />
              </pre>
            ),
          hr: () => <hr className="my-4 border-gray-700" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
