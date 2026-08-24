import { useEffect, useState } from "react";
import { Image } from "@imagekit/react";

import QuestionCommentInput from "./QuestionCommentInput";
import MarkdownRenderer from "../../MarkdownRenderer";
import { useImageKitUpload } from "@/hooks/useImageKitUpload";

import QuestionNavigator from "@/Components/Praktikans/Common/QuestionNavigator";
import useQuestionNavigation from "@/hooks/praktikum/useQuestionNavigation";

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
    const [uploadingIndexes, setUploadingIndexes] = useState({});
    const [previews, setPreviews] = useState({});
    const { upload } = useImageKitUpload();
    const { panelRef, active, setActive, goTo } = useQuestionNavigation(questions);

    useEffect(() => {
        setQuestionsCount?.(Array.isArray(questions) ? questions.length : 0);
    }, [questions, setQuestionsCount]);

    const handleInputChange = (index, value) => {
        setActive(index);
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

    const triggerFileInput = (index) => {
        setActive(index);
        document.getElementById(`tp-file-upload-${index}`)?.click();
    };

    const handleFileUpload = async (index, file) => {
        if (!file) return;
        if (file.size > 10485760) {
            alert("File size must be less than 10MB");
            return;
        }
        if (!file.type.startsWith("image/")) {
            alert("Please upload an image file");
            return;
        }

        setActive(index);
        setUploadingIndexes((prev) => ({ ...prev, [index]: true }));

        const oldPreview = previews[index];
        if (oldPreview) URL.revokeObjectURL(oldPreview);

        const previewUrl = URL.createObjectURL(file);
        setPreviews((prev) => ({ ...prev, [index]: previewUrl }));

        try {
            const result = await upload(file, "daskom/jawaban-tp", null, true);
            const updated = [...answers];
            updated[index] = {
                type: "file",
                url: result.url,
                fileId: result.fileId,
                filePath: result.filePath,
            };
            setAnswers(updated);
        } catch (error) {
            console.error("TP upload error:", error);
            alert("Failed to upload file. Please try again.");
            URL.revokeObjectURL(previewUrl);
            setPreviews((prev) => {
                const next = { ...prev };
                delete next[index];
                return next;
            });
        } finally {
            setUploadingIndexes((prev) => {
                const next = { ...prev };
                delete next[index];
                return next;
            });
        }
    };

    const handleDeleteFile = (index) => {
        setActive(index);
        const updated = [...answers];
        updated[index] = "";
        setAnswers(updated);
        setPreviews((prev) => {
            const next = { ...prev };
            if (next[index]) {
                URL.revokeObjectURL(next[index]);
                delete next[index];
            }
            return next;
        });
    };

    const handleSubmit = () => onSubmitTask?.("TugasPendahuluan", answers);

    if (isLoading) return (
        <div className="mx-auto mt-[1vh] max-w-4xl p-5 text-center">
            <p className="text-depth-secondary">Memuat soal tugas pendahuluan...</p>
        </div>
    );

    if (errorMessage) return (
        <div className="mx-auto mt-[1vh] max-w-4xl p-5 text-center">
            <p className="font-semibold text-red-400">{errorMessage}</p>
        </div>
    );

    if (!Array.isArray(questions) || !questions.length) return (
        <div className="mx-auto mt-[1vh] max-w-4xl p-5 text-center">
            <p className="text-depth-secondary">Belum ada soal tugas pendahuluan untuk modul ini.</p>
        </div>
    );

    return (
        <>
            <div className="mx-auto mt-2 flex max-h-[70vh] w-full flex-col gap-4 overflow-hidden rounded-depth-lg border border-depth bg-depth-card/70 p-4 shadow-depth-lg">
                <div ref={panelRef} className="min-h-0 flex-1 space-y-6 overflow-y-auto rounded-depth-lg bg-depth-interactive/40 p-3.5" style={{ overflowAnchor: "none" }}>
                    <QuestionNavigator questions={questions} answers={answers} active={active} onChange={goTo} />

                    {questions.map((question, index) => {
                        const isFileUploadEnabled = Boolean(question.enable_file_upload);
                        const currentAnswer = answers[index];
                        const isFileAnswer = typeof currentAnswer === "object" && currentAnswer?.type === "file";
                        const preview = previews[index];

                        return (
                            <div
                                key={question.key ?? `tp:${question.id ?? index}`}
                                data-question-index={index}
                                onClick={() => setActive(index)}
                                onFocusCapture={() => setActive(index)}
                                className="space-y-3 rounded-depth-lg border border-depth bg-depth-card/60 p-4 shadow-depth-sm"
                            >
                                <div className="flex items-start gap-2.5">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--depth-color-primary)] text-xs font-semibold text-white shadow-depth-sm">{index + 1}</span>
                                    <div className="min-w-0 flex-1 break-words text-sm font-semibold text-depth-primary">
                                        <MarkdownRenderer content={question.text} />
                                    </div>
                                </div>

                                <QuestionCommentInput
                                    questionId={question.id ?? question.soalId ?? question.soal_id ?? null}
                                    tipeSoal={tipeSoal}
                                    praktikanId={praktikanId}
                                    isEnabled={isCommentEnabled}
                                    className="pl-9"
                                />

                                {isFileUploadEnabled ? (
                                    <div className="space-y-3">
                                        {!isFileAnswer && !preview ? (
                                            <div>
                                                <label
                                                    htmlFor={`tp-file-upload-${index}`}
                                                    className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-depth-md border-2 border-dashed border-depth bg-depth-interactive transition hover:bg-depth-hover"
                                                >
                                                    <div className="flex flex-col items-center justify-center pb-6 pt-5">
                                                        <svg className="mb-3 h-10 w-10 text-depth-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                        </svg>
                                                        <p className="mb-2 text-sm text-depth-secondary"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                                        <p className="text-xs text-depth-secondary">PNG, JPG, GIF up to 10MB</p>
                                                    </div>
                                                </label>
                                                <div className="mt-3 text-right">
                                                    <button type="button" onClick={() => triggerFileInput(index)} className="inline-flex items-center rounded-depth-md bg-[var(--depth-color-primary)] px-4 py-1.5 text-xs font-semibold text-white shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md">Pilih File</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="relative rounded-depth-md border border-depth bg-depth-interactive p-3">
                                                {uploadingIndexes[index] ? (
                                                    <div className="flex flex-col items-center justify-center py-8">
                                                        <div className="mb-3 h-16 w-16 animate-spin rounded-full border-4 border-[var(--depth-color-primary)] border-t-transparent" />
                                                        <p className="text-sm text-depth-secondary">Uploading...</p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {isFileAnswer && currentAnswer?.url ? (
                                                            <Image
                                                                src={currentAnswer.url}
                                                                alt="Uploaded TP answer"
                                                                transformation={[{ width: "800", quality: "80" }]}
                                                                className="h-auto w-full rounded-depth-md shadow-depth-sm"
                                                                loading="lazy"
                                                            />
                                                        ) : preview ? (
                                                            <img src={preview} alt="TP answer preview" className="h-auto w-full rounded-depth-md shadow-depth-sm" />
                                                        ) : null}

                                                        <button type="button" onClick={() => handleDeleteFile(index)} className="absolute right-5 top-5 rounded-depth-full bg-red-500 p-2 text-white shadow-depth-md transition-all hover:bg-red-600" title="Delete image">
                                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>

                                                        <div className="mt-3 text-right">
                                                            <button type="button" onClick={() => triggerFileInput(index)} className="inline-flex items-center rounded-depth-md bg-[var(--depth-color-primary)] px-4 py-1.5 text-xs font-semibold text-white shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md">Ganti File</button>
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
                                            disabled={uploadingIndexes[index]}
                                            onChange={(event) => {
                                                const file = event.target.files?.[0];
                                                event.target.value = "";
                                                if (file) void handleFileUpload(index, file);
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <textarea
                                        className="min-h-[15vh] w-full resize-y rounded-depth-md border border-depth bg-depth-interactive p-3 text-sm text-depth-primary placeholder:text-depth-secondary shadow-depth-inset transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)]"
                                        placeholder="Tulis jawabanmu di sini..."
                                        value={typeof currentAnswer === "string" ? currentAnswer : ""}
                                        onChange={(event) => handleInputChange(index, event.target.value)}
                                        onFocus={() => setActive(index)}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {showSubmitButton && (
                <div className="mt-3 flex justify-end">
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={Object.keys(uploadingIndexes).length > 0}
                        className="inline-flex items-center justify-center rounded-depth-md bg-[var(--depth-color-primary)] px-5 py-2 text-sm font-semibold text-white shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {Object.keys(uploadingIndexes).length ? "Mengunggah..." : submitLabel}
                    </button>
                </div>
            )}
        </>
    );
}
