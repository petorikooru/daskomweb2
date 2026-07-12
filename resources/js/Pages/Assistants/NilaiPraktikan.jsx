import ContentNilai from "@/Components/Assistants/Content/ContentNilai";
import AssistantLayout from "@/Layouts/AssistantLayout";
import { Head } from "@inertiajs/react";

export default function NilaiPraktikan() {
    return (
        <AssistantLayout>
            {({ asisten }) => (
                <>
                    <Head title="Nilai Praktikan" />
                    <ContentNilai asisten={asisten} />
                </>
            )}
        </AssistantLayout>
    );
}
