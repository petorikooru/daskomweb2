import { Suspense, lazy, useCallback, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import editIcon from "../../../../assets/nav/Icon-Edit.svg";
import {
    useAssignedPraktikanQuery,
    ASSIGNED_PRAKTIKAN_QUERY_KEY,
} from "@/hooks/useAssignedPraktikanQuery";
import { useAssistantToolbar } from "@/Layouts/AssistantToolbarContext";
import ShortcutWindow from "@/Components/Assistants/Modals/ShortcutWindow";
import { useNilaiComplaintsQuery } from "@/hooks/useNilaiComplaintsQuery";

const ModalInputNilai = lazy(() => import("../Modals/ModalInputNilai"));
const ModalNilaiComplaintAsisten = lazy(() => import("../Modals/ModalNilaiComplaintAsisten"));

function ExpandableFeedback({ text }) {
    const [expanded, setExpanded] = useState(false);
    const needsClamp = text.length > 120;

    return (
        <div className="flex flex-1 flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-depth-secondary">
                Feedback
            </span>
            <p
                className={`text-[11px] leading-relaxed text-depth-secondary transition-all ${expanded ? "" : "line-clamp-3"
                    }`}
            >
                {text}
            </p>
            {needsClamp && (
                <button
                    type="button"
                    onClick={() => setExpanded((prev) => !prev)}
                    className="mt-0.5 self-start text-[10px] font-semibold text-[var(--depth-color-primary)] hover:underline focus:outline-none"
                >
                    {expanded ? "Sembunyikan" : "Lihat selengkapnya"}
                </button>
            )}
        </div>
    );
}

const SCORE_FIELDS = [
    { key: "tp", label: "TP" },
    { key: "ta", label: "TA" },
    { key: "d1", label: "D1" },
    { key: "d2", label: "D2" },
    { key: "d3", label: "D3" },
    { key: "d4", label: "D4" },
    { key: "i1", label: "I1" },
    { key: "i2", label: "I2" },
];

const toDisplayDate = (value) => {
    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString("id-ID");
};

const toDisplayTime = (value) => {
    if (!value) {
        return "-";
    }

    if (/^\d{2}:\d{2}/.test(value)) {
        return value.slice(0, 5);
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
    });
};

const normalizeRating = (value) => {
    if (value === null || value === undefined) {
        return null;
    }

    const numeric = Number(value);

    if (Number.isNaN(numeric)) {
        return null;
    }

    return Number(numeric.toFixed(1));
};

const getScoreValue = (nilai, key) => {
    if (!nilai) {
        return "-";
    }

    let raw = nilai[key];

    if (raw === undefined) {
        if (key === "i1") {
            raw = nilai.l1;
        } else if (key === "i2") {
            raw = nilai.l2;
        }
    }

    if (raw === null || raw === undefined) {
        return "-";
    }

    const numeric = Number(raw);

    if (Number.isNaN(numeric)) {
        return raw;
    }

    return Number.isInteger(numeric) ? numeric : numeric.toFixed(1);
};

