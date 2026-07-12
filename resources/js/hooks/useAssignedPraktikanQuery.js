import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const ASSIGNED_PRAKTIKAN_QUERY_KEY = ["assigned-praktikan"];

const fetchAssignedPraktikan = async () => {
    const { data } = await api.get("/api-v1/praktikan-tertarik");

    if (data?.success === false) {
        throw new Error(data?.message ?? "Gagal memuat daftar praktikan");
    }

    if (Array.isArray(data?.data)) {
        return data.data;
    }

    return [];
};

export const useAssignedPraktikanQuery = (options = {}) =>
    useQuery({
        queryKey: ASSIGNED_PRAKTIKAN_QUERY_KEY,
        queryFn: fetchAssignedPraktikan,
        staleTime: 60 * 1000,
        ...options,
    });

