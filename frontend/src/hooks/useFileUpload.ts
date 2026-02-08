import { useState, useCallback } from 'react';

interface UploadProgress {
    [key: string]: number;
}

interface UseFileUploadReturn {
    uploadProgress: UploadProgress;
    isUploading: boolean;
    uploadFiles: (files: File[], onUpload: (file: File) => Promise<void>) => Promise<void>;
    resetProgress: () => void;
}

export function useFileUpload(): UseFileUploadReturn {
    const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});
    const [isUploading, setIsUploading] = useState(false);

    const uploadFiles = useCallback(
        async (files: File[], onUpload: (file: File) => Promise<void>) => {
            setIsUploading(true);

            try {
                for (const file of files) {
                    const fileName = file.name;

                    // Simulate progress updates
                    const progressInterval = setInterval(() => {
                        setUploadProgress((prev) => {
                            const current = prev[fileName] || 0;
                            if (current >= 90) {
                                clearInterval(progressInterval);
                                return prev;
                            }
                            return { ...prev, [fileName]: current + 10 };
                        });
                    }, 200);

                    await onUpload(file);

                    clearInterval(progressInterval);
                    setUploadProgress((prev) => ({ ...prev, [fileName]: 100 }));
                }
            } finally {
                setIsUploading(false);
            }
        },
        []
    );

    const resetProgress = useCallback(() => {
        setUploadProgress({});
    }, []);

    return {
        uploadProgress,
        isUploading,
        uploadFiles,
        resetProgress,
    };
}
