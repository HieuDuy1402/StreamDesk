"use client";

import { LucideIcon, Plus, X } from "lucide-react";

interface SoundButtonProps {
    label?: string;
    icon?: LucideIcon;
    isActive?: boolean;
    isPlaying?: boolean;
    isEmpty?: boolean;
    onClick?: () => void;
    onDelete?: () => void; // New prop
    color?: string;
    className?: string;
}

export function SoundButton({
    label,
    icon: Icon,
    isActive = false,
    isPlaying = false,
    isEmpty = false,
    onClick,
    onDelete,
    color = "bg-primary/20",
    className = ""
}: SoundButtonProps) {

    const baseClasses = `
        group flex flex-col items-center justify-center 
        rounded-2xl transition-all duration-200 ease-out
        relative
        ${className || "w-24 h-24 md:w-32 md:h-32"}
    `;

    // Common Delete Button
    const DeleteButton = () => (
        <div
            role="button"
            onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
            }}
            className="absolute -top-2 -right-2 p-1 bg-zinc-800 rounded-full border border-zinc-700 
                opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-500/20 hover:border-red-500/50"
        >
            <X className="w-4 h-4 text-zinc-400 group-hover/delete:text-red-400" />
        </div>
    );

    if (isEmpty) {
        return (
            <button
                onClick={onClick}
                className={`
                    ${baseClasses}
                    border-2 border-dashed border-zinc-700 
                    bg-transparent hover:border-zinc-500 hover:bg-zinc-900/50
                `}
            >
                {onDelete && <DeleteButton />}
                <Plus className="w-8 h-8 md:w-10 md:h-10 mb-2 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                <span className="text-xs md:text-sm font-medium text-zinc-600 group-hover:text-zinc-400">
                    Add Music
                </span>
            </button>
        );
    }

    return (
        <button
            onClick={onClick}
            className={`
                ${baseClasses}
                border-2 
                ${isActive
                    ? "border-primary bg-primary/20 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                    : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-600 hover:border-zinc-500 hover:bg-zinc-800"
                }
                ${isPlaying ? "animate-pulse" : ""}
            `}
        >
            {onDelete && <DeleteButton />}

            {/* Glow Effect Background */}
            {isActive && (
                <div className="absolute inset-0 rounded-2xl bg-primary/10 blur-xl transition-all" />
            )}

            {/* Icon */}
            {Icon && (
                <Icon
                    className={`w-8 h-8 md:w-10 md:h-10 mb-2 transition-colors
            ${isActive ? "text-primary-foreground" : "text-zinc-400 group-hover:text-zinc-200"}
          `}
                />
            )}

            {/* Label */}
            <span className={`text-xs md:text-sm font-medium truncate w-full px-2 text-center
        ${isActive ? "text-primary-foreground" : "text-zinc-500 group-hover:text-zinc-300"}
      `}>
                {label}
            </span>
        </button>
    );
}
