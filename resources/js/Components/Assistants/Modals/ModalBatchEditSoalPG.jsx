import { useEffect, useMemo, useState } from "react";
import { ModalOverlay } from "@/Components/Common/ModalPortal";
import ModalCloseButton from "@/Components/Common/ModalCloseButton";
import MarkdownRenderer from "../../MarkdownRenderer";
import PairNavigator from "./PairNavigator";

const OPTION_COUNT = 4;
const LABELS = ["A", "B", "C", "D"];
const DIFFICULTIES = ["easy", "medium", "hard"];

const getModuleId = (item) => {
    const value = item?.idM ?? item?.id ?? item?.value ?? item?.uuid ?? item?.ID;
    return value == null ? "" : String(value);
};

const getModuleLabel = (item) => item?.judul ?? item?.nama ?? item?.nama_modul ?? item?.label ?? `Modul ${getModuleId(item)}`;

const extractQuestions = (dataset) => {
    if (Array.isArray(dataset)) return dataset;
    return [dataset?.soal, dataset?.questions, dataset?.items, dataset?.data, dataset?.data?.soal, dataset?.data?.questions, dataset?.data?.items, dataset?.data?.data].find(Array.isArray) ?? [];
};

const isCorrect = (question, option, index) => {
    if (typeof option?.is_correct === "boolean") return option.is_correct;
    if (option?.id && question?.opsi_benar_id) return option.id === question.opsi_benar_id;
    return question?.correct_option === index;
};

const emptyOptions = () => Array.from({ length: OPTION_COUNT }, () => ({ id: null, text: "", is_correct: false }));

const emptyDraft = () => ({
    id: null,
    pertanyaan: "",
    options: emptyOptions(),
    correctIndex: 0,
    difficulty: "",
    originalPertanyaan: "",
    originalOptions: emptyOptions(),
    originalCorrectIndex: 0,
    originalDifficulty: "",
    _deleted: false,
});

const getDifficultyFromMarkdown = (text) => {
    const match = String(text ?? "").match(/^\s*Kesulitan\s*:\s*(easy|medium|hard)\s*$/im);
    return match?.[1] ?? "";
};

const setDifficultyInMarkdown = (text, difficulty) => {
    const source = String(text ?? "");
    const pattern = /^\s*Kesulitan\s*:\s*(easy|medium|hard)\s*\n?/im;

    if (!difficulty) return source.replace(pattern, "").replace(/^\n+/, "");

    const line = `Kesulitan: ${difficulty}`;
    return pattern.test(source) ? source.replace(pattern, `${line}\n`) : `${line}\n\n${source}`;
};

const normalizeOptions = (question) => {
    const result = (question?.options ?? []).map((option) => ({ id: option?.id ?? null, text: option?.text ?? "", is_correct: option?.is_correct }));
    while (result.length < OPTION_COUNT) result.push({ id: null, text: "", is_correct: false });
    return result.slice(0, OPTION_COUNT);
};

const createDrafts = (dataset) => extractQuestions(dataset).map((question) => {
    const options = normalizeOptions(question);
    const found = options.findIndex((option, index) => isCorrect(question, option, index));
    const correctIndex = found >= 0 ? found : typeof question?.correct_option === "number" ? question.correct_option : 0;
    const pertanyaan = question?.pertanyaan ?? question?.soal ?? "";
    const difficulty = question?.difficulty ?? getDifficultyFromMarkdown(pertanyaan);

    return {
        id: question?.id ?? null,
        pertanyaan: pertanyaan.replace(/^\s*Kesulitan\s*:\s*(easy|medium|hard)\s*\n?/im, "").replace(/^\n+/, ""),
        options,
        correctIndex,
        difficulty,
        originalPertanyaan: pertanyaan,
        originalOptions: options.map((option) => ({ ...option })),
        originalCorrectIndex: correctIndex,
        originalDifficulty: difficulty,
        _deleted: false,
    };
});

