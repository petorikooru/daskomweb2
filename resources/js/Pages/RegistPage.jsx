import { Head, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import toast , { Toaster } from "react-hot-toast";  // Import Toaster
import RegistFormPraktikan from '@/Components/Praktikans/Forms/RegistFormPraktikan';
import RegistFormAssistant from '@/Components/Assistants/Forms/RegistFormAssistant';
import Vector from '@/Components/Praktikans/Sections/Vector';

export default function RegistPage() {
    const { ziggy } = usePage().props;  

    const [mode, setMode] = useState();

    useEffect(() => {
        const currentMode = ziggy?.location
            ? new URL(ziggy.location).searchParams.get('mode') || 'praktikan'
            : 'praktikan';
        setMode(currentMode);
    }, [ziggy?.location]);

    return (
        <>
            <Head title={mode === 'praktikan' ? "Register - Praktikan" : "Register - Asisten"} />
            
            <div className="bg-depth-background min-h-screen flex items-center justify-center p-4">
                <Toaster />
                <div className="bg-depth-card flex rounded-depth-lg shadow-depth-lg max-w-4xl w-full p-5 border border-depth">
                    {mode === 'praktikan' ? (
                        <RegistFormPraktikan mode={mode} />
                    ) : (
                        <RegistFormAssistant mode={mode} />
                    )}
                    <Vector />
                </div>
            </div>
        </>
    );
}
