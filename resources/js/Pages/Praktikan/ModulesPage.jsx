import { useMemo } from "react";
import { Head, usePage } from "@inertiajs/react";
import PraktikanAuthenticated from "@/Layouts/PraktikanAuthenticatedLayout";
import PraktikanUtilities from "@/Components/Praktikans/Layout/PraktikanUtilities";
import PraktikanPageHeader from "@/Components/Praktikans/Common/PraktikanPageHeader";
import { useModulesQuery } from "@/hooks/useModulesQuery";
import ContentModule from "@/Components/Praktikans/Sections/ContentModule";

export default function ModulesPage() {
    const { auth } = usePage().props;
    const praktikan = auth?.praktikan ?? null;
    const { data: modules = [], isLoading, isError, error } = useModulesQuery();
    const kelas = praktikan?.kelas ?? null;
    const isEnglishClass = Boolean(Number(kelas?.isEnglish ?? 0));

    const modulesByLanguage = useMemo(() => {
        const grouped = {
            regular: [],
            english: [],
        };

        (Array.isArray(modules) ? modules : []).forEach((moduleItem) => {
            const isEnglishModule = Number(moduleItem?.isEnglish ?? 0) === 1;
            if (isEnglishModule) {
                grouped.english.push(moduleItem);
            } else {
                grouped.regular.push(moduleItem);
            }
        });

        return grouped;
    }, [modules]);

    const visibleModules = isEnglishClass ? modulesByLanguage.english : modulesByLanguage.regular;
    const alternateModules = isEnglishClass ? modulesByLanguage.regular : modulesByLanguage.english;
    const showLanguageNotice =
        !isLoading
        && !isError
        && visibleModules.length === 0
        && alternateModules.length > 0;
    const emptyMessage = isEnglishClass
        ? "Belum ada modul untuk kelas English saat ini."
        : "Belum ada modul untuk kelas reguler saat ini.";

    return (
        <>
            <PraktikanAuthenticated
                praktikan={praktikan}
                customWidth="w-[80%]"
                header={
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Dashboard
                    </h2>
                }
            >
                <Head title="Modul Praktikan" />

                <div className="-mt-[1vh] flex flex-col gap-6">
                    <PraktikanPageHeader title="Daftar Modul" />

                    <div className="h-[81vh] overflow-y-auto rounded-depth-lg border border-depth bg-depth-card shadow-depth-lg">
                        {isLoading ? (
                            <div className="px-6 py-10 text-center text-depth-secondary">Memuat data modul...</div>
                        ) : isError ? (
                            <div className="px-6 py-10 text-center text-red-500">
                                {error?.message ?? "Gagal memuat data modul"}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {showLanguageNotice && (
                                    <div className="mx-6 rounded-depth-md border border-amber-400 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 shadow-depth-sm">
                                        Modul untuk kelas Anda belum dipublikasikan. Sementara itu, modul tipe lainnya ditahan agar pengalaman belajar tetap relevan.
                                    </div>
                                )}
                                <ContentModule modules={visibleModules} emptyMessage={emptyMessage} />
                            </div>
                        )}
                    </div>
                </div>
            </PraktikanAuthenticated>
            <PraktikanUtilities />
        </>
    );
}
