import { useEffect, useMemo, useRef, useState } from "react";

export default function PairNavigator({ count, active, onChange }) {
    const pagesRef = useRef(null);
    const [capacity, setCapacity] = useState(5);

    useEffect(() => {
        const element = pagesRef.current;
        if (!element) return;

        const update = () => {
            setCapacity(Math.max(1, Math.floor(element.clientWidth / 34)));
        };

        update();

        if (typeof ResizeObserver !== "undefined") {
            const observer = new ResizeObserver(update);
            observer.observe(element);
            return () => observer.disconnect();
        }

        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);

    const { start, end } = useMemo(() => {
        if (!count) return { start: 0, end: 0 };

        const slots =
            count <= capacity
                ? count
                : Math.max(1, capacity - 2);

        const start = Math.max(
            0,
            Math.min(
                active - Math.floor(slots / 2),
                count - slots,
            ),
        );

        return {
            start,
            end: Math.min(count, start + slots),
        };
    }, [active, capacity, count]);

    if (!count) return null;

    return (
        <div className="flex items-center gap-2 rounded-depth-lg border border-depth bg-depth-card p-2 shadow-depth-sm">
            <button
                type="button"
                onClick={() => onChange(active - 1)}
                disabled={active === 0}
                className="shrink-0 rounded-depth-md border border-depth bg-depth-interactive px-3 py-2 text-xs font-semibold text-depth-primary transition hover:shadow-depth-md disabled:cursor-not-allowed disabled:opacity-40"
            >
                ← <span className="hidden sm:inline">Previous</span>
            </button>

            <div
                ref={pagesRef}
                className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden"
            >
                {start > 0 && (
                    <span className="shrink-0 px-1 text-depth-secondary">…</span>
                )}

                {Array.from(
                    { length: end - start },
                    (_, offset) => start + offset,
                ).map((index) => (
                    <button
                        key={index}
                        type="button"
                        onClick={() => onChange(index)}
                        className={`flex h-8 min-w-8 shrink-0 items-center justify-center rounded-depth-md border px-2 text-xs font-semibold transition ${
                            active === index
                                ? "border-[var(--depth-color-primary)] bg-[var(--depth-color-primary)] text-white"
                                : "border-depth bg-depth-interactive text-depth-secondary hover:text-depth-primary"
                        }`}
                    >
                        {index + 1}
                    </button>
                ))}

                {end < count && (
                    <span className="shrink-0 px-1 text-depth-secondary">…</span>
                )}
            </div>

            <span className="shrink-0 rounded-depth-md border border-depth bg-depth-interactive px-2.5 py-2 text-xs font-semibold text-depth-primary">
                {active + 1} / {count}
            </span>

            <button
                type="button"
                onClick={() => onChange(active + 1)}
                disabled={active >= count - 1}
                className="shrink-0 rounded-depth-md border border-depth bg-depth-interactive px-3 py-2 text-xs font-semibold text-depth-primary transition hover:shadow-depth-md disabled:cursor-not-allowed disabled:opacity-40"
            >
                <span className="hidden sm:inline">Next</span> →
            </button>
        </div>
    );
}
