import { NextResponse } from 'next/server';
import { Order, OrderDiscount, OrderStatus } from '@/lib/types';

// In-memory store
const ordersStore: Order[] = [];

export async function GET() {
  return NextResponse.json(ordersStore);
}

export async function POST(request: Request) {
  try {
    const order: Order = await request.json();
    
    // For cash orders, start as pending_payment
    if (order.paymentMethod === 'cash') {
      order.status = 'pending_payment';
    } else {
      // UPI/GPay are pre-confirmed
      order.status = 'paid';
    }
    
    ordersStore.unshift(order);
    
    // Keep only last 200 orders
    if (ordersStore.length > 200) {
      ordersStore.pop();
    }
    
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
    
    const order = ordersStore.find(o => o.id === body.id);
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
    
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update order' }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    const index = ordersStore.findIndex(o => o.id === id);
    if (index !== -1) {
      ordersStore.splice(index, 1);
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 400 });
  }
}
