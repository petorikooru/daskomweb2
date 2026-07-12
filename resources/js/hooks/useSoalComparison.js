import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { soalQueryKey } from "./useSoalQuery";

const normalizeModuleId = (value) => {
    if (value === undefined || value === null || value === "") {
        return null;
    }

    return String(value);
};

const extractSoalPayload = (responseData) => {
    if (!responseData) {
        return [];
    }

    if (Array.isArray(responseData?.soal)) {
        return responseData.soal;
    }

    if (Array.isArray(responseData?.data)) {
        return responseData.data;
    }

    return [];
};

export const soalComparisonQueryKey = (kategoriSoal, regularModuleId, englishModuleId) => [
    "soal-comparison",
    kategoriSoal ?? null,
    normalizeModuleId(regularModuleId),
    normalizeModuleId(englishModuleId),
];

export const useSoalComparison = (
    kategoriSoal,
    regularModuleId,
    englishModuleId,
    options = {},
) => {
    const queryClient = useQueryClient();
    const normalizedRegularId = normalizeModuleId(regularModuleId);
    const normalizedEnglishId = normalizeModuleId(englishModuleId);
    const { enabled: userEnabled, ...restOptions } = options;

    return useQuery({
        queryKey: soalComparisonQueryKey(kategoriSoal, normalizedRegularId, normalizedEnglishId),
        queryFn: async () => {
            const result = {
                regular: null,
                english: null,
            };

            if (!kategoriSoal) {
                return result;
            }

            const fetchDataset = async (moduleId) => {
                if (!moduleId) {
                    return null;
                }

                const existing = queryClient.getQueryData(soalQueryKey(kategoriSoal, moduleId));
                if (existing) {
                    return {
                        modulId: moduleId,
                        items: existing,
                    };
                }

                const { data } = await api.get(`/api-v1/soal-${kategoriSoal}/${moduleId}`);
                const payload = extractSoalPayload(data);
                queryClient.setQueryData(soalQueryKey(kategoriSoal, moduleId), payload);
                return {
                    modulId: moduleId,
                    items: payload,
                };
            };

            const [regularData, englishData] = await Promise.all([
                fetchDataset(normalizedRegularId),
                fetchDataset(normalizedEnglishId),
            ]);

            result.regular = regularData;
            result.english = englishData;

            return result;
        },
        enabled:
            Boolean(kategoriSoal && (normalizedRegularId || normalizedEnglishId)) && (userEnabled ?? true),
        refetchOnWindowFocus: false,
        ...restOptions,
    });
};
