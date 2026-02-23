import { NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import connectDB from '@/lib/db';
import Sound from '@/models/Sound';
import cloudinary from '@/lib/cloudinary';

export async function GET() {
    try {
        const user = await getUserFromToken();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();
        const sounds = await Sound.find({ userId: user._id });
        return NextResponse.json(sounds);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const user = await getUserFromToken();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();

        const { id, label, icon, fileUrl } = await req.json();

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        // Track limit sanity check
        if (fileUrl && user.role !== 'admin') {
            const existingTrack = await Sound.findOne({ id, userId: user._id });
            const isReplacingFile = !!(existingTrack && existingTrack.file);

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

        // Handle Audio Upload to Cloudinary Reference
        if (fileUrl) {
            // Check for existing file to delete from Cloudinary (clean up old file before applying new one)
            const existingSound = await Sound.findOne({ id, userId: user._id });
            if (existingSound && existingSound.file) {
                // Extract public_id from Cloudinary URL
                try {
                    const urlParts = existingSound.file.split('/');
                    const filenameWithExt = urlParts[urlParts.length - 1];
                    const publicId = `streamdesk/${filenameWithExt.split('.')[0]}`;
                    await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
                } catch (e) {
                    console.error("Failed to delete old Cloudinary file", e);
                }
            }

            updateData.file = fileUrl;
        }

        // Find and Update or Create
        const sound = await Sound.findOneAndUpdate(
            { id, userId: user._id },
            updateData,
            { new: true, upsert: true }
        );

        return NextResponse.json(sound);
    } catch (error: any) {
        console.error("Upload Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
