import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import c from "react-syntax-highlighter/dist/esm/languages/prism/c";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import mermaid from "mermaid";

SyntaxHighlighter.registerLanguage("c", c);

const parseMediaSize = (alt = "") => {
    if (typeof alt !== "string") return { altText: "", width: null };

    const match = alt.match(
        /^(.*?)\s*\|\s*(\d+(?:\.\d+)?)\s*(px|%)?\s*$/i,
    );

    if (!match) return { altText: alt, width: null };

    const altText = match[1].trim();
    const value = Number(match[2]);
    const unit = (match[3] ?? "px").toLowerCase();

    if (!Number.isFinite(value) || value <= 0)
        return { altText: alt, width: null };

    return {
        altText,
        width:
            unit === "%"
                ? `${Math.min(value, 100)}%`
                : `${Math.min(value, 2000)}px`,
    };
};


/* ============================================================
 * GitHub Alerts
 * ============================================================ */

const ALERT_PATTERN =
    /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*(?:\r?\n)?/i;

const remarkGithubAlerts = () => (tree) => {
    const walk = (node) => {
        if (!Array.isArray(node?.children)) return;

        node.children.forEach((child) => {
            if (
                child.type === "blockquote" &&
                Array.isArray(child.children) &&
                child.children.length
            ) {
                const paragraph = child.children[0];
                const first = paragraph?.children?.[0];

                if (
                    paragraph?.type === "paragraph" &&
                    first?.type === "text"
                ) {
                    const match = first.value.match(ALERT_PATTERN);

                    if (match) {
                        const type = match[1].toLowerCase();

                        first.value = first.value.replace(
                            ALERT_PATTERN,
                            "",
                        );

                        if (!first.value) paragraph.children.shift();

                        while (paragraph.children[0]?.type === "break")
                            paragraph.children.shift();

                        if (!paragraph.children.length)
                            child.children.shift();

                        const old =
                            child.data?.hProperties?.className;
                        const classes = Array.isArray(old)
                            ? old
                            : old
                              ? [old]
                              : [];

                        child.data = {
                            ...(child.data ?? {}),
                            hProperties: {
                                ...(child.data?.hProperties ?? {}),
                                className: [
                                    ...classes,
                                    "markdown-alert",
                                    `markdown-alert-${type}`,
                                ],
                            },
                        };
                    }
                }
            }

            walk(child);
        });
    };

    walk(tree);
};


/* ============================================================
 * Mermaid
 * ============================================================ */

function Mermaid({ chart }) {
    const ref = useRef(null);

    useEffect(() => {
        mermaid.initialize({
            startOnLoad: false,
            theme: "dark",
        });

        let cancelled = false;

        const render = async () => {
            try {
                const id = `mermaid-${Math.random()
                    .toString(36)
                    .slice(2, 11)}`;

                const { svg } = await mermaid.render(id, chart);

                if (!cancelled && ref.current)
                    ref.current.innerHTML = svg;
            } catch (error) {
                console.error("Mermaid parsing error", error);

                if (!cancelled && ref.current)
                    ref.current.innerHTML =
                        '<div class="text-red-500 text-sm border border-red-500 p-2 rounded">Failed to render Mermaid diagram</div>';
            }
        };

        render();

        return () => {
            cancelled = true;
        };
    }, [chart]);

    return (
        <div
            ref={ref}
            className="my-4 flex justify-center overflow-x-auto"
        />
    );
}


/* ============================================================
 * Copy
 * ============================================================ */

function CopyButton({ value }) {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(value);
            } else {
                const textarea = document.createElement("textarea");
                textarea.value = value;
                textarea.style.cssText =
                    "position:fixed;opacity:0;pointer-events:none";
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand("copy");
                textarea.remove();
            }

            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch (error) {
            console.error("Failed to copy code", error);
        }
    };

    return (
        <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1.5 rounded-depth-md border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-gray-300 transition hover:bg-white/10 hover:text-white"
            title="Copy code"
        >
            {copied ? (
                <>
                    <svg
                        className="h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                        />
                    </svg>
                    Copied
                </>
            ) : (
                <>
                    <svg
                        className="h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <rect
                            x="9"
                            y="9"
                            width="11"
                            height="11"
                            rx="2"
                        />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 9V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7a2 2 0 002 2h3"
                        />
                    </svg>
                    Copy
                </>
            )}
        </button>
    );
}


/* ============================================================
 * Code Block
 * ============================================================ */

