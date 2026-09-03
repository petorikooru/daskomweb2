import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { FEEDBACK_INITIAL, PHASE_VIEW, SCORE_INITIAL } from "@/config/praktikum";

const SCORE_PHASES = new Set(["ta", "tk"]);

export default function usePraktikumSession({ praktikan, task, view, setView }) {
    const [meta, setMeta] = useState(null);
    const [modulId, setModulId] = useState(null);
    const [feedbackReminder, setFeedbackReminder] = useState(FEEDBACK_INITIAL);
    const [feedbackContext, setFeedbackContext] = useState({ modulId: null, assistantId: null });
    const [score, setScore] = useState(SCORE_INITIAL);
    const [refreshing, setRefreshing] = useState(false);

    const previousPhase = useRef(null);
    const scoreLocks = useRef(new Set());
    const scoreAck = useRef(false);
    const pendingFeedback = useRef(null);

    const praktikanId = praktikan?.id ?? null;
    const kelasId = praktikan?.kelas_id ?? praktikan?.kelas?.id ?? null;
    const dk = praktikan?.dk ?? meta?.dk ?? null;

    /*
     * IMPORTANT:
     * Extract members. Do not depend on the entire `task` object.
     */
    const {
        reset: resetTask,
        setModulId: setTaskModulId,
        save: saveTask,
        open: openTask,
        submit: submitTask,
        activeTask,
        answers,
        submitting,
    } = task;

    const apply = useCallback((state) => {
        if (!state) {
            setMeta(null);
            setModulId(null);
            setFeedbackReminder({ ...FEEDBACK_INITIAL });
            resetTask();
            setView("NoPraktikumSection");
            return;
        }

        const pending = Boolean(state.feedback_pending ?? state.feedbackPending);
        const module = state.modul_id ?? state.feedback_modul_id ?? null;

        setFeedbackReminder({
            isPending: pending,
            modulId: state.feedback_modul_id ?? module,
            asistenId: state.feedback_asisten_id ?? state.pj_id ?? null,
        });

        setModulId(module);
        setTaskModulId(module);
        setMeta(state);

        if (["paused", "exited"].includes(state.status)) {
            resetTask();
            setView("NoPraktikumSection");
        }
    }, [resetTask, setTaskModulId, setView]);

    const normalize = useCallback((data, fallback = null) => {
        const raw = data?.data ?? fallback ?? null;
        const pending = Boolean(data?.feedback_pending ?? raw?.feedback_pending ?? false);

        if (!raw && !pending) return null;

        return {
            ...(raw ?? {}),
            feedback_pending: pending,
            feedback_modul_id: data?.feedback_modul_id ?? raw?.feedback_modul_id ?? raw?.modul_id ?? null,
            feedback_asisten_id: data?.feedback_asisten_id ?? raw?.feedback_asisten_id ?? raw?.pj_id ?? null,
        };
    }, []);

    const sync = useCallback(async ({ notify = false, fallback = null } = {}) => {
        try {
            const { data } = await api.get("/api-v1/praktikum/check-praktikum");

            if (data?.dk_required) {
                if (notify) toast("DK belum dipilih.", { icon: "⚠️" });
                return;
            }

            apply(data?.status === "success" ? normalize(data, fallback) : null);
            if (notify) toast.success("Status praktikum diperbarui.");
        } catch (e) {
            console.error("[Status Sync]", e);
            if (notify) toast.error(e?.response?.data?.message ?? "Gagal memperbarui status.");
        }
    }, [apply, normalize]);

    const refresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await saveTask(false);
            await sync({ notify: true });
        } finally {
            setRefreshing(false);
        }
    }, [saveTask, sync]);

    const fetchScore = useCallback(async (phase, module = modulId) => {
        if (!praktikanId || !module || !SCORE_PHASES.has(phase)) return false;

        const key = `${phase}:${module}`;
        if (scoreLocks.current.has(key)) return false;

        scoreLocks.current.add(key);
        scoreAck.current = true;
        setScore((x) => ({ ...x, phaseType: phase, hasError: false, isRetrying: true }));

        try {
            const { data } = await api.get(`/api-v1/nilai-${phase}/${praktikanId}/${module}`, {
                params: { _t: Date.now() },
            });

            const total = data?.total_questions ?? data?.totalQuestions ?? 0;
            const percentage = typeof data?.score === "number" ? data.score : null;
            const rawCorrect = data?.correct_answers ?? data?.correctAnswers;
            const correct = typeof rawCorrect === "number"
                ? rawCorrect
                : total && percentage != null
                ? Math.round((percentage / 100) * total)
                : 0;

            setScore({
                isOpen: true,
                phaseType: phase,
                correctAnswers: correct,
                totalQuestions: total,
                percentage: percentage ?? (total ? (correct / total) * 100 : 0),
                hasError: false,
                isRetrying: false,
            });

            return true;
        } catch (e) {
            console.error(`[Score:${phase}]`, e);
            setScore((x) => ({ ...x, isOpen: true, phaseType: phase, hasError: true, isRetrying: false }));
            return false;
        } finally {
            scoreLocks.current.delete(key);
        }
    }, [praktikanId, modulId]);

    const getFeedbackContext = useCallback(() => {
        const module = modulId ?? feedbackReminder.modulId;
        if (!module) return null;

        return {
            modulId: module,
            assistantId: feedbackReminder.asistenId ?? meta?.pj_id ?? null,
        };
    }, [modulId, feedbackReminder.modulId, feedbackReminder.asistenId, meta?.pj_id]);

    const openFeedback = useCallback((context) => {
        const next = context ?? getFeedbackContext();
        if (!next?.modulId) return;

        setFeedbackContext(next);
        setView("FeedbackPhase");
    }, [getFeedbackContext, setView]);

    const scheduleFeedback = useCallback((context) => {
        const next = context ?? getFeedbackContext();
        if (!next?.modulId) return;

        if (scoreAck.current || score.isOpen) {
            pendingFeedback.current = next;
            return;
        }

        pendingFeedback.current = null;
        openFeedback(next);
    }, [getFeedbackContext, openFeedback, score.isOpen]);

    const closeScore = useCallback(() => {
        const phase = score.phaseType;

        if (phase && modulId) {
            scoreLocks.current.delete(`${phase}:${modulId}`);
        }

        setScore((x) => ({ ...x, isOpen: false }));
        scoreAck.current = false;

        const pending = pendingFeedback.current;
        if (!pending) return;

        pendingFeedback.current = null;
        openFeedback(pending);
    }, [score.phaseType, modulId, openFeedback]);

    const retryScore = useCallback(() => {
        const phase = score.phaseType;
        if (!SCORE_PHASES.has(phase) || !modulId) return;

        scoreLocks.current.delete(`${phase}:${modulId}`);
        void fetchScore(phase, modulId);
    }, [score.phaseType, modulId, fetchScore]);

    const goPhase = useCallback(async (phase) => {
        if (phase === "feedback") {
            scheduleFeedback();
            return;
        }

        const next = PHASE_VIEW[phase];
        if (!next || !modulId) return;

        setView(next);
        await openTask(next, modulId);
    }, [modulId, openTask, scheduleFeedback, setView]);

    useEffect(() => {
        const next = meta?.current_phase;

        if (!next || !modulId) {
            previousPhase.current = null;
            return;
        }

        const previous = previousPhase.current;
        if (previous === next) return;

        previousPhase.current = next;

        if (!previous) {
            void goPhase(next);
            return;
        }

        void (async () => {
            try {
                if (activeTask && view !== "NoPraktikumSection" && answers.length && !submitting)
                    await submitTask(activeTask, answers, true);

                if (SCORE_PHASES.has(previous))
                    await fetchScore(previous, modulId);
            } catch (e) {
                console.error("[Phase Transition]", e);
            } finally {
                await goPhase(next);
            }
        })();
    }, [
        meta?.current_phase,
        modulId,
        activeTask,
        view,
        answers,
        submitting,
        submitTask,
        fetchScore,
        goPhase,
    ]);

    useEffect(() => {
        if (!window.Echo || !kelasId || !praktikanId) return;

        const name = `presence-kelas.${kelasId}`;
        window.Echo.join(name).error((e) => console.error("[Presence]", e));

        return () => window.Echo.leave(name);
    }, [kelasId, praktikanId]);

    useEffect(() => {
        if (!window.Echo || !kelasId || !dk) return;

        const name = `praktikum.class.${kelasId}.dk.${dk}`;
        const channel = window.Echo.channel(name).listen(".PraktikumStatusUpdated", (event) => {
            void sync({ fallback: event?.praktikum ?? null });
        });

        return () => {
            channel.stopListening(".PraktikumStatusUpdated");
            window.Echo.leave(name);
        };
    }, [kelasId, dk, sync]);

    const closeFeedback = useCallback(() => {
        setFeedbackContext({ modulId: null, assistantId: null });
        setView("NoPraktikumSection");
    }, [setView]);

    const feedbackSubmitted = useCallback(() => {
        setFeedbackReminder({ ...FEEDBACK_INITIAL });
        setFeedbackContext({ modulId: null, assistantId: null });
        setView("NoPraktikumSection");
    }, [setView]);

    return {
        meta,
        modulId,
        dk,
        refreshing,
        score,
        feedbackReminder,
        feedbackContext,
        apply,
        refresh,
        sync,
        openFeedback,
        scheduleFeedback,
        closeScore,
        retryScore,
        closeFeedback,
        feedbackSubmitted,
    };
}
