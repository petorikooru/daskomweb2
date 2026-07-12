import ContentLaporan from "@/Components/Assistants/Content/ContentLaporan";
import AssistantLayout from "@/Layouts/AssistantLayout";
import { Head } from "@inertiajs/react";

export default function ResultLaporan() {
    return (
        <AssistantLayout>
            <Head title="Hasil Laporan" />
            <ContentLaporan />
        </AssistantLayout>
    );
}
