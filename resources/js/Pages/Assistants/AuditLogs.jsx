import ContentAuditLogs from "@/Components/Assistants/Content/ContentAuditLogs";
import AssistantLayout from "@/Layouts/AssistantLayout";
import { Head } from "@inertiajs/react";

export default function AuditLogs() {
    return (
        <AssistantLayout>
            <Head title="Audit Logs" />
            <ContentAuditLogs />
        </AssistantLayout>
    );
}
