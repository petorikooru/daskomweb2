import { useEffect, useMemo, useState } from "react";

import { ModalOverlay } from "@/Components/Common/ModalPortal";
import ModalCloseButton from "@/Components/Common/ModalCloseButton";
import DepthToggleButton from "@/Components/Common/DepthToggleButton";

import MarkdownRenderer from "../../MarkdownRenderer";
import PairNavigator from "./PairNavigator";


const getModuleId = (item) => {
    const value =
        item?.idM ??
        item?.id ??
        item?.value ??
        item?.uuid ??
        item?.ID;

    return value == null ? "" : String(value);
};


const getModuleLabel = (item) =>
    item?.judul ??
    item?.nama ??
    item?.nama_modul ??
    item?.label ??
    `Modul ${getModuleId(item)}`;


const extractQuestions = (dataset) => {
    if (Array.isArray(dataset)) return dataset;

    return [
        dataset?.soal,
        dataset?.questions,
        dataset?.items,
        dataset?.data,
        dataset?.data?.soal,
        dataset?.data?.questions,
        dataset?.data?.items,
        dataset?.data?.data,
    ].find(Array.isArray) ?? [];
};


const emptyDraft = () => ({
    id: null,
    soal: "",
    enable_file_upload: false,
    originalSoal: "",
    originalEnableFileUpload: false,
    _deleted: false,
});


const createDrafts = (dataset) =>
    extractQuestions(dataset).map((item) => {
        const soal = item?.soal ?? item?.pertanyaan ?? "";
        const upload = Boolean(item?.enable_file_upload);

        return {
            id: item?.id ?? item?.soal_id ?? null,
            soal,
            enable_file_upload: upload,
            originalSoal: soal,
            originalEnableFileUpload: upload,
            _deleted: false,
        };
    });


const activeCount = (items) =>
    items.filter(
        (item) =>
            !item?._deleted &&
            String(item?.soal ?? "").trim(),
    ).length;


