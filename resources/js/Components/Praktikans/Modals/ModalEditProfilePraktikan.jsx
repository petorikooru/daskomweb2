import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { useImageKitUpload } from '../../../hooks/useImageKitUpload';
import axios from 'axios';

export default function ModalEditProfilePraktikan({ isOpen, onClose, praktikan }) {
    const [avatar, setAvatar] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [photoError, setPhotoError] = useState(false);
    const { upload } = useImageKitUpload();

    const { data: values, setData: setValues, put, errors } = useForm({
        nomor_telepon: praktikan?.nomor_telepon || '',
        email: praktikan?.email || '',
        alamat: praktikan?.alamat || '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setValues(name, value);
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        
        if (!file) {
            return;
        }

        // Check file size (512KB = 524288 bytes)
        if (file.size > 524288) {
            setPhotoError(true);
            setIsSuccessModalOpen(true);
            return;
        }

        setIsUploading(true);
        setProgress(0);

        try {
            // Create preview
            const previewUrl = URL.createObjectURL(file);
            setAvatar(previewUrl);

            // Upload to ImageKit via server
            const uploadResult = await upload(file, 'daskom/profil-praktikan', null, true);

            // Update praktikan profile picture
            await axios.post('/api-v1/praktikan/profile-picture', {
                file_id: uploadResult.fileId,
                url: uploadResult.url,
                file_path: uploadResult.filePath,
            });

            setPhotoError(false);
            setIsSuccessModalOpen(true);
            
            // Reload page after short delay to show new avatar
            setTimeout(() => {
                window.location.reload();
            }, 1500);

        } catch (error) {
            console.error('Upload error:', error);
            setPhotoError(true);
            setIsSuccessModalOpen(true);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteAvatar = async () => {
        if (!praktikan?.profile_picture_file_id) {
            return;
        }

        if (!confirm('Are you sure you want to delete your profile picture?')) {
            return;
        }

        try {
            await axios.delete('/api-v1/praktikan/profile-picture');
            setAvatar(null);
            setPhotoError(false);
            setIsSuccessModalOpen(true);
            
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (error) {
            console.error('Delete error:', error);
            setPhotoError(true);
            setIsSuccessModalOpen(true);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        put('/api-v1/praktikan', {
            preserveScroll: true,
            onSuccess: () => {
                setPhotoError(false);
                setIsSuccessModalOpen(true);
            },
            onError: () => {
                setPhotoError(true);
                setIsSuccessModalOpen(true);
            },
        });
    };

    if (!isOpen) {
        return null;
    }

    return (
        <>
            {/* Main Modal */}
            <div className="depth-modal-overlay" onClick={onClose}>
                <div className="depth-modal-container max-w-3xl" onClick={(e) => e.stopPropagation()}>
                    {/* Header */}
                    <div className="mb-6 flex items-center justify-between border-b border-depth pb-4">
                        <h2 className="text-2xl font-bold text-depth-primary">
                            Edit Profile
                        </h2>
                        <button
                            onClick={onClose}
                            className="rounded-depth-md p-2 text-depth-secondary transition hover:bg-depth-hover hover:text-depth-primary"
                        >
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        <div className="mb-6 grid grid-cols-2 gap-6">
                            {/* Left Column - Form Fields */}
                            <div className="space-y-4">
                                {/* Phone Number */}
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-depth-primary">
                                        Phone Number:
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                                        placeholder="Enter phone number"
                                        name="nomor_telepon"
                                        id="nomor_telepon"
                                        value={values.nomor_telepon}
                                        onChange={handleChange}
                                    />
                                    {errors.nomor_telepon && (
                                        <p className="mt-1 text-xs text-red-500">{errors.nomor_telepon}</p>
                                    )}
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-depth-primary">
                                        Email:
                                    </label>
                                    <input
                                        type="email"
                                        className="w-full rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                                        placeholder="Enter email"
                                        name="email"
                                        id="email"
                                        value={values.email}
                                        onChange={handleChange}
                                    />
                                    {errors.email && (
                                        <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                                    )}
                                </div>

                                {/* Address */}
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-depth-primary">
                                        Address:
                                    </label>
                                    <textarea
                                        className="w-full rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                                        placeholder="Enter address"
                                        rows="3"
                                        name="alamat"
                                        id="alamat"
                                        value={values.alamat}
                                        onChange={handleChange}
                                    ></textarea>
                                    {errors.alamat && (
                                        <p className="mt-1 text-xs text-red-500">{errors.alamat}</p>
                                    )}
                                </div>
                            </div>

                            {/* Right Column - Avatar */}
                            <div className="flex flex-col items-center">
                                <div className="mb-4 flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-2 border-depth bg-depth-background shadow-depth-md">
                                    {praktikan?.profile_picture_url || avatar ? (
                                        <img 
                                            src={praktikan?.profile_picture_url || avatar} 
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
                                        className={`cursor-pointer rounded-depth-md bg-[var(--depth-color-primary)] px-4 py-2 text-center text-sm font-semibold text-white shadow-depth-md transition hover:-translate-y-0.5 hover:shadow-depth-lg ${
                                            isUploading ? 'opacity-50 cursor-not-allowed' : ''
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
                                                                {/* Photo Rules Disclaimer */}
                                <div className="mt-6 w-full rounded-depth-md border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-900 shadow-depth-sm dark:border-amber-900/30 dark:bg-amber-900/20 dark:text-amber-100">
                                    <p className="font-semibold mb-2"> Peraturan Foto Profil:</p>
                                    <p className="leading-relaxed">
                                        Untuk foto dibebaskan foto apapun dengan syarat menunjukkan wajah diri sendiri dan tidak mengandung sara/pornografi. Jika melanggar maka akan diberikan sanksi akademik yang serius.
                                    </p>
                                </div>
                            </div>
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
            </div>

            {/* Success/Error Modal */}
            {isSuccessModalOpen && (
                <div className="depth-modal-overlay">
                    <div className="depth-modal-container max-w-md">
                        {photoError ? (
                            <>
                                <div className="mb-4 flex justify-center">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                                        <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </div>
                                </div>
                                <h3 className="mb-2 text-center text-lg font-bold text-red-500">
                                    Upload Error
                                </h3>
                                <p className="mb-4 text-center text-sm text-depth-secondary">
                                    Photo must be less than 500kb
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="mb-4 flex justify-center">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                                        <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                </div>
                                <h3 className="mb-2 text-center text-lg font-bold text-[var(--depth-color-primary)]">
                                    Success!
                                </h3>
                                <p className="mb-4 text-center text-sm text-depth-secondary">
                                    Profile Updated Successfully!
                                </p>
                            </>
                        )}
                        <button
                            onClick={() => setIsSuccessModalOpen(false)}
                            className="w-full rounded-depth-md bg-[var(--depth-color-primary)] px-4 py-2 text-sm font-semibold text-white shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
