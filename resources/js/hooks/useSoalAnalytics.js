import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { resolveUrl } from "@/lib/http";
import * as soalTaRoutes from "@/lib/routes/soalTA";
import * as soalTkRoutes from "@/lib/routes/soalTK";

const ANALYTICS_ROUTE_MAP = {
    ta: soalTaRoutes,
    tk: soalTkRoutes,
};

const normalizeModuleId = (value) => {
    if (value === undefined || value === null || value === "") {
        return null;
    }

    return String(value);
};

const extractAnalyticsPayload = (responseData) => {
    if (!responseData) {
        return {
            summary: {
                total_questions: 0,
                total_responses: 0,
                respondent_count: 0,
            },
            questions: [],
        };
    }

    return {
        summary: responseData.summary ?? responseData.data?.summary ?? {
            total_questions: 0,
            total_responses: 0,
            respondent_count: 0,
        },
        questions: responseData.questions ?? responseData.data?.questions ?? [],
    };
};

export const soalAnalyticsQueryKey = (kategoriSoal, modulId) => [
    "soal-analytics",
    kategoriSoal ?? null,
    normalizeModuleId(modulId),
];

export const useSoalAnalytics = (kategoriSoal, modulId, options = {}) => {
    const normalizedModuleId = normalizeModuleId(modulId);
    const routeGroup = kategoriSoal ? ANALYTICS_ROUTE_MAP[kategoriSoal] : null;
    const { enabled: userEnabled, ...restOptions } = options;

    return useQuery({
        queryKey: soalAnalyticsQueryKey(kategoriSoal, normalizedModuleId),
        queryFn: async () => {
            if (!routeGroup?.analysis || !normalizedModuleId) {
                return extractAnalyticsPayload(null);
            }

            const analysisRoute = routeGroup.analysis(normalizedModuleId);
            const url = resolveUrl(analysisRoute);
            const { data } = await api.get(url);
            return extractAnalyticsPayload(data);
        },
        enabled: Boolean(routeGroup?.analysis && normalizedModuleId) && (userEnabled ?? true),
        refetchOnWindowFocus: false,
        ...restOptions,
    });
};
