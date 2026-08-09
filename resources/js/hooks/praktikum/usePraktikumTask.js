import { useCallback, useEffect, useRef, useState } from "react";
import debounce from "lodash/debounce";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { DONE_INITIAL, TASKS } from "@/config/praktikum";

const int = (v) => {
    const n = Number(v);
    return Number.isInteger(n) && n > 0 ? n : null;
};

const arr = (res) => {
    const d = res?.data ?? res;
    return Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : Array.isArray(d?.questions) ? d.questions : [];
};

const essay = (items, type = "essay") => (items ?? [])
    .filter((x) => x && (x.soal || x.pertanyaan))
    .map((x) => ({
        id: x.id,
        key: `${type}:${x.id}`,
        text: x.soal ?? x.pertanyaan ?? "",
        questionType: type,
        enable_file_upload: Boolean(x.enable_file_upload),
    }));

const pg = (items) => (items ?? [])
    .filter((x) => x?.pertanyaan)
    .map((x) => ({
        id: x.id,
        key: `pg:${x.id}`,
        text: x.pertanyaan,
        questionType: "multiple-choice",
        options: (x.options ?? []).filter((o) => o?.id != null).map((o) => ({ id: o.id, text: o.text ?? "" })),
    }))
    .filter((x) => x.options.length);

const optionId = (q, value) => {
    if (value == null || value === "") return null;
    const option = q?.options?.find((o) => String(o.id) === String(value));
    return option ? int(option.id) : null;
};

const reorder = (questions, ids = []) => {
    if (!ids.length) return questions;
    const map = new Map(questions.map((q) => [String(q.id), q])), used = new Set();
    return [
        ...ids.map((id) => map.get(String(id))).filter((q) => {
            const key = String(q?.id ?? "");
            if (!q || used.has(key)) return false;
            used.add(key);
            return true;
        }),
        ...questions.filter((q) => {
            const key = String(q?.id ?? "");
            if (!key || used.has(key)) return false;
            used.add(key);
            return true;
        }),
    ];
};

const serialize = (value) => {
    if (value == null) return "";
    if (typeof value !== "object") return String(value);
    try { return JSON.stringify(value); } catch { return ""; }
};

const autosaveValue = (q, value) => {
    if (q?.questionType === "multiple-choice") return optionId(q, value);
    if (value == null) return null;
    if (typeof value === "object") {
        try { return JSON.stringify(value); } catch { return null; }
    }
    const s = String(value);
    return s.trim() ? s : null;
};

const hydrate = (q, value) => {
    if (q?.questionType === "multiple-choice") return optionId(q, value);
    if (value == null) return "";
    if (typeof value === "object") return value;
    if (typeof value !== "string") return String(value);
    const s = value.trim();
    if (!s) return "";
    if ((s.startsWith("{") && s.endsWith("}")) || (s.startsWith("[") && s.endsWith("]"))) {
        try { return JSON.parse(s); } catch {}
    }
    return value;
};

const errorText = (e, fallback) =>
    Object.values(e?.response?.data?.errors ?? {}).flat()[0] ??
    e?.response?.data?.message ??
    e?.response?.data?.error ??
    e?.message ??
    fallback;

const getCollection = async (url, config) => {
    try { return await api.get(url, config); }
    catch (e) {
        if (e?.response?.status === 404) return { data: { data: [] } };
        throw e;
    }
};

