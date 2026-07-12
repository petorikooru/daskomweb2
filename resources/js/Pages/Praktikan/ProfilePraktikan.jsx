import { Head } from "@inertiajs/react";
import PraktikanAuthenticated from "@/Layouts/PraktikanAuthenticatedLayout";
import PraktikanCard from "@/Components/Praktikans/Sections/CardPraktikan";
import { usePage } from "@inertiajs/react";
import PraktikanUtilities from "@/Components/Praktikans/Layout/PraktikanUtilities";

export default function ProfilePraktikan() {
    const { auth } = usePage().props; //data praktikan
    const praktikan = auth.praktikan;

    return (
        <>
            <PraktikanAuthenticated
                praktikan={praktikan}
                customWidth="w-[60%]"
            >
                <Head title="Dashboard" />
                <PraktikanCard praktikan={praktikan} />
            </PraktikanAuthenticated>
            <PraktikanUtilities />
        </>
    );
}
