import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSoalQuery, soalQueryKey } from "@/hooks/useSoalQuery";
import { useSoalComparison } from "@/hooks/useSoalComparison";
import { send } from "@/lib/http";
import { getSoalController } from "@/lib/soalControllers";
import { ModalOverlay } from "@/Components/Common/ModalPortal";
import ModalCloseButton from "@/Components/Common/ModalCloseButton";
import ModalBatchEditSoal from "../Modals/ModalBatchEditSoal";
import SoalCommentsButton from "./SoalCommentsButton";
import SoalMarkdownEditor from "./SoalMarkdownEditor";
import MarkdownRenderer from "../../MarkdownRenderer";
import trashIcon from "../../../../assets/nav/Icon-Delete.svg";
import editIcon from "../../../../assets/nav/Icon-Edit.svg";
import toast from "react-hot-toast";

const getModuleId = (m) => {
    const id = m?.idM ?? m?.id ?? m?.value ?? m?.uuid ?? m?.ID;
    return id == null ? "" : String(id);
};

export default function SoalInputEssay({
    kategoriSoal,
    modul,
    modules = [],
    onModalSuccess,
    onModalValidation,
    isEditable = true,
}) {
    const queryClient = useQueryClient();
    const [addSoal, setAddSoal] = useState({ soal: "" });
    const [enableFileUploadNew, setEnableFileUploadNew] = useState(false);
    const [isAddingSoal, setIsAddingSoal] = useState(false);
    const [editingSoal, setEditingSoal] = useState(null);
    const [deleteCandidate, setDeleteCandidate] = useState(null);
    const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
    const [batchState, setBatchState] = useState({
        regularModuleId: "",
        englishModuleId: "",
    });

    const regularModules = useMemo(
        () => modules.filter((m) => Number(m?.isEnglish ?? 0) !== 1),
        [modules],
    );
    const englishModules = useMemo(
        () => modules.filter((m) => Number(m?.isEnglish ?? 0) === 1),
        [modules],
    );

    const soalQuery = useSoalQuery(kategoriSoal, modul);
    const soalList = soalQuery.data ?? [];
    const soalLoading = soalQuery.isLoading;
    const soalError = soalQuery.isError;
    const soalQueryError = soalQuery.error;
    const controller = getSoalController(kategoriSoal);

    const supportsFileUpload = useMemo(
        () => ["tp", "jurnal", "fitb"].includes(kategoriSoal),
        [kategoriSoal]
    );

    const invalidate = (moduleId = modul) => {
        if (!moduleId) return;
        queryClient.invalidateQueries({
            queryKey: soalQueryKey(kategoriSoal, String(moduleId)),
        });
    };

    const postSoalMutation = useMutation({
        mutationFn: async (payload) => {
            if (!controller)
                throw new Error(`Kategori soal tidak didukung: ${kategoriSoal}`);
            return (await send(controller.store(modul), payload)).data;
        },
        onSuccess: () => {
            invalidate();
            onModalSuccess?.();
        },
        onError: (error) => {
            console.error("Error posting soal:", error);
            toast.error(
                error?.response?.data?.message ??
                    error?.message ??
                    "Gagal menambahkan soal.",
            );
        },
    });

    const putSoalMutation = useMutation({
        mutationFn: async ({ soalId, payload }) => {
            if (!controller)
                throw new Error(`Kategori soal tidak didukung: ${kategoriSoal}`);
            return (await send(controller.update(soalId), payload)).data;
        },
        onSuccess: (_, variables) => {
            const previous = variables?.previousModulKey ?? modul;
            const next = variables?.nextModulKey ?? previous;
            if (previous) invalidate(previous);
            if (next && next !== previous) invalidate(next);
        },
        onError: (error) => {
            console.error("Error updating soal:", error);
            toast.error(
                error?.response?.data?.message ??
                    error?.message ??
                    "Gagal memperbarui soal.",
            );
        },
    });

    const deleteSoalMutation = useMutation({
        mutationFn: async (soalId) => {
            if (!controller)
                throw new Error(`Kategori soal tidak didukung: ${kategoriSoal}`);
            await send(controller.destroy(soalId));
        },
        onSuccess: () => {
            invalidate();
            setDeleteCandidate(null);
            toast.success("Soal berhasil dihapus!");
        },
        onError: (error) => {
            console.error("Error deleting soal:", error);
            toast.error(
                error?.response?.data?.message ??
                    error?.message ??
                    "Gagal menghapus soal.",
            );
        },
    });

    const syncBatchModule = async ({ modulId, items }) => {
        if (!controller)
            throw new Error(`Kategori soal tidak didukung: ${kategoriSoal}`);

        const targetModulId = Number(modulId);
        if (!targetModulId || Number.isNaN(targetModulId))
            throw new Error("Modul belum dipilih.");

        for (const item of items ?? []) {
            const soalId = item?.id ?? null;
            const deleted = Boolean(item?._deleted);
            const soal = String(item?.soal ?? "").trim();

            if (soalId) {
                if (deleted) {
                    await send(controller.destroy(soalId));
                    continue;
                }

                if (!soal)
                    throw new Error(
                        "Soal tidak boleh kosong. Gunakan tombol Hapus jika ingin menghapus soal.",
                    );

                const originalSoal = String(item?.originalSoal ?? "").trim();
                const questionChanged = soal !== originalSoal;
                const uploadChanged =
                    supportsFileUpload &&
                    Boolean(item.enable_file_upload) !==
                        Boolean(item.originalEnableFileUpload);

                if (!questionChanged && !uploadChanged) continue;

                const payload = {
                    modul_id: targetModulId,
                    soal,
                    oldSoal: item.originalSoal ?? soal,
                };

                if (supportsFileUpload)
                    payload.enable_file_upload = Boolean(
                        item.enable_file_upload,
                    );

                await send(controller.update(soalId), payload);
                continue;
            }

            if (!deleted && soal) {
                const payload = { soal };

                if (supportsFileUpload)
                    payload.enable_file_upload = Boolean(
                        item.enable_file_upload,
                    );

                await send(controller.store(targetModulId), payload);
            }
        }
    };

    const batchUpdateMutation = useMutation({
        mutationFn: async ({ regular, english }) => {
            await syncBatchModule(regular);
            await syncBatchModule(english);
        },
        onSuccess: (_, variables) => {
            [
                ...new Set(
                    [
                        variables?.regular?.modulId,
                        variables?.english?.modulId,
                        modul,
                    ]
                        .filter(Boolean)
                        .map(String),
                ),
            ].forEach(invalidate);

            toast.success("Soal modul ID dan EN berhasil diperbarui.");
        },
        onError: (error) => {
            console.error("Error batch updating soal:", error);
            toast.error(
                error?.response?.data?.message ??
                    error?.message ??
                    "Gagal memperbarui soal.",
            );
        },
    });

    const handleOpenTambah = () => {
        setEditingSoal(null);
        setIsAddingSoal(true);
    };

    const handleCancelTambah = () => {
        if (postSoalMutation.isPending) return;
        setIsAddingSoal(false);
        setAddSoal({ soal: "" });
        setEnableFileUploadNew(false);
    };

    const handleTambahSoal = () => {
        if (!modul) {
            onModalValidation?.({
                message: "Pilih modul terlebih dahulu.",
                includeModuleNotice: false,
            });
            return;
        }

        const soal = addSoal.soal.trim();

        if (!soal) {
            onModalValidation?.({
                message: "Isi soal terlebih dahulu sebelum menyimpan.",
                includeModuleNotice: false,
            });
            return;
        }

        postSoalMutation.mutate(
            {
                soal,
                enable_file_upload: supportsFileUpload
                    ? enableFileUploadNew
                    : false,
            },
            {
                onSuccess: () => {
                    setAddSoal({ soal: "" });
                    setEnableFileUploadNew(false);
                    setIsAddingSoal(false);
                    toast.success("Soal berhasil ditambahkan.");
                },
            },
        );
    };

    const handleStartEdit = (item) => {
        setIsAddingSoal(false);

        const originalModulId =
            item?.modul_id ?? (modul ? Number(modul) : null);

        setEditingSoal({
            id: item.id,
            soal: item.soal ?? "",
            modul_id: originalModulId ?? "",
            enable_file_upload: Boolean(item.enable_file_upload),
            originalSoal: item.soal ?? "",
            originalModulId,
        });
    };

    const updateEditingSoal = (field, value) =>
        setEditingSoal((prev) =>
            prev ? { ...prev, [field]: value } : prev,
        );

    const handleCancelEdit = () => {
        if (!putSoalMutation.isPending) setEditingSoal(null);
    };

    const handleConfirmEdit = () => {
        if (!editingSoal?.id || putSoalMutation.isPending) return;

        const soal = editingSoal.soal?.trim() ?? "";
        if (!soal) {
            toast.error("Isi soal terlebih dahulu.");
            return;
        }

        const nextModulId = Number(editingSoal.modul_id);
        if (!nextModulId || Number.isNaN(nextModulId)) {
            toast.error("Pilih modul untuk soal ini.");
            return;
        }

        const previousModulKey =
            editingSoal.originalModulId != null
                ? String(editingSoal.originalModulId)
                : String(modul ?? "");
        const nextModulKey = String(nextModulId);

        const payload = {
            modul_id: nextModulId,
            soal,
            oldSoal: editingSoal.originalSoal ?? soal,
        };

        if (supportsFileUpload)
            payload.enable_file_upload = Boolean(
                editingSoal.enable_file_upload,
            );

        putSoalMutation.mutate(
            {
                soalId: editingSoal.id,
                payload,
                previousModulKey,
                nextModulKey,
            },
            {
                onSuccess: () => {
                    setEditingSoal(null);
                    toast.success("Soal berhasil diperbarui.");
                },
            },
        );
    };

    const handleOpenModalDelete = (item) => setDeleteCandidate(item);

    const handleCancelDelete = () => {
        if (!deleteSoalMutation.isPending) setDeleteCandidate(null);
    };

    const handleConfirmDelete = () => {
        if (!deleteCandidate?.id || deleteSoalMutation.isPending) return;
        deleteSoalMutation.mutate(deleteCandidate.id);
    };

    const handleOpenBatchModal = () => {
        if (!regularModules.length || !englishModules.length) {
            toast.error(
                "Modul Indonesia dan English harus tersedia untuk Batch Edit.",
            );
            return;
        }

        const currentModuleId = modul ? String(modul) : "";
        const currentModule = modules.find(
            (m) => getModuleId(m) === currentModuleId,
        );
        const currentIsEnglish =
            Number(currentModule?.isEnglish ?? 0) === 1;

        setBatchState((prev) => ({
            regularModuleId:
                (!currentIsEnglish && currentModuleId) ||
                prev.regularModuleId ||
                getModuleId(regularModules[0]),
            englishModuleId:
                (currentIsEnglish && currentModuleId) ||
                prev.englishModuleId ||
                getModuleId(englishModules[0]),
        }));

        setIsBatchModalOpen(true);
    };

    const handleCloseBatchModal = () => {
        if (!batchUpdateMutation.isPending) setIsBatchModalOpen(false);
    };

    const handleBatchSubmit = async (payload) => {
        await batchUpdateMutation.mutateAsync(payload);
        setIsBatchModalOpen(false);
    };

    const {
        data: batchComparisonData,
        isLoading: isBatchComparisonLoading,
        isFetching: isBatchComparisonFetching,
    } = useSoalComparison(
        kategoriSoal,
        isBatchModalOpen ? batchState.regularModuleId : null,
        isBatchModalOpen ? batchState.englishModuleId : null,
        {
            enabled:
                isBatchModalOpen &&
                Boolean(
                    kategoriSoal &&
                        batchState.regularModuleId &&
                        batchState.englishModuleId,
                ),
            keepPreviousData: false,
        },
    );

    return (
        <div className="space-y-6 text-depth-primary">
            {isEditable && (
                <div className="flex flex-wrap justify-end gap-3">
                    <button
                        type="button"
                        onClick={handleOpenBatchModal}
                        disabled={!regularModules.length || !englishModules.length}
                        className="rounded-depth-md border border-depth bg-depth-interactive px-6 py-2 text-sm font-semibold text-depth-primary shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Batch Edit ID / EN
                    </button>

                    <button
                        type="button"
                        onClick={handleOpenTambah}
                        disabled={
                            isAddingSoal || postSoalMutation.isPending
                        }
                        className="rounded-depth-md bg-[var(--depth-color-primary)] px-6 py-2 text-sm font-semibold text-white shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isAddingSoal
                            ? "Menambah Soal..."
                            : "+ Tambah Soal"}
                    </button>
                </div>
            )}

            {isEditable && isAddingSoal && (
                <section className="overflow-hidden rounded-depth-lg border border-[var(--depth-color-primary)]/40 bg-depth-card shadow-depth-md">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-depth bg-depth-interactive px-5 py-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-semibold">
                                    Tambah Soal Baru
                                </h3>

                                <span className="rounded-depth-full bg-[var(--depth-color-primary)]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--depth-color-primary)]">
                                    New
                                </span>
                            </div>

                            <p className="mt-1 text-xs text-depth-secondary">
                                Tulis Markdown dan lihat hasil render secara
                                langsung.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleCancelTambah}
                            disabled={postSoalMutation.isPending}
                            className="flex h-8 w-8 items-center justify-center rounded-depth-md border border-depth bg-depth-card text-lg text-depth-secondary transition hover:text-depth-primary disabled:opacity-50"
                            aria-label="Tutup form tambah soal"
                            title="Tutup"
                        >
                            ×
                        </button>
                    </div>

                    <div className="p-5">
                        <SoalMarkdownEditor
                            value={addSoal.soal}
                            onChange={(soal) => setAddSoal({ soal })}
                            placeholder="Tulis soal menggunakan Markdown..."
                            supportsFileUpload={supportsFileUpload}
                            enableFileUpload={enableFileUploadNew}
                            onToggleFileUpload={() =>
                                setEnableFileUploadNew((v) => !v)
                            }
                            isSaving={postSoalMutation.isPending}
                            saveLabel="Tambah Soal"
                            onCancel={handleCancelTambah}
                            onSave={handleTambahSoal}
                        />
                    </div>
                </section>
            )}

            <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base font-semibold text-depth-secondary">
                        Soal yang telah ditambahkan:
                    </h3>

                    {!soalLoading && !soalError && (
                        <span className="text-xs text-depth-secondary">
                            {soalList.length} soal
                        </span>
                    )}
                </div>

                {soalLoading && (
                    <p className="text-sm text-depth-secondary">
                        Memuat soal...
                    </p>
                )}

                {soalError && (
                    <p className="rounded-depth-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
                        {soalQueryError?.message ?? "Gagal memuat soal"}
                    </p>
                )}

                {!soalLoading && !soalError && soalList.length === 0 && (
                    <div className="flex min-h-[120px] flex-col items-center justify-center rounded-depth-lg border border-dashed border-depth bg-depth-card p-8 text-center">
                        <p className="text-sm font-medium text-depth-secondary">
                            Belum ada soal.
                        </p>

                        {isEditable && (
                            <button
                                type="button"
                                onClick={handleOpenTambah}
                                className="mt-3 text-sm font-semibold text-[var(--depth-color-primary)] transition hover:opacity-80"
                            >
                                + Tambah soal pertama
                            </button>
                        )}
                    </div>
                )}

                {!soalLoading && !soalError && soalList.length > 0 && (
                    <ul className="space-y-4">
                        {soalList.map((item, index) => {
                            const isEditing = editingSoal?.id === item.id;

                            return (
                                <li
                                    id={`soal-${kategoriSoal}-${index}`}
                                    key={item.id ?? index}
                                    className={`relative overflow-hidden rounded-depth-lg border bg-depth-card shadow-depth-md transition ${
                                        isEditing
                                            ? "border-[var(--depth-color-primary)] ring-1 ring-[var(--depth-color-primary)]/20"
                                            : "border-depth hover:shadow-depth-lg"
                                    }`}
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-depth bg-depth-interactive px-5 py-3">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-sm font-semibold text-depth-secondary">
                                                Soal {index + 1}
                                            </span>

                                            {Boolean(item.enable_file_upload) && (
                                                <span className="rounded-depth-full border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-600">File Upload</span>
                                            )}

                                            {isEditing && (
                                                <span className="rounded-depth-full bg-[var(--depth-color-primary)]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--depth-color-primary)]">
                                                    Editing
                                                </span>
                                            )}
                                        </div>

                                        {!isEditing && (
                                            <div className="flex gap-2">
                                                {isEditable && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleOpenModalDelete(
                                                                item,
                                                            )
                                                        }
                                                        className="flex h-9 w-9 items-center justify-center rounded-depth-md border border-depth bg-depth-interactive text-red-500 shadow-depth-sm transition hover:border-red-400 hover:shadow-depth-md"
                                                        title="Hapus soal"
                                                        aria-label={`Hapus soal ${
                                                            index + 1
                                                        }`}
                                                    >
                                                        <img
                                                            src={trashIcon}
                                                            className="h-4 w-4"
                                                            alt=""
                                                        />
                                                    </button>
                                                )}

                                                <SoalCommentsButton
                                                    kategoriSoal={kategoriSoal}
                                                    modulId={
                                                        item?.modul_id ??
                                                        (modul
                                                            ? Number(modul)
                                                            : null)
                                                    }
                                                    soalId={item?.id}
                                                    variant="icon"
                                                />

                                                {isEditable && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleStartEdit(
                                                                item,
                                                            )
                                                        }
                                                        className="flex h-9 w-9 items-center justify-center rounded-depth-md border border-depth bg-depth-interactive shadow-depth-sm transition hover:border-blue-400 hover:shadow-depth-md"
                                                        title="Edit soal"
                                                        aria-label={`Edit soal ${
                                                            index + 1
                                                        }`}
                                                    >
                                                        <img
                                                            src={editIcon}
                                                            className="edit-icon-filter h-4 w-4"
                                                            alt=""
                                                        />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-5">
                                        {isEditing ? (
                                            <div className="space-y-4">
                                                {!!modules.length && (
                                                    <div className="max-w-sm">
                                                        <label
                                                            htmlFor={`soal-module-${item.id}`}
                                                            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-depth-secondary"
                                                        >
                                                            Modul
                                                        </label>

                                                        <select
                                                            id={`soal-module-${item.id}`}
                                                            value={
                                                                editingSoal.modul_id ??
                                                                ""
                                                            }
                                                            onChange={(e) =>
                                                                updateEditingSoal(
                                                                    "modul_id",
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            disabled={
                                                                putSoalMutation.isPending
                                                            }
                                                            className="w-full rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm text-depth-primary shadow-depth-sm focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)]/30 disabled:opacity-60"
                                                        >
                                                            {modules.map(
                                                                (m) => {
                                                                    const id =
                                                                        getModuleId(
                                                                            m,
                                                                        );

                                                                    if (!id)
                                                                        return null;

                                                                    return (
                                                                        <option
                                                                            key={
                                                                                id
                                                                            }
                                                                            value={
                                                                                id
                                                                            }
                                                                        >
                                                                            {m?.judul ??
                                                                                m?.nama ??
                                                                                `Modul ${id}`}
                                                                        </option>
                                                                    );
                                                                },
                                                            )}
                                                        </select>
                                                    </div>
                                                )}

                                                <SoalMarkdownEditor
                                                    value={editingSoal.soal}
                                                    onChange={(value) =>
                                                        updateEditingSoal(
                                                            "soal",
                                                            value,
                                                        )
                                                    }
                                                    supportsFileUpload={
                                                        supportsFileUpload
                                                    }
                                                    enableFileUpload={
                                                        editingSoal.enable_file_upload
                                                    }
                                                    onToggleFileUpload={() =>
                                                        updateEditingSoal(
                                                            "enable_file_upload",
                                                            !editingSoal.enable_file_upload,
                                                        )
                                                    }
                                                    isSaving={
                                                        putSoalMutation.isPending
                                                    }
                                                    saveLabel="Simpan Perubahan"
                                                    onCancel={handleCancelEdit}
                                                    onSave={handleConfirmEdit}
                                                />
                                            </div>
                                        ) : (
                                            <div className="min-w-0 max-h-[60vh] overflow-y-auto break-words rounded-depth-md bg-depth-interactive p-4 text-sm text-depth-primary shadow-depth-inset">
                                                {item.soal ? (
                                                    <MarkdownRenderer
                                                        content={item.soal}
                                                    />
                                                ) : (
                                                    <p className="italic text-depth-secondary">
                                                        Soal kosong.
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {isBatchModalOpen && (
                <ModalBatchEditSoal
                    title="Batch Edit Soal — ID / EN"
                    regularModules={regularModules}
                    englishModules={englishModules}
                    selectedRegularModuleId={batchState.regularModuleId}
                    selectedEnglishModuleId={batchState.englishModuleId}
                    onSelectRegularModule={(value) =>
                        setBatchState((v) => ({
                            ...v,
                            regularModuleId: value,
                        }))
                    }
                    onSelectEnglishModule={(value) =>
                        setBatchState((v) => ({
                            ...v,
                            englishModuleId: value,
                        }))
                    }
                    regularDataset={batchComparisonData?.regular ?? null}
                    englishDataset={batchComparisonData?.english ?? null}
                    isLoading={isBatchComparisonLoading}
                    isFetching={isBatchComparisonFetching}
                    isSaving={batchUpdateMutation.isPending}
                    supportsFileUpload={supportsFileUpload}
                    onClose={handleCloseBatchModal}
                    onSubmit={handleBatchSubmit}
                />
            )}

            {deleteCandidate && (
                <ModalOverlay
                    onClose={handleCancelDelete}
                    className="depth-modal-overlay z-[70]"
                >
                    <div className="depth-modal-container max-w-sm space-y-4 text-center">
                        <div className="depth-modal-header justify-center">
                            <h3 className="depth-modal-title text-center">
                                Hapus Soal
                            </h3>

                            <ModalCloseButton
                                onClick={handleCancelDelete}
                                ariaLabel="Tutup konfirmasi hapus soal"
                            />
                        </div>

                        <p className="text-sm text-depth-secondary">
                            Apakah Anda yakin ingin menghapus soal{" "}
                            <span className="font-semibold text-depth-primary">
                                {deleteCandidate?.soal?.slice(0, 40) ?? "ini"}
                            </span>
                            ?
                        </p>

                        <div className="flex justify-center gap-3">
                            <button
                                type="button"
                                onClick={handleCancelDelete}
                                disabled={deleteSoalMutation.isPending}
                                className="rounded-depth-md border border-depth bg-depth-interactive px-5 py-2 text-sm font-semibold text-depth-primary shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md disabled:opacity-60"
                            >
                                Batal
                            </button>

                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                disabled={deleteSoalMutation.isPending}
                                className="rounded-depth-md border border-red-500/60 bg-red-500/15 px-5 py-2 text-sm font-semibold text-red-400 shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md disabled:opacity-60"
                            >
                                {deleteSoalMutation.isPending
                                    ? "Menghapus..."
                                    : "Hapus"}
                            </button>
                        </div>
                    </div>
                </ModalOverlay>
            )}
        </div>
    );
}
