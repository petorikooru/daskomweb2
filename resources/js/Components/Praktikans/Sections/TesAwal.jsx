import MarkdownRenderer from "../../MarkdownRenderer";
import QuestionCommentInput from "./QuestionCommentInput";
import QuestionNavigator from "@/Components/Praktikans/Common/QuestionNavigator";
import useQuestionNavigation from "@/hooks/praktikum/useQuestionNavigation";

export default function TesAwal({
    isLoading = false,
    errorMessage = null,
    questions = [],
    answers = [],
    setAnswers,
    tipeSoal = "ta",
    praktikanId = null,
    isCommentEnabled = false,
    isTot = false,
}) {
    const { panelRef, active, setActive, goTo } = useQuestionNavigation(questions);

    const selectAnswer = (index, optionId) => {
        setActive(index);
        setAnswers((prev) => {
            const next = [...prev];
            next[index] = optionId;
            return next;
        });
    };

    if (isLoading) {
        return <State>Memuat soal Tes Awal...</State>;
    }

    if (errorMessage) {
        return <State error>{errorMessage}</State>;
    }

    if (!questions.length) {
        return <State>Belum ada soal Tes Awal untuk modul ini.</State>;
    }

    return (
        <div className="w-full p-5 py-0">
            <Header title="Tes Awal" />

            <div
                ref={panelRef}
                className="max-h-[80vh] overflow-x-hidden overflow-y-auto rounded-depth-lg border border-depth bg-depth-card p-4 shadow-depth-lg"
                style={{ overflowAnchor: "none" }}
            >
                <QuestionNavigator
                    questions={questions}
                    answers={answers}
                    active={active}
                    onChange={goTo}
                />

                <div className="space-y-4">
                    {questions.map((question, index) => (
                        <Question
                            key={question.id ?? index}
                            question={question}
                            index={index}
                            answer={answers[index]}
                            onSelect={selectAnswer}
                            onActivate={setActive}
                            tipeSoal={tipeSoal}
                            praktikanId={praktikanId}
                            isCommentEnabled={isCommentEnabled}
                            isTot={isTot}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

function Question({
    question,
    index,
    answer,
    onSelect,
    onActivate,
    tipeSoal,
    praktikanId,
    isCommentEnabled,
    isTot,
}) {
    const questionId =
        question.id ??
        question.soalId ??
        question.soal_id ??
        null;

    return (
        <div
            data-question-index={index}
            onClick={() => onActivate(index)}
            onFocusCapture={() => onActivate(index)}
            className="rounded-depth-lg border border-depth bg-depth-interactive p-4 shadow-depth-md"
        >
            <div className="mb-4 flex items-start gap-3">
                <QuestionNumber number={index + 1} />

                <div className="min-w-0 flex-1">
                    {isTot && (
                        <DifficultyIndicator value={question.difficulty} />
                    )}

                    <div className="text-sm font-medium leading-relaxed text-depth-primary">
                        <MarkdownRenderer content={question.text} />
                    </div>

                    <QuestionCommentInput
                        questionId={questionId}
                        tipeSoal={tipeSoal}
                        praktikanId={praktikanId}
                        isEnabled={isCommentEnabled}
                        className="mt-2"
                    />
                </div>
            </div>

            <div
                role="radiogroup"
                className="grid gap-2 sm:grid-cols-2"
            >
                {(question.options ?? []).map((option) => (
                    <AnswerOption
                        key={option.id}
                        option={option}
                        selected={
                            String(answer ?? "") === String(option.id)
                        }
                        onSelect={() => onSelect(index, option.id)}
                    />
                ))}
            </div>
        </div>
    );
}

function AnswerOption({ option, selected, onSelect }) {
    const handleKeyDown = (event) => {
        if (event.key !== "Enter" && event.key !== " ") {
            return;
        }

        event.preventDefault();
        onSelect();
    };

    return (
        <div
            role="radio"
            tabIndex={0}
            aria-checked={selected}
            onMouseDown={(event) => event.preventDefault()}
            onClick={onSelect}
            onKeyDown={handleKeyDown}
            className={`cursor-pointer rounded-depth-md border p-3 text-sm transition ${
                selected
                    ? "border-[var(--depth-color-primary)] bg-[var(--depth-color-primary)] text-white shadow-depth-md"
                    : "border-depth bg-depth-card text-depth-primary hover:bg-depth-interactive"
            }`}
        >
            <div className="flex items-start gap-2">
                <span
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                        selected ? "border-white" : "border-depth"
                    }`}
                >
                    {selected && (
                        <span className="h-2 w-2 rounded-full bg-white" />
                    )}
                </span>

                <div className="min-w-0 flex-1">
                    <MarkdownRenderer content={option.text} />
                </div>
            </div>
        </div>
    );
}

function QuestionNumber({ number }) {
    return (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-depth-full bg-[var(--depth-color-primary)] text-xs font-bold text-white">
            {number}
        </span>
    );
}

function Header({ title }) {
    return (
        <div className="mb-4 flex justify-center rounded-depth-lg bg-[var(--depth-color-primary)] px-3 py-2 shadow-depth-lg">
            <h1 className="text-lg font-bold text-white">{title}</h1>
        </div>
    );
}

function State({ children, error = false }) {
    return (
        <div
            className={`mx-auto mt-[20vh] p-5 text-center text-sm font-semibold ${
                error ? "text-red-400" : "text-depth-secondary"
            }`}
        >
            {children}
        </div>
    );
}

const difficultyStyles = {
    easy: {
        container: "border-emerald-500/40 bg-emerald-500/10 text-emerald-500",
        dot: "bg-emerald-500",
        label: "Mudah",
    },
    medium: {
        container: "border-amber-500/40 bg-amber-500/10 text-amber-500",
        dot: "bg-amber-500",
        label: "Sedang",
    },
    hard: {
        container: "border-red-500/40 bg-red-500/10 text-red-500",
        dot: "bg-red-500",
        label: "Sulit",
    },
};

function normalizeDifficulty(value) {
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
}

function DifficultyIndicator({ value }) {
    const difficulty = normalizeDifficulty(value);
    const styles = difficultyStyles[difficulty];

    if (!styles) return null;

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-depth-md border px-2 py-0.5 text-xs font-semibold ${styles.container}`}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
            {styles.label}
        </span>
    );
}

