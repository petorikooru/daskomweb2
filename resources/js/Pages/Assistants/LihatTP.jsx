import FormLihatTP from "@/Components/Assistants/Forms/FormLihatTP";
import AssistantLayout from "@/Layouts/AssistantLayout";
import { Head } from "@inertiajs/react";

export default function LihatTP() {
    return (
        <AssistantLayout contentClassName="mt-10 flex w-full justify-center">
            <Head title="Lihat Tes Pendahuluan" />
            <FormLihatTP />
        </AssistantLayout>
    );
}
