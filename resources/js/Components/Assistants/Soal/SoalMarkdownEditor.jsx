import MarkdownRenderer from "../../MarkdownRenderer";
import DepthToggleButton from "@/Components/Common/DepthToggleButton";

export default function SoalMarkdownEditor({
    value = "",
    onChange,
    onSave,
    onCancel,
    saveLabel = "Simpan",
    cancelLabel = "Batal",
    isSaving = false,

    supportsFileUpload = false,
    enableFileUpload = false,
    onToggleFileUpload,

    placeholder = "Tulis soal menggunakan Markdown...",
}) {
    const handleKeyDown = (event) => {
        // Ctrl/Cmd + Enter = save
        if (
            (event.ctrlKey || event.metaKey) &&
            event.key === "Enter"
        ) {
            event.preventDefault();

            if (!isSaving) {
                onSave?.();
            }
        }

        // Escape = cancel
        if (event.key === "Escape") {
            event.preventDefault();

            if (!isSaving) {
                onCancel?.();
            }
        }
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {/* Markdown source */}
                <div className="min-w-0 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-depth-secondary">
                            Markdown
                        </span>

                        <span className="text-[10px] text-depth-secondary">
                            Ctrl/⌘ + Enter untuk simpan
                        </span>
                    </div>

                    <textarea
                        value={value}
                        onChange={(event) =>
                            onChange?.(event.target.value)
                        }
                        onKeyDown={handleKeyDown}
                        rows={12}
                        autoFocus
                        placeholder={placeholder}
                        className="min-h-[18rem] w-full resize-y rounded-depth-lg border border-depth bg-depth-card p-4 font-mono text-sm leading-relaxed text-depth-primary shadow-depth-inset transition placeholder:text-depth-secondary focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)]"
                    />
                </div>

                {/* Live preview */}
                <div className="min-w-0 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-depth-secondary">
                            Preview
                        </span>

                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Live
                        </span>
                    </div>

                    <div className="min-h-[18rem] max-h-[34rem] overflow-auto rounded-depth-lg border border-depth bg-depth-interactive/40 p-4 shadow-depth-inset">
                        {value.trim() ? (
                            <MarkdownRenderer content={value} />
                        ) : (
                            <div className="flex min-h-[16rem] items-center justify-center text-center">
                                <p className="text-sm italic text-depth-secondary">
                                    Preview akan muncul di sini saat Anda mengetik.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {supportsFileUpload && (
                <div className="flex items-center justify-between rounded-depth-md border border-depth bg-depth-interactive/40 px-4 py-3">
                    <div>
                        <p className="text-sm font-semibold text-depth-primary">
                            Izinkan unggah file
                        </p>

                        <p className="mt-0.5 text-xs text-depth-secondary">
                            Praktikan dapat mengirim gambar sebagai jawaban.
                        </p>
                    </div>

                    <DepthToggleButton
                        isOn={enableFileUpload}
                        onToggle={onToggleFileUpload}
                    />
                </div>
            )}

            <div className="flex justify-end gap-2 border-t border-depth pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSaving}
                    className="rounded-depth-md border border-depth bg-depth-interactive px-4 py-2 text-sm font-semibold text-depth-primary transition hover:bg-depth-card disabled:opacity-50"
                >
                    {cancelLabel}
                </button>

                <button
                    type="button"
                    onClick={onSave}
                    disabled={isSaving || !value.trim()}
                    className="rounded-depth-md bg-[var(--depth-color-primary)] px-5 py-2 text-sm font-semibold text-white shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isSaving ? "Menyimpan..." : saveLabel}
                </button>
            </div>
        </div>
    );
}
