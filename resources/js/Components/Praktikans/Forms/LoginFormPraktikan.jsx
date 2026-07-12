import { useState } from 'react';
import { usePage } from '@inertiajs/react';
import toast from 'react-hot-toast';
import eyeClose from '../../../../assets/form/eyeClose.png';
import eyeOpen from '../../../../assets/form/eyeOpen.png';
import ButtonOption from '../Buttons/ButtonOption';
import Modal from '../Modals/Modal';
import ModalForgotPass from '../Modals/ModalForgotPass';
import { submit } from '@/lib/http';
import { store as loginPraktikan } from '@/lib/routes/auth/loginPraktikan';

export default function LoginFormPraktikan({ mode, onSwitchToRegister }) {
    const [values, setValues] = useState({
        nim: '',
        password: '',
    });

    const [passwordVisible, setPasswordVisible] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Access shared props from Inertia
    const { errors } = usePage().props;

    const togglePasswordVisibility = () => {
        setPasswordVisible((prevState) => !prevState);
    };

    const openModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    function handleChange(e) {
        const key = e.target.id;
        let value = e.target.value;

        if (key === 'nim') {
            value = value.replace(/\D/g, '').slice(0, 12);
        }

        setValues((values) => ({
            ...values,
            [key]: value,
        }));
    }

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate form values before submission (if needed)
        if (values.nim && values.password) {
            submit(loginPraktikan(), {
                data: values,
                preserveScroll: true,
                preserveState: true,
                onSuccess: (page) => {
                    if (page.props.authenticated) {
                        toast.success('Login successful!');
                    } else {
                        toast.error('Login failed! Please check your credentials.');
                    }
                },
                onError: (error) => {
                    Object.values(error).forEach((errMsg) => {
                        toast.error(errMsg);
                    });
                }
            });
        } else {
            toast.error("NIM and Password are required.");
        }
    };

    return (
        <div className="w-1/2 my-10 px-10">
            <h1 className="font-bold text-3xl text-depth-primary text-center">WELCOME!</h1>
            <p className="font-bold text-lg text-depth-secondary text-center">Please login to start practicum.</p>

            <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
                <input
                    className="bg-depth-card py-2 px-4 mt-10 rounded-depth-md border border-depth placeholder-depth-secondary focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:border-transparent transition-all shadow-depth-sm"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={12}
                    name="nim"
                    id='nim'
                    value={values.nim}
                    placeholder="NIM"
                    onChange={handleChange}
                />
                <div className="relative">
                    <input
                        className="bg-depth-card py-2 px-4 mt-1 w-full rounded-depth-md border border-depth placeholder-depth-secondary focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:border-transparent transition-all shadow-depth-sm"
                        type={passwordVisible ? 'text' : 'password'}
                        id="password"
                        value={values.password}
                        onChange={handleChange}
                        name="password"
                        placeholder="Password"
                    />
                    <img
                        className="w-4 cursor-pointer absolute top-[55%] right-3 transform -translate-y-1/2 opacity-70 hover:opacity-100 transition-opacity"
                        src={passwordVisible ? eyeOpen : eyeClose}
                        alt="Toggle Password Visibility"
                        onClick={togglePasswordVisibility}
                    />
                </div>
                <ButtonOption order="login" mode={mode} onSwitchToRegister={onSwitchToRegister} />
            </form>
            <div className="relative my-1 text-right">
                <p className="inline-block relative text-sm text-depth-primary font-semibold cursor-pointer group hover:opacity-80 transition-opacity" onClick={openModal}>
                    Forgot Password?
                    <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[var(--depth-color-primary)] transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100" />
                </p>
            </div>

            {isModalOpen && (
                <Modal isOpen={isModalOpen} onClose={closeModal} width="w-[370px]">
                    <ModalForgotPass />
                </Modal>
            )}
        </div>
    );
}
