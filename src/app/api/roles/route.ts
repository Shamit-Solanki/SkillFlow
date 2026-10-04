import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const roles = await prisma.targetRole.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
      },
    });
    return NextResponse.json(roles);
  } catch (error) {
    console.error('Failed to fetch roles:', error);
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
  }
}
