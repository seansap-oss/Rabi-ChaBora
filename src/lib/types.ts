export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  isSpecial: boolean;
  available: boolean;
  createdAt: number;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  note: string;
}

export type OrderStatus = 
  | 'pending_payment'    // Cash order waiting for counter approval
  | 'paid'              // Payment confirmed (UPI/GPay/Cash approved)
  | 'pending'           // Paid, waiting for kitchen to start
  | 'preparing'         // Kitchen is preparing
  | 'ready'             // Ready for pickup/delivery
  | 'out_for_delivery'  // Out for delivery
  | 'completed';        // Order complete

export interface OrderDiscount {
  type: 'flat' | 'percent';
  value: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  paymentMethod: 'upi' | 'gpay' | 'cash';
  status: OrderStatus;
  createdAt: number;
  paidAt?: number;
  tableNumber?: string;
  customerName?: string;
  customerPhone?: string;
  discount?: OrderDiscount;
  orderType: 'dine_in' | 'takeaway' | 'delivery';
}

export interface CafeSettings {
  name: string;
  tagline: string;
  logo: string;
  upiId: string;
  paymentQRImage: string;
  phone: string;
  address: string;
  socialLinks: {
    instagram: string;
    facebook: string;
    twitter: string;
  };
}

export interface ThemeSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  headingFont: string;
  bodyFont: string;
  borderRadius: number;
  fontSize: number;
}

export const DEFAULT_THEME: ThemeSettings = {
  primaryColor: '#f59e0b',
  secondaryColor: '#1c1917',
  accentColor: '#ea580c',
  backgroundColor: '#f5f5f4',
  textColor: '#1c1917',
  headingFont: 'system-ui, sans-serif',
  bodyFont: 'system-ui, sans-serif',
  borderRadius: 16,
  fontSize: 16,
};

export const FONT_OPTIONS = [
  { label: 'System Default', value: 'system-ui, sans-serif' },
  { label: 'Inter', value: 'Inter, sans-serif' },
  { label: 'Playfair Display', value: '"Playfair Display", serif' },
  { label: 'Poppins', value: 'Poppins, sans-serif' },
  { label: 'Dancing Script', value: '"Dancing Script", cursive' },
  { label: 'Pacifico', value: 'Pacifico, cursive' },
  { label: 'Caveat', value: 'Caveat, cursive' },
  { label: 'Lora', value: 'Lora, serif' },
  { label: 'Merriweather', value: 'Merriweather, serif' },
  { label: 'Nunito', value: 'Nunito, sans-serif' },
];

export interface SalesData {
  date: string;
  total: number;
  upi: number;
  gpay: number;
  cash: number;
  orders: number;
}

export const DEFAULT_CAFE_SETTINGS: CafeSettings = {
  name: 'Cafe Delight',
  tagline: 'Freshly brewed happiness',
  logo: '/cafe-logo.png',
  upiId: 'cafedelight@upi',
  paymentQRImage: '',
  phone: '+91 98765 43210',
  address: '123 Coffee Street, Mumbai',
  socialLinks: {
    instagram: 'https://instagram.com/cafedelight',
    facebook: 'https://facebook.com/cafedelight',
    twitter: 'https://twitter.com/cafedelight',
  },
};

