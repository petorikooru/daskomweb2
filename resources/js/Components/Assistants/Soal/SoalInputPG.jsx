import { useMemo, useState, } from "react";
import { useMutation, useQueryClient, } from "@tanstack/react-query";
import { send } from "@/lib/http";
import { useSoalQuery, soalQueryKey, } from "@/hooks/useSoalQuery";
import { useSoalComparison } from "@/hooks/useSoalComparison";
import { getSoalController, } from "@/lib/soalControllers";

import trashIcon from "../../../../assets/nav/Icon-Delete.svg";
import editIcon from "../../../../assets/nav/Icon-Edit.svg";

import toast from "react-hot-toast";

import ModalBatchEditSoalPG from "../Modals/ModalBatchEditSoalPG";
import ModalAnalyzeSoalPG from "../Modals/ModalAnalyzeSoalPG";

import SoalCommentsButton from "./SoalCommentsButton";
import SoalPGEditor from "./SoalPGEditor";

import { ModalOverlay, } from "@/Components/Common/ModalPortal";
import ModalCloseButton from "@/Components/Common/ModalCloseButton";
import MarkdownRenderer from "../../MarkdownRenderer";

const OPTION_COUNT = 4;

const OPTION_LABELS = [
    "A",
    "B",
    "C",
    "D",
];

const EMPTY_OPTIONS =
    Array.from( { length: OPTION_COUNT, }, () => "");


/*
 * ============================================================
 * OPTION HELPERS
 * ============================================================
 */

const isOptionCorrect = (
    soalItem,
    option,
    optionIndex
) => {
    if (
        typeof option?.is_correct ===
        "boolean"
    ) {
        return option.is_correct;
    }

    if (
        option?.id &&
        soalItem?.opsi_benar_id
    ) {
        return (
            option.id ===
            soalItem.opsi_benar_id
        );
    }

    if (
        typeof soalItem?.correct_option ===
        "number"
    ) {
        return (
            soalItem.correct_option ===
            optionIndex
        );
    }

    return false;
};


const normalizeOptionsForDisplay = (
    soalItem
) => {
    const options =
        soalItem?.options ??
        [];

    const normalized =
        options.map(
            (option) => ({
                id:
                    option?.id ??
                    null,

                text:
                    option?.text ??
                    "",

                is_correct:
                    option?.is_correct,
            })
        );

    while (
        normalized.length <
        OPTION_COUNT
    ) {
        normalized.push({
            id:
                null,

            text:
                "",

            is_correct:
                false,
        });
    }

    return normalized.slice(
        0,
        OPTION_COUNT
    );
};


const validatePGForm = ({
    pertanyaan,
    options,
}) => {
    if (
        !String(
            pertanyaan ??
                ""
        ).trim()
    ) {
        return "Pertanyaan tidak boleh kosong.";
    }

    const normalizedOptions =
        options.map(
            (option) =>
                String(
                    typeof option ===
                        "string"
                        ? option
                        : option?.text ??
                          ""
                ).trim()
        );

    if (
        normalizedOptions.some(
            (option) =>
                option.length ===
                0
        )
    ) {
        return "Semua pilihan jawaban harus diisi.";
    }

    const uniqueOptions =
        new Set(
            normalizedOptions
        );

    if (
        uniqueOptions.size !==
        normalizedOptions.length
    ) {
        return "Teks pilihan tidak boleh duplikat.";
    }

    return null;
};


