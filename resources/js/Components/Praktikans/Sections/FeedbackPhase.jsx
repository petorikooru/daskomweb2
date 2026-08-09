import { useEffect, useMemo, useRef, useState } from "react";
import { router } from "@inertiajs/react";
import toast from "react-hot-toast";

import { useAsistensQuery } from "@/hooks/useAsistensQuery";
import { useModulesQuery } from "@/hooks/useModulesQuery";
import { api } from "@/lib/api";

const STARS = [1, 2, 3, 4, 5];

const assistantLabel = (a, fallback = "") => {
    if (!a) return fallback;
    const code = a.kode ?? a.code ?? "";
    const name = a.nama ?? a.name ?? "";

    return code && name
        ? `${code} — ${name}`
        : code || name || fallback;
};

const matches = (a, query) => {
    const q = query.trim().toLowerCase();

    if (!q) return true;

    return [
        a?.nama,
        a?.name,
        a?.kode,
        a?.code,
        assistantLabel(a),
    ]
        .filter(Boolean)
        .some((x) =>
            String(x).toLowerCase().includes(q),
        );
};

function RatingStars({ value, onChange }) {
    return (
        <div className="mt-4 rounded-depth-lg border border-depth bg-depth-card px-4 py-3 shadow-depth-inset">
            {STARS.map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => onChange(star)}
                    className="mx-2 p-1"
                    aria-label={`${star} bintang`}
                >
                    <svg
                        className={`h-8 w-8 drop-shadow-sm transition ${
                            star <= value
                                ? "text-yellow-400"
                                : "text-depth-disabled"
                        }`}
                        viewBox="0 0 24 24"
                        fill="currentColor"
                    >
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                </button>
            ))}
        </div>
    );
}

