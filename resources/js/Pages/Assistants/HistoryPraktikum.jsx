import ContentHistory from "@/Components/Assistants/Content/ContentHistory";
import AssistantLayout from "@/Layouts/AssistantLayout";
import { Head } from "@inertiajs/react";

export default function HistoryPraktikum() {
    return (
        <AssistantLayout>
            <Head title="History Praktikum" />
            <ContentHistory />
        </AssistantLayout>
    );
}
