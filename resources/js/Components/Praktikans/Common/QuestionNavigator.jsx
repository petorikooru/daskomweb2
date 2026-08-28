const answered = (value) => {
    if (value == null) {
        return false;
    }
    if (typeof value === "string") {
        return Boolean(value.trim());
    }
    if (typeof value === "object") {
        return Object.keys(value).length > 0;
    }
    return true;
};

export default function QuestionNavigator({
    questions = [],
    answers = [],
    active = 0,
    onChange,
}) {
    if (!questions.length) {
        return null;
    }

    const getButtonClassName = (index) => {
        const done = answered(answers[index]);
        const current = index === active;

        if (current) {
            return done
                ? "border-[var(--depth-color-primary)] bg-[var(--depth-color-primary)] text-white"
                : "border-amber-400 bg-amber-400 text-black";
        }

        return done
            ? "border-[var(--depth-color-primary)] bg-depth-interactive text-depth-primary"
            : "border-amber-400/70 bg-amber-400/10 text-amber-300";
    };

    return (
        <div className="sticky top-0 z-20 mb-4 flex items-center gap-2 rounded-depth-lg border border-depth bg-depth-card p-2 shadow-depth-md">
            <button
                type="button"
                disabled={!active}
                onClick={() => onChange(active - 1)}
                className="rounded-depth-md border border-depth bg-depth-interactive px-3 py-2 text-xs font-bold disabled:opacity-40 font-mono"
            >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /> </svg>
            </button>

            <span className="shrink-0 text-sm font-semibold text-depth-secondary">
                Soal:
            </span>

            <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto">

                {questions.map((question, index) => {
                    const isAnswered = answered(answers[index]);

                    return (
                        <button
                            key={question.key ?? index}
                            type="button"
                            onClick={() => onChange(index)}
                            className={`relative h-8 min-w-8 shrink-0 rounded-depth-md border text-xs font-bold ${getButtonClassName(index)}`}
                        >
                            {index + 1}
                            {!isAnswered && <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-amber-400" />}
                        </button>
                    );
                })}
            </div>

            <span className="shrink-0 text-sm font-semibold text-depth-secondary">
                Selamat mengerjakan!
            </span>

            <button
                type="button"
                disabled={active >= questions.length - 1}
                onClick={() => onChange(active + 1)}
                className="rounded-depth-md border border-depth bg-depth-interactive px-3 py-2 text-xs font-bold disabled:opacity-40"
            >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /> </svg>
            </button>
        </div>
    );
}
