import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Admin from '@/lib/models/Admin';
import User from '@/lib/models/User';
import { verifyToken } from '@/lib/auth';

export async function GET(req) {
  try {
    await connectDB();
    const decoded = verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (decoded.role === 'admin') {
      const admin = await Admin.findById(decoded.id).select('-password');
      if (!admin) {
        return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
      }
      return NextResponse.json({ role: 'admin', user: admin });
    } else {
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      return NextResponse.json({ role: 'user', user });
    }
  } catch (error) {
    console.error('Session verify error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await connectDB();
    const decoded = verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, avatar } = await req.json();
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (decoded.role === 'admin') {
      const updatedAdmin = await Admin.findByIdAndUpdate(
        decoded.id,
        { name, avatar },
        { new: true }
      ).select('-password');
      if (!updatedAdmin) {
        return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
      }
      return NextResponse.json({ role: 'admin', user: updatedAdmin });
    } else {
      const updatedUser = await User.findByIdAndUpdate(
        decoded.id,
        { name, avatar },
        { new: true }
      ).select('-password');
      if (!updatedUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      return NextResponse.json({ role: 'user', user: updatedUser });
    }
  } catch (error) {
    console.error('Session update error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

