import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { send } from "@/lib/http";
import { useSoalQuery, soalQueryKey } from "@/hooks/useSoalQuery";
import { useSoalComparison } from "@/hooks/useSoalComparison";
import { getSoalController } from "@/lib/soalControllers";
import trashIcon from "../../../../assets/nav/Icon-Delete.svg";
import editIcon from "../../../../assets/nav/Icon-Edit.svg";
import toast from "react-hot-toast";
import ModalBatchEditSoalPG from "../Modals/ModalBatchEditSoalPG";
import ModalLegacyBatchEditSoal from "../Modals/ModalLegacyBatchEditSoal";
import ModalAnalyzeSoalPG from "../Modals/ModalAnalyzeSoalPG";
import SoalCommentsButton from "./SoalCommentsButton";
import SoalPGEditor from "./SoalPGEditor";
import SoalRandomizationPanel, { randomizationQueryKey } from "./SoalRandomizationPanel";
import { ModalOverlay } from "@/Components/Common/ModalPortal";
import ModalCloseButton from "@/Components/Common/ModalCloseButton";
import MarkdownRenderer from "../../MarkdownRenderer";

const OPTION_COUNT = 4;
const OPTION_LABELS = ["A", "B", "C", "D"];
const EMPTY_OPTIONS = Array.from({ length: OPTION_COUNT }, () => "");

const DIFFICULTY_OPTIONS = [
    { value: "easy", label: "Mudah" },
    { value: "medium", label: "Sedang" },
    { value: "hard", label: "Sulit" },
];

const difficultyStyles = {
    easy: {
        button: "border-emerald-500/40 bg-emerald-500/10 text-emerald-500",
        dot: "bg-emerald-500",
        hover: "hover:bg-emerald-500/10",
    },
    medium: {
        button: "border-amber-500/40 bg-amber-500/10 text-amber-500",
        dot: "bg-amber-500",
        hover: "hover:bg-amber-500/10",
    },
    hard: {
        button: "border-red-500/40 bg-red-500/10 text-red-500",
        dot: "bg-red-500",
        hover: "hover:bg-red-500/10",
    },
};

const getModuleId = (m) => {
    const id = m?.idM ?? m?.id ?? m?.value ?? m?.uuid ?? m?.ID;
    return id == null ? "" : String(id);
};

const isOptionCorrect = (soalItem, option, index) => {
    if (typeof option?.is_correct === "boolean")
        return option.is_correct;
    if (option?.id && soalItem?.opsi_benar_id)
        return option.id === soalItem.opsi_benar_id;
    if (typeof soalItem?.correct_option === "number")
        return soalItem.correct_option === index;

    return false;
};

const normalizeOptionsForDisplay = (item) => {
    const options = (item?.options ?? []).map((option) => ({
        id: option?.id ?? null,
        text: option?.text ?? "",
        is_correct: option?.is_correct,
    }));

    while (options.length < OPTION_COUNT) {
        options.push({ id: null, text: "", is_correct: false });
    }

    return options.slice(0, OPTION_COUNT);
};

const validatePGForm = ({ pertanyaan, options }) => {
    if (!String(pertanyaan ?? "").trim())
        return "Pertanyaan tidak boleh kosong.";

    const normalized = options.map((option) =>
        String(typeof option === "string" ? option : option?.text ?? "").trim(),
    );

    if (normalized.some((option) => !option))
        return "Semua pilihan jawaban harus diisi.";
    if (new Set(normalized).size !== normalized.length)
        return "Teks pilihan tidak boleh duplikat.";

    return null;
};

const difficultyLabel = (difficulty) =>
    difficulty === "easy"
        ? "Mudah"
        : difficulty === "medium"
          ? "Sedang"
          : difficulty === "hard"
            ? "Sulit"
            : "Unlabeled";

const normalizeDifficulty = (value) => {
    const normalized = String(value ?? "").trim().toLowerCase();

    return {
        easy: "easy",
        mudah: "easy",
        medium: "medium",
        sedang: "medium",
        hard: "hard",
        sulit: "hard",
        susah: "hard",
    }[normalized] ?? "";
};

const DifficultyIndicator = ({ value }) => {
    const difficulty = normalizeDifficulty(value);
    const styles = difficultyStyles[difficulty];

    return (
        <span
            className={`flex items-center gap-1.5 rounded-depth-md border px-2 py-0.5 text-xs font-semibold ${
                styles?.button ?? "border-depth bg-depth-card text-depth-primary"
            }`}
        >
            {difficulty && <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />}
            {difficultyLabel(difficulty)}
        </span>
    );
};

