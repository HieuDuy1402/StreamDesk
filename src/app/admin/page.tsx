"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Header } from "@/components/Header";
import { Trash2, Edit, Shield, User as UserIcon } from "lucide-react";

interface User {
    _id: string;
    username: string;
    email: string;
    role: "user" | "admin";
    maxTracks: number;
    trackCount: number;
    totalStorageBytes: number;
    createdAt: string;
}

const API_URL = "/api/admin";

export default function AdminPanel() {
    const { user } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [newUsername, setNewUsername] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newMaxTracks, setNewMaxTracks] = useState(20);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch(`${API_URL}/users`, {
                credentials: "include",
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (err) {
            console.error("Failed to fetch users:", err);
        } finally {
            setLoading(false);
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleUsernameUpdate = async (userId: string) => {
        if (!newUsername || newUsername.trim().length < 2) {
            alert("Username must be at least 2 characters");
            return;
        }

        try {
            const res = await fetch(`${API_URL}/users/${userId}/username`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ username: newUsername }),
            });

            if (res.ok) {
                fetchUsers();
                setEditingUser(null);
                setNewUsername("");
            } else {
                const data = await res.json();
                alert(data.error || "Failed to update username");
            }
        } catch (err) {
            console.error("Failed to update username:", err);
        }
    };

    const handleLimitUpdate = async (userId: string) => {
        try {
            const res = await fetch(`${API_URL}/users/${userId}/limit`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ maxTracks: newMaxTracks }),
            });

            if (res.ok) {
                fetchUsers();
                setEditingUser(null);
            }
        } catch (err) {
            console.error("Failed to update limit:", err);
        }
    };

    const handleDeleteAllTracks = async (userId: string) => {
        if (!confirm("Are you sure? This will permanently delete ALL sounds for this user.")) {
            return;
        }

        try {
            const res = await fetch(`${API_URL}/users/${userId}/tracks`, {
                method: "DELETE",
                credentials: "include",
            });

            if (res.ok) {
                alert("All tracks deleted successfully");
                fetchUsers(); // Refresh stats in the table
            }
        } catch (err) {
            console.error("Failed to delete tracks:", err);
        }
    };

    const handleRoleChange = async (userId: string, newRole: "user" | "admin") => {
        try {
            const res = await fetch(`${API_URL}/users/${userId}/role`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ role: newRole }),
            });

            if (res.ok) {
                fetchUsers();
            }
        } catch (err) {
            console.error("Failed to update role:", err);
        }
    };

    const handlePasswordReset = async (userId: string) => {
        if (!newPassword || newPassword.length < 6) {
            alert("Password must be at least 6 characters");
            return;
        }

        try {
            const res = await fetch(`${API_URL}/users/${userId}/password`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ newPassword }),
            });

            if (res.ok) {
                alert("Password updated successfully");
                setEditingUser(null);
                setNewPassword("");
            }
        } catch (err) {
            console.error("Failed to reset password:", err);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm("Are you sure you want to delete this user? This will also delete all their sounds.")) {
            return;
        }

        try {
            const res = await fetch(`${API_URL}/users/${userId}`, {
                method: "DELETE",
                credentials: "include",
            });

            if (res.ok) {
                fetchUsers();
            }
        } catch (err) {
            console.error("Failed to delete user:", err);
        }
    };

    if (user?.role !== "admin") {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <p className="text-white">Access denied. Admin only.</p>
            </div>
        );
    }

    return (
        <ProtectedRoute>
            <Header />
            <main className="min-h-screen bg-zinc-950 pt-20 px-4 pb-8">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-3xl font-bold text-white mb-8">User Management</h1>

                    {loading ? (
                        <p className="text-zinc-400">Loading users...</p>
                    ) : (
                        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-x-auto">
                            <table className="w-full min-w-[600px]">
                                <thead className="bg-zinc-800">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-zinc-300">Username</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-zinc-300">Email</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-zinc-300">Tracks</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-zinc-300">Storage</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-zinc-300">Role</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-zinc-300">Created</th>
                                        <th className="px-6 py-4 text-right text-sm font-medium text-zinc-300">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800">
                                    {users.map((u) => (
                                        <tr key={u._id} className="hover:bg-zinc-800/50">
                                            <td className="px-6 py-4 text-white">{u.username}</td>
                                            <td className="px-6 py-4 text-zinc-400">{u.email}</td>
                                            <td className="px-6 py-4 text-zinc-400 text-sm">
                                                <span className={u.trackCount >= u.maxTracks ? "text-red-400 font-bold" : ""}>
                                                    {u.trackCount}
                                                </span>
                                                <span className="mx-1 text-zinc-600">/</span>
                                                {u.maxTracks}
                                            </td>
                                            <td className="px-6 py-4 text-zinc-400 text-sm">{formatSize(u.totalStorageBytes)}</td>
                                            <td className="px-6 py-4">
                                                <select
                                                    value={u.role}
                                                    onChange={(e) => handleRoleChange(u._id, e.target.value as "user" | "admin")}
                                                    className="bg-zinc-800 text-white px-3 py-1 rounded border border-zinc-700 text-sm"
                                                    disabled={u._id === user?.id}
                                                >
                                                    <option value="user">User</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 text-zinc-400 text-sm">
                                                {new Date(u.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingUser(u);
                                                            setNewUsername(u.username);
                                                            setNewMaxTracks(u.maxTracks || 20);
                                                            setNewPassword("");
                                                        }}
                                                        className="px-3 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded border border-blue-500/30 text-sm flex items-center gap-1"
                                                    >
                                                        <Edit className="h-3 w-3" />
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(u._id)}
                                                        disabled={u._id === user?.id}
                                                        className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded border border-red-500/30 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Password Reset Modal */}
                    {editingUser && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 max-w-md w-full mx-4">
                                <h2 className="text-xl font-bold text-white mb-4">
                                    Edit User: {editingUser.email}
                                </h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-400 mb-1">Username</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newUsername}
                                                onChange={(e) => setNewUsername(e.target.value)}
                                                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-zinc-500"
                                            />
                                            <button
                                                onClick={() => handleUsernameUpdate(editingUser._id)}
                                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                                            >
                                                Update
                                            </button>
                                        </div>
                                    </div>

                                    <div className="border-t border-zinc-800 pt-4">
                                        <label className="block text-sm font-medium text-zinc-400 mb-1">Track Limit</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                value={newMaxTracks}
                                                onChange={(e) => setNewMaxTracks(Number(e.target.value))}
                                                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-zinc-500"
                                            />
                                            <button
                                                onClick={() => handleLimitUpdate(editingUser._id)}
                                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                                            >
                                                Update
                                            </button>
                                        </div>
                                    </div>

                                    <div className="border-t border-zinc-800 pt-4">
                                        <label className="block text-sm font-medium text-zinc-400 mb-1">Danger Zone</label>
                                        <button
                                            onClick={() => handleDeleteAllTracks(editingUser._id)}
                                            className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2 rounded-lg border border-red-500/30 text-sm font-medium transition flex items-center justify-center gap-2"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Delete All Tracks
                                        </button>
                                    </div>

                                    <div className="border-t border-zinc-800 pt-4">
                                        <label className="block text-sm font-medium text-zinc-400 mb-1">New Password</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="Min 6 characters"
                                                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-zinc-500"
                                            />
                                            <button
                                                onClick={() => handlePasswordReset(editingUser._id)}
                                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                                            >
                                                Reset
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <button
                                        onClick={() => {
                                            setEditingUser(null);
                                            setNewUsername("");
                                            setNewPassword("");
                                        }}
                                        className="w-full bg-zinc-800 text-white font-medium py-2 rounded-lg hover:bg-zinc-700 transition"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </ProtectedRoute>
    );
}