function FencedCodeBlock({ children }) {
    const child = React.Children.only(children);
    const className = child?.props?.className ?? "";
    const language =
        /language-([\w-]+)/.exec(className)?.[1] ?? null;
    const code = String(
        child?.props?.children ?? "",
    ).replace(/\n$/, "");

    if (language === "mermaid")
        return <Mermaid chart={code} />;

    return (
        <div className="my-4 overflow-hidden rounded-depth-md border border-depth shadow-depth-md">
            <div className="flex min-h-10 items-center justify-between border-b border-white/10 bg-[#1e1e1e] px-3 py-2">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    {language ?? "code"}
                </span>

                <CopyButton value={code} />
            </div>

            <div className="overflow-x-auto">
                <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={language ?? undefined}
                    PreTag="div"
                    showLineNumbers={Boolean(language)}
                    startingLineNumber={1}
                    lineNumberStyle={{
                        minWidth: "3.25em",
                        paddingRight: "1em",
                        textAlign: "right",
                        userSelect: "none",
                        opacity: 0.45,
                    }}
                    customStyle={{
                        margin: 0,
                        borderRadius: 0,
                        padding: "1rem",
                        background: "#1e1e1e",
                    }}
                    codeTagProps={{
                        style: {
                            fontFamily:
                                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                        },
                    }}
                >
                    {code}
                </SyntaxHighlighter>
            </div>
        </div>
    );
}


/* ============================================================
 * Media
 *
 * IMPORTANT:
 * Use <span>, NOT <div>.
 *
 * Markdown images normally live inside <p>, therefore:
 *
 * <p><span><img /></span></p>  -> valid
 * <p><div><img /></div></p>    -> invalid hydration nesting
 * ============================================================ */

const VIDEO_EXTENSIONS = /\.(mp4|webm|ogg|m4v|mov)$/i;