const DifficultySelect = ({
    value,
    onChange,
    disabled = false,
    placeholder = "Pilih tingkat kesulitan",
    className = "",
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const difficulty = normalizeDifficulty(value);
    const selected = DIFFICULTY_OPTIONS.find((option) => option.value === difficulty);
    const styles = difficultyStyles[difficulty];

    return (
        <div className={`relative ${className}`}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen((prev) => !prev)}
                className={`flex w-full items-center justify-between gap-3 rounded-depth-md border px-3 py-2 text-xs font-semibold shadow-depth-sm transition focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${
                    styles?.button ?? "border-depth bg-depth-card text-depth-primary"
                }`}
            >
                <span className="flex min-w-0 items-center gap-2">
                    {selected ? (
                        <>
                            <span className={`h-2 w-2 shrink-0 rounded-full ${styles.dot}`} />
                            <span>{selected.label}</span>
                        </>
                    ) : (
                        <span className="text-depth-secondary">{placeholder}</span>
                    )}
                </span>

                <svg
                    className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                >
                    <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z"
                        clipRule="evenodd"
                    />
                </svg>
            </button>

            {isOpen && (
                <>
                    <button
                        type="button"
                        aria-label="Close difficulty menu"
                        className="fixed inset-0 z-40 cursor-default"
                        onClick={() => setIsOpen(false)}
                    />

                    <div className="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-depth-md border border-depth bg-depth-card p-1 shadow-depth-lg">
                        {DIFFICULTY_OPTIONS.map((option) => {
                            const optionStyles = difficultyStyles[option.value];
                            const isSelected = difficulty === option.value;

                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(option.value);
                                        setIsOpen(false);
                                    }}
                                    className={`flex w-full items-center justify-between rounded-depth-md px-3 py-2 text-left text-xs font-semibold transition ${
                                        isSelected ? optionStyles.button : `text-depth-primary ${optionStyles.hover}`
                                    }`}
                                >
                                    <span className="flex items-center gap-2">
                                        <span className={`h-2.5 w-2.5 rounded-full ${optionStyles.dot}`} />
                                        {option.label}
                                    </span>

                                    {isSelected && (
                                        <svg
                                            className="h-4 w-4"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                            aria-hidden="true"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M16.704 5.29a1 1 0 010 1.42l-7.25 7.25a1 1 0 01-1.414 0l-3.25-3.25a1 1 0 111.414-1.42l2.543 2.544 6.543-6.544a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
};

export default function SoalInputPG({
    kategoriSoal,
    modul,
    modules = [],
    onModalSuccess,
    onModalValidation,
    isEditable = true,
}) {
    const queryClient = useQueryClient();
    const supportsDifficulty = kategoriSoal === "ta" || kategoriSoal === "tk";
    const isAnalysisSupported = supportsDifficulty;

    const [formState, setFormState] = useState({
        pertanyaan: "",
        options: [...EMPTY_OPTIONS],
        correctIndex: 0,
        difficulty: "",
    });

    const [isAddingSoal, setIsAddingSoal] = useState(false);
    const [editingSoal, setEditingSoal] = useState(null);
    const [deleteCandidate, setDeleteCandidate] = useState(null);
    const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
    const [isLegacyBatchModalOpen, setIsLegacyBatchModalOpen] = useState(false);
    const [isAnalyzeModalOpen, setIsAnalyzeModalOpen] = useState(false);
    const [analyzeModuleId, setAnalyzeModuleId] = useState(modul ? String(modul) : "");
    const [batchState, setBatchState] = useState({
        regularModuleId: "",
        englishModuleId: "",
    });

    const regularModules = useMemo(
        () => modules.filter((m) => Number(m?.isEnglish ?? 0) !== 1),
        [modules],
    );

    const englishModules = useMemo(
        () => modules.filter((m) => Number(m?.isEnglish ?? 0) === 1),
        [modules],
    );

    const soalQuery = useSoalQuery(kategoriSoal, modul);
    const soalList = soalQuery.data ?? [];
    const controller = getSoalController(kategoriSoal);

    const invalidate = (moduleId = modul) => {
        if (!moduleId) return;

        return queryClient.invalidateQueries({
            queryKey: soalQueryKey(kategoriSoal, String(moduleId)),
        });
    };

    const invalidateRandomization = (moduleId = modul) => {
        if (!supportsDifficulty || !moduleId) return;

        return queryClient.invalidateQueries({
            queryKey: randomizationQueryKey(kategoriSoal, moduleId),
        });
    };

    const postSoalMutation = useMutation({
        mutationFn: async (payload) => {
            if (!controller) throw new Error(`Kategori soal tidak didukung: ${kategoriSoal}`);
            return (await send(controller.store(modul), payload)).data;
        },
        onSuccess: () => {
            invalidate();
            invalidateRandomization();
            onModalSuccess?.();
        },
        onError: (error) => {
            console.error("Error posting soal PG:", error);
            toast.error(
                error?.response?.data?.message ??
                    error?.message ??
                    "Gagal menambahkan soal.",
            );
        },
    });

    const putSoalMutation = useMutation({
        mutationFn: async ({ soalId, payload }) => {
            if (!controller) throw new Error(`Kategori soal tidak didukung: ${kategoriSoal}`);
            return (await send(controller.update(soalId), payload)).data;
        },
        onSuccess: (_, variables) => {
            const previous = variables?.previousModulKey ?? modul;
            const next = variables?.nextModulKey ?? previous;

            if (previous) {
                invalidate(previous);
                invalidateRandomization(previous);
            }

            if (next && next !== previous) {
                invalidate(next);
                invalidateRandomization(next);
            }
        },
        onError: (error) => {
            console.error("Error updating soal PG:", error);
            toast.error(
                error?.response?.data?.message ??
                    error?.message ??
                    "Gagal memperbarui soal.",
            );
        },
    });

    const deleteSoalMutation = useMutation({
        mutationFn: async (soalId) => {
            if (!controller) throw new Error(`Kategori soal tidak didukung: ${kategoriSoal}`);
            await send(controller.destroy(soalId));
        },
        onSuccess: () => {
            invalidate();
            invalidateRandomization();
            setDeleteCandidate(null);
            toast.success("Soal berhasil dihapus!");
        },
        onError: (error) =>
            toast.error(
                error?.response?.data?.message ??
                    error?.message ??
                    "Gagal menghapus soal.",
            ),
    });

    const difficultyMutation = useMutation({
        mutationFn: async ({ id, difficulty }) =>
            (
                await api.patch(
                    `/api-v1/question-difficulty/${kategoriSoal}/${id}`,
                    { difficulty },
                )
            ).data,
        onSuccess: () => {
            invalidate();
            invalidateRandomization();
        },
        onError: (error) =>
            toast.error(
                error?.response?.data?.message ?? "Gagal mengubah difficulty.",
            ),
    });

    const syncBatchModule = async ({ modulId, items }) => {
        if (!controller) throw new Error(`Kategori soal tidak didukung: ${kategoriSoal}`);

        const targetModulId = Number(modulId);

        if (!targetModulId || Number.isNaN(targetModulId))
            throw new Error("Modul belum dipilih.");

        for (const item of items ?? []) {
            const questionId = item?.id ?? null;
            const deleted = Boolean(item?._deleted);

            const validationError = deleted
                ? null
                : validatePGForm({
                      pertanyaan: item?.pertanyaan,
                      options: item?.options ?? [],
                  });

            if (validationError)
                throw new Error(validationError);

            if (!deleted && supportsDifficulty && !item?.difficulty)
                throw new Error("Semua soal TA/TK harus memiliki difficulty.");


            if (questionId) {
                if (deleted) {
                    await send(controller.destroy(questionId));
                    continue;
                }

                const questionChanged =
                    item.pertanyaan.trim() !== String(item.originalPertanyaan ?? "").trim();

                const optionsChanged = item.options.some(
                    (option, index) =>
                        option.text.trim() !== String(item.originalOptions?.[index]?.text ?? "").trim(),
                );

                const correctChanged = item.correctIndex !== item.originalCorrectIndex;

                const difficultyChanged =
                    supportsDifficulty &&
                    item.difficulty !== item.originalDifficulty;

                if (
                    !questionChanged &&
                    !optionsChanged &&
                    !correctChanged &&
                    !difficultyChanged
                ) {
                    continue;
                }

                await send(controller.update(questionId), {
                    modul_id: targetModulId,
                    pertanyaan: item.pertanyaan.trim(),
                    options: item.options.map((option) => ({
                        id: option.id ?? null,
                        text: option.text.trim(),
                    })),
                    correct_option: item.correctIndex,
                    ...(supportsDifficulty
                        ? { difficulty: item.difficulty }
                        : {}),
                });

                continue;
            }

            if (!deleted) {
                await send(controller.store(targetModulId), {
                    pertanyaan: item.pertanyaan.trim(),
                    options: item.options.map((option) => ({
                        text: option.text.trim(),
                    })),
                    correct_option: item.correctIndex,
                    ...(supportsDifficulty
                        ? { difficulty: item.difficulty }
                        : {}),
                });
            }
        }
    };

    const batchUpdateMutation = useMutation({
        mutationFn: async ({ regular, english }) => {
            await syncBatchModule(regular);
            await syncBatchModule(english);
        },
        onSuccess: (_, variables) => {
            const moduleIds = [
                variables?.regular?.modulId,
                variables?.english?.modulId,
                modul,
            ]
                .filter(Boolean)
                .map(String);

            [...new Set(moduleIds)].forEach((moduleId) => {
                invalidate(moduleId);
                invalidateRandomization(moduleId);
            });

            toast.success("Soal PG modul ID dan EN berhasil diperbarui.");
        },
        onError: (error) => {
            console.error("Error batch updating soal PG:", error);
            toast.error(
                error?.response?.data?.message ??
                    error?.message ??
                    "Gagal memperbarui soal.",
            );
        },
    });

    const handleOpenTambah = () => {
        setEditingSoal(null);
        setIsAddingSoal(true);
    };

    const handleCancelTambah = () => {
        if (postSoalMutation.isPending) return;

        setIsAddingSoal(false);
        setFormState({
            pertanyaan: "",
            options: [...EMPTY_OPTIONS],
            correctIndex: 0,
            difficulty: "",
        });
    };

    const handleOptionChange = (index, value) => {
        setFormState((prev) => {
            const options = [...prev.options];
            options[index] = value;
            return { ...prev, options };
        });
    };

    const handleTambahSoal = () => {
        if (!modul) {
            onModalValidation?.({
                message: "Pilih modul terlebih dahulu.",
                includeModuleNotice: false,
            });
            return;
        }

        const validationError = validatePGForm(formState);

        if (validationError) {
            onModalValidation?.({ message: validationError });
            return;
        }

        if (supportsDifficulty && !formState.difficulty) {
            onModalValidation?.({ message: "Pilih difficulty soal." });
            return;
        }

        postSoalMutation.mutate(
            {
                pertanyaan: formState.pertanyaan.trim(),
                options: formState.options.map((text) => ({
                    text: text.trim(),
                })),
                correct_option: formState.correctIndex,
                ...(supportsDifficulty
                    ? { difficulty: formState.difficulty }
                    : {}),
            },
            {
                onSuccess: () => {
                    setFormState({
                        pertanyaan: "",
                        options: [...EMPTY_OPTIONS],
                        correctIndex: 0,
                        difficulty: "",
                    });
                    setIsAddingSoal(false);
                    toast.success("Soal berhasil ditambahkan.");
                },
            },
        );
    };

    const handleStartEdit = (item) => {
        setIsAddingSoal(false);

        const options = normalizeOptionsForDisplay(item);

        const correctIndex = options.findIndex((option, index) =>
            isOptionCorrect(item, option, index),
        );

        setEditingSoal({
            id: item.id,
            modul_id: item?.modul_id ?? (modul ? Number(modul) : ""),
            pertanyaan: item.pertanyaan ?? "",
            options: options.map((option) => ({
                id: option.id,
                text: option.text,
            })),
            correctIndex: correctIndex >= 0 ? correctIndex : 0,
            difficulty: normalizeDifficulty(item?.difficulty),
            originalModulId:
                item?.modul_id ?? (modul ? Number(modul) : null),
        });
    };

    const updateEditingQuestion = (value) =>
        setEditingSoal((prev) => ({ ...prev, pertanyaan: value }));

    const updateEditingOption = (index, value) =>
        setEditingSoal((prev) => {
            if (!prev) return prev;

            return {
                ...prev,
                options: prev.options.map((option, i) =>
                    i === index ? { ...option, text: value } : option,
                ),
            };
        });

    const handleCancelEdit = () => {
        if (!putSoalMutation.isPending) setEditingSoal(null);
    };

    const handleConfirmEdit = () => {
        if (!editingSoal || putSoalMutation.isPending) return;

        const validationError = validatePGForm(editingSoal);

        if (validationError) {
            toast.error(validationError);
            return;
        }

        if (supportsDifficulty && !editingSoal.difficulty) {
            toast.error("Pilih difficulty soal.");
            return;
        }

        const nextModulId = Number(editingSoal.modul_id);

        if (!nextModulId || Number.isNaN(nextModulId)) {
            toast.error("Pilih modul untuk soal ini.");
            return;
        }

        const previousModulKey =
            editingSoal.originalModulId != null
                ? String(editingSoal.originalModulId)
                : String(modul ?? "");

        const nextModulKey = String(nextModulId);

        putSoalMutation.mutate(
            {
                soalId: editingSoal.id,
                payload: {
                    modul_id: nextModulId,
                    pertanyaan: editingSoal.pertanyaan.trim(),
                    options: editingSoal.options.map((option) => ({
                        id: option.id ?? null,
                        text: option.text.trim(),
                    })),
                    correct_option: editingSoal.correctIndex,
                    ...(supportsDifficulty
                        ? { difficulty: editingSoal.difficulty }
                        : {}),
                },
                previousModulKey,
                nextModulKey,
            },
            {
                onSuccess: () => {
                    setEditingSoal(null);
                    toast.success("Soal berhasil diperbarui.");
                },
            },
        );
    };

    const handleCancelDelete = () => {
        if (!deleteSoalMutation.isPending) setDeleteCandidate(null);
    };

    const handleConfirmDelete = () => {
        if (!deleteCandidate?.id || deleteSoalMutation.isPending) return;
        deleteSoalMutation.mutate(deleteCandidate.id);
    };

    const handleOpenLegacyBatchModal = () => {
        if (!modul) {
            toast.error("Pilih modul terlebih dahulu.");
            return;
        }

        if (!controller) {
            toast.error(`Kategori soal tidak didukung: ${kategoriSoal}`);
            return;
        }

        setIsLegacyBatchModalOpen(true);
    };

    const handleCloseLegacyBatchModal = () => {
        if (!batchUpdateMutation.isPending) setIsLegacyBatchModalOpen(false);
    };

    const handleLegacyBatchSubmit = async ({ items, modulId }) => {
        try {
            if (!controller) {
                throw new Error(`Kategori soal tidak didukung: ${kategoriSoal}`);
            }

            const targetModulId = Number(modulId);

            if (!targetModulId || Number.isNaN(targetModulId)) {
                throw new Error("Modul belum dipilih.");
            }

            const currentQuestions = soalList;

            for (let index = 0; index < items.length; index += 1) {
                const item = items[index];

                const pertanyaan = String(item?.pertanyaan ?? "").trim();

                const options = (item?.options ?? []).map((option) => ({
                    id: option?.id ?? null,
                    text: String(option?.text ?? "").trim(),
                    isCorrect: Boolean(option?.isCorrect),
                }));

                const validationError = validatePGForm({
                    pertanyaan,
                    options,
                });

                if (validationError)
                    throw new Error(`Soal ${index + 1}: ${validationError}`);

                if (supportsDifficulty && !item?.difficulty)
                    throw new Error(`Soal ${index + 1}: difficulty wajib diisi.`);

                const difficulty = normalizeDifficulty(item?.difficulty);

                if (supportsDifficulty && !difficulty)
                    throw new Error(`Soal ${index + 1}: difficulty harus easy/mudah, medium/sedang, atau hard/sulit.`);
            }

            if (items.length < currentQuestions.length) {
                const shouldDelete = window.confirm(
                    `Jumlah soal berubah dari ${currentQuestions.length} menjadi ${items.length}. Soal yang tidak ada lagi akan dihapus. Lanjutkan?`,
                );

                if (!shouldDelete)
                    return;
            }

            for (let index = 0; index < items.length; index += 1) {
                const item = items[index];
                const current = currentQuestions[index];

                const pertanyaan = String(item?.pertanyaan ?? "").trim();

                const options = (item?.options ?? []).map((option) => ({
                    id: option?.id ?? null,
                    text: String(option?.text ?? "").trim(),
                    isCorrect: Boolean(option?.isCorrect),
                }));

                const difficulty = normalizeDifficulty(item?.difficulty);
                const correctIndex = options.findIndex(
                    (option) => option.isCorrect,
                );

                const payload = {
                    modul_id: targetModulId,
                    pertanyaan,
                    options: options.map((option) => ({
                        id: option.id,
                        text: option.text,
                    })),
                    correct_option:
                        correctIndex >= 0
                            ? correctIndex
                            : Number(item?.correctIndex ?? 0),
                    ...(supportsDifficulty ? { difficulty } : {}),
                };

                if (current?.id) {
                    await send(controller.update(current.id), payload);
                } else {
                    await send(controller.store(targetModulId), {
                        pertanyaan,
                        options: options.map((option) => ({
                            text: option.text,
                        })),
                        correct_option: payload.correct_option,
                        ...(supportsDifficulty ? { difficulty } : {}),
                    });
                }
            }

            if (items.length < currentQuestions.length) {
                for (
                    let index = items.length;
                    index < currentQuestions.length;
                    index += 1
                ) {
                    const question = currentQuestions[index];

                    if (question?.id) {
                        await send(controller.destroy(question.id));
                    }
                }
            }

            await queryClient.invalidateQueries({
                queryKey: soalQueryKey(
                    kategoriSoal,
                    String(targetModulId),
                ),
            });

            invalidateRandomization(String(targetModulId));

            await queryClient.refetchQueries({
                queryKey: soalQueryKey(
                    kategoriSoal,
                    String(targetModulId),
                ),
            });

            toast.success("Batch soal PG berhasil diperbarui.");
            setIsLegacyBatchModalOpen(false);
        } catch (error) {
            console.error("Error batch editing soal:", error);

            toast.error(
                error?.response?.data?.message ??
                    error?.message ??
                    "Gagal memperbarui batch soal.",
            );

            throw error;
        }
    };

    const handleOpenBatchModal = () => {
        if (!regularModules.length || !englishModules.length) {
            toast.error(
                "Modul Indonesia dan English harus tersedia untuk Batch Edit.",
            );
            return;
        }

        const currentModuleId = modul ? String(modul) : "";
        const currentModule = modules.find(
            (m) => getModuleId(m) === currentModuleId,
        );
        const currentIsEnglish =
            Number(currentModule?.isEnglish ?? 0) === 1;

        setBatchState((prev) => ({
            regularModuleId:
                (!currentIsEnglish && currentModuleId) ||
                prev.regularModuleId ||
                getModuleId(regularModules[0]),
            englishModuleId:
                (currentIsEnglish && currentModuleId) ||
                prev.englishModuleId ||
                getModuleId(englishModules[0]),
        }));

        setIsBatchModalOpen(true);
    };

    const handleBatchSubmit = async (payload) => {
        await batchUpdateMutation.mutateAsync(payload);
        setIsBatchModalOpen(false);
    };

    const handleOpenAnalyzeModal = () => {
        if (!String(modul)) {
            toast.error(
                "Pilih modul terlebih dahulu sebelum menganalisis.",
            );
            return;
        }

        setAnalyzeModuleId(String(modul));
        setIsAnalyzeModalOpen(true);
    };

    const {
        data: batchComparisonData,
        isLoading: isBatchComparisonLoading,
        isFetching: isBatchComparisonFetching,
    } = useSoalComparison(
        kategoriSoal,
        isBatchModalOpen ? batchState.regularModuleId : null,
        isBatchModalOpen ? batchState.englishModuleId : null,
        {
            enabled:
                isBatchModalOpen &&
                Boolean(
                    kategoriSoal &&
                        batchState.regularModuleId &&
                        batchState.englishModuleId,
                ),
            keepPreviousData: false,
        },
    );

    return (
        <div className="space-y-6 text-depth-primary">
            {supportsDifficulty && modul && (
                <SoalRandomizationPanel
                    category={kategoriSoal}
                    moduleId={modul}
                />
            )}

            {isEditable && (
                <div className="flex flex-wrap justify-end gap-3">
                    {isAnalysisSupported && (
                        <button
                            type="button"
                            onClick={handleOpenAnalyzeModal}
                            disabled={!String(modul)}
                            className="rounded-depth-md border border-depth bg-depth-interactive px-6 py-2 text-sm font-semibold text-depth-primary shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Analyze
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={handleOpenLegacyBatchModal}
                        disabled={!modul || soalQuery.isLoading}
                        className="rounded-depth-md border border-depth bg-depth-interactive px-6 py-2 text-sm font-semibold text-depth-primary shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Batch Edit
                    </button>

                    <button
                        type="button"
                        onClick={handleOpenBatchModal}
                        disabled={
                            !regularModules.length ||
                            !englishModules.length
                        }
                        className="rounded-depth-md border border-depth bg-depth-interactive px-6 py-2 text-sm font-semibold text-depth-primary shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Compare Soal ID / EN
                    </button>

                    <button
                        type="button"
                        onClick={handleOpenTambah}
                        disabled={
                            isAddingSoal ||
                            postSoalMutation.isPending
                        }
                        className="rounded-depth-md bg-[var(--depth-color-primary)] px-6 py-2 text-sm font-semibold text-white shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isAddingSoal
                            ? "Menambah Soal..."
                            : "+ Tambah Soal"}
                    </button>
                </div>
            )}

            {isEditable && isAddingSoal && (
                <section className="overflow-hidden rounded-depth-lg border border-[var(--depth-color-primary)] bg-depth-card shadow-depth-md">
                    <div className="border-b border-depth bg-depth-interactive px-5 py-4">
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-semibold">
                                Tambah Soal PG
                            </h3>

                            <span className="rounded-depth-full bg-[var(--depth-color-primary)]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--depth-color-primary)]">
                                New
                            </span>
                        </div>

                        <p className="mt-1 text-xs text-depth-secondary">
                            Pertanyaan dan seluruh pilihan mendukung Markdown.
                        </p>
                    </div>

                    <div className="space-y-4 p-5">
                        {supportsDifficulty && (
                            <div className="max-w-xs">
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-depth-secondary">
                                    Difficulty
                                </label>

                                <DifficultySelect
                                    value={formState.difficulty}
                                    onChange={(difficulty) =>
                                        setFormState((prev) => ({
                                            ...prev,
                                            difficulty,
                                        }))
                                    }
                                    disabled={postSoalMutation.isPending}
                                />
                            </div>
                        )}

                        <SoalPGEditor
                            pertanyaan={formState.pertanyaan}
                            options={formState.options}
                            correctIndex={formState.correctIndex}
                            onQuestionChange={(value) =>
                                setFormState((prev) => ({
                                    ...prev,
                                    pertanyaan: value,
                                }))
                            }
                            onOptionChange={handleOptionChange}
                            onCorrectChange={(index) =>
                                setFormState((prev) => ({
                                    ...prev,
                                    correctIndex: index,
                                }))
                            }
                            onSave={handleTambahSoal}
                            onCancel={handleCancelTambah}
                            saveLabel="Tambah Soal"
                            isSaving={postSoalMutation.isPending}
                        />
                    </div>
                </section>
            )}

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-depth-secondary">
                        Soal yang telah ditambahkan:
                    </h3>

                    {!soalQuery.isLoading && !soalQuery.isError && (
                        <span className="text-xs text-depth-secondary">
                            {soalList.length} soal
                        </span>
                    )}
                </div>

                {soalQuery.isLoading && (
                    <p className="text-sm text-depth-secondary">
                        Memuat soal...
                    </p>
                )}

                {soalQuery.isError && (
                    <p className="text-sm text-red-500">
                        {soalQuery.error?.message ?? "Gagal memuat soal"}
                    </p>
                )}

                {!soalQuery.isLoading &&
                    !soalQuery.isError &&
                    !soalList.length && (
                        <div className="rounded-depth-lg border border-dashed border-depth bg-depth-card p-8 text-center">
                            <p className="text-sm text-depth-secondary">
                                Belum ada soal.
                            </p>

                            {isEditable && (
                                <button
                                    type="button"
                                    onClick={handleOpenTambah}
                                    className="mt-3 text-sm font-semibold text-[var(--depth-color-primary)] hover:underline"
                                >
                                    + Tambah soal pertama
                                </button>
                            )}
                        </div>
                    )}

                {!soalQuery.isLoading &&
                    !soalQuery.isError &&
                    soalList.length > 0 && (
                        <ul className="space-y-4">
                            {soalList.map((soalItem, index) => {
                                const isEditing = editingSoal?.id === soalItem.id;

                                return (
                                    <li
                                        id={`soal-${kategoriSoal}-${index}`}
                                        key={soalItem.id ?? index}
                                        className={`relative overflow-hidden rounded-depth-lg border bg-depth-card shadow-depth-md transition ${
                                            isEditing
                                                ? "border-[var(--depth-color-primary)] ring-1 ring-[var(--depth-color-primary)]"
                                                : "border-depth hover:shadow-depth-lg"
                                        }`}
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-depth bg-depth-interactive px-5 py-3">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-sm font-semibold text-depth-secondary">
                                                    Soal {index + 1}
                                                </span>

                                                {supportsDifficulty &&
                                                    !isEditing &&
                                                    isEditable && (
                                                        <DifficultySelect
                                                            value={normalizeDifficulty(soalItem.difficulty)}
                                                            disabled={difficultyMutation.isPending}
                                                            onChange={(difficulty) => difficultyMutation.mutate({id: soalItem.id, difficulty}) }
                                                            className="ml-2 w-32"
                                                        />
                                                    )}

                                                {supportsDifficulty &&
                                                    !isEditable && (
                                                        <DifficultyIndicator value={soalItem.difficulty}/>
                                                    )}

                                                {isEditing && (
                                                    <>
                                                        {supportsDifficulty && (
                                                            <DifficultyIndicator value={editingSoal.difficulty}/>
                                                        )}

                                                        <span className="rounded-depth-full bg-[var(--depth-color-primary)]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--depth-color-primary)]">
                                                            Editing
                                                        </span>
                                                    </>
                                                )}
                                            </div>

                                            {!isEditing && (
                                                <div className="flex gap-2">
                                                    {isEditable && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeleteCandidate(soalItem)}
                                                            className="flex h-9 w-9 items-center justify-center rounded-depth-md border border-depth bg-depth-interactive text-red-500 shadow-depth-sm transition hover:border-red-400 hover:shadow-depth-md"
                                                            title="Hapus soal"
                                                        >
                                                            <img
                                                                className="h-4 w-4"
                                                                src={trashIcon}
                                                                alt=""
                                                            />
                                                        </button>
                                                    )}

                                                    <SoalCommentsButton
                                                        kategoriSoal={kategoriSoal}
                                                        modulId={
                                                            soalItem?.modul_id ??
                                                            (modul
                                                                ? Number(modul)
                                                                : null)
                                                        }
                                                        soalId={soalItem?.id}
                                                        variant="icon"
                                                    />

                                                    {isEditable && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleStartEdit(soalItem)}
                                                            className="flex h-9 w-9 items-center justify-center rounded-depth-md border border-depth bg-depth-interactive shadow-depth-sm transition hover:border-blue-400 hover:shadow-depth-md"
                                                            title="Edit soal"
                                                        >
                                                            <img
                                                                className="edit-icon-filter h-4 w-4"
                                                                src={editIcon}
                                                                alt=""
                                                            />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-5">
                                            {isEditing ? (
                                                <div className="space-y-5">
                                                    <div
                                                        className={`grid gap-4 ${supportsDifficulty ? "md:grid-cols-2" : ""}`}
                                                    >
                                                        <div>
                                                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-depth-secondary">
                                                                Modul
                                                            </label>

                                                            <select
                                                                value={editingSoal.modul_id ?? ""}
                                                                onChange={(e) =>
                                                                    setEditingSoal(
                                                                        (prev) => ({
                                                                            ...prev,
                                                                            modul_id: e.target.value,
                                                                        }),
                                                                    )
                                                                }
                                                                disabled={putSoalMutation.isPending}
                                                                className="w-full rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm text-depth-primary shadow-depth-sm focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)]"
                                                            >
                                                                {modules
                                                                    .map((moduleItem) => {
                                                                        const moduleId = getModuleId(moduleItem);
                                                                        if (!moduleId)
                                                                            return null;

                                                                        return (
                                                                            <option
                                                                                key={moduleId}
                                                                                value={moduleId}
                                                                            >
                                                                                {moduleItem?.judul ?? moduleItem?.nama ?? `Modul ${moduleId}`}
                                                                            </option>
                                                                        );
                                                                    },
                                                                )}
                                                            </select>
                                                        </div>

                                                        {supportsDifficulty && (
                                                            <div>
                                                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-depth-secondary">
                                                                    Difficulty
                                                                </label>

                                                                <DifficultySelect
                                                                    value={editingSoal.difficulty}
                                                                    onChange={
                                                                        (difficulty) => setEditingSoal(
                                                                            (prev) => ({...prev, difficulty}),
                                                                        )
                                                                    }
                                                                    disabled={putSoalMutation.isPending}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <SoalPGEditor
                                                        pertanyaan={editingSoal.pertanyaan}
                                                        options={editingSoal.options}
                                                        correctIndex={editingSoal.correctIndex}
                                                        onQuestionChange={updateEditingQuestion}
                                                        onOptionChange={updateEditingOption}
                                                        onCorrectChange={(optionIndex) =>
                                                            setEditingSoal(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    correctIndex:
                                                                        optionIndex,
                                                                }),
                                                            )
                                                        }
                                                        onSave={handleConfirmEdit}
                                                        onCancel={handleCancelEdit}
                                                        saveLabel="Simpan Perubahan"
                                                        isSaving={putSoalMutation.isPending}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="space-y-5">
                                                    <div className="space-y-2">
                                                        <span className="text-xs font-semibold uppercase tracking-wide text-depth-secondary">
                                                            Pertanyaan
                                                        </span>

                                                        <div className="min-w-0 max-h-[60vh] overflow-y-auto break-words rounded-depth-md bg-depth-interactive p-4 text-sm text-depth-primary shadow-depth-inset">
                                                            <MarkdownRenderer content={soalItem.pertanyaan}/>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <span className="text-xs font-semibold uppercase tracking-wide text-depth-secondary">
                                                            Pilihan Jawaban
                                                        </span>

                                                        <ul className="space-y-2">
                                                            {normalizeOptionsForDisplay(soalItem)
                                                                .map((option, optionIndex) => {
                                                                    const isCorrect = isOptionCorrect(soalItem, option, optionIndex);

                                                                    return (
                                                                        <li
                                                                            key={option.id ?? optionIndex}
                                                                            className={`flex items-start gap-3 rounded-depth-md border px-3 py-3 text-sm shadow-depth-sm transition ${
                                                                                isCorrect
                                                                                    ? "border-[var(--depth-color-primary)] bg-[var(--depth-color-primary)] text-white shadow-depth-md"
                                                                                    : "border-depth bg-depth-interactive text-depth-primary"
                                                                            }`}
                                                                        >
                                                                            <span
                                                                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-depth-md text-xs font-bold ${
                                                                                    isCorrect
                                                                                        ? "bg-white/20 text-white"
                                                                                        : "border border-depth bg-depth-card text-depth-secondary"
                                                                                }`}
                                                                            >
                                                                                {
                                                                                    OPTION_LABELS[optionIndex]
                                                                                }
                                                                            </span>

                                                                            <div className="min-w-0 flex-1">
                                                                                {option.text ? (
                                                                                    <MarkdownRenderer content={option.text}/>
                                                                                ) : (
                                                                                    <span className="italic text-depth-secondary">
                                                                                        Belum diisi
                                                                                    </span>
                                                                                )}
                                                                            </div>

                                                                            {isCorrect && (
                                                                                <span className="shrink-0 rounded-depth-full bg-white/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                                                                                    Benar
                                                                                </span>
                                                                            )}
                                                                        </li>
                                                                    );
                                                                },
                                                            )}
                                                        </ul>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
            </div>

            {isAnalyzeModalOpen && (
                <ModalAnalyzeSoalPG
                    kategoriSoal={kategoriSoal}
                    modules={modules}
                    initialModuleId={analyzeModuleId}
                    onClose={() => setIsAnalyzeModalOpen(false)}
                />
            )}

            {isLegacyBatchModalOpen && (
                <ModalLegacyBatchEditSoal
                    title="Batch Edit Soal PG"
                    initialValue={soalList
                        .map((item, index) => {
                            const options = normalizeOptionsForDisplay(item);

                            const correctIndex = options.findIndex(
                                (option, optionIndex) => isOptionCorrect(item, option, optionIndex),
                            );

                            return [
                                `Soal ${index + 1}`,
                                "",
                                "Kesulitan:",
                                item.difficulty ?? "",
                                "",
                                "Pertanyaan:",
                                item.pertanyaan ?? "",
                                "",
                                "Pilihan:",
                                ...options.map(
                                    (option, optionIndex) =>
                                        `- [${
                                            optionIndex === correctIndex
                                                ? "x"
                                                : " "
                                        }] ${option.text ?? ""}`,
                                ),
                            ].join("\n");
                        })
                        .join("\n\n")}
                    variant="pg"
                    moduleOptions={modules}
                    initialModuleId={modul}
                    onClose={handleCloseLegacyBatchModal}
                    onSubmit={handleLegacyBatchSubmit}
                    isSaving={batchUpdateMutation.isPending}
                />
            )}

            {isBatchModalOpen && (
                <ModalBatchEditSoalPG
                    regularModules={regularModules}
                    englishModules={englishModules}
                    selectedRegularModuleId={batchState.regularModuleId}
                    selectedEnglishModuleId={batchState.englishModuleId}
                    onSelectRegularModule={(value) =>
                        setBatchState((prev) => ({
                            ...prev,
                            regularModuleId: value,
                        }))
                    }
                    onSelectEnglishModule={(value) =>
                        setBatchState((prev) => ({
                            ...prev,
                            englishModuleId: value,
                        }))
                    }
                    regularDataset={batchComparisonData?.regular ?? null}
                    englishDataset={batchComparisonData?.english ?? null}
                    isLoading={isBatchComparisonLoading}
                    isFetching={isBatchComparisonFetching}
                    isSaving={batchUpdateMutation.isPending}
                    supportsDifficulty={supportsDifficulty}
                    onClose={() => {
                        if (!batchUpdateMutation.isPending) {
                            setIsBatchModalOpen(false);
                        }
                    }}
                    onSubmit={handleBatchSubmit}
                />
            )}

            {deleteCandidate && (
                <ModalOverlay
                    onClose={handleCancelDelete}
                    className="depth-modal-overlay z-[70]"
                >
                    <div className="depth-modal-container max-w-sm space-y-4 text-center">
                        <div className="depth-modal-header justify-center">
                            <h3 className="depth-modal-title text-center">
                                Hapus Soal
                            </h3>

                            <ModalCloseButton
                                onClick={handleCancelDelete}
                                ariaLabel="Tutup konfirmasi hapus soal"
                            />
                        </div>

                        <p className="text-sm text-depth-secondary">
                            Apakah Anda yakin ingin menghapus soal{" "}
                            <span className="font-semibold text-depth-primary">
                                {deleteCandidate?.pertanyaan?.slice(0, 40,) ?? "ini"}
                            </span>
                            ?
                        </p>

                        <div className="flex justify-center gap-3">
                            <button
                                type="button"
                                onClick={handleCancelDelete}
                                disabled={deleteSoalMutation.isPending}
                                className="rounded-depth-md border border-depth bg-depth-interactive px-5 py-2 text-sm font-semibold text-depth-primary shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md disabled:opacity-60"
                            >
                                Batal
                            </button>

                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                disabled={deleteSoalMutation.isPending}
                                className="rounded-depth-md border border-red-500/60 bg-red-500/15 px-5 py-2 text-sm font-semibold text-red-400 shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md disabled:opacity-60"
                            >
                                {deleteSoalMutation.isPending
                                    ? "Menghapus..."
                                    : "Hapus"}
                            </button>
                        </div>
                    </div>
                </ModalOverlay>
            )}
        </div>
    );
}
