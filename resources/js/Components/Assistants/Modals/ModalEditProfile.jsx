import { useEffect, useState } from "react";
import { usePage } from "@inertiajs/react";
import { submit } from "@/lib/http";
import { useImageKitUpload } from "@/hooks/useImageKitUpload";
import {
    update as updateAsisten,
    updatePp as updateAsistenPhoto,
    destroyPp as destroyAsistenPhoto,
} from "@/lib/routes/asisten";
import { ModalOverlay } from "@/Components/Common/ModalPortal";
import ModalCloseButton from "@/Components/Common/ModalCloseButton";

export default function ModalEditProfile({ isOpen, onClose }) {
    // const [isSuccessModalOpen, setSuccessModalOpen] = useState(false);
    const { success } = usePage().props;
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [photoError, setPhotoError] = useState(""); // Only for photo errors
    const [avatar, setAvatar] = useState(null);
    const [values, setValues] = useState({
        nomor_telepon: "",
        id_line: "",
        instagram: "",
        deskripsi: "",

    });

    const { upload, isUploading, progress, error: uploadError } = useImageKitUpload();
    const { auth, errors } = usePage().props; // Fetch shared props from Inertia
    const asisten = auth.asisten;

    // Populate the form fields with current data from `asisten`
    useEffect(() => {
        // Show error only for photo uploads
        if (errors?.upload) {
            setPhotoError(errors.upload[0]);
            setIsSuccessModalOpen(true); // Ensure modal opens for errors
        } else {
            setPhotoError(""); // Clear photo error if fixed
        }

        // ✅ Ensure success modal shows when update is successful
        if (success && !errors?.upload) {
            setIsSuccessModalOpen(true);
        }


        if (asisten) {
            setValues({
                nomor_telepon: asisten.nomor_telepon || "",
                id_line: asisten.id_line || "",
                instagram: asisten.instagram || "",
                deskripsi: asisten.deskripsi || "",
            });
            setAvatar(asisten.avatar_url || null); // Assuming there's an avatar URL
        }
    }, [asisten, errors, success]);

    const handleSave = async (e) => {
        e.preventDefault();
        submit(updateAsisten(), {
            data: values,
            preserveScroll: true,
            onSuccess: () => {
                setIsSuccessModalOpen(true);
                setTimeout(() => {
                    setIsSuccessModalOpen(false);
                    onClose();
                }, 3000);
            },
            onError: (errors) => {
                console.error("Validation Errors:", errors);
            },
        });
    };

    const handleChange = (e) => {
        const key = e.target.id;
        const value = e.target.value;
        setValues((prevValues) => ({
            ...prevValues,
            [key]: value,
        }));
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file size (512KB = 512 * 1024 bytes)
        if (file.size > 512 * 1024) {
            setPhotoError("Photo must be less than 512kb");
            setIsSuccessModalOpen(true);
            return;
        }

        try {
            // Show preview immediately
            setAvatar(URL.createObjectURL(file));

            // Upload to ImageKit
            const fileName = `${asisten.kode}.${file.name.split('.').pop()}`;
            const result = await upload(file, 'daskom/profil-asisten', fileName);

            // Send metadata to Laravel
            submit(updateAsistenPhoto(), {
                data: {
                    file_id: result.fileId,
                    url: result.url,
                    file_path: result.filePath,
                },
                preserveScroll: true,
                onSuccess: (page) => {
                    setAvatar(page.props.auth.asisten.foto_asistens?.foto || null);
                    setPhotoError("");
                },
                onError: (errors) => {
                    console.error("Upload Error:", errors);
                    setPhotoError("Failed to save photo metadata");
                    setIsSuccessModalOpen(true);
                },
            });
        } catch (error) {
            console.error("ImageKit Upload Error:", error);
            setPhotoError(error.message || "Upload failed");
            setIsSuccessModalOpen(true);
        }
    };

    const handleDeleteAvatar = () => {
        submit(destroyAsistenPhoto(), {
            preserveScroll: true,
            onSuccess: () => {
                setAvatar(null);
            },
            onError: (errors) => {
                console.error("Delete Avatar Error:", errors);
            },
        });
    };

    if (!isOpen) return null;

    return (
        <>
            <ModalOverlay onClose={onClose} className="depth-modal-overlay z-50">
                <div className="depth-modal-container max-w-2xl">
                    <div className="flex flex-row justify-between items-center">
                        <h2 className="depth-modal-title mb-6">Edit Profile</h2>
                        <ModalCloseButton onClick={onClose} ariaLabel="Tutup edit profil" />
                    </div>
                    <form onSubmit={handleSave} encType="multipart/form-data">
                        <div className="flex gap-6 p-4">
                            <div className="flex-1">
                                {/* WhatsApp */}
                                <div className="mb-4">
                                    <label className="mb-2 block text-sm font-semibold text-depth-primary">
                                        WhatsApp:
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                                        placeholder="Enter WhatsApp number"
                                        name="nomor_telepon"
                                        id="nomor_telepon"
                                        value={values.nomor_telepon}
                                        onChange={handleChange}
                                    />
                                    {errors.nomor_telepon && (
                                        <p className="mt-1 text-xs text-red-500">{errors.nomor_telepon}</p>
                                    )}
                                </div>
                                {/* ID Line */}
                                <div className="mb-4">
                                    <label className="mb-2 block text-sm font-semibold text-depth-primary">
                                        ID Line:
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                                        placeholder="Enter Line ID"
                                        name="id_line"
                                        id="id_line"
                                        value={values.id_line}
                                        onChange={handleChange}
                                    />
                                    {errors.id_line && (
                                        <p className="mt-1 text-xs text-red-500">{errors.id_line}</p>
                                    )}
                                </div>
                                {/* Instagram */}
                                <div className="mb-4">
                                    <label className="mb-2 block text-sm font-semibold text-depth-primary">
                                        Instagram:
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                                        placeholder="Enter Instagram username"
                                        name="instagram"
                                        id="instagram"
                                        value={values.instagram}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            {/* Avatar */}
                            <div className="flex flex-col items-center">
                                <div className="mb-4 flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-2 border-depth bg-depth-background shadow-depth-md">
                                    {asisten?.foto_asistens?.foto || avatar ? (
                                        <img
                                            src={asisten?.foto_asistens?.foto || avatar}
                                            alt="Avatar"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-4xl text-depth-secondary">👤</span>
                                    )}
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <label
                                        htmlFor="avatarUpload"
                                        className={`cursor-pointer rounded-depth-md bg-[var(--depth-color-primary)] px-4 py-2 text-center text-sm font-semibold text-white shadow-depth-md transition hover:-translate-y-0.5 hover:shadow-depth-lg ${isUploading ? 'opacity-50 cursor-not-allowed' : ''
                                            }`}
                                    >
                                        {isUploading ? `Uploading ${progress}%` : 'Change Avatar'}
                                    </label>
                                    <input
                                        id="avatarUpload"
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleAvatarUpload}
                                        disabled={isUploading}
                                    />

                                    <button
                                        type="button"
                                        className="rounded-depth-md border border-depth bg-depth-interactive px-5 py-2 text-sm font-semibold text-depth-primary shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md disabled:cursor-not-allowed disabled:opacity-50"
                                        onClick={handleDeleteAvatar}
                                        disabled={isUploading}
                                    >
                                        Delete Avatar
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* About Me */}
                        <div className="mb-6">
                            <label className="mb-2 block text-sm font-semibold text-depth-primary">
                                About Me:
                            </label>
                            <textarea
                                className="w-full rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                                placeholder="Tell us about yourself"
                                rows="4"
                                name="deskripsi"
                                id="deskripsi"
                                value={values.deskripsi}
                                onChange={handleChange}
                            ></textarea>
                            {errors.deskripsi && (
                                <p className="mt-1 text-xs text-red-500">{errors.deskripsi}</p>
                            )}
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-center">
                            <button
                                type="submit"
                                className="w-full max-w-xs rounded-depth-md bg-[var(--depth-color-primary)] px-8 py-3 font-semibold text-white shadow-depth-lg transition hover:-translate-y-0.5 hover:shadow-depth-lg"
                            >
                                Save
                            </button>
                        </div>
                    </form>
                </div>
            </ModalOverlay>
            {isSuccessModalOpen && (
                <ModalOverlay
                    onClose={() => setIsSuccessModalOpen(false)}
                    className="depth-modal-overlay z-[60]"
                >
                    <div className="depth-modal-container max-w-sm space-y-4 text-center">
                        <div className="depth-modal-header justify-center">
                            <h3
                                className={`depth-modal-title text-center ${photoError ? "text-red-500" : "text-[var(--depth-color-primary)]"}`}
                            >
                                {photoError ? "Upload Error" : "Success!"}
                            </h3>
                            <ModalCloseButton
                                onClick={() => setIsSuccessModalOpen(false)}
                                ariaLabel="Tutup notifikasi edit profil"
                            />
                        </div>

                        <div className="flex justify-center">
                            <div
                                className={`flex h-16 w-16 items-center justify-center rounded-full ${
                                    photoError ? "bg-red-100" : "bg-green-100"
                                }`}
                            >
                                {photoError ? (
                                    <svg
                                        className="h-8 w-8 text-red-500"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                ) : (
                                    <svg
                                        className="h-8 w-8 text-green-500"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                        </div>

                        <p className="text-sm text-depth-secondary">
                            {photoError ? "Photo must be less than 500kb" : "Profile Updated Successfully!"}
                        </p>

                        <button
                            onClick={() => setIsSuccessModalOpen(false)}
                            className="w-full rounded-depth-md bg-[var(--depth-color-primary)] px-4 py-2 text-sm font-semibold text-white shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
                        >
                            Tutup
                        </button>
                    </div>
                </ModalOverlay>
            )}
        </>
    );
}
