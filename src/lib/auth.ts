import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import connectDB from './db';
import User, { IUser } from '../models/User';

export async function getUserFromToken(): Promise<IUser | null> {
    await connectDB();
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) return null;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
        const user = await User.findById(decoded.userId);
        return user;
    } catch (e) {
        return null;
    }
}
