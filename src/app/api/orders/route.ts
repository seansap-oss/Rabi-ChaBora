import { NextResponse } from 'next/server';
import { Order, OrderDiscount, OrderStatus } from '@/lib/types';

const BLOB_KEY = 'cafe-orders-data.json';

// In-memory fallback
let ordersStore: Order[] = [];
let useBlob = false;

async function loadOrders(): Promise<Order[]> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { list } = await import('@vercel/blob');
      const { blobs } = await list({ prefix: BLOB_KEY });
      if (blobs.length > 0) {
        const res = await fetch(blobs[0].url);
        const data = await res.json();
        if (Array.isArray(data)) {
          useBlob = true;
          return data;
        }
      }
      useBlob = true;
      return [];
    } catch {}
  }
  return ordersStore;
}

async function saveOrders(orders: Order[]): Promise<void> {
  if (useBlob && process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { put } = await import('@vercel/blob');
      await put(BLOB_KEY, JSON.stringify(orders), {
        contentType: 'application/json',
        access: 'public',
      });
      return;
    } catch {}
  }
  ordersStore = orders;
}

export async function GET() {
  const orders = await loadOrders();
  return NextResponse.json(orders);
}

export async function POST(request: Request) {
  try {
    const order: Order = await request.json();
    
    if (order.paymentMethod === 'cash') {
      order.status = 'pending_payment';
    } else {
      order.status = 'paid';
    }
    
    const orders = await loadOrders();
    orders.unshift(order);
    
    if (orders.length > 200) {
      orders.pop();
    }
    
    await saveOrders(orders);
    return NextResponse.json({ success: true, order });
  } catch {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json() as {
      id: string;
      status?: OrderStatus;
      customerName?: string;
      customerPhone?: string;
      discount?: OrderDiscount | null;
    };
    
    const orders = await loadOrders();
    const order = orders.find(o => o.id === body.id);
    if (order) {
      if (body.status) {
        order.status = body.status;
        if (body.status === 'paid' || body.status === 'pending') {
          order.paidAt = Date.now();
        }
      }
      if (body.customerName !== undefined) order.customerName = body.customerName || undefined;
      if (body.customerPhone !== undefined) order.customerPhone = body.customerPhone || undefined;
      if (body.discount !== undefined) order.discount = body.discount || undefined;
    }
    
    await saveOrders(orders);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update order' }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    const orders = await loadOrders();
    const index = orders.findIndex(o => o.id === id);
    if (index !== -1) {
      orders.splice(index, 1);
    }
    await saveOrders(orders);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 400 });
  }
}
