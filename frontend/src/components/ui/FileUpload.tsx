import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from './Button';

interface FileUploadProps {
    onUpload: (files: File[]) => Promise<void>;
    accept?: string;
    multiple?: boolean;
    maxSize?: number; // in MB
    maxFiles?: number;
    className?: string;
}

interface UploadedFile {
    file: File;
    progress: number;
    status: 'uploading' | 'success' | 'error';
    error?: string;
}

export function FileUpload({
    onUpload,
    accept = '.pdf,.doc,.docx',
    multiple = true,
    maxSize = 10,
    maxFiles = 10,
    className,
}: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    const validateFile = (file: File): string | null => {
        if (maxSize && file.size > maxSize * 1024 * 1024) {
            return `File size exceeds ${maxSize}MB`;
        }
        return null;
    };

    const handleFiles = useCallback(async (fileList: FileList) => {
        const newFiles = Array.from(fileList);

        if (!multiple && newFiles.length > 1) {
            alert('Only one file is allowed');
            return;
        }

        if (files.length + newFiles.length > maxFiles) {
            alert(`Maximum ${maxFiles} files allowed`);
            return;
        }

        const validFiles: UploadedFile[] = [];
        for (const file of newFiles) {
            const error = validateFile(file);
            validFiles.push({
                file,
                progress: 0,
                status: error ? 'error' : 'uploading',
                error: error || undefined,
            });
        }

        setFiles((prev) => [...prev, ...validFiles]);

        // Simulate upload progress and call onUpload
        const filesToUpload = validFiles.filter((f) => f.status === 'uploading').map((f) => f.file);

        if (filesToUpload.length > 0) {
            try {
                // Simulate progress
                const progressInterval = setInterval(() => {
                    setFiles((prev) =>
                        prev.map((f) =>
                            f.status === 'uploading' && f.progress < 90
                                ? { ...f, progress: f.progress + 10 }
                                : f
                        )
                    );
                }, 200);

                await onUpload(filesToUpload);

                clearInterval(progressInterval);

                setFiles((prev) =>
                    prev.map((f) =>
                        f.status === 'uploading' ? { ...f, progress: 100, status: 'success' } : f
                    )
                );
            } catch (error) {
                setFiles((prev) =>
                    prev.map((f) =>
                        f.status === 'uploading'
                            ? { ...f, status: 'error', error: 'Upload failed' }
                            : f
                    )
                );
            }
        }
    }, [files.length, maxFiles, multiple, onUpload]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            handleFiles(e.target.files);
        }
    };

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    return (
        <div className={cn('space-y-4', className)}>
            <div
                className={cn(
                    'border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer',
                    isDragging ? 'border-primary bg-primary/5' : 'border-border bg-card/30',
                    'hover:border-primary/50 hover:bg-card/50'
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
            >
                <div className="p-4 rounded-full bg-card/50 mb-4">
                    <Upload className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-medium text-text-primary mb-2">
                    {isDragging ? 'Drop files here' : 'Upload Files'}
                </h3>
                <p className="text-sm text-text-secondary mb-6 max-w-xs">
                    Drag and drop files here, or click to browse. Max {maxSize}MB per file.
                </p>
                <Button variant="outline" type="button" onClick={(e) => e.stopPropagation()}>
                    Browse Files
                </Button>
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    onChange={handleInputChange}
                    className="hidden"
                />
            </div>

            {files.length > 0 && (
                <div className="space-y-2">
                    {files.map((uploadedFile, index) => (
                        <div
                            key={index}
                            className="glass p-4 rounded-lg flex items-center gap-4"
                        >
                            <div className={cn(
                                "h-10 w-10 rounded-lg flex items-center justify-center",
                                uploadedFile.status === 'success' && "bg-success/20 text-success",
                                uploadedFile.status === 'error' && "bg-error/20 text-error",
                                uploadedFile.status === 'uploading' && "bg-primary/20 text-primary"
                            )}>
                                {uploadedFile.status === 'uploading' ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <FileText className="h-5 w-5" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-text-primary truncate">
                                    {uploadedFile.file.name}
                                </p>
                                <p className="text-xs text-text-secondary">
                                    {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                                {uploadedFile.status === 'uploading' && (
                                    <div className="mt-2 w-full bg-background/50 rounded-full h-1.5">
                                        <div
                                            className="bg-primary h-1.5 rounded-full transition-all duration-300"
                                            style={{ width: `${uploadedFile.progress}%` }}
                                        />
                                    </div>
                                )}
                                {uploadedFile.error && (
                                    <p className="text-xs text-error mt-1">{uploadedFile.error}</p>
                                )}
                            </div>
                            <button
                                onClick={() => removeFile(index)}
                                className="p-1 rounded-lg text-text-secondary hover:bg-card-hover hover:text-text-primary transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
