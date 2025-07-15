import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ADMIN_USER = 'admin';
const ADMIN_PASS = 'password123'; // Change to your real admin password

function parseBasicAuth(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith('Basic ')) return null;
  const base64 = authHeader.replace('Basic ', '');
  try {
    const [user, pass] = atob(base64).split(':');
    return { user, pass };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const auth = parseBasicAuth(request.headers.get('authorization'));
  if (!auth || auth.user !== ADMIN_USER || auth.pass !== ADMIN_PASS) {
    return new NextResponse('Unauthorized', { status: 401, headers: { 'WWW-Authenticate': 'Basic' } });
  }
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        orderItems: {
          include: {
            product: {
              select: {
                name: true,
                description: true,
                imageUrl: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    return NextResponse.json(orders);
  } catch (error) {
    console.error('[ADMIN_ORDERS_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
} 