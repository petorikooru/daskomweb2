import ContentPolling from "@/Components/Assistants/Content/ContentPolling";
import AssistantLayout from "@/Layouts/AssistantLayout";
import { Head } from "@inertiajs/react";

export default function PollingAssistant() {
    return (
        <AssistantLayout>
            {({ roleName }) => (
                <>
                    <Head title="Polling Assistant" />
                    <ContentPolling roleName={roleName} />
                </>
            )}
        </AssistantLayout>
    );
}
