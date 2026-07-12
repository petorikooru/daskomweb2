import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const PRAKTIKUM_QUERY_KEY = ["praktikum"];

const fetchPraktikum = async () => {
    const { data } = await api.get("/api-v1/praktikum");

    if (Array.isArray(data?.data)) {
        return data.data;
    }

    if (data?.status === "success" && Array.isArray(data?.praktikum)) {
        return data.praktikum;
    }

    if (data?.success === false) {
        throw new Error(data?.message ?? "Gagal memuat data praktikum");
    }

    return [];
};

export const usePraktikumQuery = (options = {}) =>
    useQuery({
        queryKey: PRAKTIKUM_QUERY_KEY,
        queryFn: fetchPraktikum,
        staleTime: 5 * 60 * 1000,
        ...options,
    });
