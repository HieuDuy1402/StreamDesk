"use client";

import { useState } from "react";
import { X, Check, Music, Mic, Volume2, Bell, Radio, Zap, Star, Heart, Upload } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface EditSoundDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (label: string, icon: LucideIcon, file: File | null) => void;
    initialLabel?: string;
}

export const AVAILABLE_ICONS = [
    { icon: Music, label: "Music" },
    { icon: Mic, label: "Mic" },
    { icon: Volume2, label: "Speaker" },
    { icon: Bell, label: "Bell" },
    { icon: Radio, label: "Radio" },
    { icon: Zap, label: "Effect" },
    { icon: Star, label: "Star" },
    { icon: Heart, label: "Fav" },
];

import { upload } from "@vercel/blob/client";

export function EditSoundDialog({ isOpen, onClose, onSave, initialLabel = "" }: EditSoundDialogProps) {
    const [label, setLabel] = useState(initialLabel);
    const [selectedIconName, setSelectedIconName] = useState("Music");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    if (!isOpen) return null;

    const handleSave = async () => {
        setIsUploading(true);
        try {
            const selectedIcon = AVAILABLE_ICONS.find(i => i.label === selectedIconName)?.icon || Music;

            let fileUrl = null;
            if (selectedFile) {
                const newBlob = await upload(selectedFile.name, selectedFile, {
                    access: 'public',
                    handleUploadUrl: '/api/upload',
                });
                fileUrl = newBlob.url;
            }

            // We pass fileUrl (string) instead of File object now, but we need to update the interface in the parent or cast it here.
            // Actually, let's update the onSave signature in the props to accept string | File | null
            // But wait, the parent `SoundBoard.tsx` handles the upload currently?
            // No, the parent `handleSaveSound` takes `File | null`.
            // We should change the parent to accept `string | null` for the file URL if we do upload here.
            // OR we hack it for now and pass the URL as a "file" property in a special object?
            // Better: Update the onSave prop type.

            // For now, let's assume we pass the File object if we didn't upload, or...
            // Wait, if we upload HERE, we get a URL.
            // If we pass the File to the parent, the PARENT uploads.
            // The goal is to upload HERE (Client Side).
            // So onSave should accept (label, icon, fileUrl: string | null).

            onSave(label || "New Sound", selectedIcon, fileUrl as any);

            onClose();
            setSelectedFile(null);
        } catch (err) {
            console.error("Upload failed:", err);
            alert("Upload failed. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">Edit Sound Button</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-zinc-800 transition">
                        <X className="w-5 h-5 text-zinc-400" />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Label Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Label</label>
                        <input
                            type="text"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            placeholder="e.g. Applause"
                            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-white placeholder:text-zinc-600 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>

                    {/* File Upload Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Audio File</label>
                        <div className="relative">
                            <input
                                type="file"
                                accept="audio/*"
                                onChange={handleFileChange}
                                className="hidden"
                                id="audio-upload"
                            />
                            <label
                                htmlFor="audio-upload"
                                className={`
                  flex items-center justify-center w-full gap-2 px-4 py-3 rounded-lg border cursor-pointer border-dashed
                  transition-colors duration-200
                  ${selectedFile
                                        ? "border-primary/50 bg-primary/10 text-primary"
                                        : "border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:bg-zinc-900 hover:border-zinc-600"
                                    }
                `}
                            >
                                <Upload className="w-5 h-5" />
                                <span className="text-sm truncate">
                                    {selectedFile ? selectedFile.name : "Choose audio file..."}
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Icon Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Select Icon</label>
                        <div className="grid grid-cols-4 gap-3">
                            {AVAILABLE_ICONS.map(({ icon: Icon, label: iconLabel }) => (
                                <button
                                    key={iconLabel}
                                    onClick={() => setSelectedIconName(iconLabel)}
                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all
                    ${selectedIconName === iconLabel
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:border-zinc-700"
                                        }
                  `}
                                >
                                    <Icon className="w-6 h-6 mb-1" />
                                    <span className="text-[10px]">{iconLabel}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            disabled={isUploading}
                            className="flex-1 rounded-lg border border-zinc-800 bg-transparent py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-900 transition disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isUploading}
                            className="flex-1 rounded-lg bg-primary py-3 text-sm font-medium text-white hover:bg-primary/90 transition shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isUploading ? (
                                <>
                                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
