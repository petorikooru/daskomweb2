import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import iconPPT from "../../../../assets/practicum/iconPPT.svg";
import iconVideo from "../../../../assets/practicum/iconVideo.svg";
import iconModule from "../../../../assets/practicum/iconModule.svg";

import MarkdownRenderer from "@/Components/MarkdownRenderer";
import { ModalOverlay } from "@/Components/Common/ModalPortal";
import ModalCloseButton from "@/Components/Common/ModalCloseButton";
import DepthToggleButton from "@/Components/Common/DepthToggleButton";
import { useModulesQuery, MODULES_QUERY_KEY } from "@/hooks/useModulesQuery";
import { api } from "@/lib/api";

const normalizeBooleanFlag = (value) => {
    if (typeof value === "boolean")
        return value;
    if (typeof value === "number")
        return value === 1;
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        return normalized === "1" || normalized === "true";
    }

    return false;
};

const toNumericFlag = (value) =>
    normalizeBooleanFlag(value) ? 1 : 0;

const getPayload = (module) => ({
    judul: module.judul ?? "",
    deskripsi: module.deskripsi ?? "",
    isEnglish: toNumericFlag(module.isEnglish),
    isUnlocked: toNumericFlag(module.isUnlocked),
    modul_link: module.modul_link ?? "",
    ppt_link: module.ppt_link ?? "",
    video_link: module.video_link ?? "",
});

const inputClass =
    "w-full rounded-depth-md border border-depth bg-depth-card px-3 py-2 " +
    "text-sm text-depth-primary outline-none transition " +
    "placeholder:text-depth-secondary/50 " +
    "focus:border-[var(--depth-color-primary)] " +
    "focus:ring-2 focus:ring-[var(--depth-color-primary)]/20";

const buttonClass =
    "inline-flex items-center justify-center gap-1.5 rounded-depth-md " +
    "border border-depth bg-depth-interactive px-3 py-2 text-xs font-semibold " +
    "text-depth-primary shadow-depth-sm transition " +
    "hover:-translate-y-0.5 hover:shadow-depth-md " +
    "disabled:cursor-not-allowed disabled:opacity-50";

function Icon({ name, size = 16 }) {
    const props = {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.8,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": true,
    };

    const icons = {
        down: <path d="m6 9 6 6 6-6" />,
        up: <path d="m18 15-6-6-6 6" />,

        lock: (
            <>
                <rect x="5" y="10" width="14" height="10" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                <path d="M12 14v2" />
            </>
        ),

        unlock: (
            <>
                <rect x="5" y="10" width="14" height="10" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 7.5-2" />
                <path d="M12 14v2" />
            </>
        ),

        language: (
            <>
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18" />
                <path d="M12 3c2.3 2.5 3.5 5.5 3.5 9s-1.2 6.5-3.5 9" />
                <path d="M12 3C9.7 5.5 8.5 8.5 8.5 12s1.2 6.5 3.5 9" />
            </>
        ),

        edit: (
            <>
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
            </>
        ),

        save: (
            <>
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
                <path d="M17 21v-8H7v8" />
                <path d="M7 3v5h8" />
            </>
        ),

        close: (
            <>
                <path d="m6 6 12 12" />
                <path d="m18 6-12 12" />
            </>
        ),

        trash: (
            <>
                <path d="M3 6h18" />
                <path d="M8 6V4h8v2" />
                <path d="m19 6-1 15H6L5 6" />
                <path d="M10 11v6M14 11v6" />
            </>
        ),
    };

    return <svg {...props}>{icons[name]}</svg>;
}

