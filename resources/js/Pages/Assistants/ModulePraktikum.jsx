import ContentModule from "@/Components/Assistants/Content/ContentModule";
import AssistantLayout from "@/Layouts/AssistantLayout";
import { Head } from "@inertiajs/react";

export default function ModulePraktikum() {
    return (
        <AssistantLayout>
            <Head title="Modul Praktikum" />
            <ContentModule />
        </AssistantLayout>
    );
}
