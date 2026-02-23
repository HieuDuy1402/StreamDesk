"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { StreamGrid, SoundItem } from "./deck/StreamGrid";
import { PlayerBar } from "./player/PlayerBar";
import { EditSoundDialog, AVAILABLE_ICONS } from "./dialog/EditSoundDialog";
import { Music, LucideIcon } from "lucide-react";

// Helper to generate empty slots
const createEmptySound = (id: string): SoundItem => ({
    id,
});

const API_URL = "/api/sounds";

export function SoundBoard() {
    const { user } = useAuth();
    const defaultLimit = user?.maxTracks || 8;

    // Initial state: matches the user's limit or default
    const [sounds, setSounds] = useState<SoundItem[]>([]);

    // Initialize and sync sounds based on user.maxTracks
    useEffect(() => {
        if (user) {
            setSounds(prev => {
                const targetCount = user.maxTracks || 8;

                // If it's the very first load (prev is empty)
                if (prev.length === 0) {
                    return Array.from({ length: targetCount }, (_, i) => createEmptySound(String(i + 1)));
                }

                // If already at target count, do nothing
                if (prev.length === targetCount) return prev;

                // Adjusting count:
                if (prev.length < targetCount) {
                    // Need more slots
                    const needed = targetCount - prev.length;
                    const newPlaceholders = Array.from({ length: needed }, (_, i) =>
                        createEmptySound(String(Date.now() + i))
                    );
                    return [...prev, ...newPlaceholders];
                } else {
                    // Admin reduced the limit -> remove slots
                    // Per user request: "If the limit < track holder default then delete the track holder to fit limit"
                    // We take the first 'targetCount' tracks.
                    return prev.slice(0, targetCount);
                }
            });
        }
    }, [user?.maxTracks]);

    const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(50);
    const [isFadeIn, setIsFadeIn] = useState(false);
    const [isFadeOut, setIsFadeOut] = useState(false);
    const [isRepeat, setIsRepeat] = useState(false);

    // For volume sync and fading
    const volumeRef = useRef(volume);
    useEffect(() => {
        volumeRef.current = volume;
    }, [volume]);

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingSoundId, setEditingSoundId] = useState<string | null>(null);

    // Audio Element Reference
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const fadeIntervalRef = useRef<any>(null);

    // Fetch Sounds on Mount
    useEffect(() => {
        const fetchSounds = async () => {
            try {
                const res = await fetch(API_URL, {
                    credentials: 'include'
                });
                const data = await res.json();

                // Validate that data is an array
                if (!Array.isArray(data)) {
                    console.error("Expected array from API, got:", typeof data, data);
                    return;
                }

                // Merge fetched data into current slots
                setSounds((prev) => {
                    const tempSounds = [...prev];
                    data.forEach((item: any) => {
                        const iconObj = AVAILABLE_ICONS.find(i => i.label === item.icon);
                        const IconComponent = iconObj ? iconObj.icon : Music;

                        const soundWithData = {
                            id: item.id,
                            label: item.label,
                            icon: IconComponent,
                            file: item.file || undefined
                        };

                        // Try to find a placeholder with this ID
                        const index = tempSounds.findIndex(s => s.id === item.id);
                        if (index !== -1) {
                            tempSounds[index] = soundWithData;
                        } else {
                            // Try to find any empty placeholder to replace
                            const emptyIndex = tempSounds.findIndex(s => !s.file);
                            if (emptyIndex !== -1) {
                                tempSounds[emptyIndex] = soundWithData;
                            } else {
                                // If no empty slots left, push it (this handles user having more tracks than limit)
                                tempSounds.push(soundWithData);
                            }
                        }
                    });
                    return tempSounds;
                });
            } catch (err) {
                console.error("Failed to fetch sounds:", err);
            }
        };

        fetchSounds();
    }, []);

    // Volume Sync Effect (only if not fading)
    useEffect(() => {
        if (audioRef.current && !fadeIntervalRef.current) {
            audioRef.current.volume = volume / 100;
        }
    }, [volume, isPlaying]);

    // Audio Playback Effect
    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
        }

        const audio = audioRef.current;

        // Handle audio end
        const handleEnded = () => {
            if (isRepeat) {
                audio.currentTime = 0;
                audio.play();
            } else {
                setIsPlaying(false);
                // Optional: Auto-play next? User didn't ask for auto-next, just manual controls.
            }
        };

        audio.addEventListener('ended', handleEnded);

        // Find the current sound
        const currentSound = sounds.find(s => s.id === currentTrackId);

        if (currentSound && currentSound.file) {
            const isNewTrack = audio.src !== currentSound.file;

            // Load the audio file
            if (isNewTrack) {
                audio.src = currentSound.file;
                audio.load();
                // Clear any existing fade
                if (fadeIntervalRef.current) {
                    clearInterval(fadeIntervalRef.current);
                    fadeIntervalRef.current = null;
                }
            }

            // Play or pause based on state
            if (isPlaying) {
                // Implementation of Fade In
                if (isFadeIn && (isNewTrack || audio.paused)) {
                    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);

                    audio.volume = 0;
                    const target = volumeRef.current / 100;
                    const steps = 20;
                    const stepVal = target / steps;
                    let currentStep = 0;

                    audio.play().catch(err => {
                        console.error("Error playing audio:", err);
                        setIsPlaying(false);
                    });

                    fadeIntervalRef.current = setInterval(() => {
                        currentStep++;
                        if (currentStep < steps) {
                            audio.volume = (stepVal * currentStep);
                        } else {
                            audio.volume = target;
                            clearInterval(fadeIntervalRef.current!);
                            fadeIntervalRef.current = null;
                        }
                    }, 50); // 1 second total (50ms * 20)
                } else {
                    if (!fadeIntervalRef.current) {
                        audio.volume = volume / 100;
                    }
                    audio.play().catch(err => {
                        console.error("Error playing audio:", err);
                        setIsPlaying(false);
                    });
                }
            } else {
                // If not playing, and not currently fading out, pause
                if (!fadeIntervalRef.current) {
                    audio.pause();
                }
            }
        } else {
            // No file to play
            audio.pause();
            setIsPlaying(false);
        }

        // Cleanup
        return () => {
            audio.removeEventListener('ended', handleEnded);
            audio.pause();
        };
    }, [currentTrackId, isPlaying, sounds, isFadeIn]);

    const handleNext = () => {
        if (!currentTrackId) return;
        const currentSounds = sounds.filter(s => s.file);
        const currentIndex = currentSounds.findIndex(s => s.id === currentTrackId);
        if (currentIndex === -1) return;

        const nextIndex = (currentIndex + 1) % currentSounds.length;
        handlePlay(currentSounds[nextIndex].id);
    };

    const handleBack = () => {
        if (!currentTrackId) return;
        const currentSounds = sounds.filter(s => s.file);
        const currentIndex = currentSounds.findIndex(s => s.id === currentTrackId);
        if (currentIndex === -1) return;

        const prevIndex = (currentIndex - 1 + currentSounds.length) % currentSounds.length;
        handlePlay(currentSounds[prevIndex].id);
    };

    const handleTogglePlay = () => {
        if (isPlaying) {
            if (isFadeOut && audioRef.current && !audioRef.current.paused) {
                // Start Fade Out
                if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);

                const audio = audioRef.current;
                const startVol = audio.volume;
                const steps = 20;
                const stepVal = startVol / steps;
                let currentStep = 0;

                fadeIntervalRef.current = setInterval(() => {
                    currentStep++;
                    if (currentStep < steps) {
                        audio.volume = Math.max(0, startVol - (stepVal * currentStep));
                    } else {
                        audio.volume = 0;
                        clearInterval(fadeIntervalRef.current!);
                        fadeIntervalRef.current = null;
                        setIsPlaying(false);
                        audio.pause(); // Ensure it pauses after fade
                    }
                }, 50); // 1 second total
            } else {
                setIsPlaying(false);
            }
        } else {
            setIsPlaying(true);
        }
    };

    const handlePlay = (id: string) => {
        const sound = sounds.find(s => s.id === id);

        // Only play if the sound has a file
        if (!sound || !sound.file) {
            console.warn("No audio file for this sound");
            return;
        }

        if (currentTrackId === id) {
            handleTogglePlay();
        } else {
            // Immediate switch if playing a different track
            if (fadeIntervalRef.current) {
                clearInterval(fadeIntervalRef.current);
                fadeIntervalRef.current = null;
            }
            setCurrentTrackId(id);
            setIsPlaying(true);
        }
    };

    const handleAddMusic = (id: string) => {
        setEditingSoundId(id);
        setIsDialogOpen(true);
    };

    const handleSaveSound = async (label: string, icon: LucideIcon, file: File | null) => {
        if (!editingSoundId) return;

        // Find icon label string
        const iconLabel = AVAILABLE_ICONS.find(i => i.icon === icon)?.label || "Music";

        try {
            let fileUrl = undefined;
            const existingSound = sounds.find(s => s.id === editingSoundId);
            const isReplacingFile = !!(existingSound && existingSound.file);

            if (file) {
                // 1. Get Upload Signature
                const sigRes = await fetch('/api/upload-signature', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: editingSoundId, isReplacingFile })
                });

                if (!sigRes.ok) {
                    const errorData = await sigRes.json();
                    alert(errorData.error || "Failed to get upload signature. Track limit reached?");
                    setEditingSoundId(null);
                    setIsDialogOpen(false);
                    return;
                }

                const { signature, timestamp, cloudName, apiKey } = await sigRes.json();

                // 2. Upload directly to Cloudinary
                const uploadData = new FormData();
                uploadData.append('file', file);
                uploadData.append('api_key', apiKey);
                uploadData.append('timestamp', timestamp);
                uploadData.append('signature', signature);
                uploadData.append('folder', 'streamdesk');

                // Audio must use the 'video' resource_type endpoint
                const cloudinaryRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, {
                    method: 'POST',
                    body: uploadData
                });

                if (!cloudinaryRes.ok) {
                    alert("Failed to upload audio to Cloudinary.");
                    setEditingSoundId(null);
                    setIsDialogOpen(false);
                    return;
                }

                const cloudinaryData = await cloudinaryRes.json();
                fileUrl = cloudinaryData.secure_url;
            }

            // 3. Save metadata to our database
            const payload = {
                id: editingSoundId,
                label,
                icon: iconLabel,
                ...(fileUrl && { fileUrl })
            };

            const res = await fetch(API_URL, {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                let errorMessage = "Failed to save";
                const contentType = res.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    const errorData = await res.json();
                    errorMessage = errorData.error || errorMessage;
                } else {
                    errorMessage = await res.text();
                }
                alert(errorMessage);
                setEditingSoundId(null);
                setIsDialogOpen(false);
                return;
            }

            const data = await res.json();
            // fileUrl comes from either Cloudinary (if new upload) or database (if unchanged)
            const finalFileUrl = data.file;

            setSounds((prev) =>
                prev.map((s) =>
                    s.id === editingSoundId
                        ? { ...s, label, icon, file: finalFileUrl }
                        : s
                )
            );
        } catch (err: any) {
            console.error("Error saving sound:", err);
            alert(err.message || "An error occurred while saving the sound.");
        }

        setEditingSoundId(null);
    };

    const handleDelete = async (id: string) => {
        const sound = sounds.find((s) => s.id === id);
        if (!sound) return;

        setSounds((prev) => {
            // 2-stage delete logic (Optimistic Update first)
            if (sound.file) {
                return prev.map((s) => s.id === id ? { id: s.id } : s);
            } else {
                return prev.filter((s) => s.id !== id);
            }
        });

        // Perform API Delete if it had data
        if (sound.file) {
            try {
                await fetch(`${API_URL}/${id}`, { method: "DELETE", credentials: 'include' });
            } catch (err) {
                console.error("Failed to delete", err);
            }
        }

        // If deleting currently playing track, stop playback
        if (currentTrackId === id) {
            setIsPlaying(false);
            setCurrentTrackId(null);
        }
    };

    const handleAddButton = () => {
        const newId = String(Date.now());
        setSounds((prev) => [...prev, createEmptySound(newId)]);
    };

    return (
        <>
            <div className="w-full h-full flex flex-col items-center justify-center mt-4 mb-24">
                <StreamGrid
                    sounds={sounds}
                    onPlay={handlePlay}
                    onAddMusic={handleAddMusic}
                    onAddButton={handleAddButton}
                    onDelete={handleDelete}
                    currentTrackId={currentTrackId}
                    isPlaying={isPlaying}
                />
            </div>

            <PlayerBar
                currentTrackId={currentTrackId}
                currentTrackLabel={sounds.find(s => s.id === currentTrackId)?.label}
                isPlaying={isPlaying}
                onTogglePlay={handleTogglePlay}
                audioRef={audioRef}
                volume={volume}
                onVolumeChange={setVolume}
                isFadeIn={isFadeIn}
                onToggleFadeIn={setIsFadeIn}
                isFadeOut={isFadeOut}
                onToggleFadeOut={setIsFadeOut}
                isRepeat={isRepeat}
                onToggleRepeat={() => setIsRepeat(!isRepeat)}
                onNext={handleNext}
                onBack={handleBack}
            />

            <EditSoundDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onSave={handleSaveSound}
                initialLabel={sounds.find(s => s.id === editingSoundId)?.label}
            />
        </>
    );
}
