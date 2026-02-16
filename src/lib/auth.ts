import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import User from '@/models/User';
import dbConnect from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
);

export async function getUserFromSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
        return null;
    }

    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        if (!payload.userId) return null;

        await dbConnect();
        const user = await User.findById(payload.userId).select('-password');
        return user;
    } catch (error) {
        return null;
    }
}

export async function verifyAdmin() {
    const user = await getUserFromSession();
    if (!user || user.role !== 'admin') {
        return false;
    }
    return true;
}
