import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Admin from '@/lib/models/Admin';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';
import { verifyToken } from '@/lib/auth';

export async function POST(req) {
  try {
    await connectDB();
    const decoded = verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current password and new password are required.' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters long.' }, { status: 400 });
    }

    if (decoded.role === 'admin') {
      const admin = await Admin.findById(decoded.id);
      if (!admin) {
        return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
      }

      const match = await bcrypt.compare(currentPassword, admin.password);
      if (!match) {
        return NextResponse.json({ error: 'Incorrect current password.' }, { status: 400 });
      }

      const hashed = await bcrypt.hash(newPassword, 10);
      admin.password = hashed;
      await admin.save();

      return NextResponse.json({ message: 'Password changed successfully.' });
    } else {
      const user = await User.findById(decoded.id);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const match = await bcrypt.compare(currentPassword, user.password);
      if (!match) {
        return NextResponse.json({ error: 'Incorrect current password.' }, { status: 400 });
      }

      const hashed = await bcrypt.hash(newPassword, 10);
      user.password = hashed;
      await user.save();

      return NextResponse.json({ message: 'Password changed successfully.' });
    }
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
