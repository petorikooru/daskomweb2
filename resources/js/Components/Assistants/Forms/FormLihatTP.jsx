import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useModulesQuery } from "@/hooks/useModulesQuery";
import { useManagePraktikanQuery } from "@/hooks/useManagePraktikanQuery";
import ContentLihatTP from "../Content/ContentLihatTP";

const formatPraktikanOption = (praktikan) => {
    if (!praktikan) return "";
    const nim = praktikan.nim ?? "";
    const nama = praktikan.nama ?? "";
    if (!nim && !nama) return "";
    if (!nama) return nim;
    if (!nim) return nama;
    return `${nim} — ${nama}`;
};

const matchesPraktikanQuery = (praktikan, query) => {
    if (!praktikan) return false;
    const normalized = query.trim().toLowerCase();
    if (normalized === "") return true;
    return [praktikan.nim, praktikan.nama]
        .filter(Boolean)
        .map((v) => v.toLowerCase())
        .some((v) => v.includes(normalized));
};

export default function FormLihatTp() {
    const [nim, setNim] = useState("");
    const [nimSearchTerm, setNimSearchTerm] = useState("");
    const [isNimDropdownOpen, setIsNimDropdownOpen] = useState(false);
    const [highlightedNimIndex, setHighlightedNimIndex] = useState(-1);

    const [selectedModulId, setSelectedModulId] = useState("");
    const [modulSearchTerm, setModulSearchTerm] = useState("");
    const [isModulDropdownOpen, setIsModulDropdownOpen] = useState(false);
    const [highlightedModulIndex, setHighlightedModulIndex] = useState(-1);

    const [error, setError] = useState("");
    const [showResults, setShowResults] = useState(false);
    const [resultData, setResultData] = useState({
        jawabanData: [],
        praktikan: null,
        modul: null,
    });

    const nimDropdownRef = useRef(null);
    const modulDropdownRef = useRef(null);

    const {
        data: modulesData = [],
        isLoading: modulesLoading,
        isError: modulesError,
        error: modulesQueryError,
    } = useModulesQuery({
        onError: (err) => {
            console.error("Error fetching modules:", err);
        },
    });

    const { data: praktikanData } = useManagePraktikanQuery({ perPage: 9999 });
    const praktikanList = praktikanData?.items ?? [];

    const getModuleId = (module) => String(module?.idM ?? module?.id ?? module?.modul_id ?? "");

    const moduleOptions = useMemo(
        () =>
            modulesData.map((module) => ({
                id: getModuleId(module),
                label: module?.judul ?? `Modul ${module?.idM ?? module?.id ?? ""}`,
            })),
        [modulesData],
    );

    const filteredPraktikans = useMemo(() => {
        if (!nimSearchTerm) return praktikanList;
        return praktikanList.filter((p) => matchesPraktikanQuery(p, nimSearchTerm));
    }, [praktikanList, nimSearchTerm]);

    const filteredModules = useMemo(() => {
        if (!modulSearchTerm) return moduleOptions;
        const q = modulSearchTerm.trim().toLowerCase();
        return moduleOptions.filter((m) => m.label.toLowerCase().includes(q));
    }, [moduleOptions, modulSearchTerm]);

    // Outside click for NIM dropdown
    useEffect(() => {
        const handler = (e) => {
            if (!nimDropdownRef.current || nimDropdownRef.current.contains(e.target)) return;
            setIsNimDropdownOpen(false);
            setHighlightedNimIndex(-1);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Outside click for Modul dropdown
    useEffect(() => {
        const handler = (e) => {
            if (!modulDropdownRef.current || modulDropdownRef.current.contains(e.target)) return;
            setIsModulDropdownOpen(false);
            setHighlightedModulIndex(-1);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleNimSelect = (praktikan) => {
        setNim(praktikan.nim);
        setNimSearchTerm(formatPraktikanOption(praktikan));
        setIsNimDropdownOpen(false);
        setHighlightedNimIndex(-1);
        setError("");
    };

    const handleModulSelect = (module) => {
        setSelectedModulId(module.id);
        setModulSearchTerm(module.label);
        setIsModulDropdownOpen(false);
        setHighlightedModulIndex(-1);
        setError("");
    };

    const jawabanTpMutation = useMutation({
        mutationFn: async ({ nim: praktikanNim, modulId }) => {
            try {
                const { data } = await api.get(`/api-v1/jawaban-tp/${praktikanNim}/${modulId}`);
                if (!data?.success) {
                    throw new Error(data?.message ?? "Gagal menampilkan jawaban TP");
                }
                return data.data;
            } catch (err) {
                const message = err.response?.data?.message ?? err.message ?? "Gagal menampilkan jawaban TP";
                throw new Error(message);
            }
        },
        retry: false,
        onSuccess: (data) => {
            setResultData({
                jawabanData: data?.jawabanData ?? [],
                praktikan: data?.praktikan ?? null,
                modul: data?.modul ?? null,
            });
            setShowResults(true);
        },
        onError: (err) => {
            setError(err.message ?? "Gagal menampilkan jawaban TP");
        },
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        // If no dropdown selection, fall back to the raw typed NIM string
        const nimToUse = nim || nimSearchTerm.trim();

        if (!nimToUse || !selectedModulId) {
            setError("NIM dan Modul harus diisi");
            return;
        }

        setError("");
        jawabanTpMutation.mutate({ nim: nimToUse, modulId: selectedModulId });
    };

    const handleBackToForm = () => {
        setShowResults(false);
        setNim("");
        setNimSearchTerm("");
        setSelectedModulId("");
        setModulSearchTerm("");
        setError("");
    };

    if (showResults) {
        return (
            <div className="space-y-4">
                <div>
                    <button
                        onClick={handleBackToForm}
                        className="inline-flex items-center gap-1.5 rounded-depth-md border border-depth bg-depth-interactive px-4 py-2 text-sm font-semibold text-depth-primary shadow-depth-sm transition hover:-translate-y-0.5 hover:border-[var(--depth-color-primary)] hover:text-[var(--depth-color-primary)] hover:shadow-depth-md"
                    >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                        Kembali ke Pencarian
                    </button>
                </div>
                <ContentLihatTP
                    jawabanData={resultData.jawabanData}
                    praktikan={resultData.praktikan}
                    modul={resultData.modul}
                />
            </div>
        );
    }

    const inputClass =
        "w-full rounded-depth-md border border-depth bg-depth-card px-4 py-2 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0";

    const dropdownListClass =
        "absolute z-20 mt-2 max-h-56 w-full overflow-y-auto rounded-depth-lg border border-depth bg-depth-card shadow-depth-lg";

    return (
        <div className="container mx-auto p-4">
            <div className="rounded-depth-lg border border-depth bg-depth-card p-6 shadow-depth-lg">
                <h1 className="mb-6 text-center text-2xl font-bold text-depth-primary">Lihat Jawaban TP</h1>

                <form onSubmit={handleSubmit} className="mb-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                        {/* NIM searchable combobox */}
                        <div ref={nimDropdownRef}>
                            <label className="mb-1 block text-sm font-medium text-depth-primary">
                                NIM Praktikan
                            </label>
                            <div className="relative">
                                <input
                                    type="search"
                                    value={nimSearchTerm}
                                    onChange={(e) => {
                                        setNimSearchTerm(e.target.value);
                                        setNim("");
                                        setIsNimDropdownOpen(true);
                                        setHighlightedNimIndex(-1);
                                        setError("");
                                    }}
                                    onFocus={() => {
                                        setIsNimDropdownOpen(true);
                                        if (filteredPraktikans.length > 0 && highlightedNimIndex === -1) {
                                            setHighlightedNimIndex(0);
                                        }
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            if (highlightedNimIndex >= 0 && highlightedNimIndex < filteredPraktikans.length) {
                                                handleNimSelect(filteredPraktikans[highlightedNimIndex]);
                                            } else if (filteredPraktikans.length > 0) {
                                                handleNimSelect(filteredPraktikans[0]);
                                            }
                                        } else if (e.key === "ArrowDown") {
                                            e.preventDefault();
                                            if (!isNimDropdownOpen) { setIsNimDropdownOpen(true); setHighlightedNimIndex(0); return; }
                                            if (filteredPraktikans.length === 0) return;
                                            setHighlightedNimIndex((prev) => {
                                                const next = prev + 1;
                                                return next >= filteredPraktikans.length ? 0 : next;
                                            });
                                        } else if (e.key === "ArrowUp") {
                                            e.preventDefault();
                                            if (!isNimDropdownOpen) { setIsNimDropdownOpen(true); setHighlightedNimIndex(Math.max(filteredPraktikans.length - 1, 0)); return; }
                                            if (filteredPraktikans.length === 0) return;
                                            setHighlightedNimIndex((prev) => {
                                                const next = prev - 1;
                                                return next < 0 ? filteredPraktikans.length - 1 : next;
                                            });
                                        } else if (e.key === "Escape") {
                                            setIsNimDropdownOpen(false);
                                            setHighlightedNimIndex(-1);
                                        }
                                    }}
                                    placeholder="Cari berdasarkan NIM atau nama"
                                    className={inputClass}
                                />
                                {isNimDropdownOpen && (
                                    <div className={dropdownListClass}>
                                        {filteredPraktikans.length === 0 ? (
                                            <div className="px-4 py-3 text-sm text-depth-secondary">Praktikan tidak ditemukan.</div>
                                        ) : (
                                            <ul className="divide-y divide-[color:var(--depth-border)]">
                                                {filteredPraktikans.map((p, index) => {
                                                    const isActive = index === highlightedNimIndex;
                                                    const isSelected = p.nim === nim;
                                                    return (
                                                        <li key={`nim-option-${p.nim}`}>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleNimSelect(p)}
                                                                className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition hover:bg-depth-interactive ${
                                                                    isSelected
                                                                        ? "bg-depth-interactive/80 font-semibold text-depth-primary"
                                                                        : isActive
                                                                            ? "bg-depth-interactive/60 text-depth-primary"
                                                                            : "text-depth-primary"
                                                                }`}
                                                            >
                                                                <span>{formatPraktikanOption(p)}</span>
                                                                {isSelected && (
                                                                    <svg className="h-4 w-4 text-[var(--depth-color-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                )}
                                                            </button>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modul searchable combobox */}
                        <div ref={modulDropdownRef}>
                            <label className="mb-1 block text-sm font-medium text-depth-primary">
                                Modul
                            </label>
                            <div className="relative">
                                <input
                                    type="search"
                                    value={modulSearchTerm}
                                    onChange={(e) => {
                                        setModulSearchTerm(e.target.value);
                                        setSelectedModulId("");
                                        setIsModulDropdownOpen(true);
                                        setHighlightedModulIndex(-1);
                                        setError("");
                                    }}
                                    onFocus={() => {
                                        setIsModulDropdownOpen(true);
                                        if (filteredModules.length > 0 && highlightedModulIndex === -1) {
                                            setHighlightedModulIndex(0);
                                        }
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            if (highlightedModulIndex >= 0 && highlightedModulIndex < filteredModules.length) {
                                                handleModulSelect(filteredModules[highlightedModulIndex]);
                                            } else if (filteredModules.length > 0) {
                                                handleModulSelect(filteredModules[0]);
                                            }
                                        } else if (e.key === "ArrowDown") {
                                            e.preventDefault();
                                            if (!isModulDropdownOpen) { setIsModulDropdownOpen(true); setHighlightedModulIndex(0); return; }
                                            if (filteredModules.length === 0) return;
                                            setHighlightedModulIndex((prev) => {
                                                const next = prev + 1;
                                                return next >= filteredModules.length ? 0 : next;
                                            });
                                        } else if (e.key === "ArrowUp") {
                                            e.preventDefault();
                                            if (!isModulDropdownOpen) { setIsModulDropdownOpen(true); setHighlightedModulIndex(Math.max(filteredModules.length - 1, 0)); return; }
                                            if (filteredModules.length === 0) return;
                                            setHighlightedModulIndex((prev) => {
                                                const next = prev - 1;
                                                return next < 0 ? filteredModules.length - 1 : next;
                                            });
                                        } else if (e.key === "Escape") {
                                            setIsModulDropdownOpen(false);
                                            setHighlightedModulIndex(-1);
                                        }
                                    }}
                                    placeholder={modulesLoading ? "Memuat modul..." : "Cari modul"}
                                    disabled={modulesLoading}
                                    className={inputClass}
                                />
                                {isModulDropdownOpen && !modulesLoading && (
                                    <div className={dropdownListClass}>
                                        {filteredModules.length === 0 ? (
                                            <div className="px-4 py-3 text-sm text-depth-secondary">
                                                {modulesError ? (modulesQueryError?.message ?? "Gagal memuat modul") : "Modul tidak ditemukan."}
                                            </div>
                                        ) : (
                                            <ul className="divide-y divide-[color:var(--depth-border)]">
                                                {filteredModules.map((module, index) => {
                                                    const isActive = index === highlightedModulIndex;
                                                    const isSelected = module.id === selectedModulId;
                                                    return (
                                                        <li key={`modul-option-${module.id}`}>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleModulSelect(module)}
                                                                className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition hover:bg-depth-interactive ${
                                                                    isSelected
                                                                        ? "bg-depth-interactive/80 font-semibold text-depth-primary"
                                                                        : isActive
                                                                            ? "bg-depth-interactive/60 text-depth-primary"
                                                                            : "text-depth-primary"
                                                                }`}
                                                            >
                                                                <span>{module.label}</span>
                                                                {isSelected && (
                                                                    <svg className="h-4 w-4 text-[var(--depth-color-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                )}
                                                            </button>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={jawabanTpMutation.isPending || modulesLoading}
                        className="mt-4 w-full rounded-depth-md bg-[var(--depth-color-primary)] px-5 py-2 text-sm font-semibold text-white shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {jawabanTpMutation.isPending ? "Memuat..." : "Lihat Jawaban"}
                    </button>
                </form>

                {error && (
                    <div className="mb-4 rounded-depth-md border border-red-500/60 bg-red-500/15 px-4 py-3 text-sm text-red-400">
                        {error}
                    </div>
                )}

                {modulesError && (
                    <div className="mt-4 rounded-depth-md border border-red-500/60 bg-red-500/15 px-4 py-3 text-sm text-red-400">
                        {modulesQueryError?.message ?? "Gagal memuat daftar modul."}
                    </div>
                )}
            </div>
        </div>
    );
}
