"use client";

import { SoundBoard } from "@/components/SoundBoard";
import { Header } from "@/components/Header";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function Home() {
  return (
    <ProtectedRoute>
      <Header />
      <main className="flex h-screen w-full flex-col items-center overflow-hidden bg-background pt-16">
        {/* SoundBoard Area - Flex-1 to take available space */}
        <div className="flex-1 w-full flex items-center justify-center p-4">
          <SoundBoard />
        </div>
      </main>
    </ProtectedRoute>
  );
}
