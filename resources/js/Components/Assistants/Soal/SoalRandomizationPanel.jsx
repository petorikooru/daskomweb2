import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api } from "@/lib/api";

export const randomizationQueryKey = (category, moduleId) => ["question-randomization", category, String(moduleId ?? "")];

export default function QuestionRandomizationPanel({ category, moduleId }) {
    const queryClient = useQueryClient();
    const [form, setForm] = useState({ easy_count: 5, medium_count: 4, hard_count: 1, enabled: false });
    const enabled = ["ta", "tk"].includes(category) && Boolean(moduleId);
    const query = useQuery({
        queryKey: randomizationQueryKey(category, moduleId),
        enabled,
        queryFn: async () => (await api.get(`/api-v1/question-randomization/${category}/${moduleId}`)).data,
    });

    useEffect(() => {
        if (!query.data?.config) return;
        const c = query.data.config;
        setForm({ easy_count: c.easy_count ?? 5, medium_count: c.medium_count ?? 4, hard_count: c.hard_count ?? 1, enabled: Boolean(c.enabled) });
    }, [query.data]);

    const mutation = useMutation({
        mutationFn: async () => (await api.put(`/api-v1/question-randomization/${category}/${moduleId}`, form)).data,
        onSuccess: (data) => {
            queryClient.setQueryData(randomizationQueryKey(category, moduleId), data);
            toast.success(data?.message ?? "Konfigurasi berhasil disimpan.");
        },
        onError: (e) => toast.error(e?.response?.data?.message ?? "Gagal menyimpan konfigurasi."),
    });

    if (!enabled) return null;

    const available = query.data?.available ?? {};
    const total = Number(form.easy_count) + Number(form.medium_count) + Number(form.hard_count);
    const change = (key, value) => setForm((x) => ({ ...x, [key]: Math.max(0, Number(value) || 0) }));

    return (
        <div className="rounded-depth-lg border border-depth bg-depth-card p-4 shadow-depth-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div><h3 className="text-sm font-semibold text-depth-primary">Acak Kesulitan!</h3><p className="text-xs text-depth-secondary">Berlaku untuk praktikan normal. Kelas TOT selalu mendapatkan semua soal.</p></div>
                <label className="flex items-center gap-2 text-xs font-semibold text-depth-primary"><input type="checkbox" checked={form.enabled} onChange={(e) => setForm((x) => ({ ...x, enabled: e.target.checked }))} />Aktif</label>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
                {[["easy", "Mudah"], ["medium", "Sedang"], ["hard", "Susah"]].map(([key, label]) => (
                    <label key={key} className="rounded-depth-md border border-depth bg-depth-interactive p-3">
                        <span className="mb-2 flex justify-between text-xs font-semibold text-depth-primary"><span>{label}</span><span className="text-depth-secondary">Available: {available[key] ?? 0}</span></span>
                        <input type="number" min="0" max={available[key] ?? 0} value={form[`${key}_count`]} onChange={(e) => change(`${key}_count`, e.target.value)} className="w-full rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm text-depth-primary" />
                    </label>
                ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gaj-3">
                <div className="text-xs text-depth-secondary">Yang akan diberikan: <strong className="text-depth-primary">{total}</strong> · Belum Terlabel: {available.unlabeled ?? 0}</div>
                <button type="button" disabled={mutation.isPending} onClick={() => mutation.mutate()} className="rounded-depth-md bg-[var(--depth-color-primary)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{mutation.isPending ? "Menyimpan..." : "Simpan Randomisasi"}</button>
            </div>
        </div>
    );
}
