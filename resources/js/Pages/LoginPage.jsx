import { Head, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Toaster } from "react-hot-toast";  // Import Toaster
import LoginFormPraktikan from '@/Components/Praktikans/Forms/LoginFormPraktikan';
import LoginFormAssistant from '@/Components/Assistants/Forms/LoginFormAssistant';
import Vector from '@/Components/Praktikans/Sections/Vector';
import ButtonGroup from '@/Components/Praktikans/Buttons/ButtonGroup';

export default function LoginPage() {
    const { ziggy } = usePage().props; 
    
    const [mode, setMode] = useState('praktikan');

    useEffect(() => {
        const currentMode = ziggy?.location
            ? new URL(ziggy.location).searchParams.get('mode') || 'praktikan'
            : 'praktikan';
        setMode(currentMode);
    }, [ziggy?.location]);

    const handleModeChange = (nextMode) => {
        if (!nextMode || nextMode === mode) {
            return;
        }

        setMode(nextMode);

        if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.searchParams.set("mode", nextMode);
            window.history.replaceState({}, "", url);
        }
    };

    return (
        <>
            <Head title={mode === 'praktikan' ? "Login - Praktikan" : "Login - Asisten"} />

            <div className="min-h-screen flex items-center justify-center p-4 bg-depth-background">
                <Toaster />
                <div className="bg-depth-card flex items-center rounded-depth-lg shadow-depth-lg max-w-4xl w-full p-5 border border-depth">
                    {mode === 'praktikan' ? (           
                        <LoginFormPraktikan mode={mode} />
                    ) : (
                        <LoginFormAssistant mode={mode} />
                    )}

                    <div className="w-1/2 flex flex-col items-center justify-center">
                        <Vector size="w-[410px]" />
                        <div className="flex flex-col items-center mt-4 w-full">
                            <ButtonGroup currentMode={mode} onModeChange={handleModeChange} />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
