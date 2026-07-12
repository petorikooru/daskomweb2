import ContentPelanggaran from "@/Components/Assistants/Content/ContentPelanggaran";
import AssistantLayout from "@/Layouts/AssistantLayout";
import { Head } from "@inertiajs/react";

export default function PelanggaranAssistant() {
    return (
        <AssistantLayout>
            <Head title="Pelanggaran Asisten" />
            <ContentPelanggaran />
        </AssistantLayout>
    );
}
