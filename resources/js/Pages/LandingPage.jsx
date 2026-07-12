import { Head, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import LandingNavbar from '@/Components/Praktikans/Layout/LandingNavbar';
import MainLanding from '@/Components/Praktikans/Sections/MainLanding';
import LandingSosmed from '@/Components/Praktikans/Sections/LandingSosmed';
import LandingFooter from '@/Components/Praktikans/Layout/LandingFooter';
import AuthModal from '@/Components/Praktikans/Modals/ModalAuth';
import AboutModal from '@/Components/Praktikans/Modals/ModalAbout';
import ContactModal from '@/Components/Praktikans/Modals/ModalContact';

export default function LandingPage() {
    const { ziggy, errors, error } = usePage().props;
    const [authModal, setAuthModal] = useState({ isOpen: false, type: null, mode: 'praktikan' });
    const [aboutModal, setAboutModal] = useState(false);
    const [contactModal, setContactModal] = useState(false);

    useEffect(() => {
        // Check URL parameters for modal state
        const currentUrl = ziggy?.location ? new URL(ziggy.location) : null;
        const path = currentUrl?.pathname;
        const mode = currentUrl?.searchParams.get('mode') || 'praktikan';

        if (path === '/login') {
            setAuthModal({ isOpen: true, type: 'login', mode });
        } else if (path === '/register') {
            setAuthModal({ isOpen: true, type: 'register', mode });
        }
    }, [ziggy?.location]);

    useEffect(() => {
        // Keep modal open if there are validation errors or error messages
        if ((errors && Object.keys(errors).length > 0) || error) {
            // If modal is not already open, reopen it with login type
            if (!authModal.isOpen) {
                const currentUrl = ziggy?.location ? new URL(ziggy.location) : null;
                const mode = currentUrl?.searchParams.get('mode') || 'praktikan';
                setAuthModal({ isOpen: true, type: 'login', mode });
            }
        }
    }, [errors, error]);

    const openAuthModal = (type, mode = 'praktikan') => {
        setAuthModal({ isOpen: true, type, mode });
        // Update URL without page reload
        const newUrl = `/${type}?mode=${mode}`;
        window.history.pushState({}, '', newUrl);
    };

    const closeAuthModal = () => {
        setAuthModal({ isOpen: false, type: null, mode: authModal.mode });
        // Return to landing page URL
        window.history.pushState({}, '', '/');
    };

    const handleModeChange = (newMode) => {
        setAuthModal(prev => ({ ...prev, mode: newMode }));
        // Update URL with new mode
        const newUrl = `/${authModal.type}?mode=${newMode}`;
        window.history.pushState({}, '', newUrl);
    };

    const handleSwitchType = (newType) => {
        setAuthModal(prev => ({ ...prev, type: newType }));
        // Update URL with new type
        const newUrl = `/${newType}?mode=${authModal.mode}`;
        window.history.pushState({}, '', newUrl);
    };

    const openAboutModal = () => {
        setAboutModal(true);
    };

    const closeAboutModal = () => {
        setAboutModal(false);
    };

    const openContactModal = () => {
        setContactModal(true);
    };

    const closeContactModal = () => {
        setContactModal(false);
    };

    return (
        <>
            <Head title="Daskom Laboratory" />
            <Toaster />
            <LandingNavbar onAboutClick={openAboutModal} onContactClick={openContactModal} />
            <MainLanding onGetStartedClick={() => openAuthModal('login')} />
            <LandingSosmed />
            
            <AuthModal 
                isOpen={authModal.isOpen}
                onClose={closeAuthModal}
                type={authModal.type}
                mode={authModal.mode}
                onModeChange={handleModeChange}
                onSwitchType={handleSwitchType}
            />

            <AboutModal 
                isOpen={aboutModal}
                onClose={closeAboutModal}
            />

            <ContactModal 
                isOpen={contactModal}
                onClose={closeContactModal}
            />
        </>
    );
}