const activeCount = (items) => items.filter((item) => !item?._deleted && String(item?.pertanyaan ?? "").trim()).length;

function PGCard({ item, index, side, isSaving, supportsDifficulty, onPatch, onOption, onCreate, onCopy }) {
    if (!item) {
        return (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-depth-lg border border-dashed border-depth bg-depth-card p-5 text-center">
                <p className="text-sm font-semibold">Soal {index + 1} tidak ada</p>
                <p className="mt-1 text-xs text-depth-secondary">Modul {side} memiliki soal lebih sedikit.</p>
                <button type="button" onClick={onCreate} disabled={isSaving} className="mt-4 rounded-depth-md border border-depth bg-depth-interactive px-4 py-2 text-xs font-semibold">+ Buat Soal</button>
            </div>
        );
    }

    if (item._deleted) {
        return (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-depth-lg border border-red-500/40 bg-red-500/10 p-5">
                <p className="text-sm font-semibold text-red-400">Soal {index + 1} akan dihapus</p>
                <button type="button" onClick={() => onPatch({ _deleted: false })} className="mt-4 rounded-depth-md border border-depth bg-depth-card px-4 py-2 text-xs font-semibold">Batalkan Hapus</button>
            </div>
        );
    }

    const handleDifficulty = (difficulty) => onPatch({
        difficulty,
    });

    return (
        <div className="space-y-4 rounded-depth-lg border border-depth bg-depth-card p-4 shadow-depth-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">Soal {index + 1}</span>
                    <span className="rounded-depth-full border border-depth bg-depth-interactive px-2 py-0.5 text-[10px] font-semibold text-depth-secondary">{side}</span>
                    {!item.id && <span className="text-[10px] font-semibold text-emerald-500">BARU</span>}
                    {supportsDifficulty && item.difficulty && (
                        <span className="rounded-depth-full border border-depth bg-depth-interactive px-2 py-0.5 text-[10px] font-semibold capitalize text-depth-secondary">{item.difficulty}</span>
                    )}
                </div>

                <div className="flex gap-2">
                    <button type="button" onClick={onCopy} disabled={!item.pertanyaan.trim() || isSaving} className="rounded-depth-md border border-depth bg-depth-interactive px-2.5 py-1 text-[10px] font-semibold text-depth-secondary disabled:opacity-40">{side === "ID" ? "Copy to EN" : "Copy to ID"}</button>
                    <button type="button" onClick={() => onPatch({ _deleted: true })} disabled={isSaving} className="rounded-depth-md border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[10px] font-semibold text-red-400">Hapus</button>
                </div>
            </div>

            {supportsDifficulty && (
                <div className="max-w-xs">
                    <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-depth-secondary">Kesulitan</label>
                    <select
                        value={item.difficulty ?? ""}
                        onChange={(e) => handleDifficulty(e.target.value)}
                        disabled={isSaving}
                        style={{ backgroundColor: "color-mix(in srgb, var(--depth-color-card) 65%, black 35%)" }}
                        className="w-full rounded-depth-md border border-depth px-3 py-2 text-sm font-semibold text-depth-primary shadow-depth-inset focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] disabled:opacity-50"
                    >
                        <option value="" style={{ backgroundColor: "#181b20", color: "white" }}>Pilih kesulitan...</option>
                        {DIFFICULTIES.map((difficulty) => (
                            <option key={difficulty} value={difficulty} style={{ backgroundColor: "#181b20", color: "white" }}>
                                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <div className="grid grid-cols-1 gap-3 2xl:grid-cols-2">
                <div>
                    <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-depth-secondary">Pertanyaan Markdown</label>
                    <textarea
                        value={item.pertanyaan}
                        onChange={(e) => {
                            onPatch({ pertanyaan, difficulty: getDifficultyFromMarkdown(pertanyaan) });
                        }}
                        spellCheck={false}
                        rows={5}
                        disabled={isSaving}
                        className="min-h-[120px] w-full resize-y rounded-depth-md border border-depth bg-depth-card p-3 font-mono text-sm leading-relaxed text-depth-primary shadow-depth-inset focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)]"
                    />
                </div>

                <div>
                    <div className="mb-1.5 flex justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-depth-secondary">Preview</span>
                        <span className="text-[10px] text-emerald-500">● Live</span>
                    </div>
                    <div className="min-h-[120px] max-h-[260px] overflow-auto rounded-depth-md border border-depth bg-depth-interactive p-3 shadow-depth-inset">
                        {item.pertanyaan.trim() ? <MarkdownRenderer content={item.pertanyaan} /> : <div className="flex min-h-[90px] items-center justify-center text-xs italic text-depth-secondary">Belum diisi.</div>}
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                {item.options.map((option, optionIndex) => {
                    const correct = item.correctIndex === optionIndex;

                    return (
                        <div key={option.id ?? optionIndex} className={`grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-depth-md border p-3 ${correct ? "border-[var(--depth-color-primary)]" : "border-depth"}`}>
                            <div className="flex items-start gap-2 pt-2">
                                <input type="radio" name={`correct-${side}-${index}`} checked={correct} onChange={() => onPatch({ correctIndex: optionIndex })} disabled={isSaving} className="mt-1 h-4 w-4 accent-[var(--depth-color-primary)]" />
                                <span className={`flex h-7 w-7 items-center justify-center rounded-depth-md text-xs font-bold ${correct ? "bg-[var(--depth-color-primary)] text-white" : "border border-depth bg-depth-interactive text-depth-secondary"}`}>{LABELS[optionIndex]}</span>
                            </div>

                            <div className="grid min-w-0 grid-cols-1 gap-2 2xl:grid-cols-2">
                                <textarea value={option.text} onChange={(e) => onOption(optionIndex, e.target.value)} spellCheck={false} rows={2} disabled={isSaving} className="min-h-[68px] w-full resize-y rounded-depth-md border border-depth bg-depth-card p-2.5 font-mono text-xs leading-relaxed text-depth-primary shadow-depth-inset focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)]" />
                                <div className="min-h-[68px] max-h-[150px] overflow-auto rounded-depth-md border border-depth bg-depth-interactive p-2.5 text-sm shadow-depth-inset">
                                    {option.text.trim() ? <MarkdownRenderer content={option.text} /> : <div className="flex min-h-[45px] items-center justify-center text-xs italic text-depth-secondary">Belum diisi.</div>}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function ModalBatchEditSoalPG({
    title = "Compare Soal PG — ID / EN",
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
    supportsDifficulty = false,
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
        if (!selectedRegularModuleId || regularDirty || isLoading || isFetching) return;
        setRegularDrafts(createDrafts(regularDataset));
    }, [regularDataset, regularDirty, isLoading, isFetching, selectedRegularModuleId]);

    useEffect(() => {
        if (!selectedEnglishModuleId || englishDirty || isLoading || isFetching) return;
        setEnglishDrafts(createDrafts(englishDataset));
    }, [englishDataset, englishDirty, isLoading, isFetching, selectedEnglishModuleId]);

    const regularCount = useMemo(() => activeCount(regularDrafts), [regularDrafts]);
    const englishCount = useMemo(() => activeCount(englishDrafts), [englishDrafts]);
    const rowCount = Math.max(regularDrafts.length, englishDrafts.length);
    const hasChanges = regularDirty || englishDirty;

    useEffect(() => setActivePair((current) => Math.min(current, Math.max(0, rowCount - 1))), [rowCount]);

    const patch = (setter, dirtySetter, index, value) => {
        setter((items) => items.map((item, i) => i === index ? { ...item, ...value } : item));
        dirtySetter(true);
    };

    const createAt = (setter, dirtySetter, index) => {
        setter((items) => {
            const next = [...items];
            while (next.length <= index) next.push(emptyDraft());
            return next;
        });
        dirtySetter(true);
    };

    const patchOption = (setter, dirtySetter, questionIndex, optionIndex, text) => {
        setter((items) => items.map((item, index) => index !== questionIndex ? item : {
            ...item,
            options: item.options.map((option, i) => i === optionIndex ? { ...option, text } : option),
        }));
        dirtySetter(true);
    };

    const copy = (source, setter, dirtySetter, index) => {
        const item = source[index];
        if (!item) return;

        setter((items) => {
            const next = [...items];
            while (next.length <= index) next.push(emptyDraft());

            const destination = next[index];

            next[index] = {
                ...destination,
                pertanyaan: item.pertanyaan,
                correctIndex: item.correctIndex,
                difficulty: item.difficulty ?? "",
                _deleted: false,
                options: item.options.map((option, optionIndex) => ({
                    id: destination?.options?.[optionIndex]?.id ?? null,
                    text: option.text,
                })),
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
        if (hasChanges && !window.confirm("Ada perubahan yang belum disimpan. Tutup Batch Edit?")) return;
        onClose?.();
    };

    const validateDifficulty = (items, label) => {
        if (!supportsDifficulty) return null;
        const index = items.findIndex((item) => !item?._deleted && String(item?.pertanyaan ?? "").trim() && !item?.difficulty);
        return index >= 0 ? `${label} Soal ${index + 1} belum memiliki difficulty.` : null;
    };

    const handleSave = async () => {
        if (isSaving || !hasChanges || !selectedRegularModuleId || !selectedEnglishModuleId) return;

        const difficultyError = validateDifficulty(regularDrafts, "ID") ?? validateDifficulty(englishDrafts, "EN");
        if (difficultyError) {
            window.alert(difficultyError);
            return;
        }

        try {
            await onSubmit?.({
                regular: { modulId: selectedRegularModuleId, items: regularDrafts },
                english: { modulId: selectedEnglishModuleId, items: englishDrafts },
            });
        } catch {}
    };

    const regularItem = regularDrafts[activePair];
    const englishItem = englishDrafts[activePair];

    return (
        <ModalOverlay onClose={handleClose} className="depth-modal-overlay z-[70]">
            <div className="depth-modal-container flex max-h-[94vh] flex-col overflow-hidden p-0" style={{ width: "96vw", maxWidth: "1600px" }}>
                <div className="depth-modal-header shrink-0 border-b border-depth px-6 py-4">
                    <div>
                        <h2 className="depth-modal-title">{title}</h2>
                        <p className="mt-1 text-xs text-depth-secondary">Edit PG Indonesia dan English secara berdampingan{supportsDifficulty ? ", termasuk difficulty." : "."}</p>
                    </div>
                    <ModalCloseButton onClick={handleClose} ariaLabel="Tutup batch edit PG" />
                </div>

                <div className="shrink-0 space-y-4 border-b border-depth bg-depth-interactive px-6 py-4">
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-depth-secondary">ID Module</label>
                            <select value={selectedRegularModuleId} onChange={(e) => onSelectRegularModule?.(e.target.value)} disabled={isSaving || hasChanges} className="w-full rounded-depth-md border border-depth bg-depth-card px-3 py-2.5 text-sm font-semibold text-depth-primary">
                                <option value="">Pilih modul ID...</option>
                                {regularModules.map((item) => <option key={getModuleId(item)} value={getModuleId(item)}>{getModuleLabel(item)}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-depth-secondary">EN Module</label>
                            <select value={selectedEnglishModuleId} onChange={(e) => onSelectEnglishModule?.(e.target.value)} disabled={isSaving || hasChanges} className="w-full rounded-depth-md border border-depth bg-depth-card px-3 py-2.5 text-sm font-semibold text-depth-primary">
                                <option value="">Pilih modul EN...</option>
                                {englishModules.map((item) => <option key={getModuleId(item)} value={getModuleId(item)}>{getModuleLabel(item)}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-depth-md border border-depth bg-depth-card px-3 py-1.5">ID: {regularCount}</span>
                        <span className="rounded-depth-md border border-depth bg-depth-card px-3 py-1.5">EN: {englishCount}</span>
                        <span className={`rounded-depth-md border px-3 py-1.5 font-semibold ${regularCount === englishCount ? "border-emerald-500/30 text-emerald-500" : "border-amber-500/30 text-amber-500"}`}>
                            {regularCount === englishCount ? "Jumlah sama" : "Jumlah berbeda"}
                        </span>
                        {(isLoading || isFetching) && <span className="text-depth-secondary">Memuat...</span>}
                        <button type="button" onClick={handleAddPair} disabled={isSaving || isLoading || isFetching || !selectedRegularModuleId || !selectedEnglishModuleId} className="ml-auto rounded-depth-md border border-depth bg-depth-card px-4 py-2 font-semibold disabled:opacity-50">+ Tambah Pair</button>
                    </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                    {rowCount > 0 && (
                        <div className="sticky top-0 z-20 mb-4">
                            <PairNavigator count={rowCount} active={activePair} onChange={setActivePair} />
                        </div>
                    )}

                    {isLoading && rowCount === 0 ? (
                        <div className="flex min-h-[350px] items-center justify-center text-sm text-depth-secondary">Memuat soal...</div>
                    ) : rowCount === 0 ? (
                        <div className="flex min-h-[350px] flex-col items-center justify-center rounded-depth-lg border border-dashed border-depth">
                            <p className="text-sm font-semibold">Belum ada soal.</p>
                            <button type="button" onClick={handleAddPair} className="mt-4 rounded-depth-md bg-[var(--depth-color-primary)] px-4 py-2 text-sm font-semibold text-white">+ Tambah Pair</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
                            <PGCard
                                item={regularItem}
                                index={activePair}
                                side="ID"
                                isSaving={isSaving}
                                supportsDifficulty={supportsDifficulty}
                                onPatch={(value) => patch(setRegularDrafts, setRegularDirty, activePair, value)}
                                onOption={(optionIndex, text) => patchOption(setRegularDrafts, setRegularDirty, activePair, optionIndex, text)}
                                onCreate={() => createAt(setRegularDrafts, setRegularDirty, activePair)}
                                onCopy={() => copy(regularDrafts, setEnglishDrafts, setEnglishDirty, activePair)}
                            />

                            <PGCard
                                item={englishItem}
                                index={activePair}
                                side="EN"
                                isSaving={isSaving}
                                supportsDifficulty={supportsDifficulty}
                                onPatch={(value) => patch(setEnglishDrafts, setEnglishDirty, activePair, value)}
                                onOption={(optionIndex, text) => patchOption(setEnglishDrafts, setEnglishDirty, activePair, optionIndex, text)}
                                onCreate={() => createAt(setEnglishDrafts, setEnglishDirty, activePair)}
                                onCopy={() => copy(englishDrafts, setRegularDrafts, setRegularDirty, activePair)}
                            />
                        </div>
                    )}
                </div>

                <div className="flex shrink-0 items-center justify-between gap-3 border-t border-depth bg-depth-card px-6 py-4">
                    <span className={`text-xs ${hasChanges ? "font-semibold text-amber-500" : "text-depth-secondary"}`}>
                        {hasChanges ? "Ada perubahan yang belum disimpan." : "Belum ada perubahan."}
                    </span>
                    <div className="flex gap-2">
                        <button type="button" onClick={handleClose} disabled={isSaving} className="rounded-depth-md border border-depth bg-depth-interactive px-5 py-2 text-sm font-semibold">Batal</button>
                        <button type="button" onClick={handleSave} disabled={isSaving || isLoading || isFetching || !hasChanges || !selectedRegularModuleId || !selectedEnglishModuleId} className="rounded-depth-md bg-[var(--depth-color-primary)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">
                            {isSaving ? "Menyimpan..." : "Simpan Kedua Modul"}
                        </button>
                    </div>
                </div>
            </div>
        </ModalOverlay>
    );
}
