import ContentPlottingan from "@/Components/Assistants/Content/ContentPlotting";
import AssistantLayout from "@/Layouts/AssistantLayout";
import { Head } from "@inertiajs/react";

export default function PlottingAssistant() {
    return (
        <AssistantLayout>
            <Head title="Plotting Assistant" />
            <ContentPlottingan />
        </AssistantLayout>
    );
}
