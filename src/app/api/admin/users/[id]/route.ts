import { NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Sound from '@/models/Sound';
import cloudinary from '@/lib/cloudinary';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const adminUser = await getUserFromToken();

        if (!adminUser || adminUser.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        if (id === adminUser._id.toString()) {
            return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
        }

        await connectDB();
        const user = await User.findByIdAndDelete(id);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Delete associated sounds and files
        const sounds = await Sound.find({ userId: id });
        for (const sound of sounds) {
            if (sound.file) {
                try {
                    const urlParts = sound.file.split('/');
                    const filenameWithExt = urlParts[urlParts.length - 1];
                    const publicId = `streamdesk/${filenameWithExt.split('.')[0]}`;
                    await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
                } catch (e) {
                    console.error('Failed to delete Cloudinary file during user deletion:', e);
                }
            }
        }
        await Sound.deleteMany({ userId: id });

        return NextResponse.json({ message: 'User deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
