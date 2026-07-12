import { useState, useCallback, useRef } from 'react';
import axios from 'axios';

/**
 * Custom hook for handling ImageKit uploads with progress tracking and abort capability
 * 
 * @returns {object} Upload utilities and state
 */
export function useImageKitUpload() {
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);
    const uploadRef = useRef(null);

    /**
     * Fetch authentication parameters from the backend
     */
    const getAuthParams = useCallback(async () => {
        try {
            const response = await axios.get('/api-v1/imagekit/auth');
            if (response.data.success) {
                return response.data.data;
            }
            throw new Error('Failed to get authentication parameters');
        } catch (err) {
            const message = err.response?.data?.message || err.message || 'Authentication failed';
            setError(message);
            throw new Error(message);
        }
    }, []);

    /**
     * Handle upload error
     */
    const onError = useCallback((err) => {
        setIsUploading(false);
        setProgress(0);
        const errorMessage = err?.message || 'Upload failed';
        setError(errorMessage);
        console.error('ImageKit upload error:', err);
    }, []);

    /**
     * Handle upload success
     */
    const onSuccess = useCallback((response) => {
        setIsUploading(false);
        setProgress(100);
        setError(null);
        return response;
    }, []);

    /**
     * Handle upload progress
     */
    const onUploadProgress = useCallback((progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setProgress(percentCompleted);
    }, []);

    /**
     * Handle upload start
     */
    const onUploadStart = useCallback(() => {
        setIsUploading(true);
        setProgress(0);
        setError(null);
    }, []);

    /**
     * Abort the current upload
     */
    const abort = useCallback(() => {
        if (uploadRef.current) {
            uploadRef.current.abort();
            setIsUploading(false);
            setProgress(0);
            setError('Upload cancelled');
        }
    }, []);

    /**
     * Reset upload state
     */
    const reset = useCallback(() => {
        setIsUploading(false);
        setProgress(0);
        setError(null);
    }, []);

    /**
     * Upload a file to ImageKit via server-side endpoint
     * 
     * @param {File} file - The file to upload
     * @param {string} folder - The folder path in ImageKit
     * @param {string} fileName - Optional custom filename
     * @param {boolean} useUniqueFileName - Whether to generate a unique filename
     * @returns {Promise<object>} Upload response with url, fileId, etc.
     */
    const upload = useCallback(async (file, folder = '/', fileName = null, useUniqueFileName = true) => {
        return new Promise(async (resolve, reject) => {
            try {
                setIsUploading(true);
                setProgress(0);
                setError(null);

                const formData = new FormData();
                formData.append('file', file);
                
                if (fileName) {
                    formData.append('fileName', fileName);
                }

                if (folder) {
                    formData.append('folder', folder);
                }

                formData.append('useUniqueFileName', useUniqueFileName ? '1' : '0');

                const response = await axios.post('/api-v1/imagekit/upload', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        );
                        setProgress(percentCompleted);
                    },
                });

                setIsUploading(false);
                setProgress(100);
                setError(null);

                // Return normalized response
                resolve(response.data.data);
            } catch (err) {
                setIsUploading(false);
                setProgress(0);
                const errorMessage = err.response?.data?.message || err.message || 'Upload failed';
                setError(errorMessage);
                console.error('ImageKit upload error:', err);
                reject(new Error(errorMessage));
            }
        });
    }, []);

    return {
        upload,
        abort,
        reset,
        isUploading,
        progress,
        error,
        uploadRef,
        getAuthParams,
        onError,
        onSuccess,
        onUploadProgress,
        onUploadStart,
    };
}
