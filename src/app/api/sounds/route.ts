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
        // Client now sends the Blob URL as a string in the 'file' field
        const fileUrl = formData.get('file') as string | null;

        // Check track limit (Exempt Admins)
        if (fileUrl && user.role !== 'admin') {
            const existingTrack = await Sound.findOne({ id, userId: user._id });
            const isReplacingFile = existingTrack && existingTrack.file;

            if (!isReplacingFile) {
                const trackCount = await Sound.countDocuments({ userId: user._id, file: { $exists: true, $ne: null } });
                if (trackCount >= user.maxTracks) {
                    // If we reached limit, we should ideally delete the just-uploaded blob to avoid orphans,
                    // but the client usually handles this or we rely on Vercel strict limits?
                    // Actually, if client uploaded it, it's already there. 
                    // We just won't save the reference. Ideally we delete it.
                    if (fileUrl.startsWith('http')) {
                        try { await del(fileUrl); } catch (e) { }
                    }

                    return NextResponse.json({
                        error: `Max audio tracks Reached (${user.maxTracks}). You can still save labels/icons, but cannot upload more audio files.`
                    }, { status: 400 });
                }
            }
        }

        let updateData: any = { label, icon, userId: user._id };

        // Handle File URL
        if (fileUrl) {
            // Check for existing sound to replace file
            const existingSound = await Sound.findOne({ id, userId: user._id });
            if (existingSound && existingSound.file && existingSound.file !== fileUrl) {
                // Delete old file from Vercel Blob
                try {
                    await del(existingSound.file);
                } catch (e) {
                    console.error("Failed to delete old blob:", e);
                }
            }
            updateData.file = fileUrl;
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
