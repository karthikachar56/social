import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import Comment from '@/lib/models/Comment';
import { verifyToken } from '@/lib/auth';

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const comments = await Comment.find({ postId: id }).sort({ createdAt: -1 });
    return NextResponse.json(comments);
  } catch (error) {
    console.error('Fetch comments error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const decoded = verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Authentication required to post comments.' }, { status: 401 });
    }
    if (decoded.role === 'user') {
      const dbUser = await User.findById(decoded.id);
      if (dbUser && dbUser.banned) {
        return NextResponse.json({ error: 'Account suspended.' }, { status: 403 });
      }
    }

    const { content, postType } = await req.json();
    if (!content || !postType) {
      return NextResponse.json({ error: 'Comment content and post type are required.' }, { status: 400 });
    }

    const newComment = new Comment({
      content: content.trim(),
      postId: id,
      postType,
      authorName: decoded.name,
      authorId: decoded.id
    });

    await newComment.save();

    // Notify the admin about the comment
    try {
      let postTitle = 'your post';
      let targetAdminId = null;
      if (postType === 'event') {
        const Event = (await import('@/lib/models/Event')).default;
        const event = await Event.findById(id);
        if (event) {
          postTitle = `"${event.title}"`;
          targetAdminId = event.adminId;
        }
      } else {
        const News = (await import('@/lib/models/News')).default;
        const news = await News.findById(id);
        if (news) {
          postTitle = `"${news.title}"`;
          targetAdminId = news.adminId;
        }
      }

      if (targetAdminId && targetAdminId !== decoded.id) {
        const Notification = (await import('@/lib/models/Notification')).default;
        await new Notification({
          userId: targetAdminId,
          title: 'New Comment',
          message: `${decoded.name} commented on your post ${postTitle}`,
          type: 'comment',
          link: `/${postType}s/${id}`
        }).save();
      }
    } catch (err) {
      console.error('Failed to create notification for comment:', err);
    }

    return NextResponse.json(newComment, { status: 201 });
  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
