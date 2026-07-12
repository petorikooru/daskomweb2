import ContentPraktikum from "@/Components/Assistants/Content/ContentPraktikum";
import AssistantLayout from "@/Layouts/AssistantLayout";
import { Head } from "@inertiajs/react";

export default function StartPraktikum() {
    return (
        <AssistantLayout>
            <Head title="Start Praktikum" />
            <ContentPraktikum />
        </AssistantLayout>
    );
}