export default function TableModule() {
    const queryClient = useQueryClient();

    const [openIndex, setOpenIndex] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [draft, setDraft] = useState(null);

    const [selectedModuleIds, setSelectedModuleIds] = useState(
        new Set(),
    );

    const [moduleToDelete, setModuleToDelete] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const {
        data: modules = [],
        isLoading: modulesLoading,
        isError: modulesError,
        error: modulesQueryError,
    } = useModulesQuery();

    useEffect(() => {
        setSelectedModuleIds((previous) => {
            const next = new Set();

            modules.forEach((module) => {
                const id = String(module.idM);

                if (previous.has(id)) {
                    next.add(id);
                }
            });

            return next;
        });
    }, [modules]);

    const updateCache = (updatedModule) => {
        queryClient.setQueryData(
            MODULES_QUERY_KEY,
            (previous) => {
                if (!Array.isArray(previous)) return previous;

                return previous.map((module) =>
                    module.idM === updatedModule.idM
                        ? { ...module, ...updatedModule }
                        : module,
                );
            },
        );
    };

    const updateMutation = useMutation({
        mutationFn: async ({ id, payload }) => {
            const { data } = await api.patch(
                `/api-v1/modul/${id}`,
                payload,
            );

            return data?.data ?? null;
        },

        onSuccess: (updatedModule, variables) => {
            if (updatedModule) {
                updateCache(updatedModule);
            } else {
                queryClient.invalidateQueries({
                    queryKey: MODULES_QUERY_KEY,
                });
            }

            setEditingId(null);
            setDraft(null);

            toast.success(
                variables?.message ??
                    "Modul berhasil diperbarui.",
            );
        },

        onError: (error) => {
            toast.error(
                error?.response?.data?.message ??
                    error?.message ??
                    "Gagal memperbarui modul.",
            );
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            await api.delete(`/api-v1/modul/${id}`);
        },

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: MODULES_QUERY_KEY,
            });

            setIsDeleteModalOpen(false);
            setModuleToDelete(null);

            toast.success("Modul berhasil dihapus.");
        },

        onError: (error) => {
            toast.error(
                error?.response?.data?.message ??
                    error?.message ??
                    "Gagal menghapus modul.",
            );

            setIsDeleteModalOpen(false);
        },
    });

    const bulkMutation = useMutation({
        mutationFn: async ({ payload }) => {
            await api.patch(
                "/api-v1/modul/bulk-update",
                payload,
            );
        },

        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: MODULES_QUERY_KEY,
            });

            setSelectedModuleIds(new Set());

            toast.success(
                variables?.message ??
                    "Modul berhasil diperbarui.",
            );
        },

        onError: (error) => {
            toast.error(
                error?.response?.data?.message ??
                    error?.message ??
                    "Gagal memperbarui modul.",
            );
        },
    });

    const openModule = (index) => {
        setOpenIndex((current) => current === index ? null : index);
    };

    const startEditing = (module) => {
        const index = modules.findIndex(
            (item) => item.idM === module.idM,
        );

        setOpenIndex(index);
        setEditingId(module.idM);
        setDraft({ ...module });
    };

    const cancelEditing = () => {
        setEditingId(null);
        setDraft(null);
    };

    const updateDraft = (field, value) => {
        setDraft((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const saveEditing = () => {
        if (!draft?.idM) return;

        if (!draft.judul?.trim()) {
            toast.error("Judul modul tidak boleh kosong.");
            return;
        }

        updateMutation.mutate({
            id: draft.idM,
            payload: getPayload(draft),
            message: "Modul berhasil disimpan.",
        });
    };

    const toggleUnlocked = (module) => {
        updateMutation.mutate({
            id: module.idM,
            payload: {
                ...getPayload(module),
                isUnlocked: normalizeBooleanFlag(module.isUnlocked) ? 0 : 1,
            },
            message: normalizeBooleanFlag(module.isUnlocked)
                ? "Modul berhasil dikunci."
                : "Modul berhasil dibuka.",
        });
    };

    const toggleEnglish = (module) => {
        updateMutation.mutate({
            id: module.idM,
            payload: {
                ...getPayload(module),
                isEnglish: normalizeBooleanFlag(module.isEnglish) ? 0 : 1,
            },
            message: normalizeBooleanFlag(module.isEnglish)
                ? "Modul dikembalikan ke reguler."
                : "Modul ditandai sebagai English.",
        });
    };

    const toggleSelection = (id) => {
        const key = String(id);

        setSelectedModuleIds((previous) => {
            const next = new Set(previous);

            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }

            return next;
        });
    };

    const selectAll = () => {
        setSelectedModuleIds(
            new Set(
                modules.map((module) =>
                    String(module.idM)
                )
            )
        );
    };

    const clearSelection = () => {
        setSelectedModuleIds(new Set());
    };

    const handleBulkAction = (changes, message) => {
        if (!selectedModuleIds.size) {
            toast.error("Pilih modul terlebih dahulu.");
            return;
        }

        const payload = [...selectedModuleIds].map((id) => {
            const module =
                modules.find(
                    (item) => String(item.idM) === id,
                ) ?? {};

            return {
                id: Number(id),
                ...getPayload({
                    ...module,
                    ...changes,
                }),
            };
        });

        bulkMutation.mutate({
            payload,
            message,
        });
    };

    const askDelete = (id) => {
        setModuleToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const cancelDelete = () => {
        setModuleToDelete(null);
        setIsDeleteModalOpen(false);
    };

    const confirmDelete = () => {
        if (moduleToDelete) {
            deleteMutation.mutate(moduleToDelete);
        }
    };

    const selectedCount = selectedModuleIds.size;

    return (
        <div className="space-y-4">
            <Toolbar
                count={modules.length}
                selectedCount={selectedCount}
                loading={bulkMutation.isPending}
                onSelectAll={selectAll}
                onClear={clearSelection}
                onBulkAction={handleBulkAction}
            />

            <div className="h-[76vh] overflow-y-auto rounded-depth-lg border border-depth bg-depth-card shadow-depth-lg">
                {modulesLoading && (
                    <EmptyState text="Memuat data..." />
                )}

                {modulesError && (
                    <EmptyState error text={modulesQueryError?.message ?? "Gagal memuat data modul."}/>
                )}

                {!modulesLoading &&
                    !modulesError &&
                    modules.length === 0 && (
                        <EmptyState text="Tidak ada modul yang tersedia." />
                    )}

                {!modulesLoading &&
                    !modulesError &&
                    modules.length > 0 && (
                        <div className="divide-y divide-[color:var(--depth-border)]">
                            {modules.map((module, index) => (
                                <ModuleRow
                                    key={`module-${module.idM}`}
                                    module={module}
                                    isOpen={openIndex === index}
                                    isEditing={editingId === module.idM}
                                    isSelected={selectedModuleIds.has(String(module.idM))}
                                    draft={editingId === module.idM ? draft : module}
                                    isSaving={ updateMutation.isPending && editingId === module.idM}
                                    onToggle={() => openModule(index)}
                                    onSelect={() => toggleSelection(module.idM)}
                                    onEdit={() => startEditing(module)}
                                    onCancel={cancelEditing}
                                    onSave={saveEditing}
                                    onChange={updateDraft}
                                    onToggleUnlocked={() => toggleUnlocked(module)}
                                    onToggleEnglish={() => toggleEnglish(module)}
                                    onDelete={() => askDelete(module.idM)}
                                />
                            ))}
                        </div>
                    )}
            </div>

            {isDeleteModalOpen && (
                <ModalOverlay
                    onClose={cancelDelete}
                    className="depth-modal-overlay z-50"
                >
                    <div className="depth-modal-container max-w-sm space-y-4 text-center">
                        <div className="depth-modal-header justify-center">
                            <h2 className="depth-modal-title">
                                Konfirmasi Hapus
                            </h2>

                            <ModalCloseButton
                                onClick={cancelDelete}
                                ariaLabel="Tutup konfirmasi hapus modul"
                            />
                        </div>

                        <p className="text-sm text-depth-secondary">
                            Apakah Anda yakin ingin menghapus
                            modul ini?
                        </p>

                        <div className="flex justify-center gap-3">
                            <button
                                type="button"
                                onClick={cancelDelete}
                                className={buttonClass}
                            >
                                Batal
                            </button>

                            <button
                                type="button"
                                onClick={confirmDelete}
                                disabled={deleteMutation.isPending}
                                className="inline-flex items-center gap-1.5 rounded-depth-md border border-red-500/60 bg-red-500/10 px-5 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/15 disabled:opacity-50"
                            >
                                <Icon name="trash" size={14} />
                                {deleteMutation.isPending ? "Menghapus..." : "Hapus"}
                            </button>
                        </div>
                    </div>
                </ModalOverlay>
            )}
        </div>
    );
}

function Toolbar({
    count,
    selectedCount,
    loading,
    onSelectAll,
    onClear,
    onBulkAction,
}) {
    const hasSelection = selectedCount > 0;

    return (
        <div className="rounded-depth-lg border border-depth bg-depth-card px-4 py-3 shadow-depth-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Module Count */}
                <div>
                    <p className="text-sm font-semibold text-depth-primary">
                        {hasSelection
                            ? `${selectedCount} Modul dipilih`
                            : `${count} Modul tersedia`}
                    </p>
                </div>

                {/* Bulk Actions */}
                <div
                    className={`grid ${ hasSelection ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0" }`}
                >
                    <div className="min-h-0 overflow-hidden">
                        <div
                            className={`flex flex-wrap gap-2 transition-transform duration-300 ease-out ${
                                hasSelection
                                    ? "translate-y-0"
                                    : "-translate-y-2"
                            }`}
                        >
                            <IconButton
                                icon="unlock"
                                label="Unlock"
                                loading={loading}
                                onClick={() =>
                                    onBulkAction(
                                        { isUnlocked: 1 },
                                        "Modul berhasil dibuka."
                                    )
                                }
                                color="green"
                            />

                            <IconButton
                                icon="lock"
                                label="Lock"
                                loading={loading}
                                onClick={() =>
                                    onBulkAction(
                                        { isUnlocked: 0 },
                                        "Modul berhasil dikunci."
                                    )
                                }
                            />

                            <IconButton
                                icon="language"
                                label="English"
                                loading={loading}
                                onClick={() =>
                                    onBulkAction(
                                        { isEnglish: 1 },
                                        "Modul ditandai English."
                                    )
                                }
                                color="blue"
                            />

                            <IconButton
                                icon="language"
                                label="Reguler"
                                loading={loading}
                                onClick={() =>
                                    onBulkAction(
                                        { isEnglish: 0 },
                                        "Modul ditandai reguler."
                                    )
                                }
                            />
                        </div>
                    </div>
                </div>

                {/* Selection Actions */}
                <div className="flex gap-2">
                    {hasSelection && (
                        <button
                            type="button"
                            onClick={onClear}
                            className={`${buttonClass} animate-in fade-in slide-in-from-right-2 duration-300`}
                        >
                            Bersihkan
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={onSelectAll}
                        disabled={count === 0 || selectedCount === count}
                        className={buttonClass}
                    >
                        Pilih Semua
                    </button>
                </div>
            </div>
        </div>
    );
}

function ModuleRow({
    module,
    isOpen,
    isEditing,
    isSelected,
    draft,
    isSaving,
    onToggle,
    onSelect,
    onEdit,
    onCancel,
    onSave,
    onChange,
    onToggleUnlocked,
    onToggleEnglish,
    onDelete,
}) {
    const currentModule = isEditing ? draft : module;

    const unlocked = normalizeBooleanFlag(currentModule?.isUnlocked);
    const english = normalizeBooleanFlag(currentModule?.isEnglish);

    return (
        <article
            className={`relative ${
                isOpen
                    ? "bg-depth-interactive/20"
                    : "hover:bg-depth-interactive/40"
            }`}
        >
            {/* Header */}
            <div className={`sticky top-0 z-30 border-b border-depth bg-depth-card`}>
                {/* Left Side */}
                <div className="flex items-center gap-3 px-4 py-3 md:px-5">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={onSelect}
                        onClick={(event) => event.stopPropagation()}
                        className="h-4 w-4 shrink-0 rounded border-depth text-[var(--depth-color-primary)] focus:ring-[var(--depth-color-primary)]"
                    />

                    <button
                        type="button"
                        onClick={onToggle}
                        className="min-w-0 flex-1 text-left"
                    >
                        <div className="flex min-w-0 items-center gap-2">
                            <div
                                className={`inline-flex shrink-0 items-center gap-1.5 rounded-depth-full border px-2.5 py-1 ${
                                    unlocked
                                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                                        : "border-red-500/30 bg-red-500/10 text-red-400"
                                }`}
                            >
                                <Icon
                                    name={unlocked ? "unlock" : "lock"}
                                    size={14}
                                />

                                <span className="text-[11px] font-semibold">
                                    {unlocked ? "Terbuka" : "Terkunci"}
                                </span>
                            </div>

                            <h3 className="truncate text-sm font-semibold text-depth-primary md:text-base">
                                {currentModule?.judul || "Tanpa judul"}
                            </h3>

                            {english && (
                                <span className="hidden shrink-0 rounded-depth-full border border-blue-500/40 bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-400 sm:inline-flex">
                                    ENGLISH
                                </span>
                            )}
                        </div>
                    </button>

                    {/* Right Side */}
                    <div
                        className="flex shrink-0 items-center gap-2"
                        onClick={(event) => event.stopPropagation()}
                    >
                        {isOpen && (
                            <>
                                {!isEditing && (
                                    <IconButton
                                        icon="edit"
                                        label="Ubah modul"
                                        onClick={onEdit}
                                    />
                                )}

                                <IconButton
                                    icon="language"
                                    label={english ? "Ubah ke Reguler" : "Ubah ke English"}
                                    onClick={isEditing ? () => onChange("isEnglish", english ? 0 : 1) : onToggleEnglish}
                                    disabled={isSaving}
                                    color={english ? "blue" : undefined}
                                />
                            </>
                        )}

                        <DepthToggleButton
                            label={unlocked ? "Unlocked" : "Locked"}
                            isOn={unlocked}
                            onToggle={onToggleUnlocked}
                            disabled={isSaving}
                        />

                        <button
                            type="button"
                            onClick={onToggle}
                            aria-label={isOpen ? "Tutup modul" : "Buka modul"}
                            className="ml-1 flex h-8 w-8 items-center justify-center rounded-depth-md text-depth-secondary transition hover:bg-depth-interactive hover:text-depth-primary"
                        >
                            <Icon name={isOpen ? "up" : "down"} size={17}/>
                        </button>
                    </div>
                </div>
            </div>

            {isOpen && (
                <div className="px-4 pb-6 pt-4 md:px-5">
                    {isEditing ? (
                        <ModuleEditor
                            draft={draft}
                            isSaving={isSaving}
                            onChange={onChange}
                            onSave={onSave}
                            onCancel={onCancel}
                            onDelete={onDelete}
                        />
                    ) : (
                        <ModulePreview module={module} />
                    )}
                </div>
            )}
        </article>
    );
}

function ModulePreview({ module }) {
    return (
        <div className="space-y-5">
            <section>
                <SectionLabel>
                    Pencapaian Pembelajaran
                </SectionLabel>

                <div className="rounded-depth-md border border-depth bg-depth-interactive/20 p-4 md:p-5">
                    {module.deskripsi ? (
                        <MarkdownRenderer
                            content={module.deskripsi}
                        />
                    ) : (
                        <p className="text-sm italic text-depth-secondary">
                            Belum ada poin pembelajaran.
                        </p>
                    )}
                </div>
            </section>

            <section>
                <SectionLabel>
                    Sumber Pembelajaran
                </SectionLabel>

                <div className="grid gap-2 sm:grid-cols-3">
                    <ResourceLink
                        href={module.ppt_link}
                        icon={iconPPT}
                        label="PPT"
                        tone="green"
                    />

                    <ResourceLink
                        href={module.video_link}
                        icon={iconVideo}
                        label="Video"
                        tone="red"
                    />

                    <ResourceLink
                        href={module.modul_link}
                        icon={iconModule}
                        label="Modul"
                        tone="blue"
                    />
                </div>
            </section>
        </div>
    );
}

function ModuleEditor({
    draft,
    isSaving,
    onChange,
    onSave,
    onCancel,
    onDelete,
}) {
    return (
        <div className="overflow-hidden rounded-depth-lg border border-depth">
            <div className="space-y-5 p-4 md:p-5">
                <EditorField label="Judul Modul">
                    <input
                        value={draft?.judul ?? ""}
                        onChange={(event) => onChange("judul", event.target.value)}
                        className={inputClass}
                        placeholder="Judul modul..."
                        disabled={isSaving}
                    />
                </EditorField>

                <EditorField
                    label="Pencapaian Pembelajaran"
                    hint="Markdown"
                >
                    <div className="grid gap-3 lg:grid-cols-2">
                        <textarea
                            value={draft?.deskripsi ?? ""}
                            onChange={(event) => onChange("deskripsi", event.target.value) }
                            rows={12}
                            disabled={isSaving}
                            className={`${inputClass} resize-y font-mono text-xs leading-5`}
                            placeholder="# Pencapaian Pembelajaran"
                        />

                        <div className="min-h-[12rem] overflow-auto rounded-depth-md border border-depth bg-depth-interactive/20 p-4">
                            <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-depth-secondary">
                                Preview
                            </p>

                            {draft?.deskripsi ? (
                                <MarkdownRenderer content={draft.deskripsi}/>
                            ) : (
                                <p className="text-sm italic text-depth-secondary">
                                    Preview akan muncul
                                    di sini.
                                </p>
                            )}
                        </div>
                    </div>
                </EditorField>

                <EditorField label="Sumber Pembelajaran">
                    <div className="space-y-2">
                        <LinkInput
                            label="PPT"
                            value={draft?.ppt_link}
                            onChange={(value) => onChange("ppt_link", value)}
                        />

                        <LinkInput
                            label="Video"
                            value={draft?.video_link}
                            onChange={(value) => onChange("video_link", value)
                            }
                        />

                        <LinkInput
                            label="Modul"
                            value={draft?.modul_link}
                            onChange={(value) => onChange("modul_link", value)}
                        />
                    </div>
                </EditorField>
            </div>

            <div className="flex items-center justify-between border-t border-depth px-4 py-3">
                <button
                    type="button"
                    onClick={onDelete}
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-depth-md px-4 py-2 bg-red-400/80 text-white transition hover:bg-red-400/100 hover:-translate-y-0.5 disabled:opacity-50"
                >
                    <Icon name="trash" size={14} />
                    Hapus
                </button>

                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSaving}
                        className={buttonClass}
                    >
                        <Icon name="close" size={14} />
                        Batal
                    </button>

                    <button
                        type="button"
                        onClick={onSave}
                        disabled={isSaving}
                        className="inline-flex items-center gap-1.5 rounded-depth-md border border-[var(--depth-color-primary)] bg-[var(--depth-color-primary)] px-4 py-2 text-xs font-bold text-white shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md disabled:opacity-50"
                    >
                        <Icon name="save" size={14} />
                        {isSaving ? "Menyimpan..." : "Simpan"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function IconButton({
    icon,
    label,
    onClick,
    disabled,
    loading = false,
    danger = false,
    color,
}) {
    const colorClass = danger
        ? "border-red-500/40 bg-red-500/5 text-red-400 hover:bg-red-500/10"
        : color === "green"
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
          : color === "blue"
            ? "border-blue-500/40 bg-blue-500/10 text-blue-400"
            : "border-depth bg-depth-interactive text-depth-secondary hover:text-depth-primary";

    return (
        <button
            type="button"
            title={label}
            aria-label={label}
            onClick={onClick}
            disabled={disabled || loading}
            className={`
                flex h-8 items-center justify-center gap-1.5
                rounded-depth-md border px-2
                transition-all duration-200
                hover:-translate-y-0.5
                ${colorClass}
                disabled:cursor-not-allowed
                disabled:opacity-50
            `}
        >
            <Icon
                name={icon}
                size={15}
            />

            <span className="px-1 text-xs font-bold">
                {label}
            </span>
        </button>
    );
}

function EditorField({ label, hint, children }) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-wider text-depth-secondary">
                    {label}
                </label>

                {hint && (
                    <span className="text-[10px] text-depth-secondary">
                        {hint}
                    </span>
                )}
            </div>

            {children}
        </div>
    );
}

function LinkInput({ label, value, onChange }) {
    return (
        <label className="flex items-center gap-2">
            <span className="w-12 shrink-0 text-xs font-semibold text-depth-secondary">
                {label}
            </span>

            <input
                type="url"
                value={value ?? ""}
                onChange={(event) =>
                    onChange(event.target.value)
                }
                className={inputClass}
                placeholder={`URL ${label}...`}
            />
        </label>
    );
}

function SectionLabel({ children }) {
    return (
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-depth-secondary">
            {children}
        </p>
    );
}

function ResourceLink({
    href,
    icon,
    label,
    tone,
}) {
    if (!href) {
        return (
            <span className="rounded-depth-md border border-depth bg-depth-interactive/30 px-3 py-2 text-sm text-depth-secondary">
                {label} belum tersedia
            </span>
        );
    }

    const toneClass = {
        green: "bg-green-500/10 text-green-400",
        red: "bg-red-500/10 text-red-400",
        blue: "bg-blue-500/10 text-blue-400",
    }[tone];

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-depth-md border border-depth bg-depth-interactive px-3 py-2 text-sm font-semibold text-depth-primary shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
        >
            <span className={`flex h-7 w-7 items-center justify-center rounded-depth-full ${toneClass}`}>
                <img src={icon} alt="" className="h-4 w-4"/>
            </span>
            {label}
        </a>
    );
}

function EmptyState({ text, error = false }) {
    return (
        <div className={`px-6 py-12 text-center text-sm ${error ? "text-red-400" : "text-depth-secondary"}`}>
            {text}
        </div>
    );
}
