import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const soalComparisonQueryKey = (
    kategori,
    regularModuleId,
    englishModuleId,
) => [
    "soal-comparison",
    kategori,
    regularModuleId == null ? "" : String(regularModuleId),
    englishModuleId == null ? "" : String(englishModuleId),
];

const normalizeQuestions = (data) => {
    if (Array.isArray(data?.soal)) {
        return data.soal;
    }

    if (Array.isArray(data?.data)) {
        return data.data;
    }

    return [];
};

const fetchQuestions = async (kategori, moduleId) => {
    if (!kategori || !moduleId) {
        return [];
    }

    const { data } = await api.get(
        `/api-v1/soal-${kategori}/${String(moduleId)}`,
    );

    return normalizeQuestions(data);
};

export const useSoalComparison = (
    kategori,
    regularModuleId,
    englishModuleId,
    options = {},
) =>
    useQuery({
        queryKey: soalComparisonQueryKey(
            kategori,
            regularModuleId,
            englishModuleId,
        ),
        queryFn: async () => {
            const [regular, english] = await Promise.all([
                fetchQuestions(kategori, regularModuleId),
                fetchQuestions(kategori, englishModuleId),
            ]);

            return {
                regular: {
                    modulId: String(regularModuleId),
                    items: regular,
                },
                english: {
                    modulId: String(englishModuleId),
                    items: english,
                },
            };
        },
        enabled: Boolean(kategori && regularModuleId && englishModuleId),
        ...options,
    });
