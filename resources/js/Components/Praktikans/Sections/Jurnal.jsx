import { useEffect, useState } from "react";
import { Image } from "@imagekit/react";
import MarkdownRenderer from "../../MarkdownRenderer";
import QuestionCommentInput from "./QuestionCommentInput";
import QuestionNavigator from "@/Components/Praktikans/Common/QuestionNavigator";
import useQuestionNavigation from "@/hooks/praktikum/useQuestionNavigation";
import { useImageKitUpload } from "@/hooks/useImageKitUpload";

export default function Jurnal({
    isLoading = false,
    errorMessage = null,
    questions = [],
    answers = [],
    setAnswers,
    tipeSoal = "jurnal",
    praktikanId = null,
    isCommentEnabled = false
}) {
    const [uploading, setUploading] = useState({});
    const [previews, setPreviews] = useState({});
    const { upload } = useImageKitUpload();
    const { panelRef, active, setActive, goTo } = useQuestionNavigation(questions);

    useEffect(() => () => {
        Object.values(previews).forEach((url) => url && URL.revokeObjectURL(url));
    }, [previews]);

    const update = (index, value) => {
        setActive(index);
        setAnswers((prev) => {
            const next = [...prev];
            next[index] = value;
            return next;
        });
    };

    const pick = (index) => document.getElementById(`jurnal-file-${index}`)?.click();

    const uploadFile = async (index, file) => {
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) return alert("File size must be less than 10MB");
        if (!file.type.startsWith("image/")) return alert("Please upload an image file");

        setActive(index);
        setUploading((x) => ({ ...x, [index]: true }));

        const old = previews[index];
        if (old) URL.revokeObjectURL(old);

        const preview = URL.createObjectURL(file);
        setPreviews((x) => ({ ...x, [index]: preview }));

        try {
            const result = await upload(file, "daskom/jawaban-jurnal", null, true);
            update(index, { type: "file", url: result.url, fileId: result.fileId, filePath: result.filePath });
        } catch (error) {
            console.error("[Jurnal Upload]", error);
            URL.revokeObjectURL(preview);
            setPreviews((x) => {
                const next = { ...x };
                delete next[index];
                return next;
            });
            alert("Failed to upload file. Please try again.");
        } finally {
            setUploading((x) => {
                const next = { ...x };
                delete next[index];
                return next;
            });
        }
    };

    const removeFile = (index) => {
        const preview = previews[index];
        if (preview) URL.revokeObjectURL(preview);
        setPreviews((x) => {
            const next = { ...x };
            delete next[index];
            return next;
        });
        update(index, "");
    };

    if (isLoading) return <State>Memuat soal Jurnal...</State>;
    if (errorMessage) return <State error>{errorMessage}</State>;
    if (!questions.length) return <State>Belum ada soal Jurnal untuk modul ini.</State>;

    return (
        <div className="w-full p-5 py-0">
            <div className="mb-4 flex justify-center rounded-depth-lg bg-[var(--depth-color-primary)] px-3 py-2 shadow-depth-lg"><h1 className="text-lg font-bold text-white">Jurnal</h1></div>
            <div ref={panelRef} className="max-h-[80vh] overflow-y-auto overflow-x-hidden rounded-depth-lg border border-depth bg-depth-card p-4 shadow-depth-lg" style={{ overflowAnchor: "none" }}>
                <QuestionNavigator questions={questions} answers={answers} active={active} onChange={goTo} />
                <div className="space-y-4">
                    {questions.map((q, index) => {
                        const fileEnabled = Boolean(q.enable_file_upload);
                        const answer = answers[index];
                        const fileAnswer = typeof answer === "object" && answer?.type === "file";
                        const preview = previews[index];
                        const image = fileAnswer ? answer.url : preview;
                        const isFitb = q.questionType === "fitb";

                        return (
                            <div key={q.key ?? `${q.questionType}:${q.id ?? index}`} data-question-index={index} onClick={() => setActive(index)} onFocusCapture={() => setActive(index)} className="rounded-depth-lg border border-depth bg-depth-interactive p-4 shadow-depth-md">
                                <div className="mb-3 flex items-center gap-2">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-depth-full bg-[var(--depth-color-primary)] text-xs font-bold text-white">{index + 1}</span>
                                    <span className="rounded-depth-md border border-depth bg-depth-card px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-depth-secondary">{isFitb ? "FITB" : "Jurnal"}</span>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="min-w-0">
                                        <div className="text-sm font-medium leading-relaxed text-depth-primary"><MarkdownRenderer content={q.text} /></div>
                                        <QuestionCommentInput questionId={q.id ?? q.soalId ?? q.soal_id ?? null} tipeSoal={isFitb ? "fitb" : tipeSoal} praktikanId={praktikanId} isEnabled={isCommentEnabled} className="mt-2" />
                                    </div>
                                    {fileEnabled ? (
                                        <div className="min-w-0">
                                            {image ? (
                                                <div className="relative rounded-depth-md border border-depth bg-depth-card p-3">
                                                    {uploading[index] ? <div className="flex min-h-40 items-center justify-center text-sm font-semibold text-depth-secondary">Uploading...</div> : fileAnswer && answer.url ? <Image src={answer.url} alt={`Jawaban soal ${index + 1}`} transformation={[{ width: "800", quality: "80" }]} className="max-h-96 w-full rounded-depth-md object-contain" loading="lazy" /> : <img src={preview} alt={`Preview soal ${index + 1}`} className="max-h-96 w-full rounded-depth-md object-contain" />}
                                                    {!uploading[index] && <div className="mt-3 flex justify-end gap-2"><button type="button" onClick={(e) => { e.stopPropagation(); pick(index); }} className="rounded-depth-md border border-depth bg-depth-interactive px-3 py-1.5 text-xs font-semibold text-depth-primary">Ganti File</button><button type="button" onClick={(e) => { e.stopPropagation(); removeFile(index); }} className="rounded-depth-md bg-red-500 px-3 py-1.5 text-xs font-semibold text-white">Hapus</button></div>}
                                                </div>
                                            ) : (
                                                <button type="button" onClick={(e) => { e.stopPropagation(); pick(index); }} className="flex min-h-40 w-full flex-col items-center justify-center rounded-depth-md border-2 border-dashed border-depth bg-depth-card p-5 text-center text-sm text-depth-secondary transition hover:bg-depth-interactive">
                                                    <svg className="mb-2 h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                                    <span className="font-semibold">Pilih gambar</span>
                                                    <span className="mt-1 text-xs">PNG, JPG, GIF • max 10MB</span>
                                                </button>
                                            )}
                                            <input id={`jurnal-file-${index}`} type="file" accept="image/*" className="hidden" disabled={uploading[index]} onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                e.target.value = "";
                                                if (file) uploadFile(index, file);
                                            }} />
                                        </div>
                                    ) : (
                                        <textarea value={answers[index] ?? ""} onChange={(e) => update(index, e.target.value)} onFocus={() => setActive(index)} placeholder="Masukkan jawaban di sini..." className="min-h-40 w-full resize-y rounded-depth-md border border-depth bg-depth-card p-3 text-sm text-depth-primary shadow-depth-inset focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)]" />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function State({ children, error = false }) {
    return <div className={`mx-auto mt-[20vh] p-5 text-center text-sm font-semibold ${error ? "text-red-400" : "text-depth-secondary"}`}>{children}</div>;
}
