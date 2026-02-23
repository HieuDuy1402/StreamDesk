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

        const formData = await req.formData();
        const id = formData.get('id') as string;
        const label = formData.get('label') as string;
        const icon = formData.get('icon') as string;
        const file = formData.get('file') as File | null;

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        // Track limit check
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

        // Handle Audio Upload to Cloudinary
        if (file) {
            // Check for existing file to delete from Cloudinary
            const existingSound = await Sound.findOne({ id, userId: user._id });
            if (existingSound && existingSound.file) {
                // Extract public_id from Cloudinary URL (e.g., https://res.cloudinary.com/.../video/upload/v12345/streamdesk/xxxxx.mp3)
                // Note: file.match might be needed depending on your folder structure, or just store public_id in DB in future
                try {
                    const urlParts = existingSound.file.split('/');
                    const filenameWithExt = urlParts[urlParts.length - 1];
                    const publicId = `streamdesk/${filenameWithExt.split('.')[0]}`; // Assuming stored in streamdesk/ folder
                    await cloudinary.uploader.destroy(publicId, { resource_type: 'video' }); // Audio is considered video in Cloudinary
                } catch (e) {
                    console.error("Failed to delete old Cloudinary file", e);
                }
            }

            // Convert File to Buffer
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Upload to Cloudinary via stream
            const uploadResult: any = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        resource_type: 'video', // Must use 'video' or 'raw' for audio
                        folder: 'streamdesk',
                    },
                    (error: any, result: any) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                uploadStream.end(buffer);
            });

            updateData.file = uploadResult.secure_url;
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
