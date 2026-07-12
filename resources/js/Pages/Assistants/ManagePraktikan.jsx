import AssistantLayout from "@/Layouts/AssistantLayout";
import ContentManagePraktikan from "@/Components/Assistants/Content/ContentManagePraktikan";
import { Head } from "@inertiajs/react";

export default function ManagePraktikan() {
    return (
        <AssistantLayout>
            {({ asisten }) => (
                <>
                    <Head title="Manage Praktikan" />
                    <ContentManagePraktikan asisten={asisten} />
                </>
            )}
        </AssistantLayout>
    );
}
