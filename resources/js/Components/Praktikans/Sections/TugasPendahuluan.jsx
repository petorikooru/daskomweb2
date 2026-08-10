import { useEffect, useState } from "react";
import { Image } from "@imagekit/react";

import QuestionCommentInput from "./QuestionCommentInput";
import MarkdownRenderer from "../../MarkdownRenderer";
import { useImageKitUpload } from "@/hooks/useImageKitUpload";

export default function TugasPendahuluan({
    isLoading = false,
    errorMessage = null,
    questions = [],
    answers = [],
    setAnswers,
    setQuestionsCount,
    onSubmitTask,
    tipeSoal = null,
    praktikanId = null,
    isCommentEnabled = false,
    showSubmitButton = false,
    submitLabel = "Simpan Jawaban",
}) {
    const [uploadingIndexes, setUploadingIndexes] =
        useState({});

    const [uploadProgress, setUploadProgress] =
        useState({});

    const [previews, setPreviews] =
        useState({});

    const { upload } = useImageKitUpload();

    useEffect(() => {
        setQuestionsCount(
            Array.isArray(questions)
                ? questions.length
                : 0
        );
    }, [questions, setQuestionsCount]);

    const handleInputChange = (index, value) => {
        const updated = [...answers];

        updated[index] = value;

        setAnswers(updated);
    };

    const triggerFileInput = (index) => {
        const input = document.getElementById(
            `tp-file-upload-${index}`
        );

        if (input) {
            input.click();
        }
    };

    const handleFileUpload = async (index, file) => {
        if (!file) {
            return;
        }

        // Same 10MB limit as Journal/FITB
        if (file.size > 10485760) {
            alert("File size must be less than 10MB");
            return;
        }

        // Images only
        if (!file.type.startsWith("image/")) {
            alert("Please upload an image file");
            return;
        }

        setUploadingIndexes((previous) => ({
            ...previous,
            [index]: true,
        }));

        setUploadProgress((previous) => ({
            ...previous,
            [index]: 0,
        }));

        try {
            /*
             * Local preview while upload is happening.
             */
            const previewUrl =
                URL.createObjectURL(file);

            setPreviews((previous) => ({
                ...previous,
                [index]: previewUrl,
            }));

            /*
             * Same ImageKit hook used by Journal/FITB.
             *
             * Only change is the folder:
             * daskom/jawaban-tp
             */
            const uploadResult = await upload(
                file,
                "daskom/jawaban-tp",
                null,
                true
            );

            /*
             * Use the exact same answer format
             * as Journal/FITB.
             */
            const updated = [...answers];

            updated[index] = {
                type: "file",
                url: uploadResult.url,
                fileId: uploadResult.fileId,
                filePath: uploadResult.filePath,
            };

            setAnswers(updated);
        } catch (error) {
            console.error(
                "TP upload error:",
                error
            );

            alert(
                "Failed to upload file. Please try again."
            );

            setPreviews((previous) => {
                const next = {
                    ...previous,
                };

                if (next[index]) {
                    URL.revokeObjectURL(
                        next[index]
                    );

                    delete next[index];
                }

                return next;
            });
        } finally {
            setUploadingIndexes((previous) => {
                const next = {
                    ...previous,
                };

                delete next[index];

                return next;
            });

            setUploadProgress((previous) => {
                const next = {
                    ...previous,
                };

                delete next[index];

                return next;
            });
        }
    };

    const handleDeleteFile = (index) => {
        const updated = [...answers];

        updated[index] = "";

        setAnswers(updated);

        setPreviews((previous) => {
            const next = {
                ...previous,
            };

            if (next[index]) {
                URL.revokeObjectURL(
                    next[index]
                );

                delete next[index];
            }

            return next;
        });
    };

    const handleSubmit = () => {
        if (onSubmitTask) {
            onSubmitTask(
                "TugasPendahuluan",
                answers
            );
        }
    };

    if (isLoading) {
        return (
            <div className="mt-[1vh] p-5 max-w-4xl mx-auto text-center">
                <p className="text-gray-600">
                    Memuat soal tugas pendahuluan...
                </p>
            </div>
        );
    }

    if (errorMessage) {
        return (
            <div className="mt-[1vh] p-5 max-w-4xl mx-auto text-center">
                <p className="text-red-600 font-semibold">
                    {errorMessage}
                </p>
            </div>
        );
    }

    if (
        !Array.isArray(questions) ||
        questions.length === 0
    ) {
        return (
            <div className="mt-[1vh] p-5 max-w-4xl mx-auto text-center">
                <p className="text-gray-600">
                    Belum ada soal tugas pendahuluan
                    untuk modul ini.
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="mx-auto mt-2 w-full flex flex-col gap-4 rounded-depth-lg border border-depth bg-depth-card/70 p-4 shadow-depth-lg max-h-[70vh] overflow-hidden">
                <div className="space-y-6 overflow-y-auto min-h-0 flex-1 bg-depth-interactive/40 p-3.5 bg-depth-card rounded-depth-lg">
                    {questions.map(
                        (question, index) => {
                            const isFileUploadEnabled =
                                question.enable_file_upload ||
                                false;

                            const currentAnswer =
                                answers[index];

                            const isFileAnswer =
                                typeof currentAnswer ===
                                    "object" &&
                                currentAnswer?.type ===
                                    "file";

                            return (
                                <div
                                    key={
                                        question.id ??
                                        index
                                    }
                                    className="space-y-3"
                                >
                                    <div className="flex items-start gap-2.5">
                                        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--depth-color-primary)] text-xs font-semibold text-white shadow-depth-sm">
                                            {index + 1}
                                        </span>

                                        <div className="flex-1 text-sm font-semibold text-depth-primary break-words">
                                            <MarkdownRenderer
                                                content={
                                                    question.text
                                                }
                                            />
                                        </div>
                                    </div>

                                    <QuestionCommentInput
                                        questionId={
                                            question.id ??
                                            question.soalId ??
                                            question.soal_id ??
                                            null
                                        }
                                        tipeSoal={
                                            tipeSoal
                                        }
                                        praktikanId={
                                            praktikanId
                                        }
                                        isEnabled={
                                            isCommentEnabled
                                        }
                                        className="pl-11"
                                    />

                                    {isFileUploadEnabled ? (
                                        <div className="space-y-3">
                                            {!isFileAnswer &&
                                            !previews[
                                                index
                                            ] ? (
                                                <div>
                                                    <label
                                                        htmlFor={`tp-file-upload-${index}`}
                                                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-depth rounded-depth-md cursor-pointer bg-depth-card hover:bg-depth-hover transition-all"
                                                    >
                                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                            <svg
                                                                className="w-10 h-10 mb-3 text-depth-secondary"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                                                />
                                                            </svg>

                                                            <p className="mb-2 text-sm text-depth-secondary">
                                                                <span className="font-semibold">
                                                                    Click
                                                                    to
                                                                    upload
                                                                </span>{" "}
                                                                or
                                                                drag
                                                                and
                                                                drop
                                                            </p>

                                                            <p className="text-xs text-depth-secondary">
                                                                PNG,
                                                                JPG,
                                                                GIF
                                                                up
                                                                to
                                                                10MB
                                                            </p>
                                                        </div>
                                                    </label>

                                                    <div className="mt-3 text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                triggerFileInput(
                                                                    index
                                                                )
                                                            }
                                                            className="inline-flex items-center rounded-depth-md bg-[var(--depth-color-primary)] px-4 py-1.5 text-xs font-semibold text-white shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
                                                        >
                                                            Pilih
                                                            File
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="relative rounded-depth-md border border-depth bg-depth-card p-3">
                                                    {uploadingIndexes[
                                                        index
                                                    ] ? (
                                                        <div className="flex flex-col items-center justify-center py-8">
                                                            <div className="w-16 h-16 border-4 border-[var(--depth-color-primary)] border-t-transparent rounded-full animate-spin mb-3" />

                                                            <p className="text-sm text-depth-secondary">
                                                                Uploading...
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {isFileAnswer &&
                                                            currentAnswer?.url ? (
                                                                <Image
                                                                    src={
                                                                        currentAnswer.url
                                                                    }
                                                                    alt="Uploaded TP answer"
                                                                    transformation={[
                                                                        {
                                                                            width: "800",
                                                                            quality:
                                                                                "80",
                                                                        },
                                                                    ]}
                                                                    className="w-full h-auto rounded-depth-md shadow-depth-sm"
                                                                    loading="lazy"
                                                                />
                                                            ) : previews[
                                                                  index
                                                              ] ? (
                                                                <img
                                                                    src={
                                                                        previews[
                                                                            index
                                                                        ]
                                                                    }
                                                                    alt="TP answer preview"
                                                                    className="w-full h-auto rounded-depth-md shadow-depth-sm"
                                                                />
                                                            ) : null}

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleDeleteFile(
                                                                        index
                                                                    )
                                                                }
                                                                className="absolute top-5 right-5 p-2 rounded-depth-full bg-red-500 text-white hover:bg-red-600 shadow-depth-md transition-all"
                                                                title="Delete image"
                                                            >
                                                                <svg
                                                                    className="w-5 h-5"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={
                                                                            2
                                                                        }
                                                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                                    />
                                                                </svg>
                                                            </button>

                                                            <div className="mt-3 text-right">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        triggerFileInput(
                                                                            index
                                                                        )
                                                                    }
                                                                    className="inline-flex items-center rounded-depth-md bg-[var(--depth-color-primary)] px-4 py-1.5 text-xs font-semibold text-white shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
                                                                >
                                                                    Ganti
                                                                    File
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            )}

                                            <input
                                                id={`tp-file-upload-${index}`}
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(
                                                    event
                                                ) => {
                                                    const file =
                                                        event
                                                            .target
                                                            .files?.[0];

                                                    if (
                                                        file
                                                    ) {
                                                        handleFileUpload(
                                                            index,
                                                            file
                                                        );
                                                    }

                                                    event.target.value =
                                                        "";
                                                }}
                                                disabled={
                                                    uploadingIndexes[
                                                        index
                                                    ]
                                                }
                                            />
                                        </div>
                                    ) : (
                                        <textarea
                                            className="min-h-[15vh] w-full dark:text-gray-700 rounded-depth-md border border-depth bg-depth-card/80 p-2.5 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)]"
                                            placeholder="Tulis jawabanmu di sini..."
                                            value={
                                                typeof currentAnswer ===
                                                "string"
                                                    ? currentAnswer
                                                    : ""
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                handleInputChange(
                                                    index,
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                        />
                                    )}
                                </div>
                            );
                        }
                    )}
                </div>
            </div>

            {showSubmitButton && (
                <div className="mt-3 flex justify-end">
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={
                            Object.keys(
                                uploadingIndexes
                            ).length > 0
                        }
                        className="inline-flex items-center justify-center rounded-depth-md bg-[var(--depth-color-primary)] px-5 py-2 text-sm font-semibold text-white shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {Object.keys(
                            uploadingIndexes
                        ).length > 0
                            ? "Mengunggah..."
                            : submitLabel}
                    </button>
                </div>
            )}
        </>
    );
}
