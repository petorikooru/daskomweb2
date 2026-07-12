import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const JADWAL_JAGA_QUERY_KEY = "jadwal-jaga";

const fetchJadwalJaga = async (params = {}) => {
    const { data } = await api.get("/api-v1/jadwal", {
        params,
    });

    const list = Array.isArray(data?.kelas)
        ? data.kelas
        : Array.isArray(data?.data)
            ? data.data
            : [];

    if (params?.kelas_id) {
        const kelasId = Number(params.kelas_id);
        const matched = list.filter((item) => {
            const id = Number(item?.id ?? item?.kelas_id ?? item?.kelasId);
            return !Number.isNaN(kelasId) && id === kelasId;
        });

        if (matched.length > 0) {
            return matched;
        }

        const fallback = list.find((item) => (item?.kelas ?? "").toString() === params.kelas_id?.toString());
        return fallback ? [fallback] : [];
    }

    return list;
};

export const useJadwalJagaQuery = (params = {}, options = {}) =>
    useQuery({
        queryKey: [JADWAL_JAGA_QUERY_KEY, params?.kelas_id ?? "all"],
        queryFn: () => fetchJadwalJaga(params),
        staleTime: 5 * 60 * 1000,
        ...options,
    });
