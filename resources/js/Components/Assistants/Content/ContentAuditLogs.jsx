import { router, usePage } from "@inertiajs/react";
import { useEffect, useMemo, useState } from "react";
import { useAssistantToolbar } from "@/Layouts/AssistantToolbarContext";
import AuditLogsTable from "../Tables/AuditLogsTable";

const inputBaseClass =
    "rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm shadow-depth-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--depth-color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--depth-color-background)]";

export default function ContentAuditLogs() {
    const { logs = null, filters = {} } = usePage().props ?? {};
    const [search, setSearch] = useState(filters?.search ?? "");

    useEffect(() => {
        setSearch(filters?.search ?? "");
    }, [filters?.search]);

    const handleSubmit = (event) => {
        event.preventDefault();

        router.get(
            "/audit-logs",
            search ? { search } : {},
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleReset = () => {
        setSearch("");
        router.get(
            "/audit-logs",
            {},
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    };

    const toolbarConfig = useMemo(
        () => ({
            title: "Audit Logs",
        }),
        [],
    );

    useAssistantToolbar(toolbarConfig);

    return (
        <section className="space-y-6 text-depth-primary">
            <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-3">
                    <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Cari aksi, deskripsi, atau nama asisten"
                        className={`${inputBaseClass} w-64 max-w-full`}
                        aria-label="Cari audit log"
                    />
                    {search ? (
                        <button
                            type="button"
                            onClick={handleReset}
                            className="rounded-depth-md border border-depth bg-depth-interactive px-4 py-2 text-sm font-semibold text-depth-primary shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
                        >
                            Reset
                        </button>
                    ) : null}
                    <button
                        type="submit"
                        className="rounded-depth-md bg-[var(--depth-color-primary)] px-4 py-2 text-sm font-semibold text-white shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
                    >
                        Cari
                    </button>
                </form>

            <p className="text-sm text-depth-secondary">
                Pantau aktivitas penting yang dilakukan oleh tim asisten.
            </p>

            <AuditLogsTable logs={logs} />
        </section>
    );
}