export default function usePraktikumTask(praktikanId) {
    const [activeTask, setActiveTask] = useState(null);
    const [modulId, setModulId] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState([]);
    const [completed, setCompleted] = useState(DONE_INITIAL);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [submissionError, setSubmissionError] = useState(null);
    const debouncers = useRef({});
    const restoring = useRef(false);

    const clear = useCallback(() => {
        setQuestions([]);
        setAnswers([]);
    }, []);

    const reset = useCallback(() => {
        clear();
        setActiveTask(null);
    }, [clear]);

    useEffect(() => {
        if (!modulId) {
            setCompleted({ ...DONE_INITIAL });
            return;
        }
        try {
            setCompleted({ ...DONE_INITIAL, ...JSON.parse(localStorage.getItem(`praktikum:completed:${modulId}`) || "{}") });
        } catch {
            setCompleted({ ...DONE_INITIAL });
        }
    }, [modulId]);

    useEffect(() => {
        if (modulId) localStorage.setItem(`praktikum:completed:${modulId}`, JSON.stringify(completed));
    }, [completed, modulId]);

    const debouncer = useCallback((type) => {
        if (!debouncers.current[type]) {
            debouncers.current[type] = debounce(async (payload) => {
                try { await api.post("/api-v1/praktikan/autosave", payload); }
                catch (e) { console.warn(`[Autosave:${type}]`, e); }
            }, 600);
        }
        return debouncers.current[type];
    }, []);

    useEffect(() => () => Object.values(debouncers.current).forEach((d) => d?.cancel?.()), []);

    const buildAutosave = useCallback((values = answers) =>
        Object.fromEntries(questions.flatMap((q, i) => {
            const value = autosaveValue(q, values[i]);
            return value == null || (typeof value === "string" && !value.trim()) ? [] : [[q.key ?? q.id, value]];
        })), [questions, answers]);

    const getStoredIds = useCallback(async (type, moduleId) => {
        try {
            const { data } = await api.get("/api-v1/praktikan/autosave/questions", {
                params: { praktikan_id: praktikanId, modul_id: moduleId, tipe_soal: type },
            });
            return {
                ids: Array.isArray(data?.question_ids) ? data.question_ids.map(int).filter(Boolean) : [],
                exists: Boolean(data?.has_stored_questions),
            };
        } catch {
            return { ids: [], exists: false };
        }
    }, [praktikanId]);

    const saveStoredIds = useCallback(async (type, moduleId, ids) => {
        if (!ids.length) return;
        try {
            await api.post("/api-v1/praktikan/autosave/questions", {
                praktikan_id: praktikanId,
                modul_id: moduleId,
                tipe_soal: type,
                question_ids: ids,
            });
        } catch (e) {
            console.warn("[Question snapshot]", e);
        }
    }, [praktikanId]);

    const restore = useCallback(async (config, moduleId, qs) => {
        const empty = qs.map((q) => q.questionType === "multiple-choice" ? null : "");
        try {
            const { data } = await api.get("/api-v1/praktikan/autosave", {
                params: { praktikan_id: praktikanId, modul_id: moduleId, tipe_soal: config.phase },
            });
            const snapshot = (Array.isArray(data?.data) ? data.data : []).find((x) => x?.tipe_soal === config.phase);
            if (!snapshot?.jawaban || typeof snapshot.jawaban !== "object") return empty;

            return qs.map((q, i) => {
                const value =
                    snapshot.jawaban[q.key] ??
                    snapshot.jawaban[q.id] ??
                    snapshot.jawaban[String(q.id)];
                return value == null ? empty[i] : hydrate(q, value);
            });
        } catch {
            return empty;
        }
    }, [praktikanId]);

    const open = useCallback(async (taskName, moduleId) => {
        const config = TASKS[taskName];
        if (!config || !moduleId) return;

        setActiveTask(taskName);
        setModulId(moduleId);
        setLoading(true);
        setError(null);
        setSubmissionError(null);

        try {
            const stored = config.sticky ? await getStoredIds(config.phase, moduleId) : { ids: [], exists: false };
            let qs;

            if (config.variant === "jurnal") {
                const [fitbRes, jurnalRes] = await Promise.all([
                    getCollection(config.fitb.q(moduleId)),
                    getCollection(config.q(moduleId)),
                ]);
                qs = [
                    ...essay(arr(fitbRes), "fitb"),
                    ...essay(arr(jurnalRes), "jurnal"),
                ];
            } else {
                const response = await getCollection(
                    config.q(moduleId),
                    stored.ids.length ? { params: { question_ids: stored.ids } } : undefined,
                );
                qs = config.variant === "pg" ? pg(arr(response)) : essay(arr(response), config.phase);
            }

            if (config.sticky) {
                qs = reorder(qs, stored.ids);
                const ids = qs.map((q) => int(q.id)).filter(Boolean);
                const changed = ids.length !== stored.ids.length || ids.some((id, i) => id !== stored.ids[i]);
                if (!stored.exists || changed) await saveStoredIds(config.phase, moduleId, ids);
            }

            const restored = await restore(config, moduleId, qs);
            setQuestions(qs);
            restoring.current = true;
            setAnswers(restored);
            queueMicrotask(() => { restoring.current = false; });
        } catch (e) {
            clear();
            setError(errorText(e, "Gagal memuat soal."));
        } finally {
            setLoading(false);
        }
    }, [clear, getStoredIds, saveStoredIds, restore]);

    useEffect(() => {
        const config = TASKS[activeTask];
        if (!config || !praktikanId || !modulId || !questions.length || !answers.length || restoring.current) return;
        const jawaban = buildAutosave();
        if (!Object.keys(jawaban).length) return;

        debouncer(config.phase)({
            praktikan_id: praktikanId,
            modul_id: modulId,
            tipe_soal: config.phase,
            jawaban,
        });
    }, [answers, questions, activeTask, praktikanId, modulId, buildAutosave, debouncer]);

    const commit = useCallback(async (taskName, values = answers) => {
        const config = TASKS[taskName];
        if (!config || !praktikanId || !modulId) throw new Error("Sesi praktikum tidak valid.");

        if (config.variant === "pg") {
            const selections = questions.flatMap((q, i) => {
                const raw = values[i];
                if (raw == null || raw === "") return [];
                const soal_id = int(q.id), opsi_id = optionId(q, raw);
                if (!soal_id || !opsi_id) throw new Error(`Jawaban soal ${i + 1} tidak valid.`);
                return [{ soal_id, opsi_id }];
            });

            await api.post(config.submit, {
                praktikan_id: int(praktikanId),
                modul_id: int(modulId),
                answers: selections,
            });
            return;
        }

        if (config.variant === "jurnal") {
            const rows = questions.map((q, i) => ({ q, answer: values[i] }));
            const make = (type) => rows
                .filter(({ q }) => type === "fitb" ? q.questionType === "fitb" : q.questionType !== "fitb")
                .map(({ q, answer }) => ({
                    praktikan_id: praktikanId,
                    modul_id: modulId,
                    soal_id: q.id,
                    jawaban: serialize(answer),
                }));

            const fitb = make("fitb"), jurnal = make("jurnal");
            if (fitb.length) await api.post(config.fitb.submit, fitb);
            if (jurnal.length) await api.post(config.submit, jurnal);
            return;
        }

        await api.post(config.submit, questions.map((q, i) => ({
            praktikan_id: praktikanId,
            modul_id: modulId,
            soal_id: q.id,
            jawaban: serialize(values[i]),
        })));
    }, [answers, questions, praktikanId, modulId]);

    const save = useCallback(async (notify = true) => {
        const config = TASKS[activeTask];

        if (!config || !praktikanId || !modulId || !questions.length) {
            if (notify) toast.error("Tidak ada progress yang dapat disimpan.");
            return false;
        }

        setSaving(true);
        debouncers.current[config.phase]?.cancel?.();

        try {
            const jawaban = buildAutosave();

            if (Object.keys(jawaban).length) {
                await api.post("/api-v1/praktikan/autosave", {
                    praktikan_id: praktikanId,
                    modul_id: modulId,
                    tipe_soal: config.phase,
                    jawaban,
                });
            }

            await commit(activeTask, answers);
            if (notify) toast.success("Progress berhasil disimpan.");
            return true;
        } catch (e) {
            console.error("[Save Progress]", e);
            if (notify) toast.error(errorText(e, "Gagal menyimpan progress."));
            return false;
        } finally {
            setSaving(false);
        }
    }, [activeTask, praktikanId, modulId, questions.length, answers, buildAutosave, commit]);

    const submit = useCallback(async (taskName = activeTask, values = answers, silent = false) => {
        const config = TASKS[taskName];

        if (!config || !praktikanId || !modulId) {
            const msg = "Modul aktif atau praktikan tidak ditemukan.";
            if (silent) throw new Error(msg);
            toast.error(msg);
            return false;
        }

        setSubmitting(true);
        setSubmissionError(null);
        debouncers.current[config.phase]?.cancel?.();

        try {
            await commit(taskName, values);

            try {
                await api.delete("/api-v1/praktikan/autosave", {
                    data: { praktikan_id: praktikanId, modul_id: modulId, tipe_soal: config.phase },
                });
            } catch (e) {
                console.warn("[Autosave clear]", e);
            }

            setCompleted((x) => ({ ...x, [taskName]: true }));
            localStorage.setItem(`praktikum:answers:${taskName}:${modulId}`, JSON.stringify(values));
            clear();

            if (!silent) toast.success("Jawaban berhasil disimpan.");
            return true;
        } catch (e) {
            const msg = errorText(e, "Gagal menyimpan jawaban.");
            setSubmissionError(msg);
            if (silent) throw e;
            toast.error(msg);
            return false;
        } finally {
            setSubmitting(false);
        }
    }, [activeTask, answers, praktikanId, modulId, commit, clear]);

    return {
        activeTask, modulId, questions, answers, completed, loading, saving, submitting, error, submissionError,
        setAnswers, setCompleted, setModulId, open, clear, reset, save, submit,
    };
}
