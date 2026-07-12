import { Head, usePage } from "@inertiajs/react";
import PraktikanAuthenticated from "@/Layouts/PraktikanAuthenticatedLayout";
import ContactAssistantTable from "@/Components/Praktikans/Tables/ContactAssistantTable";
import PraktikanPageHeader from "@/Components/Praktikans/Common/PraktikanPageHeader";
import PraktikanUtilities from "@/Components/Praktikans/Layout/PraktikanUtilities";

export default function ContactAssistant() {
    const { auth } = usePage().props; //data praktikan
    const praktikan = auth.praktikan;

    return (
        <>
            <PraktikanAuthenticated
                praktikan={praktikan}
                customWidth="w-[80%]"
                header={
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Dashboard
                    </h2>
                }
            >
                <Head title="Contact Assistant" />

                <div className="-mt-[1vh] flex flex-col gap-6">
                    <PraktikanPageHeader title="Kontak Asisten" />
                    <ContactAssistantTable />
                </div>
            </PraktikanAuthenticated>
            <PraktikanUtilities />
        </>
    );
}
