import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const ROLES_QUERY_KEY = ["roles"];

const fetchRoles = async () => {
    const { data } = await api.get("/api-v1/roles");

    if (Array.isArray(data?.roles)) {
        return data.roles;
    }

    if (data?.success === false) {
        throw new Error(data?.message ?? "Gagal memuat daftar role");
    }

    return [];
};

export const useRolesQuery = (options = {}) =>
    useQuery({
        queryKey: ROLES_QUERY_KEY,
        queryFn: fetchRoles,
        staleTime: 5 * 60 * 1000,
        ...options,
    });
