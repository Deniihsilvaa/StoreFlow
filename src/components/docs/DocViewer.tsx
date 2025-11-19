"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import "highlight.js/styles/github-dark.css";

interface DocViewerProps {
  content: string;
}

export function DocViewer({ content }: DocViewerProps) {
  return (
    <div className="doc-viewer">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
          h1: ({ node, ...props }) => (
            <h1 className="doc-h1" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="doc-h2" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="doc-h3" {...props} />
          ),
          code: ({ node, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || "");
            const isInline = !match;
            
            if (isInline) {
              return (
                <code className="doc-code-inline" {...props}>
                  {children}
                </code>
              );
            }
            
            return (
              <code className={`doc-code-block ${className}`} {...props}>
                {children}
              </code>
            );
          },
          pre: ({ node, ...props }) => (
            <pre className="doc-pre" {...props} />
          ),
          a: ({ node, ...props }) => (
            <a className="doc-link" {...props} />
          ),
          table: ({ node, ...props }) => (
            <div className="doc-table-wrapper">
              <table className="doc-table" {...props} />
            </div>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

