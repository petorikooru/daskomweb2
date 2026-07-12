import ContentLihatTP from "@/Components/Assistants/Content/ContentLihatTP";
import AssistantLayout from "@/Layouts/AssistantLayout";
import { Head } from "@inertiajs/react";

export default function ResultLihatTP() {
    return (
        <AssistantLayout contentClassName="flex-grow md:w-3/4 mt-20">
            <Head title="Hasil Tes Pendahuluan" />
            <ContentLihatTP />
        </AssistantLayout>
    );
}
