import {
    Suspense,
    lazy,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import { useModulesQuery } from "@/hooks/useModulesQuery";
import toast from "react-hot-toast";

const SoalInputPG = lazy(() => import("../Soal/SoalInputPG"));
const SoalInputEssay = lazy(() => import("../Soal/SoalInputEssay"));

const CATEGORIES = [
    ["tp", "TP", "Tes Pendahuluan"],
    ["ta", "TA", "Tes Awal"],
    ["fitb", "FITB", "Fill in the blank"],
    ["jurnal", "Jurnal", "Jurnal"],
    ["tm", "Mandiri", "Mandiri"],
    ["tk", "TK", "Tes Keterampilan"],
];

const getScrollParent = (node) => {
    for (let el = node?.parentElement; el && el !== document.body; el = el.parentElement) {
        if (/(auto|scroll)/.test(getComputedStyle(el).overflowY)) return el;
    }

    return window;
};


function SoalNavigator({ count, active, onChange }) {
    const ref = useRef(null);
    const [capacity, setCapacity] = useState(8);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const update = () =>
            setCapacity(Math.max(1, Math.floor(el.clientWidth / 38)));

        update();

        const observer = new ResizeObserver(update);
        observer.observe(el);

        return () => observer.disconnect();
    }, []);

    if (!count) return null;

    const visible = count <= capacity ? count : Math.max(1, capacity - 2);
    const start = Math.max(
        0,
        Math.min(active - Math.floor(visible / 2), count - visible),
    );
    const end = Math.min(count, start + visible);

    const go = (index) => {
        if (index >= 0 && index < count) onChange(index);
    };

    return (
        <div className="flex items-center gap-2 rounded-depth-md border border-depth bg-depth-card p-2 shadow-depth-md">
            <button
                type="button"
                onClick={() => go(active - 1)}
                disabled={!active}
                className="shrink-0 rounded-depth-md border border-depth bg-depth-interactive px-3 py-2 text-xs font-semibold text-depth-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
                ← <span className="hidden sm:inline">Previous</span>
            </button>

            <div
                ref={ref}
                className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden"
            >
                {start > 0 && (
                    <span className="shrink-0 px-1 text-depth-secondary">…</span>
                )}

                {Array.from(
                    { length: end - start },
                    (_, i) => start + i,
                ).map((index) => (
                    <button
                        key={index}
                        type="button"
                        onClick={() => go(index)}
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

            <span className="shrink-0 rounded-depth-md border border-depth bg-depth-interactive px-3 py-2 text-xs font-semibold text-depth-primary">
                {active + 1} / {count}
            </span>

            <button
                type="button"
                onClick={() => go(active + 1)}
                disabled={active >= count - 1}
                className="shrink-0 rounded-depth-md border border-depth bg-depth-interactive px-3 py-2 text-xs font-semibold text-depth-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
                <span className="hidden sm:inline">Next</span> →
            </button>
        </div>
    );
}


export default function FormSoalInput({ isEditable = true }) {
    const rootRef = useRef(null);
    const restoreScrollRef = useRef(null);

    const [kategoriSoal, setKategoriSoal] = useState("");
    const [selectedModul, setSelectedModul] = useState("");
    const [activeSoal, setActiveSoal] = useState(0);

    const {
        data: moduls = [],
        isLoading: modulesLoading,
        isError: modulesError,
        error: modulesQueryError,
        refetch: refetchModules,
    } = useModulesQuery();


    /*
     * Restore scroll immediately after a card-triggered render.
     *
     * This also works when the container did not overflow before
     * the click but becomes scrollable after mounting the new content.
     */
    useLayoutEffect(() => {
        const saved = restoreScrollRef.current;
        if (!saved) return;

        restoreScrollRef.current = null;

        if (saved.target === window) {
            window.scrollTo(saved.left, saved.top);
        } else {
            saved.target.scrollLeft = saved.left;
            saved.target.scrollTop = saved.top;
        }
    });


    const preserveScroll = (callback) => {
        const target = getScrollParent(rootRef.current);

        restoreScrollRef.current =
            target === window
                ? {
                      target,
                      top: window.scrollY,
                      left: window.scrollX,
                  }
                : {
                      target,
                      top: target.scrollTop,
                      left: target.scrollLeft,
                  };

        callback();
    };


    const selectedModuleData = useMemo(
        () =>
            selectedModul
                ? moduls.find(
                      (m) => String(m.idM) === String(selectedModul),
                  ) ?? null
                : null,
        [moduls, selectedModul],
    );


    const counts = useMemo(
        () =>
            selectedModuleData
                ? {
                      tp: selectedModuleData.soal_tp_count ?? 0,
                      ta: selectedModuleData.soal_ta_count ?? 0,
                      fitb: selectedModuleData.soal_fitb_count ?? 0,
                      jurnal: selectedModuleData.soal_jurnal_count ?? 0,
                      tm: selectedModuleData.soal_tm_count ?? 0,
                      tk: selectedModuleData.soal_tk_count ?? 0,
                  }
                : null,
        [selectedModuleData],
    );

    const currentCount = counts?.[kategoriSoal] ?? 0;


    /*
     * Dropdowns and cards ultimately use the same state changes.
     * No automatic scrolling occurs here.
     */
    const changeCategory = (value) => {
        setKategoriSoal(value);
        setActiveSoal(0);
    };

    const changeModule = (value) => {
        setSelectedModul(value);
        setActiveSoal(0);
    };


    /*
     * Only the question navigator intentionally scrolls.
     */
    const goToSoal = (index) => {
        if (index < 0 || index >= currentCount) return;

        setActiveSoal(index);

        requestAnimationFrame(() => {
            const target = document.getElementById(
                `soal-${kategoriSoal}-${index}`,
            );

            if (!target) return;

            const parent = getScrollParent(target);

            if (parent === window) {
                window.scrollTo({
                    top:
                        window.scrollY +
                        target.getBoundingClientRect().top -
                        100,
                    behavior: "smooth",
                });

                return;
            }

            parent.scrollTo({
                top:
                    parent.scrollTop +
                    target.getBoundingClientRect().top -
                    parent.getBoundingClientRect().top -
                    100,
                behavior: "smooth",
            });
        });
    };


    useEffect(() => {
        setActiveSoal(0);
    }, [kategoriSoal, selectedModul]);


    const handleValidationError = ({
        message,
        includeModuleNotice = false,
    } = {}) =>
        toast.error(
            `${message ?? "Soal belum ditambahkan!!"}${
                includeModuleNotice
                    ? " Pastikan memilih modul terlebih dahulu."
                    : ""
            }`.trim(),
        );


    const handleSuccessNotification = () => {
        toast.success("Soal berhasil ditambahkan!!");
        refetchModules();
    };


    const renderSoal = () => {
        if (!kategoriSoal || !selectedModul) return null;

        const props = {
            kategoriSoal,
            modul: selectedModul,
            modules: moduls,
            onModalSuccess: handleSuccessNotification,
            onModalValidation: handleValidationError,
            onChangeModul: changeModule,
            isEditable,
        };

        if (["tp", "fitb", "jurnal", "tm"].includes(kategoriSoal)) {
            return <SoalInputEssay {...props} />;
        }

        if (["ta", "tk"].includes(kategoriSoal)) {
            return <SoalInputPG {...props} />;
        }

        return null;
    };


    return (
        <div
            ref={rootRef}
            className="space-y-6 text-depth-primary"
            style={{ overflowAnchor: "none" }}
        >
            {/* Category + Module */}
            <div className="flex flex-col gap-4 lg:flex-row">
                <div className="flex-1 space-y-2">
                    <label
                        htmlFor="kategori-soal"
                        className="block text-xs font-semibold uppercase tracking-wide text-depth-secondary"
                    >
                        Kategori Soal
                    </label>

                    <select
                        id="kategori-soal"
                        value={kategoriSoal}
                        onChange={(e) => changeCategory(e.target.value)}
                        className="w-full rounded-depth-md border border-depth bg-depth-card p-3 text-sm text-depth-primary shadow-depth-sm focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)]"
                    >
                        <option value="">- Pilih Kategori Soal -</option>

                        {CATEGORIES.map(([key, , name]) => (
                            <option key={key} value={key}>
                                {name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex-1 space-y-2">
                    <label
                        htmlFor="modul_id"
                        className="block text-xs font-semibold uppercase tracking-wide text-depth-secondary"
                    >
                        Modul
                    </label>

                    <select
                        id="modul_id"
                        value={selectedModul}
                        onChange={(e) => changeModule(e.target.value)}
                        className="w-full rounded-depth-md border border-depth bg-depth-card p-3 text-sm text-depth-primary shadow-depth-sm focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)]"
                    >
                        <option value="">- Pilih Modul -</option>

                        {modulesLoading && (
                            <option disabled>Memuat modul...</option>
                        )}

                        {modulesError && (
                            <option disabled>
                                {modulesQueryError?.message ??
                                    "Gagal memuat modul"}
                            </option>
                        )}

                        {!modulesLoading &&
                            !modulesError &&
                            moduls.map((m) => (
                                <option key={m.idM} value={m.idM}>
                                    {m.judul}
                                </option>
                            ))}
                    </select>
                </div>
            </div>


            {/* Module cards */}
            {!selectedModul && (
                <section className="space-y-3">
                    <div>
                        <h3 className="text-sm font-semibold">
                            Pilih Modul
                        </h3>

                        <p className="mt-1 text-xs text-depth-secondary">
                            Pilih modul Indonesia atau English untuk mulai
                            mengelola soal.
                        </p>
                    </div>

                    {modulesLoading ? (
                        <p className="text-sm text-depth-secondary">
                            Memuat modul...
                        </p>
                    ) : modulesError ? (
                        <p className="text-sm text-red-500">
                            {modulesQueryError?.message ??
                                "Gagal memuat modul"}
                        </p>
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {moduls.map((m) => {
                                const english =
                                    Number(m?.isEnglish ?? 0) === 1;

                                return (
                                    <button
                                        key={m.idM}
                                        type="button"
                                        onClick={(e) => {
                                            e.currentTarget.blur();

                                            preserveScroll(() =>
                                                changeModule(String(m.idM)),
                                            );
                                        }}
                                        className="group rounded-depth-lg border border-depth bg-depth-card p-4 text-left shadow-depth-sm transition hover:-translate-y-0.5 hover:border-[var(--depth-color-primary)] hover:shadow-depth-md"
                                    >
                                        <div className="mb-3 flex items-center justify-between gap-2">
                                            <span
                                                className={`rounded-depth-md border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                                                    english
                                                        ? "border-blue-500/40 bg-blue-500/10 text-blue-400"
                                                        : "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                                                }`}
                                            >
                                                {english ? "EN" : "ID"}
                                            </span>

                                            <span className="text-[10px] text-depth-secondary">
                                                Modul {m.idM}
                                            </span>
                                        </div>

                                        <p className="font-semibold transition group-hover:text-[var(--depth-color-primary)]">
                                            {m.judul}
                                        </p>

                                        <p className="mt-1 text-xs text-depth-secondary">
                                            {english
                                                ? "English Module"
                                                : "Modul Indonesia"}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </section>
            )}


            {/* Category cards */}
            {selectedModuleData && counts && (
                <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-6">
                    {CATEGORIES.map(([key, label]) => {
                        const selected = kategoriSoal === key;

                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={(e) => {
                                    e.currentTarget.blur();

                                    preserveScroll(() =>
                                        changeCategory(key),
                                    );
                                }}
                                className={`rounded-depth-md border px-3 py-2 text-center shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md ${
                                    selected
                                        ? "border-[var(--depth-color-primary)] bg-depth-card ring-1 ring-[var(--depth-color-primary)]"
                                        : "border-depth bg-depth-interactive hover:border-[var(--depth-color-primary)]"
                                }`}
                            >
                                <div className="text-[0.65rem] font-semibold uppercase tracking-wide text-depth-secondary">
                                    {label}
                                </div>

                                <div className="text-lg font-bold">
                                    {counts[key] ?? 0}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}


            {/* Sticky navigator */}
            {selectedModul && kategoriSoal && currentCount > 0 && (
                <div
                    className="sticky top-2 z-30"
                    style={{ overflowAnchor: "none" }}
                >
                    <SoalNavigator
                        count={currentCount}
                        active={Math.min(
                            activeSoal,
                            currentCount - 1,
                        )}
                        onChange={goToSoal}
                    />
                </div>
            )}


            {/* Questions */}
            <div
                id="soal-section"
                style={{ overflowAnchor: "none" }}
            >
                <Suspense
                    fallback={
                        <div className="text-sm text-depth-secondary">
                            Memuat soal...
                        </div>
                    }
                >
                    {renderSoal()}
                </Suspense>
            </div>
        </div>
    );
}
