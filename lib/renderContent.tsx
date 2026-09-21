import React from "react";

/**
 * Parses markdown-style links [text](url) and bare URLs (https://...)
 * within content and returns React nodes.
 */
export function renderContent(text: string): React.ReactNode[] {
  if (!text) return [];

  const parts: React.ReactNode[] = [];
  // Unified regex: either markdown link [text](url) or bare URL (https?://...)
  const regex = /\[([^\]]+)\]\(([^)]+)\)|(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Push preceding plain text
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[1] && match[2]) {
      // Markdown link [text](url)
      parts.push(
        <a
          key={`md-${match.index}`}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-red-400 hover:text-red-300 underline underline-offset-2 transition-colors break-words font-medium"
        >
          {match[1]}
        </a>
      );
    } else if (match[3]) {
      // Bare URL
      parts.push(
        <a
          key={`url-${match.index}`}
          href={match[3]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-red-400 hover:text-red-300 underline underline-offset-2 transition-colors break-all font-medium"
        >
          {match[3]}
        </a>
      );
    }

    lastIndex = regex.lastIndex;
  }

  // Push remaining plain text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}