export default function FeedbackPhase({
    praktikan,
    modulId = null,
    assistantId = null,
    moduleLabel: moduleLabelOverride = null,
    onClose,
    onSubmitted,
}) {
    const praktikanId = praktikan?.id ?? null;
    const moduleId = modulId ? String(modulId) : null;
    const initialAssistantId =
        assistantId != null
            ? String(assistantId)
            : null;

    const [feedback, setFeedback] = useState("");
    const [ratingPraktikum, setRatingPraktikum] = useState(0);
    const [ratingAsisten, setRatingAsisten] = useState(0);
    const [selectedAssistantId, setSelectedAssistantId] =
        useState(initialAssistantId);
    const [searchTerm, setSearchTerm] = useState("");
    const [open, setOpen] = useState(false);
    const [highlighted, setHighlighted] = useState(-1);
    const [submitting, setSubmitting] = useState(false);

    const dropdownRef = useRef(null);
    const initializedRef = useRef(false);

    const { data: assistants = [] } = useAsistensQuery();
    const { data: modules = [] } = useModulesQuery();

    const module = useMemo(
        () =>
            moduleId
                ? modules.find(
                      (m) =>
                          String(m?.idM ?? m?.id) ===
                          moduleId,
                  ) ?? null
                : null,
        [modules, moduleId],
    );

    const moduleLabel =
        moduleLabelOverride ??
        module?.judul ??
        module?.name ??
        (moduleId ? `Modul #${moduleId}` : null);

    /*
     * Apply assistant from PraktikumPage only once.
     * Do not erase it after useAsistensQuery finishes.
     */
    useEffect(() => {
        if (
            initializedRef.current ||
            !assistants.length
        )
            return;

        initializedRef.current = true;

        if (!initialAssistantId) {
            setSelectedAssistantId(null);
            setSearchTerm("");
            return;
        }

        const assistant = assistants.find(
            (a) =>
                String(a?.id) ===
                initialAssistantId,
        );

        if (!assistant) {
            setSelectedAssistantId(null);
            setSearchTerm("");
            return;
        }

        setSelectedAssistantId(initialAssistantId);
        setSearchTerm(assistantLabel(assistant));
    }, [assistants, initialAssistantId]);

    useEffect(() => {
        const close = (e) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(
                    e.target,
                )
            ) {
                setOpen(false);
                setHighlighted(-1);
            }
        };

        document.addEventListener("mousedown", close);

        return () =>
            document.removeEventListener(
                "mousedown",
                close,
            );
    }, []);

    const filtered = useMemo(
        () =>
            assistants.filter((a) =>
                matches(a, searchTerm),
            ),
        [assistants, searchTerm],
    );

    useEffect(() => {
        if (!open || !filtered.length) {
            setHighlighted(-1);
            return;
        }

        setHighlighted((x) =>
            x < 0 || x >= filtered.length ? 0 : x,
        );
    }, [open, filtered.length]);

    const selectAssistant = (id) => {
        const value =
            id != null ? String(id) : null;

        const assistant = assistants.find(
            (a) => String(a?.id) === value,
        );

        setSelectedAssistantId(value);
        setSearchTerm(
            assistantLabel(
                assistant,
                searchTerm,
            ),
        );
        setOpen(false);
        setHighlighted(-1);
    };

    const close = () => {
        if (onClose) return onClose();
        router.visit(route("praktikum"));
    };

    const submit = async () => {
        const text = feedback.trim();

        if (!moduleId)
            return toast.error(
                "Modul feedback tidak ditemukan.",
            );

        if (!praktikanId)
            return toast.error(
                "Data praktikan tidak valid.",
            );

        if (text.length < 10)
            return toast.error(
                "Feedback minimal 10 karakter.",
            );

        if (text.length > 1000)
            return toast.error(
                "Feedback maksimal 1000 karakter.",
            );

        if (
            !selectedAssistantId ||
            !ratingPraktikum ||
            !ratingAsisten
        ) {
            return toast.error(
                "Lengkapi feedback, pilih asisten penanggung jawab, dan berikan rating praktik & asisten.",
            );
        }

        try {
            setSubmitting(true);

            await api.post(
                "/api-v1/laporan-praktikan",
                {
                    praktikan_id: praktikanId,
                    modul_id: Number(moduleId),
                    laporan: text,
                    pesan: text,
                    rating: ratingPraktikum,
                    rating_praktikum:
                        ratingPraktikum,
                    rating_asisten:
                        ratingAsisten,
                    asisten_id: Number(
                        selectedAssistantId,
                    ),
                },
            );

            toast.success(
                "Feedback berhasil dikirim. Terima kasih!",
            );

            onSubmitted
                ? onSubmitted()
                : close();
        } catch (error) {
            toast.error(
                error?.response?.data?.message ??
                    error?.message ??
                    "Gagal mengirim feedback.",
            );
        } finally {
            setSubmitting(false);
        }
    };

    const length = feedback.trim().length;
    const feedbackValid =
        length >= 10 && length <= 1000;

    const disabled =
        !moduleId ||
        !selectedAssistantId ||
        !feedbackValid ||
        !ratingPraktikum ||
        !ratingAsisten ||
        submitting;

    return (
        <div
            className="mt-6 flex flex-1 flex-col gap-6 overflow-hidden"
            style={{
                maxHeight: "calc(100vh - 4rem)",
            }}
        >
            <div className="flex flex-1 flex-col gap-6 overflow-y-auto pr-1">
                <div>
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-depth-primary">
                            Feedback
                        </h1>

                        {moduleLabel && (
                            <p className="mt-2 text-xs font-medium text-depth-tertiary">
                                Modul Praktikum:{" "}
                                <span className="text-depth-primary">
                                    {moduleLabel}
                                </span>
                            </p>
                        )}
                    </div>

                    {!moduleId && (
                        <div className="mb-6 rounded-depth-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                            Modul untuk feedback belum
                            ditentukan.
                        </div>
                    )}

                    <div
                        ref={dropdownRef}
                        className="mb-6 max-w-3xl"
                    >
                        <label className="mb-3 block text-sm font-semibold text-depth-primary">
                            Pilih Asisten Penanggung Jawab
                        </label>

                        <div className="relative">
                            <input
                                type="search"
                                value={searchTerm}
                                placeholder="Cari asisten berdasarkan kode atau nama"
                                onFocus={() => {
                                    setOpen(true);
                                    if (
                                        filtered.length &&
                                        highlighted === -1
                                    )
                                        setHighlighted(0);
                                }}
                                onChange={(e) => {
                                    setSearchTerm(
                                        e.target.value,
                                    );
                                    setSelectedAssistantId(
                                        null,
                                    );
                                    setOpen(true);
                                    setHighlighted(-1);
                                }}
                                onKeyDown={(e) => {
                                    if (
                                        e.key === "Escape"
                                    ) {
                                        setOpen(false);
                                        setHighlighted(-1);
                                        return;
                                    }

                                    if (
                                        e.key === "ArrowDown"
                                    ) {
                                        e.preventDefault();
                                        setOpen(true);

                                        if (!filtered.length)
                                            return;

                                        setHighlighted(
                                            (x) =>
                                                x < 0 ||
                                                x >=
                                                    filtered.length -
                                                        1
                                                    ? 0
                                                    : x +
                                                      1,
                                        );
                                        return;
                                    }

                                    if (
                                        e.key === "ArrowUp"
                                    ) {
                                        e.preventDefault();
                                        setOpen(true);

                                        if (!filtered.length)
                                            return;

                                        setHighlighted(
                                            (x) =>
                                                x <= 0
                                                    ? filtered.length -
                                                      1
                                                    : x -
                                                      1,
                                        );
                                        return;
                                    }

                                    if (
                                        e.key === "Enter"
                                    ) {
                                        e.preventDefault();

                                        const assistant =
                                            filtered[
                                                highlighted >=
                                                0
                                                    ? highlighted
                                                    : 0
                                            ];

                                        if (assistant)
                                            selectAssistant(
                                                assistant.id,
                                            );
                                    }
                                }}
                                className="w-full rounded-depth-lg border border-depth bg-depth-card px-4 py-3 text-sm text-depth-primary shadow-depth-inset transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)]"
                            />

                            {open && (
                                <div className="absolute z-20 mt-2 max-h-56 w-full overflow-y-auto rounded-depth-lg border border-depth bg-depth-card shadow-depth-lg">
                                    {!filtered.length ? (
                                        <div className="px-4 py-3 text-sm text-depth-secondary">
                                            Asisten tidak
                                            ditemukan.
                                        </div>
                                    ) : (
                                        <ul className="divide-y divide-[color:var(--depth-border)]">
                                            {filtered.map(
                                                (
                                                    assistant,
                                                    i,
                                                ) => {
                                                    const selected =
                                                        String(
                                                            assistant.id,
                                                        ) ===
                                                        selectedAssistantId;

                                                    return (
                                                        <li
                                                            key={
                                                                assistant.id
                                                            }
                                                        >
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    selectAssistant(
                                                                        assistant.id,
                                                                    )
                                                                }
                                                                className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition hover:bg-depth-interactive ${
                                                                    selected ||
                                                                    i ===
                                                                        highlighted
                                                                        ? "bg-depth-interactive font-semibold text-depth-primary"
                                                                        : "text-depth-primary"
                                                                }`}
                                                            >
                                                                <span>
                                                                    {assistantLabel(
                                                                        assistant,
                                                                    )}
                                                                </span>

                                                                {selected && (
                                                                    <span className="font-bold text-[var(--depth-color-primary)]">
                                                                        ✓
                                                                    </span>
                                                                )}
                                                            </button>
                                                        </li>
                                                    );
                                                },
                                            )}
                                        </ul>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div>
                            <h3 className="text-sm font-semibold text-depth-primary">
                                Praktikum
                            </h3>

                            <RatingStars
                                value={
                                    ratingPraktikum
                                }
                                onChange={
                                    setRatingPraktikum
                                }
                            />
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-depth-primary">
                                Asisten
                            </h3>

                            <RatingStars
                                value={ratingAsisten}
                                onChange={
                                    setRatingAsisten
                                }
                            />
                        </div>
                    </div>

                    <div className="mt-6">
                        <label
                            htmlFor="feedback"
                            className="mb-2 block text-sm font-semibold text-depth-primary"
                        >
                            Feedback Praktikan
                        </label>

                        <textarea
                            id="feedback"
                            value={feedback}
                            rows={8}
                            maxLength={1000}
                            onChange={(e) =>
                                setFeedback(
                                    e.target.value.slice(
                                        0,
                                        1000,
                                    ),
                                )
                            }
                            placeholder="Bagikan pengalaman Anda selama praktikum, kendala yang dihadapi, saran perbaikan, atau hal lain yang ingin disampaikan..."
                            className="w-full rounded-depth-lg border border-depth bg-depth-card p-4 text-sm text-depth-primary shadow-depth-inset transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)]"
                        />

                        <div className="mt-2 flex items-center justify-between text-xs">
                            <span
                                className={
                                    feedbackValid
                                        ? "text-green-600 dark:text-green-400"
                                        : "text-red-500"
                                }
                            >
                                {length < 10
                                    ? `Minimal 10 karakter (${10 - length} lagi)`
                                    : "Feedback sudah cukup"}
                            </span>

                            <span className="text-depth-secondary">
                                {length} / 1000 karakter
                            </span>
                        </div>
                    </div>

                    <div className="mb-10 mt-6 flex justify-end">
                        <button
                            type="button"
                            onClick={submit}
                            disabled={disabled}
                            className={`glass-button inline-flex min-w-[160px] items-center justify-center gap-2 rounded-depth-lg px-6 py-3 font-semibold shadow-depth-md transition ${
                                disabled
                                    ? "cursor-not-allowed opacity-50"
                                    : "hover:-translate-y-0.5 hover:shadow-depth-lg"
                            }`}
                            style={
                                disabled
                                    ? undefined
                                    : {
                                          background:
                                              "linear-gradient(135deg, rgba(34,197,94,.9), rgba(22,163,74,.9))",
                                      }
                            }
                        >
                            {submitting
                                ? "Mengirim..."
                                : "Kirim Feedback"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
