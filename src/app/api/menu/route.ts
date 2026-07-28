import { NextResponse } from 'next/server';
import { MenuItem, DEFAULT_MENU_ITEMS } from '@/lib/types';

const menuStore: MenuItem[] = [...DEFAULT_MENU_ITEMS];

export async function GET() {
  return NextResponse.json(menuStore);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, item, id, updates } = body as {
      action: 'add' | 'update' | 'delete' | 'replace';
      item?: MenuItem;
      id?: string;
      updates?: Partial<MenuItem>;
    };

    switch (action) {
      case 'add':
        if (item) menuStore.unshift(item);
        break;
      case 'update':
        if (id && updates) {
          const idx = menuStore.findIndex(m => m.id === id);
          if (idx !== -1) menuStore[idx] = { ...menuStore[idx], ...updates };
        }
        break;
      case 'delete':
        if (id) {
          const idx = menuStore.findIndex(m => m.id === id);
          if (idx !== -1) menuStore.splice(idx, 1);
        }
        break;
      case 'replace':
        if (item) {
          menuStore.length = 0;
          menuStore.push(...(Array.isArray(item) ? item : [item]));
        }
        break;
    }

    return NextResponse.json({ success: true, menu: menuStore });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 400 });
  }
}
