import { useEffect, useMemo, useState } from "react";
import { ModalOverlay } from "@/Components/Common/ModalPortal";
import ModalCloseButton from "@/Components/Common/ModalCloseButton";
import MarkdownRenderer from "../../MarkdownRenderer";

const DIFFICULTY_MAP = {
    easy: "easy",
    mudah: "easy",
    medium: "medium",
    sedang: "medium",
    hard: "hard",
    sulit: "hard",
    susah: "hard",
};

const normalizeDifficulty = (value) => DIFFICULTY_MAP[String(value ?? "").trim().toLowerCase()] ?? "";

export default function ModalLegacyBatchEditSoal({
    title,
    initialValue,
    variant = "essay",
    onClose,
    onSubmit,
    moduleOptions = [],
    initialModuleId = "",
}) {
    const [content, setContent] = useState(initialValue ?? "");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const normalizedModuleOptions = useMemo(
        () =>
            (moduleOptions ?? [])
                .map((option) => {
                    const value = option?.idM ?? option?.id ?? option?.value ?? option?.uuid ?? option?.ID;
                    if (value == null) return null;
                    return {
                        value: String(value),
                        label: option?.judul ?? option?.nama ?? option?.name ?? option?.label ?? option?.title ?? String(value),
                    };
                })
                .filter(Boolean),
        [moduleOptions],
    );

    const [selectedModuleId, setSelectedModuleId] = useState(
        String(initialModuleId || normalizedModuleOptions[0]?.value || ""),
    );

    useEffect(() => setContent(initialValue ?? ""), [initialValue]);

    useEffect(() => {
        setSelectedModuleId(String(initialModuleId || normalizedModuleOptions[0]?.value || ""));
    }, [initialModuleId, normalizedModuleOptions]);

    const items = useMemo(
        () => variant === "pg" ? parseLegacyPgMarkdown(content) : parseLegacyEssayMarkdown(content),
        [content, variant],
    );

    const handleSubmit = async () => {
        if (!onSubmit) return onClose?.();
        setIsSubmitting(true);
        try {
            await onSubmit({ rawContent: content, items, modulId: selectedModuleId });
        } catch (error) {
            console.error("Legacy batch edit submission failed:", error);
            throw error;
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ModalOverlay onClose={onClose} className="depth-modal-overlay z-50">
            <div className="depth-modal-container flex max-h-[90vh] flex-col overflow-hidden" style={{ "--depth-modal-max-width": "90rem" }}>
                <div className="depth-modal-header">
                    <h2 className="depth-modal-title">{title}</h2>

                    <div className="flex items-center gap-3">
                        <p className="text-sm text-depth-secondary">Move into:</p>
                        {!!normalizedModuleOptions.length && (
                            <select
                                value={selectedModuleId}
                                onChange={(e) => setSelectedModuleId(e.target.value)}
                                className="rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm text-depth-primary"
                            >
                                {normalizedModuleOptions.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    <ModalCloseButton onClick={onClose} ariaLabel="Tutup editor batch" />
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                    <div className="grid min-h-[500px] gap-4 md:grid-cols-2">
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder={variant === "pg"
                                ? "Contoh:\nSoal 1\n\nPertanyaan:\nApa ibukota Indonesia?\n\nPilihan:\n- [ ] Bandung\n- [x] Jakarta\n- [ ] Surabaya\n- [ ] Medan"
                                : "Masukkan soal dalam format Markdown..."}
                            spellCheck={false}
                            className="min-h-[500px] w-full resize-y rounded-depth-lg border border-depth bg-depth-card p-4 font-mono text-sm leading-relaxed text-depth-primary shadow-depth-sm focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)]"
                        />

                        <div className="min-h-[500px] overflow-y-auto rounded-depth-lg border border-depth bg-depth-card p-4 shadow-depth-sm">
                            {!items.length ? (
                                <p className="italic text-depth-secondary">Tidak ada konten untuk ditampilkan.</p>
                            ) : (
                                <div className="space-y-4">
                                    {items.map((item, index) => (
                                        <div key={`${variant}-${index}`} className="rounded-depth-lg border border-depth bg-depth-card p-4 shadow-depth-md">
                                            <p className="mb-3 text-sm font-semibold text-depth-primary">Soal: {index + 1}</p>
                                                {variant === "pg" ? (
                                                    <>

                                                        {item.difficulty && (
                                                            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-depth-secondary">
                                                                Kesulitan: <span className="text-depth-primary">{item.difficulty}</span>
                                                            </p>
                                                        )}

                                                        <div className="mb-4 text-sm text-depth-primary">
                                                            <MarkdownRenderer content={item.pertanyaan || "_(kosong)_"} />
                                                        </div>

                                                        <p className="mb-2 text-sm font-semibold text-depth-primary">
                                                            Pilihan:
                                                        </p>

                                                        <div className="space-y-2">
                                                            {item.options.map((option, optionIndex) => (
                                                                <div
                                                                    key={`${index}-${optionIndex}`}
                                                                    className={`flex items-start gap-2 rounded-depth-md border px-3 py-2 text-sm shadow-depth-sm ${
                                                                        option.isCorrect
                                                                            ? "border-[var(--depth-color-primary)] bg-[var(--depth-color-primary)] text-white"
                                                                            : "border-depth bg-depth-interactive text-depth-primary"
                                                                    }`}
                                                                >
                                                                        <span
                                                                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-depth-md text-xs font-bold ${
                                                                                option.isCorrect
                                                                                    ? "bg-white/20 text-white"
                                                                                    : "border border-depth bg-depth-card text-depth-secondary"
                                                                            }`}
                                                                        >
                                                                        {String.fromCharCode(65 + optionIndex)}
                                                                        </span>

                                                                    <div className="min-w-0 flex-1">
                                                                        <MarkdownRenderer content={option.text || "_(kosong)_"} />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="text-sm text-depth-primary">
                                                        <MarkdownRenderer content={item.soal || "_(kosong)_"} />
                                                    </div>
                                                )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {typeof onSubmit === "function" && (
                    <div className="flex justify-end border-t border-depth bg-depth-card/80 px-6 py-4">
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="rounded-depth-md bg-[var(--depth-color-primary)] px-5 py-2 text-sm font-semibold text-white shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                        </button>
                    </div>
                )}
            </div>
        </ModalOverlay>
    );
}

export const parseLegacyEssayMarkdown = (markdown) => {
    if (!markdown?.trim()) return [];

    const normalized = markdown.replace(/\r\n/g, "\n");

    return normalized
        .split(/(?=^Soal\s+\d+\s*$)/gim)
        .map((part) => part.replace(/^Soal\s+\d+\s*\n?/i, "").trim())
        .filter(Boolean)
        .map((soal) => ({ soal }));
};

export const parseLegacyPgMarkdown = (markdown) => {
    if (!markdown?.trim()) return [];

    return markdown
        .replace(/\r\n/g, "\n")
        .split(/(?=^Soal\s+\d+\s*$)/gim)
        .map((part) => part.trim())
        .filter(Boolean)
        .map((body) => {
            const withoutHeader = body.replace(/^Soal\s+\d+\s*\n?/i, "").trim();
            const difficultyMatch = withoutHeader.match(/(?:^|\n)Kesulitan\s*:\s*([^\n]*)/i);
            const questionMatch = withoutHeader.match(/(?:^|\n)Pertanyaan\s*:\s*\n?/i);
            const optionsMatch = withoutHeader.match(/(?:^|\n)Pilihan\s*:\s*\n?/i);
            const difficulty = normalizeDifficulty(difficultyMatch?.[1]);

            let question = "";
            let optionsText = "";

            if (questionMatch && optionsMatch) {
                question = withoutHeader.slice(questionMatch.index + questionMatch[0].length, optionsMatch.index).trim();
                optionsText = withoutHeader.slice(optionsMatch.index + optionsMatch[0].length).trim();
            } else if (questionMatch) {
                question = withoutHeader.slice(questionMatch.index + questionMatch[0].length).trim();
            } else if (optionsMatch) {
                question = withoutHeader.slice(0, optionsMatch.index).replace(/(?:^|\n)Kesulitan\s*:\s*[^\n]*/i, "").trim();
                optionsText = withoutHeader.slice(optionsMatch.index + optionsMatch[0].length).trim();
            } else {
                const lines = withoutHeader.split("\n");
                const optionStart = lines.findIndex(isLegacyOptionLine);

                if (optionStart >= 0) {
                    question = lines.slice(0, optionStart).join("\n").replace(/(?:^|\n)Kesulitan\s*:\s*[^\n]*/i, "").trim();
                    optionsText = lines.slice(optionStart).join("\n").trim();
                } else {
                    question = withoutHeader.replace(/(?:^|\n)Kesulitan\s*:\s*[^\n]*/i, "").trim();
                }
            }

            return {
                pertanyaan: question,
                options: parseLegacyOptions(optionsText),
                difficulty,
            };
        });
};

const isLegacyOptionLine = (line) => /^\s*-\s*\[(?:x|X|\s)\]\s*/.test(line);

const parseLegacyOptions = (text) => {
    if (!text?.trim()) return [];

    const normalized = text.replace(/\r\n/g, "\n");
    const lines = normalized.split("\n");

    const options = [];
    let current = null;

    for (const line of lines) {
        if (isLegacyOptionLine(line)) {
            if (current) {
                options.push(current);
            }

            const match = line.match(/^\s*-\s*\[(x|X|\s)\]\s*/);

            current = {
                text: line
                    .slice(match?.[0]?.length ?? 0)
                    .trimEnd(),
                isCorrect:
                    match?.[1]?.toLowerCase() === "x",
            };
            continue;
        }
        if (current) {
            current.text += `\n${line}`;
        }
    }
    if (current) {
        options.push(current);
    }
    return options;
};
