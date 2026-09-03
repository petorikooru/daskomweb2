import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import { Head } from "@inertiajs/react";
import PraktikanAuthenticated from "@/Layouts/PraktikanAuthenticatedLayout";
import { useModulesQuery } from "@/hooks/useModulesQuery";
import usePraktikumTask from "@/hooks/praktikum/usePraktikumTask";
import usePraktikumSession from "@/hooks/praktikum/usePraktikumSession";
import { TASKS } from "@/config/praktikum";

const NoPraktikumSection = lazy(() => import("@/Components/Praktikans/Sections/NoPraktikumSection"));
const TesAwal = lazy(() => import("@/Components/Praktikans/Sections/TesAwal"));
const Jurnal = lazy(() => import("@/Components/Praktikans/Sections/Jurnal"));
const Mandiri = lazy(() => import("@/Components/Praktikans/Sections/Mandiri"));
const TesKeterampilan = lazy(() => import("@/Components/Praktikans/Sections/TesKeterampilan"));
const FeedbackPhase = lazy(() => import("@/Components/Praktikans/Sections/FeedbackPhase"));
const ScoreDisplayModal = lazy(() => import("@/Components/Modals/ScoreDisplayModal"));
const PraktikanUtilities = lazy(() => import("@/Components/Praktikans/Layout/PraktikanUtilities"));

const COMPONENTS = { TesAwal, Jurnal, Mandiri, TesKeterampilan };
const title = (m) => typeof m === "string" ? m : m?.judul ?? m?.name ?? (typeof m?.modul === "string" ? m.modul : m?.modul?.judul) ?? null;

export default function PraktikumPage({ auth }) {
    const [view, setView] = useState("NoPraktikumSection");
    const praktikan = auth?.praktikan ?? auth?.user ?? null;
    const praktikanId = praktikan?.id ?? null;
    const kelasId = praktikan?.kelas_id ?? praktikan?.kelas?.id ?? null;
    const kelasName = String(praktikan?.kelas?.kelas ?? "");
    const isTot = Boolean(praktikan?.kelas?.is_tot) || kelasName.trim().toUpperCase().startsWith("TOT");

    const task = usePraktikumTask(praktikanId);
    const session = usePraktikumSession({ praktikan, task, view, setView });
    const { data: modules = [] } = useModulesQuery();

    const moduleTitle = useCallback((id) => title(modules.find((m) => String(m?.id ?? m?.idM ?? m?.modul_id) === String(id))), [modules]);

    const reminderLabel = useMemo(() =>
        title(session.meta?.modul) ??
        session.meta?.modul_name ??
        moduleTitle(session.meta?.modul_id) ??
        moduleTitle(session.feedbackReminder.modulId) ??
        (session.feedbackReminder.modulId ? `Modul #${session.feedbackReminder.modulId}` : null),
    [session.meta, session.feedbackReminder.modulId, moduleTitle]);

    const feedbackLabel = useMemo(() =>
        session.feedbackContext.modulId ? moduleTitle(session.feedbackContext.modulId) ?? reminderLabel : reminderLabel,
    [session.feedbackContext.modulId, moduleTitle, reminderLabel]);

    const ActiveTask = COMPONENTS[view] ?? null;
    const openTask = task.open;
    const currentModulId = session.modulId;

    const openView = useCallback(async (name) => {
        setView(name);
        if (COMPONENTS[name] && currentModulId) await openTask(name, currentModulId);
    }, [openTask, currentModulId]);

    const showReminder =
        session.feedbackReminder.isPending &&
        session.meta?.status !== "running" &&
        view !== "FeedbackPhase";

    return (
        <>
            <PraktikanAuthenticated user={praktikan} praktikan={praktikan} customWidth="w-full" header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Dashboard</h2>}>
                <Head title="Praktikum Praktikan" />

                {showReminder && (
                    <div className="mb-4 rounded-depth-lg border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900 shadow-depth-sm">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="font-semibold">Feedback praktikum belum terkirim</p>
                                <p className="text-xs">Segera lengkapi feedback untuk {reminderLabel ?? "modul terkait"}.</p>
                            </div>
                            <button type="button" onClick={() => session.scheduleFeedback()} className="rounded-depth-md bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-depth-sm">Buka Feedback</button>
                        </div>
                    </div>
                )}

                <Suspense fallback={<p className="p-6 text-center text-depth-secondary">Memuat...</p>}>
                    <NoPraktikumSection
                        isVisible={view === "NoPraktikumSection"}
                        onNavigate={openView}
                        onReviewTask={openView}
                        completedCategories={task.completed}
                        setCompletedCategories={task.setCompleted}
                        kelasId={kelasId}
                        dk={session.dk}
                        moduleMeta={session.meta}
                        onPraktikumStateChange={session.apply}
                    />
                </Suspense>

                {view !== "NoPraktikumSection" && (
                    <>
                        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
                            {ActiveTask && (
                                <button
                                    type="button"
                                    onClick={() => task.save(true)}
                                    disabled={task.saving || task.submitting}
                                    className="rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-xs font-semibold shadow-depth-sm disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {task.saving ? "Menyimpan..." : "Save Progress"}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={session.refresh}
                                disabled={session.refreshing || task.saving || task.submitting}
                                className="rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-xs font-semibold shadow-depth-sm disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {session.refreshing ? "Memuat..." : "Refresh Status"}
                            </button>
                        </div>

                        {task.submissionError && <div className="mb-4 rounded-depth-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-400">{task.submissionError}</div>}

                        <Suspense fallback={<p className="p-6 text-center text-depth-secondary">Memuat konten...</p>}>
                            {ActiveTask ? (
                                <ActiveTask
                                    questions={task.questions}
                                    answers={task.answers}
                                    setAnswers={task.setAnswers}
                                    isLoading={task.loading}
                                    errorMessage={task.error}
                                    tipeSoal={TASKS[view]?.phase}
                                    praktikanId={praktikanId}
                                    isCommentEnabled={isTot}
                                    isTot={isTot}
                                />
                            ) : view === "FeedbackPhase" ? (
                                <FeedbackPhase
                                    praktikan={praktikan}
                                    modulId={session.feedbackContext.modulId ?? session.modulId}
                                    assistantId={session.feedbackContext.assistantId}
                                    moduleLabel={feedbackLabel}
                                    onClose={session.closeFeedback}
                                    onSubmitted={session.feedbackSubmitted}
                                />
                            ) : null}
                        </Suspense>
                    </>
                )}
            </PraktikanAuthenticated>

            <Suspense fallback={null}><PraktikanUtilities /></Suspense>
            <Suspense fallback={null}>
                <ScoreDisplayModal
                    {...session.score}
                    onClose={session.closeScore}
                    onRetry={session.retryScore}
                    isTotClass={isTot}
                />
            </Suspense>
        </>
    );
}
