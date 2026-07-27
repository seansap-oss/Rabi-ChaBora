import { Order, SalesData } from './types';

export const formatPrice = (price: number) => {
  return `₹${price}`;
};

export const generateOrderId = () => {
  return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getDayName = (date: string) => {
  return new Date(date).toLocaleDateString('en-IN', { weekday: 'short' });
};

export const calculateSales = (orders: Order[], period: 'day' | 'week' | 'month'): SalesData[] => {
  const now = new Date();
  const salesData: SalesData[] = [];
  
  let daysToCheck: number;
  if (period === 'day') daysToCheck = 1;
  else if (period === 'week') daysToCheck = 7;
  else daysToCheck = 30;
  
  for (let i = 0; i < daysToCheck; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayOrders = orders.filter((order) => {
      const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
      return orderDate === dateStr && order.status === 'completed';
    });
    
    const total = dayOrders.reduce((sum, order) => sum + order.total, 0);
    const upi = dayOrders.filter(o => o.paymentMethod === 'upi').reduce((sum, o) => sum + o.total, 0);
    const gpay = dayOrders.filter(o => o.paymentMethod === 'gpay').reduce((sum, o) => sum + o.total, 0);
    const cash = dayOrders.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + o.total, 0);
    
    salesData.push({
      date: dateStr,
      total,
      upi,
      gpay,
      cash,
      orders: dayOrders.length,
    });
  }
  
  return salesData.reverse();
};

export const getTotalSales = (orders: Order[]) => {
  const completedOrders = orders.filter(o => o.status === 'completed');
  return {
    total: completedOrders.reduce((sum, o) => sum + o.total, 0),
    upi: completedOrders.filter(o => o.paymentMethod === 'upi').reduce((sum, o) => sum + o.total, 0),
    gpay: completedOrders.filter(o => o.paymentMethod === 'gpay').reduce((sum, o) => sum + o.total, 0),
    cash: completedOrders.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + o.total, 0),
    orders: completedOrders.length,
  };
};
