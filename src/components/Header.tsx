"use client";

import { useAuth } from "@/contexts/AuthContext";
import { LogOut, Shield, User, Settings } from "lucide-react";
import Link from "next/link";

export function Header() {
    const { user, logout } = useAuth();

    if (!user) return null;

    return (
        <header className="fixed top-0 left-0 w-full bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800 z-50">
            <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
                <a href="/" className="flex items-center gap-3 hover:opacity-80 transition">
                    <h1 className="text-xl font-bold text-white">StreamDesk</h1>
                </a>

                <div className="flex items-center gap-4">
                    {/* User Info */}
                    <div className="flex items-center gap-3 px-4 py-2 bg-zinc-900 rounded-lg border border-zinc-800">
                        <User className="h-4 w-4 text-zinc-400" />
                        <span className="text-sm font-medium text-white">{user.username}</span>
                        {user.role === "admin" && (
                            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs font-medium rounded border border-purple-500/30">
                                <Shield className="h-3 w-3 inline mr-1" />
                                Admin
                            </span>
                        )}
                    </div>

                    {/* Admin Panel Button */}
                    {user.role === "admin" && (
                        <Link
                            href="/admin"
                            className="p-2 md:px-4 md:py-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg border border-zinc-800 text-white text-sm font-medium transition flex items-center gap-2"
                            title="Manage Accounts"
                        >
                            <Settings className="h-4 w-4" />
                            <span className="hidden md:inline">Manage Accounts</span>
                        </Link>
                    )}

                    {/* Logout Button */}
                    <button
                        onClick={logout}
                        className="p-2 md:px-4 md:py-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg border border-red-500/30 text-red-400 text-sm font-medium transition flex items-center gap-2"
                        title="Logout"
                    >
                        <LogOut className="h-4 w-4" />
                        <span className="hidden md:inline">Logout</span>
                    </button>
                </div>
            </div>
        </header>
    );
}
