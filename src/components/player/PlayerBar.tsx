"use client";

import React, { useState, useEffect } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, Repeat, Shuffle } from "lucide-react";

interface PlayerBarProps {
    currentTrackId: string | null;
    currentTrackLabel?: string;
    isPlaying: boolean;
    onTogglePlay: () => void;
    audioRef: React.RefObject<HTMLAudioElement | null>;
    volume: number;
    onVolumeChange: (vol: number) => void;
    isFadeIn: boolean;
    onToggleFadeIn: (val: boolean) => void;
    isFadeOut: boolean;
    onToggleFadeOut: (val: boolean) => void;
    isRepeat: boolean;
    onToggleRepeat: () => void;
    onNext: () => void;
    onBack: () => void;
}

export function PlayerBar({
    currentTrackId,
    currentTrackLabel,
    isPlaying,
    onTogglePlay,
    audioRef,
    volume,
    onVolumeChange,
    isFadeIn,
    onToggleFadeIn,
    isFadeOut,
    onToggleFadeOut,
    isRepeat,
    onToggleRepeat,
    onNext,
    onBack
}: PlayerBarProps) {
    const [currentTime, setCurrentTime] = React.useState(0);
    const [duration, setDuration] = React.useState(0);

    // Update progress
    React.useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => {
            setCurrentTime(audio.currentTime);
        };

        const updateDuration = () => {
            if (!isNaN(audio.duration)) {
                setDuration(audio.duration);
            }
        };

        // Set initial duration if already loaded
        if (!isNaN(audio.duration)) {
            setDuration(audio.duration);
        }

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('durationchange', updateDuration);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('durationchange', updateDuration);
        };
    }, [audioRef, currentTrackId]); // Re-attach when track changes

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = Number(e.target.value);
        setCurrentTime(newTime);
        if (audioRef.current) {
            audioRef.current.currentTime = newTime;
        }
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
    const volumeProgress = volume;

    const formatTime = (seconds: number) => {
        if (isNaN(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed bottom-0 left-0 w-full border-t border-zinc-800 bg-zinc-950/80 backdrop-blur-xl p-4 safe-area-pb">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">

                {/* Track Info */}
                <div className="flex items-center gap-4 min-w-[200px] flex-1">
                    <div className={`h-12 w-12 rounded-lg bg-zinc-800 flex items-center justify-center ${isPlaying ? 'animate-pulse' : ''}`}>
                        <Volume2 className="h-6 w-6 text-zinc-500" />
                    </div>
                    <div className="flex flex-col text-left">
                        <span className="text-sm font-medium text-zinc-200 truncate max-w-[150px]">
                            {currentTrackLabel || (currentTrackId ? `Track ${currentTrackId}` : "No Track Playing")}
                        </span>
                        <span className="text-xs text-zinc-500">
                            {currentTrackId ? `${formatTime(currentTime)} / ${formatTime(duration)}` : "Select a sound to play"}
                        </span>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col items-center gap-2 flex-[2]">
                    <div className="flex items-center gap-6">
                        <div className="w-4" /> {/* Blank space for removed shuffle */}
                        <button
                            onClick={onBack}
                            disabled={!currentTrackId}
                            className="text-zinc-200 hover:text-white transition disabled:opacity-30"
                        >
                            <SkipBack className="h-5 w-5" />
                        </button>
                        <button
                            onClick={onTogglePlay}
                            disabled={!currentTrackId}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black hover:bg-zinc-200 transition disabled:opacity-50"
                        >
                            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-1" />}
                        </button>
                        <button
                            onClick={onNext}
                            disabled={!currentTrackId}
                            className="text-zinc-200 hover:text-white transition disabled:opacity-30"
                        >
                            <SkipForward className="h-5 w-5" />
                        </button>
                        <button
                            onClick={onToggleRepeat}
                            className={`${isRepeat ? 'text-white' : 'text-zinc-400'} hover:text-white transition`}
                        >
                            <Repeat className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full max-w-md">
                        <input
                            type="range"
                            min="0"
                            max={duration || 100}
                            value={currentTime}
                            onChange={handleSeek}
                            className="w-full h-1 cursor-pointer appearance-none rounded-full bg-zinc-800 accent-white"
                            style={{
                                background: `linear-gradient(to right, white ${progress}%, rgb(39 39 42) ${progress}%)`
                            }}
                        />
                    </div>
                </div>

                {/* Volume & Effects */}
                <div className="flex items-center gap-6 min-w-[300px] justify-end flex-1 hidden md:flex">
                    {/* Fade Toggles */}
                    <div className="flex items-center gap-3 border-r border-zinc-800 pr-4">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={isFadeIn}
                                    onChange={(e) => onToggleFadeIn(e.target.checked)}
                                    className="sr-only"
                                />
                                <div className={`w-8 h-4 rounded-full transition-colors ${isFadeIn ? 'bg-white' : 'bg-zinc-800'}`}></div>
                                <div className={`absolute left-0.5 top-0.5 w-3 h-3 bg-zinc-950 rounded-full transition-transform ${isFadeIn ? 'translate-x-4' : 'translate-x-0'}`}></div>
                            </div>
                            <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 group-hover:text-zinc-300 transition-colors">Fade In</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={isFadeOut}
                                    onChange={(e) => onToggleFadeOut(e.target.checked)}
                                    className="sr-only"
                                />
                                <div className={`w-8 h-4 rounded-full transition-colors ${isFadeOut ? 'bg-white' : 'bg-zinc-800'}`}></div>
                                <div className={`absolute left-0.5 top-0.5 w-3 h-3 bg-zinc-950 rounded-full transition-transform ${isFadeOut ? 'translate-x-4' : 'translate-x-0'}`}></div>
                            </div>
                            <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 group-hover:text-zinc-300 transition-colors">Fade Out</span>
                        </label>
                    </div>

                    {/* Volume Slider */}
                    <div
                        className="flex items-center gap-2"
                        onWheel={(e) => {
                            if (e.deltaY < 0) {
                                onVolumeChange(Math.min(100, volume + 5));
                            } else {
                                onVolumeChange(Math.max(0, volume - 5));
                            }
                        }}
                    >
                        <Volume2 className="h-4 w-4 text-zinc-400" />
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={volume}
                            onChange={(e) => onVolumeChange(Number(e.target.value))}
                            className="h-1 w-24 cursor-pointer appearance-none rounded-full bg-zinc-800 accent-white"
                            style={{
                                background: `linear-gradient(to right, white ${volumeProgress}%, rgb(39 39 42) ${volumeProgress}%)`
                            }}
                        />
                        <span className="text-[10px] font-bold text-zinc-500 min-w-[30px]">{Math.round(volume)}%</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
