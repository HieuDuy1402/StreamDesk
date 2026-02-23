import { NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import cloudinary from '@/lib/cloudinary';
import connectDB from '@/lib/db';
import Sound from '@/models/Sound';

export async function POST(req: Request) {
    try {
        const user = await getUserFromToken();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Check track limit BEFORE giving permission to upload.
        // The frontend will send the intention to upload a new file.
        const { id, isReplacingFile } = await req.json();

        if (!isReplacingFile && user.role !== 'admin') {
            await connectDB();
            const trackCount = await Sound.countDocuments({ userId: user._id, file: { $exists: true, $ne: null } });
            if (trackCount >= user.maxTracks) {
                return NextResponse.json({
                    error: `Max audio tracksReached (${user.maxTracks}). You cannot upload more audio files.`
                }, { status: 400 });
            }
        }

        const timestamp = Math.round(new Date().getTime() / 1000);

        // Params to sign
        const paramsToSign = {
            timestamp: timestamp,
            folder: 'streamdesk',
        };

        const signature = cloudinary.utils.api_sign_request(
            paramsToSign,
            process.env.CLOUDINARY_API_SECRET as string
        );

        return NextResponse.json({
            signature,
            timestamp,
            cloudName: process.env.CLOUDINARY_CLOUD_NAME,
            apiKey: process.env.CLOUDINARY_API_KEY
        });
    } catch (error: any) {
        console.error('Signature error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
