import MarkdownRenderer from "../../MarkdownRenderer";

const OPTION_LABELS = ["A", "B", "C", "D"];

export default function SoalPGEditor({
    pertanyaan = "",
    options = [],
    correctIndex = 0,

    onQuestionChange,
    onOptionChange,
    onCorrectChange,

    onSave,
    onCancel,

    saveLabel = "Simpan",
    isSaving = false,
}) {
    const handleKeyDown = (event) => {
        if (
            (event.ctrlKey || event.metaKey) &&
            event.key === "Enter"
        ) {
            event.preventDefault();

            if (!isSaving) {
                onSave?.();
            }

            return;
        }

        if (event.key === "Escape") {
            event.preventDefault();

            if (!isSaving) {
                onCancel?.();
            }
        }
    };


    return (
        <div className="space-y-6">
            {/* ====================================================
             * QUESTION
             * ==================================================== */}

            <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-depth-secondary">
                        Pertanyaan
                    </span>

                    <span className="text-[10px] text-depth-secondary">
                        Ctrl/⌘ + Enter untuk simpan
                    </span>
                </div>


                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    {/* Markdown */}
                    <div className="space-y-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-depth-secondary">
                            Markdown
                        </span>

                        <textarea
                            value={pertanyaan}
                            onChange={(event) =>
                                onQuestionChange?.(
                                    event.target.value
                                )
                            }
                            onKeyDown={handleKeyDown}
                            spellCheck={false}
                            rows={8}
                            placeholder="Tulis pertanyaan menggunakan Markdown..."
                            className="min-h-[180px] w-full resize-y rounded-depth-md border border-depth bg-depth-card p-3 font-mono text-sm leading-relaxed text-depth-primary shadow-depth-inset transition placeholder:text-depth-secondary focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] disabled:opacity-60"
                            disabled={isSaving}
                        />
                    </div>


                    {/* Preview */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-depth-secondary">
                                Preview
                            </span>

                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-500">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                                Live
                            </span>
                        </div>

                        <div className="min-h-[180px] max-h-[360px] overflow-auto rounded-depth-md border border-depth bg-depth-interactive p-3 shadow-depth-inset">
                            {pertanyaan.trim() ? (
                                <MarkdownRenderer
                                    content={
                                        pertanyaan
                                    }
                                />
                            ) : (
                                <div className="flex min-h-[150px] items-center justify-center text-center">
                                    <p className="text-xs italic text-depth-secondary">
                                        Preview pertanyaan akan muncul di sini.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>


            {/* ====================================================
             * OPTIONS
             * ==================================================== */}

            <div className="space-y-3">
                <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-depth-secondary">
                        Pilihan Jawaban
                    </h4>

                    <p className="mt-1 text-xs text-depth-secondary">
                        Pilih radio button untuk menentukan jawaban yang benar.
                    </p>
                </div>


                <div className="space-y-4">
                    {options.map(
                        (
                            option,
                            index
                        ) => {
                            const optionText =
                                typeof option ===
                                "string"
                                    ? option
                                    : option?.text ??
                                      "";

                            const isCorrect =
                                correctIndex ===
                                index;

                            return (
                                <div
                                    key={
                                        option?.id ??
                                        index
                                    }
                                    className={`rounded-depth-lg border p-4 transition ${
                                        isCorrect
                                            ? "border-[var(--depth-color-primary)] bg-[var(--depth-color-primary)]/5"
                                            : "border-depth bg-depth-card"
                                    }`}
                                >
                                    <div className="mb-3 flex items-center gap-3">
                                        <input
                                            type="radio"
                                            name="correct-option-editor"
                                            checked={
                                                isCorrect
                                            }
                                            onChange={() =>
                                                onCorrectChange?.(
                                                    index
                                                )
                                            }
                                            disabled={
                                                isSaving
                                            }
                                            className="h-4 w-4 accent-[var(--depth-color-primary)]"
                                        />

                                        <span
                                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-depth-md text-xs font-bold ${
                                                isCorrect
                                                    ? "bg-[var(--depth-color-primary)] text-white"
                                                    : "border border-depth bg-depth-interactive text-depth-secondary"
                                            }`}
                                        >
                                            {
                                                OPTION_LABELS[
                                                    index
                                                ]
                                            }
                                        </span>

                                        <div>
                                            <p className="text-xs font-semibold text-depth-primary">
                                                Pilihan{" "}
                                                {
                                                    OPTION_LABELS[
                                                        index
                                                    ]
                                                }
                                            </p>

                                            {isCorrect && (
                                                <p className="text-[10px] font-semibold text-[var(--depth-color-primary)]">
                                                    Jawaban Benar
                                                </p>
                                            )}
                                        </div>
                                    </div>


                                    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                                        {/* Option markdown */}
                                        <div>
                                            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-depth-secondary">
                                                Markdown
                                            </label>

                                            <textarea
                                                value={ optionText }
                                                onChange={( event) =>
                                                    onOptionChange?.( index, event .target .value)
                                                }
                                                onKeyDown={ handleKeyDown }
                                                spellCheck={ false }
                                                rows={ 1 }
                                                placeholder={`Pilihan ${ OPTION_LABELS[ index ] }`}
                                                disabled={ isSaving }
                                                className="min-h-[40px] w-full resize-y rounded-depth-md border border-depth bg-depth-card p-3 font-mono text-sm leading-relaxed text-depth-primary shadow-depth-inset transition placeholder:text-depth-secondary focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] disabled:opacity-60"
                                            />
                                        </div>


                                        {/* Option preview */}
                                        <div>
                                            <div className="mb-1.5 flex items-center justify-between">
                                                <span className="text-[10px] font-semibold uppercase tracking-wider text-depth-secondary">
                                                    Preview
                                                </span>

                                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                                                    Live
                                                </span>
                                            </div>

                                            <div className="min-h-[40px] max-h-[240px] overflow-auto rounded-depth-md border border-depth bg-depth-interactive p-3 shadow-depth-inset">
                                                {optionText.trim() ? (
                                                    <MarkdownRenderer
                                                        content={
                                                            optionText
                                                        }
                                                    />
                                                ) : (
                                                    <div className="flex min-h-[40px] items-center justify-center">
                                                        <p className="text-xs italic text-depth-secondary">
                                                            Belum diisi.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        }
                    )}
                </div>
            </div>


            {/* ====================================================
             * ACTIONS
             * ==================================================== */}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-depth pt-4">
                <p className="text-[11px] text-depth-secondary">
                    Esc untuk batal
                </p>

                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={
                            onCancel
                        }
                        disabled={
                            isSaving
                        }
                        className="rounded-depth-md border border-depth bg-depth-interactive px-4 py-2 text-sm font-semibold text-depth-primary shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Batal
                    </button>

                    <button
                        type="button"
                        onClick={
                            onSave
                        }
                        disabled={
                            isSaving
                        }
                        className="rounded-depth-md bg-[var(--depth-color-primary)] px-5 py-2 text-sm font-semibold text-white shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isSaving
                            ? "Menyimpan..."
                            : saveLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
