import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const soalQueryKey = (kategori, modul) => ["soal", kategori, modul];

export const useSoalQuery = (kategori, modul, options = {}) =>
    useQuery({
        queryKey: soalQueryKey(kategori, modul),
        queryFn: async () => {
            if (!kategori || !modul) {
                return [];
            }
            const { data } = await api.get(`/api-v1/soal-${kategori}/${modul}`);
            if (Array.isArray(data?.soal)) {
                return data.soal;
            }
            if (Array.isArray(data?.data)) {
                return data.data;
            }
            return [];
        },
        enabled: Boolean(kategori && modul),
        ...options,
    });
