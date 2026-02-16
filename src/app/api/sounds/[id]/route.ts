import { NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import dbConnect from '@/lib/db';
import Sound from '@/models/Sound';
import { getUserFromSession } from '@/lib/auth';

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> } // Params is a Promise in Next.js 15+
) {
    try {
        const user = await getUserFromSession();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        await dbConnect();

        const sound = await Sound.findOne({ id, userId: user._id });
        if (!sound) {
            return NextResponse.json({ error: 'Sound not found' }, { status: 404 });
        }

        // Delete file from Blob
        if (sound.file) {
            try {
                await del(sound.file);
            } catch (e) {
                console.error("Failed to delete blob:", e);
            }
        }

        // Delete from DB
        await Sound.deleteOne({ id, userId: user._id });

        return NextResponse.json({ message: 'Sound deleted' });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
