import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Blog } from '@/lib/models/Blog';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') ?? '10');
    const skip = parseInt(searchParams.get('skip') ?? '0');

    const blogs = await Blog.find({ display: true })
      .sort({ position: 1, date: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({ blogs, total: blogs.length });
  } catch (err) {
    console.error('[GET blogs]', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
