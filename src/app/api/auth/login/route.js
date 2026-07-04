import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Admin, { seedAdmins } from '@/lib/models/Admin';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';

export async function POST(req) {
  try {
    await connectDB();
    // Ensure admins are seeded on login request
    await seedAdmins();

    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if logging in as Admin
    let admin = await Admin.findOne({ email: cleanEmail });
    if (admin) {
      const ok = await bcrypt.compare(password, admin.password);
      if (!ok) {
        return NextResponse.json({ error: 'Incorrect password.' }, { status: 400 });
      }
      const token = signToken({ id: admin._id, email: admin.email, name: admin.name, role: 'admin' });
      return NextResponse.json({
        token,
        role: 'admin',
        user: { id: admin._id, name: admin.name, email: admin.email, avatar: admin.avatar }
      });
    }

    // Check if logging in as regular User
    let user = await User.findOne({ email: cleanEmail });
    if (user) {
      if (user.banned) {
        return NextResponse.json({ error: 'Your account has been suspended by an administrator.' }, { status: 403 });
      }
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) {
        return NextResponse.json({ error: 'Incorrect password.' }, { status: 400 });
      }
      const token = signToken({ id: user._id, email: user.email, name: user.name, role: 'user' });
      return NextResponse.json({
        token,
        role: 'user',
        user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar }
      });
    }

    return NextResponse.json({ error: 'Account not found. Please register.' }, { status: 400 });
  } catch (e) {
    console.error('Login error:', e);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

