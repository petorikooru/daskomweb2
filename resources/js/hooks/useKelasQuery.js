import { useQuery } from "@tanstack/react-query";
import { index as kelasIndex } from "@/lib/routes/kelas";
import { guess_index } from "@/lib/routes/kelas";
import { api, publicApi } from "@/lib/api"; // Import both

export const KELAS_QUERY_KEY = ["kelas"];
export const GUESS_KELAS_QUERY_KEY = ["guess_kelas"];

// Use publicApi for guest endpoint
export const fetchKelasGuess = async () => {
    const { data } = await publicApi.get(guess_index.url());
    if (Array.isArray(data?.kelas)) {
        return data.kelas;
    }
    if (data?.status === "success" && Array.isArray(data?.data)) {
        return data.data;
    }
    return [];
}

// Keep using api for authenticated endpoint
export const fetchKelas = async () => {
    const { data } = await api.get(kelasIndex.url());
    if (Array.isArray(data?.kelas)) {
        return data.kelas;
    }
    if (data?.status === "success" && Array.isArray(data?.data)) {
        return data.data;
    }
    return [];
};

export const useKelasQuery = (options = {}) =>
    useQuery({
        queryKey: KELAS_QUERY_KEY,
        queryFn: fetchKelas,
        staleTime: 5 * 60 * 1000,
        ...options,
    });

export const useKelasQueryGuess = (options = {}) => 
    useQuery({
        queryKey: GUESS_KELAS_QUERY_KEY,
        queryFn: fetchKelasGuess,
        staleTime: 5 * 60 * 1000,
        ...options,
    })