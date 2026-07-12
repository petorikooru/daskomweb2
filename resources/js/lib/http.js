import { api } from "./api";
import { router } from "@inertiajs/react";

const normalizeRoute = (route) => {
    if (!route) {
        throw new Error("Route descriptor is required");
    }

    if (typeof route === "string") {
        return { url: route, method: "get" };
    }

    if (typeof route === "object" && route.url) {
        const method = route.method ?? route.methods?.[0] ?? "get";
        if (typeof route.url === "function") {
            return { url: route.url(), method: method.toLowerCase() };
        }

        return { url: route.url, method: method.toLowerCase() };
    }

    throw new Error("Unsupported route descriptor provided to HTTP helper");
};

const resolveRequestConfig = (normalized, payload, config = {}) => {
    const requestConfig = {
        url: normalized.url,
        method: normalized.method,
        ...config,
    };

    if (typeof payload !== "undefined") {
        requestConfig.data = payload;
    }

    return requestConfig;
};

export const send = (route, payload, config = {}) => {
    const normalized = normalizeRoute(route);
    const requestConfig = resolveRequestConfig(normalized, payload, config);

    return api.request(requestConfig);
};

export const submit = (route, options = {}) => {
    const { data, method, ...rest } = options;
    const normalized = normalizeRoute(route);

    return router.visit(normalized.url, {
        method: method ?? normalized.method,
        data,
        ...rest,
    });
};

export const resolveUrl = (route) => normalizeRoute(route).url;

export const resolveMethod = (route) => normalizeRoute(route).method;