export default function SoalInputPG({
    kategoriSoal,
    modul,
    modules = [],

    onModalSuccess,
    onModalValidation,

    isEditable = true,
}) {
    /*
     * ============================================================
     * STATE
     * ============================================================
     */

    const [
        formState,
        setFormState,
    ] = useState({
        pertanyaan:
            "",

        options:
            [
                ...EMPTY_OPTIONS,
            ],

        correctIndex:
            0,
    });


    const [
        isAddingSoal,
        setIsAddingSoal,
    ] = useState(false);


    const [
        editingSoal,
        setEditingSoal,
    ] = useState(null);


    const [
        deleteCandidate,
        setDeleteCandidate,
    ] = useState(null);


    const [
        isBatchModalOpen,
        setIsBatchModalOpen,
    ] = useState(false);


    const [
        batchState,
        setBatchState,
    ] = useState({
        regularModuleId:
            "",

        englishModuleId:
            "",
    });


    const [
        isAnalyzeModalOpen,
        setIsAnalyzeModalOpen,
    ] = useState(false);


    const [
        analyzeModuleId,
        setAnalyzeModuleId,
    ] = useState(
        modul
            ? String(modul)
            : ""
    );


    const isAnalysisSupported =
        kategoriSoal ===
            "ta" ||
        kategoriSoal ===
            "tk";


    /*
     * ============================================================
     * MODULE HELPERS
     * ============================================================
     */

    const getModuleId = (
        moduleItem
    ) => {
        const possibleId =
            moduleItem?.idM ??
            moduleItem?.id ??
            moduleItem?.value ??
            moduleItem?.uuid ??
            moduleItem?.ID;

        return possibleId ===
            undefined ||
            possibleId ===
                null
            ? ""
            : String(
                  possibleId
              );
    };


    const regularModules =
        useMemo(
            () =>
                (
                    modules ??
                    []
                ).filter(
                    (
                        moduleItem
                    ) =>
                        Number(
                            moduleItem?.isEnglish ??
                                0
                        ) !==
                        1
                ),
            [modules]
        );


    const englishModules =
        useMemo(
            () =>
                (
                    modules ??
                    []
                ).filter(
                    (
                        moduleItem
                    ) =>
                        Number(
                            moduleItem?.isEnglish ??
                                0
                        ) ===
                        1
                ),
            [modules]
        );


    /*
     * ============================================================
     * QUERY
     * ============================================================
     */

    const queryClient =
        useQueryClient();


    const soalQuery =
        useSoalQuery(
            kategoriSoal,
            modul
        );


    const soalList =
        soalQuery.data ??
        [];


    const controller =
        getSoalController(
            kategoriSoal
        );


    /*
     * ============================================================
     * CREATE
     * ============================================================
     */

    const postSoalMutation =
        useMutation({
            mutationFn:
                async (
                    payload
                ) => {
                    if (
                        !controller
                    ) {
                        throw new Error(
                            `Kategori soal tidak didukung: ${kategoriSoal}`
                        );
                    }

                    const {
                        data,
                    } =
                        await send(
                            controller.store(
                                modul
                            ),
                            payload
                        );

                    return data;
                },

            onSuccess:
                () => {
                    queryClient.invalidateQueries(
                        {
                            queryKey:
                                soalQueryKey(
                                    kategoriSoal,
                                    modul
                                ),
                        }
                    );

                    if (
                        typeof onModalSuccess ===
                        "function"
                    ) {
                        onModalSuccess();
                    }
                },

            onError:
                (
                    error
                ) => {
                    console.error(
                        "Error posting soal PG:",
                        error
                    );

                    toast.error(
                        error
                            ?.response
                            ?.data
                            ?.message ??
                            error
                                ?.message ??
                            "Gagal menambahkan soal."
                    );
                },
        });


    /*
     * ============================================================
     * UPDATE
     * ============================================================
     */

    const putSoalMutation =
        useMutation({
            mutationFn:
                async ({
                    soalId,
                    payload,
                }) => {
                    if (
                        !controller
                    ) {
                        throw new Error(
                            `Kategori soal tidak didukung: ${kategoriSoal}`
                        );
                    }

                    const {
                        data,
                    } =
                        await send(
                            controller.update(
                                soalId
                            ),
                            payload
                        );

                    return data;
                },

            onSuccess:
                (
                    _,
                    variables
                ) => {
                    const previousKey =
                        variables?.previousModulKey ??
                        modul;

                    const nextKey =
                        variables?.nextModulKey ??
                        previousKey;

                    if (
                        previousKey
                    ) {
                        queryClient.invalidateQueries(
                            {
                                queryKey:
                                    soalQueryKey(
                                        kategoriSoal,
                                        previousKey
                                    ),
                            }
                        );
                    }

                    if (
                        nextKey &&
                        nextKey !==
                            previousKey
                    ) {
                        queryClient.invalidateQueries(
                            {
                                queryKey:
                                    soalQueryKey(
                                        kategoriSoal,
                                        nextKey
                                    ),
                            }
                        );
                    }
                },

            onError:
                (
                    error
                ) => {
                    console.error(
                        "Error updating soal PG:",
                        error
                    );

                    toast.error(
                        error
                            ?.response
                            ?.data
                            ?.message ??
                            error
                                ?.message ??
                            "Gagal memperbarui soal."
                    );
                },
        });


    /*
     * ============================================================
     * DELETE
     * ============================================================
     */

    const deleteSoalMutation =
        useMutation({
            mutationFn:
                async (
                    soalId
                ) => {
                    if (
                        !controller
                    ) {
                        throw new Error(
                            `Kategori soal tidak didukung: ${kategoriSoal}`
                        );
                    }

                    await send(
                        controller.destroy(
                            soalId
                        )
                    );
                },

            onSuccess:
                () => {
                    queryClient.invalidateQueries(
                        {
                            queryKey:
                                soalQueryKey(
                                    kategoriSoal,
                                    modul
                                ),
                        }
                    );

                    setDeleteCandidate(
                        null
                    );

                    toast.success(
                        "Soal berhasil dihapus!"
                    );
                },

            onError:
                (
                    error
                ) => {
                    toast.error(
                        error
                            ?.response
                            ?.data
                            ?.message ??
                            "Gagal menghapus soal."
                    );
                },
        });


    /*
     * ============================================================
     * ADD HANDLERS
     * ============================================================
     */

    const handleOpenTambah =
        () => {
            setEditingSoal(
                null
            );

            setIsAddingSoal(
                true
            );
        };


    const handleCancelTambah =
        () => {
            if (
                postSoalMutation.isPending
            ) {
                return;
            }

            setIsAddingSoal(
                false
            );

            setFormState({
                pertanyaan:
                    "",

                options:
                    [
                        ...EMPTY_OPTIONS,
                    ],

                correctIndex:
                    0,
            });
        };


    const handleOptionChange = (
        index,
        value
    ) => {
        setFormState(
            (
                previous
            ) => {
                const updated =
                    [
                        ...previous.options,
                    ];

                updated[
                    index
                ] =
                    value;

                return {
                    ...previous,
                    options:
                        updated,
                };
            }
        );
    };


    const handleTambahSoal =
        () => {
            if (!modul) {
                onModalValidation?.(
                    {
                        message:
                            "Pilih modul terlebih dahulu.",

                        includeModuleNotice:
                            false,
                    }
                );

                return;
            }

            const validationError =
                validatePGForm(
                    formState
                );

            if (
                validationError
            ) {
                onModalValidation?.(
                    {
                        message:
                            validationError,
                    }
                );

                return;
            }

            postSoalMutation.mutate(
                {
                    pertanyaan:
                        formState.pertanyaan.trim(),

                    options:
                        formState.options.map(
                            (
                                option
                            ) => ({
                                text:
                                    option.trim(),
                            })
                        ),

                    correct_option:
                        formState.correctIndex,
                },
                {
                    onSuccess:
                        () => {
                            setFormState(
                                {
                                    pertanyaan:
                                        "",

                                    options:
                                        [
                                            ...EMPTY_OPTIONS,
                                        ],

                                    correctIndex:
                                        0,
                                }
                            );

                            setIsAddingSoal(
                                false
                            );

                            toast.success(
                                "Soal berhasil ditambahkan."
                            );
                        },
                }
            );
        };


    /*
     * ============================================================
     * INLINE EDIT
     * ============================================================
     */

    const handleStartEdit = (
        soalItem
    ) => {
        setIsAddingSoal(
            false
        );

        const options =
            normalizeOptionsForDisplay(
                soalItem
            );

        const correctIndexRaw =
            options.findIndex(
                (
                    option,
                    optionIndex
                ) =>
                    isOptionCorrect(
                        soalItem,
                        option,
                        optionIndex
                    )
            );

        setEditingSoal({
            id:
                soalItem.id,

            modul_id:
                soalItem?.modul_id ??
                (modul
                    ? Number(
                          modul
                      )
                    : ""),

            pertanyaan:
                soalItem.pertanyaan ??
                "",

            options:
                options.map(
                    (
                        option
                    ) => ({
                        id:
                            option.id,

                        text:
                            option.text,
                    })
                ),

            correctIndex:
                correctIndexRaw >=
                0
                    ? correctIndexRaw
                    : 0,

            originalModulId:
                soalItem?.modul_id ??
                (modul
                    ? Number(
                          modul
                      )
                    : null),
        });
    };


    const handleCancelEdit =
        () => {
            if (
                putSoalMutation.isPending
            ) {
                return;
            }

            setEditingSoal(
                null
            );
        };


    const updateEditingQuestion = (
        value
    ) => {
        setEditingSoal(
            (
                previous
            ) => ({
                ...previous,

                pertanyaan:
                    value,
            })
        );
    };


    const updateEditingOption = (
        index,
        value
    ) => {
        setEditingSoal(
            (
                previous
            ) => {
                if (
                    !previous
                ) {
                    return previous;
                }

                const options =
                    previous.options.map(
                        (
                            option,
                            optionIndex
                        ) =>
                            optionIndex ===
                            index
                                ? {
                                      ...option,

                                      text:
                                          value,
                                  }
                                : option
                    );

                return {
                    ...previous,
                    options,
                };
            }
        );
    };


    const handleConfirmEdit =
        () => {
            if (
                !editingSoal ||
                putSoalMutation.isPending
            ) {
                return;
            }

            const validationError =
                validatePGForm({
                    pertanyaan:
                        editingSoal.pertanyaan,

                    options:
                        editingSoal.options,
                });

            if (
                validationError
            ) {
                toast.error(
                    validationError
                );

                return;
            }

            const nextModulId =
                Number(
                    editingSoal.modul_id
                );

            if (
                !nextModulId ||
                Number.isNaN(
                    nextModulId
                )
            ) {
                toast.error(
                    "Pilih modul untuk soal ini."
                );

                return;
            }

            const previousModulKey =
                editingSoal.originalModulId !==
                    undefined &&
                editingSoal.originalModulId !==
                    null
                    ? String(
                          editingSoal.originalModulId
                      )
                    : String(
                          modul ??
                              ""
                      );

            const nextModulKey =
                String(
                    nextModulId
                );

            putSoalMutation.mutate(
                {
                    soalId:
                        editingSoal.id,

                    payload:
                        {
                            modul_id:
                                nextModulId,

                            pertanyaan:
                                editingSoal.pertanyaan.trim(),

                            options:
                                editingSoal.options.map(
                                    (
                                        option
                                    ) => ({
                                        id:
                                            option.id ??
                                            null,

                                        text:
                                            option.text.trim(),
                                    })
                                ),

                            correct_option:
                                editingSoal.correctIndex,
                        },

                    previousModulKey,

                    nextModulKey,
                },
                {
                    onSuccess:
                        () => {
                            setEditingSoal(
                                null
                            );

                            toast.success(
                                "Soal berhasil diperbarui."
                            );
                        },
                }
            );
        };


    /*
     * ============================================================
     * DELETE HANDLERS
     * ============================================================
     */

    const handleCancelDelete =
        () => {
            if (
                !deleteSoalMutation.isPending
            ) {
                setDeleteCandidate(
                    null
                );
            }
        };


    const handleConfirmDelete =
        () => {
            if (
                !deleteCandidate?.id ||
                deleteSoalMutation.isPending
            ) {
                return;
            }

            deleteSoalMutation.mutate(
                deleteCandidate.id
            );
        };


    /*
     * ============================================================
     * PG BATCH SYNC
     * ============================================================
     */

    const syncBatchModule =
        async ({
            modulId,
            items,
        }) => {
            if (
                !controller
            ) {
                throw new Error(
                    `Kategori soal tidak didukung: ${kategoriSoal}`
                );
            }

            const targetModulId =
                Number(
                    modulId
                );

            if (
                !targetModulId ||
                Number.isNaN(
                    targetModulId
                )
            ) {
                throw new Error(
                    "Modul belum dipilih."
                );
            }

            for (
                const item of
                items ?? []
            ) {
                const deleted =
                    Boolean(
                        item?._deleted
                    );

                const questionId =
                    item?.id ??
                    null;

                const validationError =
                    deleted
                        ? null
                        : validatePGForm(
                              {
                                  pertanyaan:
                                      item?.pertanyaan,

                                  options:
                                      item?.options ??
                                      [],
                              }
                          );

                if (
                    validationError
                ) {
                    throw new Error(
                        validationError
                    );
                }


                /*
                 * Existing.
                 */
                if (
                    questionId
                ) {
                    if (
                        deleted
                    ) {
                        await send(
                            controller.destroy(
                                questionId
                            )
                        );

                        continue;
                    }

                    const questionChanged =
                        item.pertanyaan.trim() !==
                        String(
                            item.originalPertanyaan ??
                                ""
                        ).trim();


                    const optionsChanged =
                        item.options.some(
                            (
                                option,
                                index
                            ) =>
                                option.text.trim() !==
                                String(
                                    item
                                        .originalOptions?.[
                                        index
                                    ]
                                        ?.text ??
                                        ""
                                ).trim()
                        );


                    const correctChanged =
                        item.correctIndex !==
                        item.originalCorrectIndex;


                    if (
                        !questionChanged &&
                        !optionsChanged &&
                        !correctChanged
                    ) {
                        continue;
                    }


                    await send(
                        controller.update(
                            questionId
                        ),
                        {
                            modul_id:
                                targetModulId,

                            pertanyaan:
                                item.pertanyaan.trim(),

                            options:
                                item.options.map(
                                    (
                                        option
                                    ) => ({
                                        id:
                                            option.id ??
                                            null,

                                        text:
                                            option.text.trim(),
                                    })
                                ),

                            correct_option:
                                item.correctIndex,
                        }
                    );

                    continue;
                }


                /*
                 * New.
                 */
                if (
                    !deleted
                ) {
                    await send(
                        controller.store(
                            targetModulId
                        ),
                        {
                            pertanyaan:
                                item.pertanyaan.trim(),

                            options:
                                item.options.map(
                                    (
                                        option
                                    ) => ({
                                        text:
                                            option.text.trim(),
                                    })
                                ),

                            correct_option:
                                item.correctIndex,
                        }
                    );
                }
            }
        };


    const batchUpdateMutation =
        useMutation({
            mutationFn:
                async ({
                    regular,
                    english,
                }) => {
                    await syncBatchModule(
                        regular
                    );

                    await syncBatchModule(
                        english
                    );
                },

            onSuccess:
                (
                    _,
                    variables
                ) => {
                    const moduleIds =
                        [
                            variables?.regular?.modulId,
                            variables?.english?.modulId,
                            modul,
                        ]
                            .filter(
                                Boolean
                            )
                            .map(
                                String
                            );

                    [
                        ...new Set(
                            moduleIds
                        ),
                    ].forEach(
                        (
                            moduleId
                        ) => {
                            queryClient.invalidateQueries(
                                {
                                    queryKey:
                                        soalQueryKey(
                                            kategoriSoal,
                                            moduleId
                                        ),
                                }
                            );
                        }
                    );

                    toast.success(
                        "Soal PG modul ID dan EN berhasil diperbarui."
                    );
                },

            onError:
                (
                    error
                ) => {
                    console.error(
                        "Error batch updating soal PG:",
                        error
                    );

                    toast.error(
                        error
                            ?.response
                            ?.data
                            ?.message ??
                            error
                                ?.message ??
                            "Gagal memperbarui soal."
                    );
                },
        });


    /*
     * ============================================================
     * BATCH MODAL HANDLERS
     * ============================================================
     */

    const handleOpenBatchModal =
        () => {
            if (
                regularModules.length ===
                    0 ||
                englishModules.length ===
                    0
            ) {
                toast.error(
                    "Modul Indonesia dan English harus tersedia untuk Batch Edit."
                );

                return;
            }

            const currentModuleId =
                modul
                    ? String(
                          modul
                      )
                    : "";

            const currentModule =
                modules.find(
                    (
                        moduleItem
                    ) =>
                        getModuleId(
                            moduleItem
                        ) ===
                        currentModuleId
                );

            const isEnglish =
                Number(
                    currentModule?.isEnglish ??
                        0
                ) ===
                1;

            const firstRegularId =
                getModuleId(
                    regularModules[
                        0
                    ]
                );

            const firstEnglishId =
                getModuleId(
                    englishModules[
                        0
                    ]
                );


            setBatchState(
                (
                    previous
                ) => ({
                    regularModuleId:
                        !isEnglish &&
                        currentModuleId
                            ? currentModuleId
                            : previous.regularModuleId ||
                              firstRegularId,

                    englishModuleId:
                        isEnglish &&
                        currentModuleId
                            ? currentModuleId
                            : previous.englishModuleId ||
                              firstEnglishId,
                })
            );

            setIsBatchModalOpen(
                true
            );
        };


    const handleBatchSubmit =
        async (
            payload
        ) => {
            await batchUpdateMutation.mutateAsync(
                payload
            );

            setIsBatchModalOpen(
                false
            );
        };


    /*
     * ============================================================
     * ANALYZE
     * ============================================================
     */

    const handleOpenAnalyzeModal =
        () => {
            if (
                !String(
                    modul
                )
            ) {
                toast.error(
                    "Pilih modul terlebih dahulu sebelum menganalisis."
                );

                return;
            }

            setAnalyzeModuleId(
                String(
                    modul
                )
            );

            setIsAnalyzeModalOpen(
                true
            );
        };


    /*
     * ============================================================
     * ID / EN DATA
     * ============================================================
     */

    const {
        data:
            batchComparisonData,

        isLoading:
            isBatchComparisonLoading,

        isFetching:
            isBatchComparisonFetching,
    } =
        useSoalComparison(
            kategoriSoal,

            isBatchModalOpen
                ? batchState.regularModuleId
                : null,

            isBatchModalOpen
                ? batchState.englishModuleId
                : null,

            {
                enabled:
                    isBatchModalOpen &&
                    Boolean(
                        kategoriSoal &&
                            batchState.regularModuleId &&
                            batchState.englishModuleId
                    ),

                keepPreviousData:
                    false,
            }
        );


    /*
     * ============================================================
     * RENDER
     * ============================================================
     */

    return (
        <div className="space-y-6 text-depth-primary">
            {/* ====================================================
             * TOOLBAR
             * ==================================================== */}

            {isEditable && (
                <div className="flex flex-wrap justify-end gap-3">
                    {isAnalysisSupported && (
                        <button
                            type="button"
                            onClick={
                                handleOpenAnalyzeModal
                            }
                            disabled={
                                !String(
                                    modul
                                )
                            }
                            className="rounded-depth-md border border-depth bg-depth-interactive px-6 py-2 text-sm font-semibold text-depth-primary shadow-depth-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-depth-md disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Analyze
                        </button>
                    )}


                    <button
                        type="button"
                        onClick={
                            handleOpenBatchModal
                        }
                        disabled={
                            regularModules.length ===
                                0 ||
                            englishModules.length ===
                                0
                        }
                        className="rounded-depth-md border border-depth bg-depth-interactive px-6 py-2 text-sm font-semibold text-depth-primary shadow-depth-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-depth-md disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Batch Edit ID / EN
                    </button>


                    <button
                        type="button"
                        onClick={
                            handleOpenTambah
                        }
                        disabled={
                            isAddingSoal ||
                            postSoalMutation.isPending
                        }
                        className="rounded-depth-md bg-[var(--depth-color-primary)] px-6 py-2 text-sm font-semibold text-white shadow-depth-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-depth-md disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isAddingSoal
                            ? "Menambah Soal..."
                            : "+ Tambah Soal"}
                    </button>
                </div>
            )}


            {/* ====================================================
             * ADD QUESTION
             * ==================================================== */}

            {isEditable &&
                isAddingSoal && (
                    <section className="overflow-hidden rounded-depth-lg border border-[var(--depth-color-primary)] bg-depth-card shadow-depth-md">
                        <div className="border-b border-depth bg-depth-interactive px-5 py-4">
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-semibold text-depth-primary">
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

                        <div className="p-5">
                            <SoalPGEditor
                                pertanyaan={
                                    formState.pertanyaan
                                }
                                options={
                                    formState.options
                                }
                                correctIndex={
                                    formState.correctIndex
                                }
                                onQuestionChange={(
                                    value
                                ) =>
                                    setFormState(
                                        (
                                            previous
                                        ) => ({
                                            ...previous,

                                            pertanyaan:
                                                value,
                                        })
                                    )
                                }
                                onOptionChange={
                                    handleOptionChange
                                }
                                onCorrectChange={(
                                    index
                                ) =>
                                    setFormState(
                                        (
                                            previous
                                        ) => ({
                                            ...previous,

                                            correctIndex:
                                                index,
                                        })
                                    )
                                }
                                onSave={
                                    handleTambahSoal
                                }
                                onCancel={
                                    handleCancelTambah
                                }
                                saveLabel="Tambah Soal"
                                isSaving={
                                    postSoalMutation.isPending
                                }
                            />
                        </div>
                    </section>
                )}


            {/* ====================================================
             * QUESTION LIST
             * ==================================================== */}

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-depth-secondary">
                        Soal yang telah ditambahkan:
                    </h3>

                    {!soalQuery.isLoading &&
                        !soalQuery.isError && (
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
                        {soalQuery.error
                            ?.message ??
                            "Gagal memuat soal"}
                    </p>
                )}


                {!soalQuery.isLoading &&
                    !soalQuery.isError &&
                    soalList.length ===
                        0 && (
                        <div className="rounded-depth-lg border border-dashed border-depth bg-depth-card p-8 text-center">
                            <p className="text-sm text-depth-secondary">
                                Belum ada soal.
                            </p>

                            {isEditable && (
                                <button
                                    type="button"
                                    onClick={
                                        handleOpenTambah
                                    }
                                    className="mt-3 text-sm font-semibold text-[var(--depth-color-primary)] hover:underline"
                                >
                                    + Tambah soal pertama
                                </button>
                            )}
                        </div>
                    )}


                {!soalQuery.isLoading &&
                    !soalQuery.isError &&
                    soalList.length >
                        0 && (
                        <ul className="space-y-4">
                            {soalList.map(
                                (
                                    soalItem,
                                    index
                                ) => {
                                    const isEditing =
                                        editingSoal?.id ===
                                        soalItem.id;

                                    return (
                                        <li
                                            id={`soal-${kategoriSoal}-${index}`}
                                            key={soalItem.id ?? index}
                                            className={`scroll-mt-24 relative overflow-hidden rounded-depth-lg border bg-depth-card shadow-depth-md transition duration-200 ${
                                                isEditing
                                                    ? "border-[var(--depth-color-primary)] ring-1 ring-[var(--depth-color-primary)]"
                                                    : "border-depth hover:shadow-depth-lg"
                                            }`}
                                        >
                                            {/* Header */}
                                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-depth bg-depth-interactive px-5 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold text-depth-secondary">
                                                        Soal{" "}
                                                        {index +
                                                            1}
                                                    </span>

                                                    {isEditing && (
                                                        <span className="rounded-depth-full bg-[var(--depth-color-primary)]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--depth-color-primary)]">
                                                            Editing
                                                        </span>
                                                    )}
                                                </div>


                                                {!isEditing && (
                                                    <div className="flex gap-2">
                                                        {isEditable && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setDeleteCandidate(
                                                                        soalItem
                                                                    )
                                                                }
                                                                className="flex h-9 w-9 items-center justify-center rounded-depth-md border border-depth bg-depth-interactive text-red-500 shadow-depth-sm transition hover:border-red-400 hover:shadow-depth-md"
                                                                title="Hapus soal"
                                                            >
                                                                <img
                                                                    className="h-4 w-4"
                                                                    src={
                                                                        trashIcon
                                                                    }
                                                                    alt=""
                                                                />
                                                            </button>
                                                        )}


                                                        <SoalCommentsButton
                                                            kategoriSoal={
                                                                kategoriSoal
                                                            }
                                                            modulId={
                                                                soalItem?.modul_id ??
                                                                (modul
                                                                    ? Number(
                                                                          modul
                                                                      )
                                                                    : null)
                                                            }
                                                            soalId={
                                                                soalItem?.id
                                                            }
                                                            variant="icon"
                                                        />


                                                        {isEditable && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleStartEdit(
                                                                        soalItem
                                                                    )
                                                                }
                                                                className="flex h-9 w-9 items-center justify-center rounded-depth-md border border-depth bg-depth-interactive shadow-depth-sm transition hover:border-blue-400 hover:shadow-depth-md"
                                                                title="Edit soal"
                                                            >
                                                                <img
                                                                    className="edit-icon-filter h-4 w-4"
                                                                    src={
                                                                        editIcon
                                                                    }
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
                                                        {/* Module */}
                                                        <div className="max-w-sm">
                                                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-depth-secondary">
                                                                Modul
                                                            </label>

                                                            <select
                                                                value={
                                                                    editingSoal.modul_id ??
                                                                    ""
                                                                }
                                                                onChange={(
                                                                    event
                                                                ) =>
                                                                    setEditingSoal(
                                                                        (
                                                                            previous
                                                                        ) => ({
                                                                            ...previous,

                                                                            modul_id:
                                                                                event
                                                                                    .target
                                                                                    .value,
                                                                        })
                                                                    )
                                                                }
                                                                disabled={
                                                                    putSoalMutation.isPending
                                                                }
                                                                className="w-full rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm text-depth-primary shadow-depth-sm focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)]"
                                                            >
                                                                {modules.map(
                                                                    (
                                                                        moduleItem
                                                                    ) => {
                                                                        const moduleId =
                                                                            getModuleId(
                                                                                moduleItem
                                                                            );

                                                                        if (
                                                                            !moduleId
                                                                        ) {
                                                                            return null;
                                                                        }

                                                                        return (
                                                                            <option
                                                                                key={
                                                                                    moduleId
                                                                                }
                                                                                value={
                                                                                    moduleId
                                                                                }
                                                                            >
                                                                                {moduleItem?.judul ??
                                                                                    moduleItem?.nama ??
                                                                                    `Modul ${moduleId}`}
                                                                            </option>
                                                                        );
                                                                    }
                                                                )}
                                                            </select>
                                                        </div>


                                                        <SoalPGEditor
                                                            pertanyaan={
                                                                editingSoal.pertanyaan
                                                            }
                                                            options={
                                                                editingSoal.options
                                                            }
                                                            correctIndex={
                                                                editingSoal.correctIndex
                                                            }
                                                            onQuestionChange={
                                                                updateEditingQuestion
                                                            }
                                                            onOptionChange={
                                                                updateEditingOption
                                                            }
                                                            onCorrectChange={(
                                                                optionIndex
                                                            ) =>
                                                                setEditingSoal(
                                                                    (
                                                                        previous
                                                                    ) => ({
                                                                        ...previous,

                                                                        correctIndex:
                                                                            optionIndex,
                                                                    })
                                                                )
                                                            }
                                                            onSave={
                                                                handleConfirmEdit
                                                            }
                                                            onCancel={
                                                                handleCancelEdit
                                                            }
                                                            saveLabel="Simpan Perubahan"
                                                            isSaving={
                                                                putSoalMutation.isPending
                                                            }
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="space-y-5">
                                                        {/* Question */}
                                                        <div className="space-y-2">
                                                            <span className="text-xs font-semibold uppercase tracking-wide text-depth-secondary">
                                                                Pertanyaan
                                                            </span>

                                                            <div className="min-w-0 max-h-[60vh] overflow-y-auto break-words rounded-depth-md bg-depth-interactive p-4 text-sm text-depth-primary shadow-depth-inset">
                                                                <MarkdownRenderer
                                                                    content={
                                                                        soalItem.pertanyaan
                                                                    }
                                                                />
                                                            </div>
                                                        </div>


                                                        {/* Options */}
                                                        <div className="space-y-2">
                                                            <span className="text-xs font-semibold uppercase tracking-wide text-depth-secondary">
                                                                Pilihan Jawaban
                                                            </span>

                                                            <ul className="space-y-2">
                                                                {normalizeOptionsForDisplay(
                                                                    soalItem
                                                                ).map(
                                                                    (
                                                                        option,
                                                                        optionIndex
                                                                    ) => {
                                                                        const isCorrect =
                                                                            isOptionCorrect(
                                                                                soalItem,
                                                                                option,
                                                                                optionIndex
                                                                            );

                                                                        return (
                                                                            <li
                                                                                key={
                                                                                    option.id ??
                                                                                    optionIndex
                                                                                }
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
                                                                                        OPTION_LABELS[
                                                                                            optionIndex
                                                                                        ]
                                                                                    }
                                                                                </span>

                                                                                <div className="min-w-0 flex-1">
                                                                                    {option.text ? (
                                                                                        <MarkdownRenderer
                                                                                            content={
                                                                                                option.text
                                                                                            }
                                                                                        />
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
                                                                    }
                                                                )}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </li>
                                    );
                                }
                            )}
                        </ul>
                    )}
            </div>


            {/* ====================================================
             * ANALYZE
             * ==================================================== */}

            {isAnalyzeModalOpen && (
                <ModalAnalyzeSoalPG
                    kategoriSoal={
                        kategoriSoal
                    }
                    modules={
                        modules
                    }
                    initialModuleId={
                        analyzeModuleId
                    }
                    onClose={() =>
                        setIsAnalyzeModalOpen(
                            false
                        )
                    }
                />
            )}


            {/* ====================================================
             * BATCH EDIT ID / EN
             * ==================================================== */}

            {isBatchModalOpen && (
                <ModalBatchEditSoalPG
                    regularModules={
                        regularModules
                    }
                    englishModules={
                        englishModules
                    }
                    selectedRegularModuleId={
                        batchState.regularModuleId
                    }
                    selectedEnglishModuleId={
                        batchState.englishModuleId
                    }
                    onSelectRegularModule={(
                        value
                    ) =>
                        setBatchState(
                            (
                                previous
                            ) => ({
                                ...previous,

                                regularModuleId:
                                    value,
                            })
                        )
                    }
                    onSelectEnglishModule={(
                        value
                    ) =>
                        setBatchState(
                            (
                                previous
                            ) => ({
                                ...previous,

                                englishModuleId:
                                    value,
                            })
                        )
                    }
                    regularDataset={
                        batchComparisonData?.regular ??
                        null
                    }
                    englishDataset={
                        batchComparisonData?.english ??
                        null
                    }
                    isLoading={
                        isBatchComparisonLoading
                    }
                    isFetching={
                        isBatchComparisonFetching
                    }
                    isSaving={
                        batchUpdateMutation.isPending
                    }
                    onClose={() => {
                        if (
                            !batchUpdateMutation.isPending
                        ) {
                            setIsBatchModalOpen(
                                false
                            );
                        }
                    }}
                    onSubmit={
                        handleBatchSubmit
                    }
                />
            )}


            {/* ====================================================
             * DELETE CONFIRMATION
             * ==================================================== */}

            {deleteCandidate && (
                <ModalOverlay
                    onClose={
                        handleCancelDelete
                    }
                    className="depth-modal-overlay z-[70]"
                >
                    <div className="depth-modal-container max-w-sm space-y-4 text-center">
                        <div className="depth-modal-header justify-center">
                            <h3 className="depth-modal-title text-center">
                                Hapus Soal
                            </h3>

                            <ModalCloseButton
                                onClick={
                                    handleCancelDelete
                                }
                                ariaLabel="Tutup konfirmasi hapus soal"
                            />
                        </div>

                        <p className="text-sm text-depth-secondary">
                            Apakah Anda yakin ingin menghapus soal{" "}
                            <span className="font-semibold text-depth-primary">
                                {deleteCandidate?.pertanyaan?.slice(
                                    0,
                                    40
                                ) ??
                                    "ini"}
                            </span>
                            ?
                        </p>

                        <div className="flex justify-center gap-3">
                            <button
                                type="button"
                                onClick={
                                    handleCancelDelete
                                }
                                disabled={
                                    deleteSoalMutation.isPending
                                }
                                className="rounded-depth-md border border-depth bg-depth-interactive px-5 py-2 text-sm font-semibold text-depth-primary shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md disabled:opacity-60"
                            >
                                Batal
                            </button>

                            <button
                                type="button"
                                onClick={
                                    handleConfirmDelete
                                }
                                disabled={
                                    deleteSoalMutation.isPending
                                }
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
