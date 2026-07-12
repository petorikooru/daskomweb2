import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const CONFIG_QUERY_KEY = ["configuration"];

const fetchConfiguration = async () => {
    const { data } = await api.get("/api-v1/config");
    if (data?.config) {
        return data.config;
    }

    if (data?.success === false) {
        throw new Error(data?.message ?? "Gagal memuat konfigurasi");
    }

    return null;
};

export const useConfigurationQuery = (options = {}) =>
    useQuery({
        queryKey: CONFIG_QUERY_KEY,
        queryFn: fetchConfiguration,
        staleTime: 5 * 60 * 1000,
        ...options,
    });
