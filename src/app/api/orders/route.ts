import { NextResponse } from 'next/server';
import { Order, OrderStatus } from '@/lib/types';

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
    const { id, status } = await request.json() as { id: string; status: OrderStatus };
    
    const order = ordersStore.find(o => o.id === id);
    if (order) {
      order.status = status;
      if (status === 'paid' || status === 'pending') {
        order.paidAt = Date.now();
      }
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
