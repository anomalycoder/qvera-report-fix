import React, { useMemo } from 'react'
import katex from 'katex'

interface MathContentProps {
  content: string
  className?: string
  asBlock?: boolean
}

/**
 * MathContent renders content that may contain:
 * 1. Native HTML with MathML (<math xmlns="http://www.w3.org/1998/Math/MathML">...)
 * 2. LaTeX equations delimited by $...$ or $$...$$
 * 3. Standard HTML formatting (paragraphs, spans, breaks)
 */
export const MathContent: React.FC<MathContentProps> = ({
  content,
  className = '',
  asBlock = false,
}) => {
  const renderedHtml = useMemo(() => {
    if (!content) return ''

    let processed = content

    // Render $$...$$ display math
    processed = processed.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
      try {
        return `<div class="math-display">${katex.renderToString(math.trim(), {
          displayMode: true,
          throwOnError: false,
        })}</div>`
      } catch {
        return math
      }
    })

    // Render $...$ inline math (avoid matching empty or escaped)
    processed = processed.replace(/(?<!\\)\$([^\$\n]+?)\$/g, (_, math) => {
      try {
        return katex.renderToString(math.trim(), {
          displayMode: false,
          throwOnError: false,
        })
      } catch {
        return math
      }
    })

    return processed
  }, [content])

  return (
    <div
      className={`math-rendered-content text-[#111111] leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  )
}