export const DEFAULT_MENU_ITEMS: MenuItem[] = [
  // Coffee
  { id: '1', name: 'Espresso', description: 'Rich and bold single shot', price: 120, category: 'Coffee', image: 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=400', isSpecial: false, available: true, createdAt: Date.now() },
  { id: '2', name: 'Cappuccino', description: 'Creamy espresso with steamed milk', price: 150, category: 'Coffee', image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400', isSpecial: false, available: true, createdAt: Date.now() },
  { id: '3', name: 'Latte', description: 'Smooth espresso with lots of milk', price: 160, category: 'Coffee', image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400', isSpecial: true, available: true, createdAt: Date.now() },
  { id: '4', name: 'Mocha', description: 'Chocolate flavored coffee delight', price: 180, category: 'Coffee', image: 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=400', isSpecial: false, available: true, createdAt: Date.now() },
  { id: '5', name: 'Cold Brew', description: '24-hour steeped cold coffee', price: 170, category: 'Coffee', image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400', isSpecial: false, available: true, createdAt: Date.now() },
  // Tea
  { id: '6', name: 'Masala Chai', description: 'Spiced Indian tea', price: 80, category: 'Tea', image: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400', isSpecial: false, available: true, createdAt: Date.now() },
  { id: '7', name: 'Green Tea', description: 'Refreshing and healthy', price: 90, category: 'Tea', image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400', isSpecial: false, available: true, createdAt: Date.now() },
  { id: '8', name: 'Earl Grey', description: 'Classic bergamot flavored tea', price: 100, category: 'Tea', image: 'https://images.unsplash.com/photo-1571934811356-5cc061b6201f?w=400', isSpecial: false, available: true, createdAt: Date.now() },
  // Food
  { id: '9', name: 'Classic Burger', description: 'Juicy beef patty with fresh veggies', price: 250, category: 'Food', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400', isSpecial: false, available: true, createdAt: Date.now() },
  { id: '10', name: 'Margherita Pizza', description: 'Fresh mozzarella and basil', price: 300, category: 'Food', image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400', isSpecial: true, available: true, createdAt: Date.now() },
  { id: '11', name: 'Pasta Alfredo', description: 'Creamy white sauce pasta', price: 280, category: 'Food', image: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=400', isSpecial: false, available: true, createdAt: Date.now() },
  { id: '12', name: 'Grilled Sandwich', description: 'Cheese and vegetable toasted sandwich', price: 180, category: 'Food', image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400', isSpecial: false, available: true, createdAt: Date.now() },
  // Desserts
  { id: '13', name: 'Chocolate Cake', description: 'Rich dark chocolate layered cake', price: 200, category: 'Desserts', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400', isSpecial: false, available: true, createdAt: Date.now() },
  { id: '14', name: 'Cheesecake', description: 'New York style creamy cheesecake', price: 220, category: 'Desserts', image: 'https://images.unsplash.com/photo-1533139502658-0198f920d8e8?w=400', isSpecial: false, available: true, createdAt: Date.now() },
  { id: '15', name: 'Tiramisu', description: 'Italian coffee-flavored dessert', price: 240, category: 'Desserts', image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400', isSpecial: true, available: true, createdAt: Date.now() },
];

export const CATEGORIES = ['All', 'Coffee', 'Tea', 'Food', 'Desserts'];

export interface ReceiptSettings {
  paperSize: '50mm' | '60mm' | '80mm' | 'A4';
  fontSize: number;
  lineStyle: 'solid' | 'dashed' | 'dotted';
  borderStyle: 'none' | 'thin' | 'rounded';
  padding: 'compact' | 'normal' | 'wide';
  itemAlign: 'left' | 'center';
  priceAlign: 'right' | 'center';
  headerAlign: 'center' | 'left';
  showLogo: boolean;
  showDate: boolean;
  showTime: boolean;
  showOrderNumber: boolean;
  showTax: boolean;
  taxPercent: number;
  headerText: string;
  footerText: string;
  watermarkEnabled: boolean;
  watermarkOpacity: number;
  watermarkRotation: number;
}

export interface LoyaltyConfig {
  enabled: boolean;
  stampsRequired: number;
  rewardType: 'free_item' | 'discount';
  rewardDescription: string;
  rewardMaxPrice: number;
  rewardDiscountPercent: number;
  bonusOnSignup: number;
  stampCategories: string[];
}

export interface LoyaltyCustomer {
  phone: string;
  name: string;
  stamps: number;
  totalVisits: number;
  totalSpent: number;
  rewardAvailable: boolean;
  rewardEarnedAt: number;
  lastVisit: number;
  enrolledAt: number;
  history: LoyaltyStampRecord[];
}

export interface LoyaltyStampRecord {
  date: number;
  orderId: string;
  amount: number;
  stampsEarned: number;
  rewardRedeemed: boolean;
}

export const DEFAULT_LOYALTY_CONFIG: LoyaltyConfig = {
  enabled: false,
  stampsRequired: 8,
  rewardType: 'free_item',
  rewardDescription: 'Free Coffee (up to ₹200)',
  rewardMaxPrice: 200,
  rewardDiscountPercent: 10,
  bonusOnSignup: 2,
  stampCategories: ['Coffee', 'Tea', 'Food', 'Desserts'],
};

export const DEFAULT_RECEIPT_SETTINGS: ReceiptSettings = {
  paperSize: '80mm',
  fontSize: 12,
  lineStyle: 'dashed',
  borderStyle: 'none',
  padding: 'normal',
  itemAlign: 'left',
  priceAlign: 'right',
  headerAlign: 'center',
  showLogo: true,
  showDate: true,
  showTime: true,
  showOrderNumber: true,
  showTax: true,
  taxPercent: 5,
  headerText: 'Thank you for visiting!',
  footerText: 'Visit us again :)',
  watermarkEnabled: true,
  watermarkOpacity: 0.08,
  watermarkRotation: -30,
};
