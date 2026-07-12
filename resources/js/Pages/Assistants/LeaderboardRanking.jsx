import ContentRanking from "@/Components/Assistants/Content/ContentRanking";
import AssistantLayout from "@/Layouts/AssistantLayout";
import { Head } from "@inertiajs/react";

export default function LeaderboardRanking() {
    return (
        <AssistantLayout>
            <Head title="Leaderboard Ranking" />
            <ContentRanking />
        </AssistantLayout>
    );
}
