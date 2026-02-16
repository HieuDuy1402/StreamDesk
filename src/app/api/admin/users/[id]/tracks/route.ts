import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Sound from '@/models/Sound';
import { del } from '@vercel/blob';

// DELETE ALL TRACKS
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        if (!(await verifyAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const { id } = await params;
        await dbConnect();

        const sounds = await Sound.find({ userId: id });

        // Delete blobs
        for (const sound of sounds) {
            if (sound.file) {
                try {
                    await del(sound.file);
                } catch (e) {
                    console.error("Failed to delete blob", e);
                }
            }
        }

        await Sound.deleteMany({ userId: id });
        return NextResponse.json({ message: 'All tracks deleted' });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
