"use client";

import { SoundButton } from "./SoundButton";
import { Plus } from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface SoundItem {
    id: string;
    label?: string;
    icon?: LucideIcon;
    file?: string;
}

interface StreamGridProps {
    sounds: SoundItem[];
    onPlay: (id: string) => void;
    onAddMusic: (id: string) => void;
    onAddButton: () => void;
    onDelete: (id: string) => void; // New prop
    currentTrackId: string | null;
    isPlaying: boolean;
}

export function StreamGrid({
    sounds,
    onPlay,
    onAddMusic,
    onAddButton,
    onDelete,
    currentTrackId,
    isPlaying
}: StreamGridProps) {
    return (
        // Changed overflow-hidden to overflow-y-auto to allow scrolling when min-size is hit
        <div className="w-full h-full max-h-[calc(100vh-140px)] flex items-center justify-center overflow-y-auto">
            <div className="
        grid gap-4 w-full h-full max-w-7xl
        grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8
        auto-rows-min
        p-4 items-center justify-center content-start
      ">
                {sounds.map((sound) => (
                    // Enforce min-height/min-width to prevent buttons from vanishing
                    <div key={sound.id} className="flex items-center justify-center w-full h-full min-h-[80px] min-w-[80px] aspect-square">
                        <SoundButton
                            label={sound.label}
                            icon={sound.icon}
                            isEmpty={!sound.file}
                            isActive={currentTrackId === sound.id}
                            isPlaying={currentTrackId === sound.id && isPlaying}
                            onClick={() => sound.file ? onPlay(sound.id) : onAddMusic(sound.id)}
                            onDelete={() => onDelete(sound.id)}
                            className="w-full h-full max-w-[140px] max-h-[140px]"
                        />
                    </div>
                ))}

                {/* Add Button Control */}
                <div className="flex items-center justify-center w-full h-full min-h-[80px] min-w-[80px] aspect-square">
                    <button
                        onClick={onAddButton}
                        className="flex flex-col items-center justify-center 
                w-full h-full max-w-[140px] max-h-[140px] rounded-2xl 
                border-2 border-dashed border-zinc-800 
                bg-zinc-900/20 hover:bg-zinc-800/50 hover:border-zinc-600
                transition-all duration-200"
                    >
                        <Plus className="w-8 h-8 text-zinc-600 mb-2" />
                        <span className="text-xs font-medium text-zinc-600">Add</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
