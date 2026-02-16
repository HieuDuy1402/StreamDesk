import { NextResponse } from 'next/server';
import { put, del } from '@vercel/blob';
import dbConnect from '@/lib/db';
import Sound from '@/models/Sound';
import { getUserFromSession, verifyAdmin } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        const user = await getUserFromSession();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const sounds = await Sound.find({ userId: user._id });
        return NextResponse.json(sounds);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const user = await getUserFromSession();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const formData = await req.formData();
        const id = formData.get('id') as string;
        const label = formData.get('label') as string;
        const icon = formData.get('icon') as string;
        const file = formData.get('file') as File | null;

        // Check track limit (Exempt Admins)
        if (file && user.role !== 'admin') {
            const existingTrack = await Sound.findOne({ id, userId: user._id });
            const isReplacingFile = existingTrack && existingTrack.file;

            if (!isReplacingFile) {
                const trackCount = await Sound.countDocuments({ userId: user._id, file: { $exists: true, $ne: null } });
                if (trackCount >= user.maxTracks) {
                    return NextResponse.json({
                        error: `Max audio tracksReached (${user.maxTracks}). You can still save labels/icons, but cannot upload more audio files.`
                    }, { status: 400 });
                }
            }
        }

        let updateData: any = { label, icon, userId: user._id };

        // Handle File Upload
        if (file && file.size > 0) {
            // Check for existing sound to replace file
            const existingSound = await Sound.findOne({ id, userId: user._id });
            if (existingSound && existingSound.file) {
                // Delete old file from Vercel Blob
                try {
                    await del(existingSound.file);
                } catch (e) {
                    console.error("Failed to delete old blob:", e);
                }
            }

            // Upload new file to Vercel Blob
            const blob = await put(file.name, file, { access: 'public' });
            updateData.file = blob.url;
        }

        // Upsert Sound
        const sound = await Sound.findOneAndUpdate(
            { id, userId: user._id },
            updateData,
            { new: true, upsert: true }
        );

        return NextResponse.json(sound);

    } catch (err: any) {
        console.error("Upload Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