function QuestionCard({
    item,
    index,
    side,
    supportsFileUpload,
    isSaving,
    onChange,
    onCreate,
    onCopy,
}) {
    if (!item) {
        return (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-depth-lg border border-dashed border-depth bg-depth-card p-5 text-center">
                <p className="text-sm font-semibold text-depth-primary">
                    Soal {index + 1} tidak ada
                </p>

                <p className="mt-1 text-xs text-depth-secondary">
                    Modul {side} memiliki soal lebih sedikit.
                </p>

                <button
                    type="button"
                    onClick={onCreate}
                    disabled={isSaving}
                    className="mt-4 rounded-depth-md border border-depth bg-depth-interactive px-4 py-2 text-xs font-semibold text-depth-primary"
                >
                    + Buat Soal
                </button>
            </div>
        );
    }

    if (item._deleted) {
        return (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-depth-lg border border-red-500/40 bg-red-500/10 p-5 text-center">
                <span className="text-xs font-semibold text-red-400">
                    Soal {index + 1} akan dihapus
                </span>

                <button
                    type="button"
                    onClick={() => onChange({ _deleted: false })}
                    disabled={isSaving}
                    className="mt-4 rounded-depth-md border border-depth bg-depth-card px-4 py-2 text-xs font-semibold text-depth-primary"
                >
                    Batalkan Hapus
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4 rounded-depth-lg border border-depth bg-depth-card p-4 shadow-depth-sm">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-depth-primary">
                        Soal {index + 1}
                    </span>

                    <span className="rounded-depth-full border border-depth bg-depth-interactive px-2 py-0.5 text-[10px] font-semibold text-depth-secondary">
                        {side}
                    </span>

                    {!item.id && (
                        <span className="text-[10px] font-semibold text-emerald-500">
                            BARU
                        </span>
                    )}
                </div>

                <div className="flex gap-2">
                    {onCopy && (
                        <button
                            type="button"
                            onClick={onCopy}
                            disabled={!item.soal.trim() || isSaving}
                            className="rounded-depth-md border border-depth bg-depth-interactive px-2.5 py-1 text-[10px] font-semibold text-depth-secondary disabled:opacity-40"
                        >
                            {side === "ID" ? "Copy → EN" : "← Copy to ID"}
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => onChange({ _deleted: true })}
                        disabled={isSaving}
                        className="rounded-depth-md border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[10px] font-semibold text-red-400"
                    >
                        Hapus
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                <div>
                    <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-depth-secondary">
                        Markdown
                    </label>

                    <textarea
                        value={item.soal}
                        onChange={(e) => onChange({ soal: e.target.value })}
                        spellCheck={false}
                        rows={7}
                        disabled={isSaving}
                        className="min-h-[150px] w-full resize-y rounded-depth-md border border-depth bg-depth-card p-3 font-mono text-sm leading-relaxed text-depth-primary shadow-depth-inset focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] disabled:opacity-60"
                    />
                </div>

                <div>
                    <div className="mb-1.5 flex justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-depth-secondary">
                            Preview
                        </span>
                    </div>

                    <div className="min-h-[150px] max-h-[350px] overflow-auto rounded-depth-md border border-depth bg-depth-interactive p-3 shadow-depth-inset">
                        {item.soal.trim() ? (
                            <MarkdownRenderer content={item.soal} />
                        ) : (
                            <div className="flex min-h-[120px] items-center justify-center text-xs italic text-depth-secondary">
                                Belum diisi.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {supportsFileUpload && (
                <div className="flex items-center justify-between rounded-depth-md border border-depth bg-depth-interactive px-3 py-2">
                    <div>
                        <p className="text-xs font-semibold text-depth-primary">
                            File Upload
                        </p>

                        <p className="text-[10px] text-depth-secondary">
                            Izinkan jawaban berupa gambar.
                        </p>
                    </div>

                    <DepthToggleButton
                        isOn={item.enable_file_upload}
                        onToggle={() =>
                            onChange({
                                enable_file_upload:
                                    !item.enable_file_upload,
                            })
                        }
                    />
                </div>
            )}
        </div>
    );
}


export default function ModalBatchEditSoal({
    title = "Batch Edit Soal — ID / EN",
    regularModules = [],
    englishModules = [],
    selectedRegularModuleId = "",
    selectedEnglishModuleId = "",
    onSelectRegularModule,
    onSelectEnglishModule,
    regularDataset = null,
    englishDataset = null,
    isLoading = false,
    isFetching = false,
    isSaving = false,
    supportsFileUpload = false,
    onClose,
    onSubmit,
}) {
    const [regularDrafts, setRegularDrafts] = useState([]);
    const [englishDrafts, setEnglishDrafts] = useState([]);
    const [regularDirty, setRegularDirty] = useState(false);
    const [englishDirty, setEnglishDirty] = useState(false);
    const [activePair, setActivePair] = useState(0);

    useEffect(() => {
        setRegularDrafts([]);
        setRegularDirty(false);
        setActivePair(0);
    }, [selectedRegularModuleId]);

    useEffect(() => {
        setEnglishDrafts([]);
        setEnglishDirty(false);
        setActivePair(0);
    }, [selectedEnglishModuleId]);

    useEffect(() => {
        if (!selectedRegularModuleId || regularDirty || isLoading || isFetching) {
            return;
        }

        setRegularDrafts(createDrafts(regularDataset));
    }, [
        regularDataset,
        regularDirty,
        isLoading,
        isFetching,
        selectedRegularModuleId,
    ]);

    useEffect(() => {
        if (!selectedEnglishModuleId || englishDirty || isLoading || isFetching) {
            return;
        }

        setEnglishDrafts(createDrafts(englishDataset));
    }, [
        englishDataset,
        englishDirty,
        isLoading,
        isFetching,
        selectedEnglishModuleId,
    ]);

    const regularCount = useMemo(
        () => activeCount(regularDrafts),
        [regularDrafts],
    );

    const englishCount = useMemo(
        () => activeCount(englishDrafts),
        [englishDrafts],
    );

    const rowCount = Math.max(
        regularDrafts.length,
        englishDrafts.length,
    );

    const hasChanges = regularDirty || englishDirty;
    const countsMatch = regularCount === englishCount;

    useEffect(() => {
        setActivePair((current) =>
            Math.min(current, Math.max(0, rowCount - 1)),
        );
    }, [rowCount]);

    const patchRegular = (index, patch) => {
        setRegularDrafts((items) =>
            items.map((item, i) =>
                i === index ? { ...item, ...patch } : item,
            ),
        );

        setRegularDirty(true);
    };

    const patchEnglish = (index, patch) => {
        setEnglishDrafts((items) =>
            items.map((item, i) =>
                i === index ? { ...item, ...patch } : item,
            ),
        );

        setEnglishDirty(true);
    };

    const createAt = (setter, dirtySetter, index) => {
        setter((items) => {
            const next = [...items];

            while (next.length <= index) {
                next.push(emptyDraft());
            }

            return next;
        });

        dirtySetter(true);
    };

    const copy = (source, setter, dirtySetter, index) => {
        const item = source[index];
        if (!item) return;

        setter((items) => {
            const next = [...items];

            while (next.length <= index) {
                next.push(emptyDraft());
            }

            next[index] = {
                ...next[index],
                soal: item.soal,
                enable_file_upload: item.enable_file_upload,
                _deleted: false,
            };

            return next;
        });

        dirtySetter(true);
    };

    const handleAddPair = () => {
        const index = rowCount;

        createAt(setRegularDrafts, setRegularDirty, index);
        createAt(setEnglishDrafts, setEnglishDirty, index);

        setActivePair(index);
    };

    const handleClose = () => {
        if (isSaving) return;

        if (
            hasChanges &&
            !window.confirm("Ada perubahan yang belum disimpan. Tutup Batch Edit?")
        ) {
            return;
        }

        onClose?.();
    };

    const handleSave = async () => {
        if (
            isSaving ||
            !hasChanges ||
            !selectedRegularModuleId ||
            !selectedEnglishModuleId
        ) {
            return;
        }

        try {
            await onSubmit?.({
                regular: {
                    modulId: selectedRegularModuleId,
                    items: regularDrafts,
                },
                english: {
                    modulId: selectedEnglishModuleId,
                    items: englishDrafts,
                },
            });
        } catch {
            // Parent handles mutation error.
        }
    };

    const regularItem = regularDrafts[activePair];
    const englishItem = englishDrafts[activePair];

    return (
        <ModalOverlay
            onClose={handleClose}
            className="depth-modal-overlay z-[70]"
        >
            <div
                className="depth-modal-container flex max-h-[94vh] flex-col overflow-hidden p-0"
                style={{ width: "96vw", maxWidth: "1500px" }}
            >
                <div className="depth-modal-header shrink-0 border-b border-depth px-6 py-4">
                    <div>
                        <h2 className="depth-modal-title">{title}</h2>

                        <p className="mt-1 text-xs text-depth-secondary">
                            Edit modul Indonesia dan English secara berdampingan.
                        </p>
                    </div>

                    <ModalCloseButton
                        onClick={handleClose}
                        ariaLabel="Tutup batch edit soal"
                    />
                </div>

                <div className="shrink-0 space-y-4 border-b border-depth bg-depth-interactive px-6 py-4">
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-depth-secondary">
                                ID Module
                            </label>

                            <select
                                value={selectedRegularModuleId}
                                onChange={(e) =>
                                    onSelectRegularModule?.(e.target.value)
                                }
                                disabled={isSaving || hasChanges}
                                className="w-full rounded-depth-md border border-depth bg-depth-card px-3 py-2.5 text-sm font-semibold text-depth-primary"
                            >
                                <option value="">Pilih modul ID...</option>

                                {regularModules.map((item) => (
                                    <option
                                        key={getModuleId(item)}
                                        value={getModuleId(item)}
                                    >
                                        {getModuleLabel(item)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-depth-secondary">
                                EN Module
                            </label>

                            <select
                                value={selectedEnglishModuleId}
                                onChange={(e) =>
                                    onSelectEnglishModule?.(e.target.value)
                                }
                                disabled={isSaving || hasChanges}
                                className="w-full rounded-depth-md border border-depth bg-depth-card px-3 py-2.5 text-sm font-semibold text-depth-primary"
                            >
                                <option value="">Pilih modul EN...</option>

                                {englishModules.map((item) => (
                                    <option
                                        key={getModuleId(item)}
                                        value={getModuleId(item)}
                                    >
                                        {getModuleLabel(item)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-depth-md border border-depth bg-depth-card px-3 py-1.5">
                            ID: {regularCount}
                        </span>

                        <span className="rounded-depth-md border border-depth bg-depth-card px-3 py-1.5">
                            EN: {englishCount}
                        </span>

                        <span
                            className={`rounded-depth-md border px-3 py-1.5 font-semibold ${
                                countsMatch
                                    ? "border-emerald-500/30 text-emerald-500"
                                    : "border-amber-500/30 text-amber-500"
                            }`}
                        >
                            {countsMatch
                                ? "Jumlah sama"
                                : "Jumlah berbeda"}
                        </span>

                        {(isLoading || isFetching) && (
                            <span className="text-depth-secondary">
                                Memuat...
                            </span>
                        )}

                        <button
                            type="button"
                            onClick={handleAddPair}
                            disabled={
                                isSaving ||
                                isLoading ||
                                isFetching ||
                                !selectedRegularModuleId ||
                                !selectedEnglishModuleId
                            }
                            className="ml-auto rounded-depth-md border border-depth bg-depth-card px-4 py-2 font-semibold text-depth-primary disabled:opacity-50"
                        >
                            + Tambah Pair
                        </button>
                    </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                    {rowCount > 0 && (
                        <div className="sticky top-0 z-20 mb-4">
                            <PairNavigator
                                count={rowCount}
                                active={activePair}
                                onChange={setActivePair}
                            />
                        </div>
                    )}

                    {isLoading && rowCount === 0 ? (
                        <div className="flex min-h-[350px] items-center justify-center text-sm text-depth-secondary">
                            Memuat soal...
                        </div>
                    ) : rowCount === 0 ? (
                        <div className="flex min-h-[350px] flex-col items-center justify-center rounded-depth-lg border border-dashed border-depth text-center">
                            <p className="text-sm font-semibold">
                                Belum ada soal.
                            </p>

                            <button
                                type="button"
                                onClick={handleAddPair}
                                className="mt-4 rounded-depth-md bg-[var(--depth-color-primary)] px-4 py-2 text-sm font-semibold text-white"
                            >
                                + Tambah Pair
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                            <QuestionCard
                                item={regularItem}
                                index={activePair}
                                side="ID"
                                supportsFileUpload={supportsFileUpload}
                                isSaving={isSaving}
                                onChange={(patch) =>
                                    patchRegular(activePair, patch)
                                }
                                onCreate={() =>
                                    createAt(
                                        setRegularDrafts,
                                        setRegularDirty,
                                        activePair,
                                    )
                                }
                                onCopy={() =>
                                    copy(
                                        regularDrafts,
                                        setEnglishDrafts,
                                        setEnglishDirty,
                                        activePair,
                                    )
                                }
                            />

                            <QuestionCard
                                item={englishItem}
                                index={activePair}
                                side="EN"
                                supportsFileUpload={supportsFileUpload}
                                isSaving={isSaving}
                                onChange={(patch) =>
                                    patchEnglish(activePair, patch)
                                }
                                onCreate={() =>
                                    createAt(
                                        setEnglishDrafts,
                                        setEnglishDirty,
                                        activePair,
                                    )
                                }
                                onCopy={() =>
                                    copy(
                                        englishDrafts,
                                        setRegularDrafts,
                                        setRegularDirty,
                                        activePair,
                                    )
                                }
                            />
                        </div>
                    )}
                </div>

                <div className="flex shrink-0 items-center justify-between gap-3 border-t border-depth bg-depth-card px-6 py-4">
                    <span
                        className={`text-xs ${
                            hasChanges
                                ? "font-semibold text-amber-500"
                                : "text-depth-secondary"
                        }`}
                    >
                        {hasChanges
                            ? "Ada perubahan yang belum disimpan."
                            : "Belum ada perubahan."}
                    </span>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isSaving}
                            className="rounded-depth-md border border-depth bg-depth-interactive px-5 py-2 text-sm font-semibold text-depth-primary"
                        >
                            Batal
                        </button>

                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={
                                isSaving ||
                                isLoading ||
                                isFetching ||
                                !hasChanges ||
                                !selectedRegularModuleId ||
                                !selectedEnglishModuleId
                            }
                            className="rounded-depth-md bg-[var(--depth-color-primary)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
                        >
                            {isSaving
                                ? "Menyimpan..."
                                : "Simpan Kedua Modul"}
                        </button>
                    </div>
                </div>
            </div>
        </ModalOverlay>
    );
}