export default function ContentNilai({ asisten }) {
    const [search, setSearch] = useState("");
    const [modalAssignment, setModalAssignment] = useState(null);
    const [complaintModal, setComplaintModal] = useState(null);
    const [selectedAssignmentIds, setSelectedAssignmentIds] = useState([]);
    const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
    const queryClient = useQueryClient();
    const { data: complaints = [] } = useNilaiComplaintsQuery();

    const {
        data: assignments = [],
        isLoading,
        isError,
        error,
    } = useAssignedPraktikanQuery({
        onError: (err) => {
            toast.error(err?.message ?? "Whoops terjadi kesalahan 😢");
        },
    });

    const filteredAssignments = useMemo(() => {
        if (!search.trim()) {
            return assignments;
        }

        const keyword = search.toLowerCase();

        return assignments.filter((item) => {
            const bucket = [
                item?.praktikan?.nim,
                item?.praktikan?.nama,
                item?.modul?.judul,
                item?.praktikan?.kelas?.nama,
                item?.datetime?.date,
                item?.datetime?.time,
            ]
                .filter(Boolean)
                .map((value) => value.toString().toLowerCase());

            return bucket.some((value) => value.includes(keyword));
        });
    }, [assignments, search]);

    const selectedSummaryAssignments = useMemo(() => {
        if (selectedAssignmentIds.length === 0) {
            return [];
        }

        const lookup = new Set(selectedAssignmentIds);

        return assignments.filter((assignment) => lookup.has(assignment.id));
    }, [assignments, selectedAssignmentIds]);

    const handleOpenModalInput = (assignment) => {
        setModalAssignment(assignment);
    };

    const handleCloseModalInput = () => {
        setModalAssignment(null);
    };

    const handleSaved = () => {
        queryClient.invalidateQueries({ queryKey: ASSIGNED_PRAKTIKAN_QUERY_KEY });
        queryClient.invalidateQueries({ queryKey: ['nilai-complaints-asisten'] });
        handleCloseModalInput();
    };

    const getPendingComplaintsForNilai = (nilaiId) => {
        return complaints.filter((c) => c.nilai_id === nilaiId && c.status === 'pending').length;
    };

    const getFirstComplaintForNilai = (nilaiId) => {
        return complaints.find((c) => c.nilai_id === nilaiId);
    };

    const handleToggleAssignmentSelection = useCallback((assignmentId) => {
        setSelectedAssignmentIds((previous) => {
            if (previous.includes(assignmentId)) {
                return previous.filter((id) => id !== assignmentId);
            }

            return [...previous, assignmentId];
        });
    }, []);

    const handleClearSelection = useCallback((assignmentId) => {
        setSelectedAssignmentIds((previous) => previous.filter((id) => id !== assignmentId));
    }, []);

    const handleClearAllSelections = useCallback(() => {
        setSelectedAssignmentIds([]);
    }, []);

    const handleWorkspaceToggle = useCallback(() => {
        setIsWorkspaceOpen((previous) => !previous);
    }, []);

    const handleWorkspaceClose = useCallback(() => {
        setIsWorkspaceOpen(false);
    }, []);

    const handleSearchChange = useCallback((event) => setSearch(event.target.value), []);

    const toolbarConfig = useMemo(
        () => ({
            title: "Input Nilai",
            right: (
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
                    <button
                        type="button"
                        onClick={handleWorkspaceToggle}
                        aria-pressed={isWorkspaceOpen}
                        className="flex items-center justify-center gap-2 rounded-depth-full border border-depth bg-depth-card px-4 py-2 text-sm font-semibold text-depth-primary shadow-depth-sm transition hover:-translate-y-0.5 hover:border-[var(--depth-color-primary)] hover:text-[var(--depth-color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--depth-color-primary)]"
                    >
                        <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                        >
                            <rect x="4" y="6" width="16" height="12" rx="2" />
                            <path d="M4 9h16" />
                        </svg>
                        Shortcut
                    </button>
                    <div className="relative min-w-[18rem] max-w-full sm:min-w-[16rem]">
                        <input
                            type="search"
                            value={search}
                            onChange={handleSearchChange}
                            placeholder="Cari nama, NIM, modul..."
                            className="w-full rounded-depth-full border border-depth bg-depth-interactive py-2.5 pl-4 pr-11 text-sm text-depth-primary shadow-depth-inset transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0 placeholder:text-depth-secondary"
                        />
                        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-depth-secondary">
                            🔍
                        </span>
                    </div>
                </div>
            ),
        }),
        [handleSearchChange, handleWorkspaceToggle, isWorkspaceOpen, search],
    );

    useAssistantToolbar(toolbarConfig);

    return (
        <div className="space-y-6 text-depth-primary">

            <div className="overflow-y-auto rounded-depth-lg border border-depth bg-depth-card shadow-depth-lg lg:max-h-[48rem]">
                {isLoading && (
                    <div className="flex items-center justify-center gap-3 py-10 text-depth-secondary">
                        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[var(--depth-color-primary)] border-t-transparent" />
                        Memuat data praktikan...
                    </div>
                )}

                {isError && !isLoading && (
                    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center text-red-400">
                        <p>{error?.message ?? "Gagal memuat data praktikan."}</p>
                        <button
                            type="button"
                            onClick={() => queryClient.invalidateQueries({ queryKey: ASSIGNED_PRAKTIKAN_QUERY_KEY })}
                            className="rounded-depth-md bg-[var(--depth-color-primary)] px-4 py-2 text-sm font-semibold text-white shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
                        >
                            Coba Lagi
                        </button>
                    </div>
                )}

                {!isLoading && !isError && filteredAssignments.length === 0 && (
                    <div className="py-12 text-center text-depth-secondary">
                        Belum ada praktikan yang siap dinilai.
                    </div>
                )}

                {!isLoading && !isError && filteredAssignments.length > 0 && (
                    <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
                        {filteredAssignments.map((assignment) => {

                            const feedbackText =
                                (assignment?.pesan && assignment.pesan.trim()) || "Belum ada feedback";
                            const nilai = assignment?.nilai ?? null;
                            const formattedPraktikumRating = normalizeRating(assignment?.rating_praktikum);
                            const formattedAsistenRating = normalizeRating(assignment?.rating_asisten);
                            const isMarked = Boolean(assignment?.nilai);
                            const praktikanName = assignment?.praktikan?.nama ?? "Tidak diketahui";
                            const praktikanClass = assignment?.praktikan?.kelas?.nama ?? "-";
                            const praktikanNim = assignment?.praktikan?.nim ?? "-";
                            const displayDate = toDisplayDate(assignment?.datetime?.date);
                            const displayTime = toDisplayTime(assignment?.datetime?.time);

                            return (
                                <article
                                    key={assignment.id}
                                    className="group relative flex flex-col overflow-hidden rounded-depth-lg border border-depth bg-depth-card shadow-depth-md transition hover:shadow-depth-lg"
                                >
                                    {/* ── Card header: NIM + status badge ── */}
                                    <div className="flex items-center justify-between border-b border-depth bg-depth-background/60 px-4 py-2.5">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                className="h-3.5 w-3.5 rounded border-depth bg-depth-card text-[var(--depth-color-primary)] focus:ring-[var(--depth-color-primary)]"
                                                checked={selectedAssignmentIds.includes(assignment.id)}
                                                onChange={() => handleToggleAssignmentSelection(assignment.id)}
                                                aria-label={`Pilih ${praktikanName}`}
                                            />
                                            <span className="text-sm font-bold tracking-wide text-depth-primary">
                                                {praktikanNim}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            {getFirstComplaintForNilai(assignment?.nilai?.id) && (
                                                <button
                                                    type="button"
                                                    onClick={() => setComplaintModal(getFirstComplaintForNilai(assignment?.nilai?.id))}
                                                    className="relative inline-flex h-7 w-7 items-center justify-center rounded-depth-md border border-depth bg-depth-interactive shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
                                                    aria-label="Lihat komplain nilai"
                                                >
                                                    <svg className="h-3.5 w-3.5 text-depth-primary" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12h-8v-2h8v2zm0-3h-8V9h8v2zm0-3H6V6h12v2z" />
                                                    </svg>
                                                    {getPendingComplaintsForNilai(assignment?.nilai?.id) > 0 && (
                                                        <span className="absolute -right-1.5 -top-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white">
                                                            {getPendingComplaintsForNilai(assignment?.nilai?.id)}
                                                        </span>
                                                    )}
                                                </button>
                                            )}
                                            <span
                                                className={`inline-flex items-center rounded-depth-full px-2 py-0.5 text-[10px] font-semibold ${isMarked
                                                    ? "border border-emerald-400/50 bg-emerald-400/15 text-emerald-300"
                                                    : "border border-amber-400/50 bg-amber-400/15 text-amber-300"
                                                    }`}
                                            >
                                                {isMarked ? "Dinilai" : "Pending"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* ── Card body ── */}
                                    <div className="flex flex-1 flex-col gap-3 px-4 py-3">
                                        {/* Avatar + info */}
                                        <div className="flex items-center gap-3">
                                            {assignment?.praktikan?.profile_picture_url ? (
                                                <img
                                                    src={assignment.praktikan.profile_picture_url}
                                                    alt={praktikanName}
                                                    className="h-11 w-11 flex-shrink-0 rounded-full border border-depth object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-depth bg-depth-interactive">
                                                    <svg className="h-6 w-6 text-depth-secondary" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                                                    </svg>
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-xs font-semibold text-depth-primary">{praktikanName}</p>
                                                <p className="text-[11px] text-depth-secondary">
                                                    Praktikum: {formattedPraktikumRating ?? "-"} / Asisten: {formattedAsistenRating ?? "-"}
                                                </p>
                                                {/* Shift & date chips */}
                                                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                                    <span className="inline-flex items-center gap-1 rounded-depth-full border border-depth bg-depth-interactive/60 px-2 py-0.5 text-[10px] font-medium text-depth-secondary">
                                                        <svg className="h-2.5 w-2.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                            <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                                                        </svg>
                                                        {displayDate}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 rounded-depth-full border border-depth bg-depth-interactive/60 px-2 py-0.5 text-[10px] font-medium text-depth-secondary">
                                                        <svg className="h-2.5 w-2.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                            <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
                                                        </svg>
                                                        {praktikanClass} · {displayTime}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Score grid – 4 cols × 2 rows */}
                                        <div className="grid grid-cols-4 gap-1.5">
                                            {SCORE_FIELDS.map((field) => (
                                                <div
                                                    key={`${assignment.id}-${field.key}`}
                                                    className="flex flex-col items-center rounded-depth-md border border-depth bg-depth-interactive/60 py-1"
                                                >
                                                    <span className="text-[9px] font-semibold uppercase tracking-wider text-depth-secondary">
                                                        {field.label}
                                                    </span>
                                                    <span className="text-sm font-bold text-depth-primary">
                                                        {getScoreValue(nilai, field.key)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                        {/* Feedback */}
                                        <ExpandableFeedback text={feedbackText} />
                                    </div>
                                    {/* ── Card footer: action buttons ── */}
                                    <div className="flex items-center gap-2 border-t border-depth bg-depth-background/40 px-4 py-2.5">
                                        <button
                                            type="button"
                                            onClick={() => handleOpenModalInput(assignment)}
                                            className="flex flex-1 items-center justify-center gap-1.5 rounded-depth-md border border-depth bg-depth-interactive px-3 py-2 text-xs font-semibold text-depth-primary shadow-depth-sm transition hover:-translate-y-0.5 hover:border-[var(--depth-color-primary)] hover:text-[var(--depth-color-primary)] hover:shadow-depth-md"
                                        >
                                            <img src={editIcon} alt="" className="edit-icon-filter h-3.5 w-3.5" />
                                            Edit Grade
                                        </button>

                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>

            <ShortcutWindow
                open={isWorkspaceOpen}
                onClose={handleWorkspaceClose}
                selectedAssignments={selectedSummaryAssignments}
                onRemoveAssignment={handleClearSelection}
                onClearAssignments={handleClearAllSelections}
                scoreFields={SCORE_FIELDS}
                formatScoreValue={getScoreValue}
            />

            {modalAssignment && (
                <Suspense fallback={null}>
                    <ModalInputNilai
                        onClose={handleCloseModalInput}
                        assignment={modalAssignment}
                        asistenId={asisten?.id}
                        onSaved={handleSaved}
                    />
                </Suspense>
            )}

            {complaintModal && (
                <Suspense fallback={null}>
                    <ModalNilaiComplaintAsisten
                        isOpen={Boolean(complaintModal)}
                        onClose={() => setComplaintModal(null)}
                        complaint={complaintModal}
                        onUpdated={() => {
                            queryClient.invalidateQueries({ queryKey: ['nilai-complaints-asisten'] });
                            setComplaintModal(null);
                        }}
                    />
                </Suspense>
            )}
        </div>
    );
}
