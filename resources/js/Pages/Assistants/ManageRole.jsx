import { Suspense, lazy } from "react";
import { Head } from "@inertiajs/react";
import AssistantLayout from "@/Layouts/AssistantLayout";

const ContentManageRole = lazy(() => import("@/Components/Assistants/Content/ContentManageRole"));

export default function ManageRole() {
    return (
        <AssistantLayout>
            {({ asisten }) => (
                <>
                    <Head title="Manage Role" />
                    <Suspense fallback={<div className="px-6 py-8 text-sm text-depth-secondary">Memuat manajemen role...</div>}>
                        <ContentManageRole asisten={asisten} />
                    </Suspense>
                </>
            )}
        </AssistantLayout>
    );
}
