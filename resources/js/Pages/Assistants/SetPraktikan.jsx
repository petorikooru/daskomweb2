import AssistantLayout from "@/Layouts/AssistantLayout";
import ContentSetPraktikan from "@/Components/Assistants/Content/ContentSetPraktikan";
import { Head } from "@inertiajs/react";

export default function SetPraktikan() {
    return (
        <AssistantLayout>
            {() => (
                <>
                    <Head title="Set Praktikan" />
                    <ContentSetPraktikan />
                </>
            )}
        </AssistantLayout>
    );
}
