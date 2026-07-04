import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Admin from '@/lib/models/Admin';
import { verifyToken } from '@/lib/auth';

export async function GET(req) {
  try {
    await connectDB();
    const decoded = verifyToken(req);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const admins = await Admin.find().select('-password').sort({ name: 1 });
    return NextResponse.json(admins);
  } catch (error) {
    console.error('Fetch admin list error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
