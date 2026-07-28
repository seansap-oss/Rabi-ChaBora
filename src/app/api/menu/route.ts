import { NextResponse } from 'next/server';
import { MenuItem, DEFAULT_MENU_ITEMS } from '@/lib/types';

const BLOB_KEY = 'cafe-menu-data.json';

// In-memory fallback when Blob token is not set
let menuStore: MenuItem[] = [...DEFAULT_MENU_ITEMS];
let useBlob = false;

async function loadMenu(): Promise<MenuItem[]> {
  // Try Blob storage first
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { list } = await import('@vercel/blob');
      const { blobs } = await list({ prefix: BLOB_KEY });
      if (blobs.length > 0) {
        const res = await fetch(blobs[0].url);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          useBlob = true;
          return data;
        }
      }
      useBlob = true;
      return [...DEFAULT_MENU_ITEMS];
    } catch {
      // Blob not configured, fall back to in-memory
    }
  }
  return menuStore;
}

async function saveMenu(menu: MenuItem[]): Promise<void> {
  if (useBlob && process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { put } = await import('@vercel/blob');
      await put(BLOB_KEY, JSON.stringify(menu), {
        contentType: 'application/json',
        access: 'public',
      });
      return;
    } catch {}
  }
  menuStore = menu;
}

export async function GET() {
  const menu = await loadMenu();
  return NextResponse.json(menu);
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

    const menu = await loadMenu();

    switch (action) {
      case 'add':
        if (item) menu.unshift(item);
        break;
      case 'update':
        if (id && updates) {
          const idx = menu.findIndex(m => m.id === id);
          if (idx !== -1) menu[idx] = { ...menu[idx], ...updates };
        }
        break;
      case 'delete':
        if (id) {
          const idx = menu.findIndex(m => m.id === id);
          if (idx !== -1) menu.splice(idx, 1);
        }
        break;
      case 'replace':
        if (item) {
          menu.length = 0;
          menu.push(...(Array.isArray(item) ? item : [item]));
        }
        break;
    }

    await saveMenu(menu);
    return NextResponse.json({ success: true, menu });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 400 });
  }
}
