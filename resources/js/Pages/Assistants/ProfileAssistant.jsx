import AssistantCard from "@/Components/Assistants/Buttons/AssistantCard";
import AssistantLayout from "@/Layouts/AssistantLayout";
import { Head } from "@inertiajs/react";

export default function ProfileAssistant() {
    return (
        <AssistantLayout>
            {({ asisten }) => (
                <>
                    <Head title="Profil Asisten" />
                    <AssistantCard asisten={asisten} />
                </>
            )}
        </AssistantLayout>
    );
}
