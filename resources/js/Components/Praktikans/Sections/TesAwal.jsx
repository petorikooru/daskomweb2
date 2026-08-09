import { useEffect } from "react";
import MarkdownRenderer from "../../MarkdownRenderer";

import QuestionCommentInput from "./QuestionCommentInput";
import QuestionNavigator from "@/Components/Praktikans/Common/QuestionNavigator";
import useQuestionNavigation from "@/hooks/praktikum/useQuestionNavigation";

export default function TesAwal({ isLoading = false, errorMessage = null, questions = [], answers = [], setAnswers, tipeSoal = "ta", praktikanId = null, isCommentEnabled = false }) {
    const { panelRef, active, setActive, goTo } = useQuestionNavigation(questions);

    const select = (index, optionId) => {
        setActive(index);
        setAnswers((prev) => {
            const next = [...prev];
            next[index] = optionId;
            return next;
        });
    };

    if (isLoading) return <State>Memuat soal Tes Awal...</State>;
    if (errorMessage) return <State error>{errorMessage}</State>;
    if (!questions.length) return <State>Belum ada soal Tes Awal untuk modul ini.</State>;

    return (
        <div className="w-full p-5 py-0">
            <Header title="Tes Awal" />
            <div ref={panelRef} className="max-h-[80vh] overflow-y-auto overflow-x-hidden rounded-depth-lg border border-depth bg-depth-card p-4 shadow-depth-lg" style={{ overflowAnchor: "none" }}>
                <QuestionNavigator questions={questions} answers={answers} active={active} onChange={goTo} />
                <div className="space-y-4">
                    {questions.map((q, index) => (
                        <div key={q.id ?? index} data-question-index={index} onClick={() => setActive(index)} onFocusCapture={() => setActive(index)} className="rounded-depth-lg border border-depth bg-depth-interactive p-4 shadow-depth-md">
                            <div className="mb-4 flex items-start gap-3">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-depth-full bg-[var(--depth-color-primary)] text-xs font-bold text-white">{index + 1}</span>
                                <div className="min-w-0 flex-1">
                                    <div className="text-sm font-medium leading-relaxed text-depth-primary"><MarkdownRenderer content={q.text} /></div>
                                    <QuestionCommentInput questionId={q.id ?? q.soalId ?? q.soal_id ?? null} tipeSoal={tipeSoal} praktikanId={praktikanId} isEnabled={isCommentEnabled} className="mt-2" />
                                </div>
                            </div>
                            <div role="radiogroup" className="grid gap-2 sm:grid-cols-2">
                                {(q.options ?? []).map((option) => {
                                    const selected = String(answers[index] ?? "") === String(option.id);
                                    return (
                                        <div key={option.id} role="radio" tabIndex={0} aria-checked={selected} onMouseDown={(e) => e.preventDefault()} onClick={() => select(index, option.id)} onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                select(index, option.id);
                                            }
                                        }} className={`cursor-pointer rounded-depth-md border p-3 text-sm transition ${selected ? "border-[var(--depth-color-primary)] bg-[var(--depth-color-primary)] text-white shadow-depth-md" : "border-depth bg-depth-card text-depth-primary hover:bg-depth-interactive"}`}>
                                            <div className="flex items-start gap-2">
                                                <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${selected ? "border-white" : "border-depth"}`}>{selected && <span className="h-2 w-2 rounded-full bg-white" />}</span>
                                                <div className="min-w-0 flex-1"><MarkdownRenderer content={option.text} /></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function Header({ title }) {
    return <div className="mb-4 flex justify-center rounded-depth-lg bg-[var(--depth-color-primary)] px-3 py-2 shadow-depth-lg"><h1 className="text-lg font-bold text-white">{title}</h1></div>;
}

function State({ children, error = false }) {
    return <div className={`mx-auto mt-[20vh] p-5 text-center text-sm font-semibold ${error ? "text-red-400" : "text-depth-secondary"}`}>{children}</div>;
}