const isVideoUrl = (src) =>
    typeof src === "string" &&
    src.trim() !== "" &&
    VIDEO_EXTENSIONS.test(src.split(/[?#]/)[0]);

function MarkdownMedia({ src, alt, title }) {
    if (!src) return null;

    const { altText, width } = parseMediaSize(alt);
    const style = {
        width: width ?? "100%",
        maxWidth: "100%",
    };

    if (isVideoUrl(src)) {
        return (
            <span className="my-4 flex w-full justify-center">
                <video
                    src={src}
                    title={title}
                    controls
                    preload="metadata"
                    style={style}
                    className="max-h-[70vh] rounded-depth-lg border border-depth bg-black object-contain shadow-depth-md"
                >
                    Your browser does not support video playback.
                </video>
            </span>
        );
    }

    return (
        <span className="my-4 flex w-full justify-center">
            <a
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                title={title}
                style={style}
                className="block"
            >
                <img
                    src={src}
                    alt={altText}
                    loading="lazy"
                    className="h-auto max-h-[70vh] w-full rounded-depth-lg border border-depth object-contain shadow-depth-md transition hover:opacity-90"
                />
            </a>
        </span>
    );
}


/* ============================================================
 * Alerts
 * ============================================================ */

const ALERT_STYLES = {
    note: {
        label: "Note",
        container: "border-blue-500/50 bg-blue-500/10",
        title: "text-blue-400",
    },
    tip: {
        label: "Tip",
        container: "border-emerald-500/50 bg-emerald-500/10",
        title: "text-emerald-400",
    },
    important: {
        label: "Important",
        container: "border-violet-500/50 bg-violet-500/10",
        title: "text-violet-400",
    },
    warning: {
        label: "Warning",
        container: "border-amber-500/50 bg-amber-500/10",
        title: "text-amber-400",
    },
    caution: {
        label: "Caution",
        container: "border-red-500/50 bg-red-500/10",
        title: "text-red-400",
    },
};

const getAlertType = (className = "") =>
    /markdown-alert-(note|tip|important|warning|caution)/.exec(
        className,
    )?.[1] ?? null;


/* ============================================================
 * Renderer
 * ============================================================ */

export default function MarkdownRenderer({
    content,
    className = "",
}) {
    const value =
        typeof content === "string"
            ? content
            : String(content ?? "");

    return (
        <div
            className={`prose prose-invert max-w-none ${className}`}
        >
            <ReactMarkdown
                remarkPlugins={[
                    remarkGfm,
                    remarkMath,
                    remarkGithubAlerts,
                    remarkBreaks,
                ]}
                rehypePlugins={[rehypeKatex]}
                components={{
                    pre: ({ children }) => (
                        <FencedCodeBlock>
                            {children}
                        </FencedCodeBlock>
                    ),

                    code: ({
                        className = "",
                        children,
                        ...props
                    }) => (
                        <code
                            className={`rounded border border-depth bg-depth-card px-1.5 py-0.5 font-mono text-sm ${className}`}
                            {...props}
                        >
                            {children}
                        </code>
                    ),

                    h1: ({ children }) => (
                        <h1 className="mb-4 mt-6 border-b border-depth pb-2 text-3xl font-bold leading-tight text-depth-primary first:mt-0">
                            {children}
                        </h1>
                    ),

                    h2: ({ children }) => (
                        <h2 className="mb-3 mt-6 border-b border-depth pb-1.5 text-2xl font-bold leading-tight text-depth-primary first:mt-0">
                            {children}
                        </h2>
                    ),

                    h3: ({ children }) => (
                        <h3 className="mb-3 mt-5 text-xl font-semibold leading-snug text-depth-primary first:mt-0">
                            {children}
                        </h3>
                    ),

                    h4: ({ children }) => (
                        <h4 className="mb-2 mt-4 text-lg font-semibold leading-snug text-depth-primary first:mt-0">
                            {children}
                        </h4>
                    ),

                    h5: ({ children }) => (
                        <h5 className="mb-2 mt-4 text-base font-semibold leading-snug text-depth-primary first:mt-0">
                            {children}
                        </h5>
                    ),

                    h6: ({ children }) => (
                        <h6 className="mb-2 mt-3 text-sm font-semibold uppercase tracking-wide text-depth-secondary first:mt-0">
                            {children}
                        </h6>
                    ),

                    blockquote: ({
                        className = "",
                        children,
                        ...props
                    }) => {
                        const type =
                            getAlertType(className);

                        if (!type)
                            return (
                                <blockquote
                                    className="my-4 border-l-4 border-depth pl-4 text-depth-secondary"
                                    {...props}
                                >
                                    {children}
                                </blockquote>
                            );

                        const alert = ALERT_STYLES[type];

                        return (
                            <div
                                className={`my-4 rounded-depth-md border-l-4 px-4 py-3 ${alert.container}`}
                            >
                                <div
                                    className={`mb-2 flex items-center gap-2 text-sm font-bold ${alert.title}`}
                                >
                                    <svg
                                        className="h-4 w-4 shrink-0"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <circle
                                            cx="12"
                                            cy="12"
                                            r="9"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            d="M12 11v5"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            d="M12 8h.01"
                                        />
                                    </svg>

                                    {alert.label}
                                </div>

                                <div className="text-sm text-depth-primary [&>*:last-child]:mb-0">
                                    {children}
                                </div>
                            </div>
                        );
                    },

                    img: ({ src, alt, title }) => (
                        <MarkdownMedia
                            src={src}
                            alt={alt}
                            title={title}
                        />
                    ),

                    p: ({ children }) => (
                        <p className="mb-2 whitespace-pre-wrap">
                            {children}
                        </p>
                    ),

                    ul: ({ children }) => (
                        <ul className="mb-2 list-inside list-disc">
                            {children}
                        </ul>
                    ),

                    ol: ({ children }) => (
                        <ol className="mb-2 list-inside list-decimal">
                            {children}
                        </ol>
                    ),

                    table: ({ children }) => (
                        <div className="my-3 overflow-x-auto">
                            <table className="min-w-full border-collapse border border-depth text-sm">
                                {children}
                            </table>
                        </div>
                    ),

                    thead: ({ children }) => (
                        <thead className="bg-depth-interactive">
                            {children}
                        </thead>
                    ),

                    tbody: ({ children }) => (
                        <tbody className="divide-y divide-depth">
                            {children}
                        </tbody>
                    ),

                    th: ({ children }) => (
                        <th className="whitespace-nowrap border border-depth px-2.5 py-1 text-left text-xs font-semibold uppercase tracking-wider text-depth-secondary">
                            {children}
                        </th>
                    ),

                    td: ({ children }) => (
                        <td className="border-x border-depth px-2.5 py-1 text-sm text-depth-primary">
                            {children}
                        </td>
                    ),

                    hr: () => (
                        <hr className="my-6 border-0 border-t border-depth" />
                    ),
                }}
            >
                {value}
            </ReactMarkdown>
        </div>
    );
}
