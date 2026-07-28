'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Coffee, Smartphone, Monitor, ChefHat, Truck, QrCode,
  BarChart3, MessageSquare, Palette, Shield, Globe, ArrowRight,
  Check, Star, Zap, DollarSign, Users, TrendingUp, Menu, X,
  Gift, Printer, Send, Cake, Repeat,
  MapPin, Clock, CreditCard, Store, Bell, PieChart, Megaphone, Heart, AtSign
} from 'lucide-react';

const FEATURES = [
  {
    icon: <QrCode className="w-6 h-6" />,
    title: 'QR Code Ordering',
    desc: 'Customers scan a table QR → opens menu on their phone → orders directly. No app download needed.',
    color: 'bg-blue-500',
    category: 'ordering',
  },
  {
    icon: <Monitor className="w-6 h-6" />,
    title: 'POS Counter',
    desc: 'Staff tablet shows incoming orders, approves cash payments, sends to kitchen. Two-panel professional layout.',
    color: 'bg-orange-500',
    category: 'ordering',
  },
  {
    icon: <ChefHat className="w-6 h-6" />,
    title: 'Kitchen Display',
    desc: 'Horizontal Kanban board: Received → In Progress → Completed. Auto-refreshes, sound alerts for new orders.',
    color: 'bg-purple-500',
    category: 'operations',
  },
  {
    icon: <Truck className="w-6 h-6" />,
    title: 'Delivery Tracking',
    desc: 'Track delivery orders from kitchen to doorstep. Status updates sent to customer via WhatsApp.',
    color: 'bg-cyan-500',
    category: 'operations',
  },
  {
    icon: <Gift className="w-6 h-6" />,
    title: 'Loyalty & Rewards',
    desc: 'Stamp card system — customers buy 8, get 1 free. Auto-stamps, near-miss WhatsApp nudges, reward notifications.',
    color: 'bg-rose-500',
    category: 'growth',
  },
  {
    icon: <MessageSquare className="w-6 h-6" />,
    title: 'WhatsApp Integration',
    desc: '10 features: order confirm, ready notifications, delivery updates, feedback, monthly reports, promo broadcasts, birthday wishes.',
    color: 'bg-green-500',
    category: 'growth',
  },
  {
    icon: <Megaphone className="w-6 h-6" />,
    title: 'Facebook & Instagram',
    desc: 'Auto-post daily specials to Facebook Page and Instagram. Reply to DMs with order links. Run promos.',
    color: 'bg-indigo-500',
    category: 'growth',
  },
  {
    icon: <Printer className="w-6 h-6" />,
    title: 'Receipt Designer',
    desc: 'Customize receipts for any printer: 58mm, 80mm, A4. Add logo, watermark, taxes. Print wirelessly.',
    color: 'bg-amber-500',
    category: 'operations',
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: 'Sales Dashboard',
    desc: 'Live pie charts, bar graphs, top sellers, category breakdown. Daily/weekly/monthly views. Export CSV.',
    color: 'bg-teal-500',
    category: 'analytics',
  },
  {
    icon: <Palette className="w-6 h-6" />,
    title: 'Digital Menu Board',
    desc: 'Fullscreen digital signage for TV/monitor. Auto-rotates specials, shows all menu items with prices.',
    color: 'bg-pink-500',
    category: 'display',
  },
  {
    icon: <Globe className="w-6 h-6" />,
    title: 'UPI Payment',
    desc: 'Dynamic UPI deep link — customer taps Pay → opens GPay/PhonePe with your UPI ID pre-filled. No second scan.',
    color: 'bg-emerald-500',
    category: 'payments',
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Modular Licensing',
    desc: 'Pay only for what you use. Each feature unlocks with a license password. Scale as you grow.',
    color: 'bg-violet-500',
    category: 'platform',
  },
];

const MORE_FEATURES = [
  { icon: <Cake className="w-5 h-5" />, title: 'Birthday Automation', desc: 'Auto-send birthday wishes + special discount via WhatsApp' },
  { icon: <Clock className="w-5 h-5" />, title: 'Happy Hour Scheduler', desc: 'Auto-apply discounts during specific time slots' },
  { icon: <MapPin className="w-5 h-5" />, title: 'Multi-Outlet Support', desc: 'Manage multiple cafe locations from one dashboard' },
  { icon: <CreditCard className="w-5 h-5" />, title: 'Split Payment', desc: 'Customers can split bill between UPI and cash' },
  { icon: <Repeat className="w-5 h-5" />, title: 'Recurring Orders', desc: 'Regular customers can repeat last order in one tap' },
  { icon: <Store className="w-5 h-5" />, title: 'Inventory Alerts', desc: 'Get notified when ingredients run low' },
  { icon: <Bell className="w-5 h-5" />, title: 'Push Notifications', desc: 'Native app push notifications for your branded APK' },
  { icon: <PieChart className="w-5 h-5" />, title: 'AI Sales Forecast', desc: 'Predict busy hours, prep ingredients, optimize staff' },
];

const PRICING = [
  {
    name: 'Starter',
    price: '₹999',
    period: '/month',
    desc: 'For small cafes just getting started',
    features: [
      'QR Code Ordering',
      'Menu Management',
      'POS Counter',
      'Basic Sales View',
      '1 User',
    ],
    color: 'border-stone-200',
    btn: 'bg-stone-900 hover:bg-stone-800',
  },
  {
    name: 'Growth',
    price: '₹2,499',
    period: '/month',
    desc: 'For growing restaurants',
    features: [
      'Everything in Starter',
      'Kitchen Display',
      'Delivery Tracking',
      'Loyalty & Rewards Program',
      'WhatsApp (5 features)',
      'Sales Dashboard with Charts',
      '3 Users',
    ],
    color: 'border-orange-400',
    btn: 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '₹4,999',
    period: '/month',
    desc: 'For multi-outlet chains',
    features: [
      'Everything in Growth',
      'Digital Menu Board',
      'All 10 WhatsApp Features',
      'Facebook & Instagram Auto-Post',
      'Receipt Printer (any size)',
      'Owner Dashboard + Reports',
      'Unlimited Users',
      'Custom Branding (APK/iOS)',
    ],
    color: 'border-purple-400',
    btn: 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600',
  },
];

const HOW_IT_WORKS = [
  { step: '1', title: 'Sign Up', desc: 'Create your account in 30 seconds. No credit card required.' },
  { step: '2', title: 'Setup Menu', desc: 'Upload your menu items with photos. Takes 5 minutes.' },
  { step: '3', title: 'Print QR Codes', desc: 'Generate table QR codes. Customers scan to order.' },
  { step: '4', title: 'Start Serving', desc: 'Orders flow to POS → Kitchen → Delivery. Done!' },
];

const DEMOS = [
  { name: 'Customer Menu', href: '/', icon: <Coffee className="w-5 h-5" />, desc: 'What your customers see' },
  { name: 'POS Counter', href: '/pos', icon: <Monitor className="w-5 h-5" />, desc: 'Staff order management' },
  { name: 'Kitchen Display', href: '/kitchen', icon: <ChefHat className="w-5 h-5" />, desc: 'Kitchen order board' },
  { name: 'Menu Board', href: '/menu-board', icon: <Palette className="w-5 h-5" />, desc: 'Digital signage display' },
  { name: 'Admin Dashboard', href: '/admin', icon: <BarChart3 className="w-5 h-5" />, desc: 'Sales & management' },
];

export default function LandingPage() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showMore, setShowMore] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-b border-stone-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Coffee className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-stone-800 text-lg">CafeOS</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">Pricing</a>
            <a href="#demo" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">Demo</a>
            <a href="#how" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">How It Works</a>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm text-stone-600 hover:text-stone-900 font-medium">Login</Link>
            <Link href="/login" className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-5 py-2 rounded-xl text-sm font-medium hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg shadow-orange-500/20">
              Get Started Free
            </Link>
          </div>
          <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-2">
            {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {mobileMenu && (
          <div className="md:hidden bg-white border-t border-stone-100 px-4 py-4 space-y-3">
            <a href="#features" className="block text-sm text-stone-600" onClick={() => setMobileMenu(false)}>Features</a>
            <a href="#pricing" className="block text-sm text-stone-600" onClick={() => setMobileMenu(false)}>Pricing</a>
            <a href="#demo" className="block text-sm text-stone-600" onClick={() => setMobileMenu(false)}>Demo</a>
            <a href="#how" className="block text-sm text-stone-600" onClick={() => setMobileMenu(false)}>How It Works</a>
            <Link href="/login" className="block bg-gradient-to-r from-orange-500 to-amber-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium text-center">Get Started Free</Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6 border border-orange-100">
            <Zap className="w-4 h-4" />
            Built for Indian Cafes & Restaurants
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold text-stone-900 leading-tight mb-6">
            Your Cafe, <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">Digitized</span>
          </h1>
          <p className="text-lg sm:text-xl text-stone-500 max-w-2xl mx-auto mb-8">
            QR ordering, POS, kitchen display, delivery tracking, <strong className="text-stone-700">loyalty rewards</strong>, WhatsApp notifications, <strong className="text-stone-700">social media automation</strong>, and sales analytics — all in one simple app. No app download. Works on any phone.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link href="/login" className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-amber-500 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:from-orange-600 hover:to-amber-600 transition-all shadow-xl shadow-orange-500/20 flex items-center justify-center gap-2">
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#demo" className="w-full sm:w-auto bg-stone-100 text-stone-700 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-stone-200 transition-colors flex items-center justify-center gap-2">
              Try Live Demo
            </a>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-stone-400">
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-green-500" /> No credit card</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-green-500" /> 14-day free trial</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-green-500" /> Setup in 5 minutes</span>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-stone-50 border-y border-stone-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-5 gap-8">
          {[
            { value: '12', label: 'Core Features' },
            { value: '10', label: 'WhatsApp Tools' },
            { value: '4', label: 'Display Modes' },
            { value: '8+', label: 'Coming Soon' },
            { value: '3', label: 'Pricing Tiers' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-bold text-orange-500">{stat.value}</p>
              <p className="text-sm text-stone-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-4">Everything You Need</h2>
            <p className="text-stone-500 max-w-xl mx-auto">One platform replaces your POS, ordering system, kitchen display, delivery tracker, loyalty program, and analytics dashboard.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-stone-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className={`w-12 h-12 ${f.color} rounded-xl flex items-center justify-center text-white mb-4 shadow-lg`}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-stone-800 mb-2">{f.title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* More Features Toggle */}
          <div className="mt-12 text-center">
            <button
              onClick={() => setShowMore(!showMore)}
              className="inline-flex items-center gap-2 bg-stone-100 text-stone-700 px-6 py-3 rounded-2xl font-medium hover:bg-stone-200 transition-colors"
            >
              {showMore ? 'Show Less' : 'See More Features Coming Soon'}
              <ArrowRight className={`w-4 h-4 transition-transform ${showMore ? 'rotate-90' : ''}`} />
            </button>
          </div>

          {showMore && (
            <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {MORE_FEATURES.map((f) => (
                <div key={f.title} className="bg-stone-50 rounded-2xl p-5 border border-stone-100">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-orange-500 mb-3 shadow-sm">
                    {f.icon}
                  </div>
                  <h4 className="font-bold text-stone-800 text-sm mb-1">{f.title}</h4>
                  <p className="text-xs text-stone-500">{f.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Loyalty Spotlight */}
      <section className="py-20 px-4 sm:px-6 bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
                <Gift className="w-4 h-4" /> Loyalty & Rewards
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-4">
                Turn One-Time Visitors Into <span className="text-orange-500">Regulars</span>
              </h2>
              <p className="text-stone-600 mb-6">
                Stamp card system that works for coffee, food, desserts — anything on your menu. Customers collect stamps, earn rewards, and keep coming back. WhatsApp nudges remind them when they&apos;re close.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Buy 8 get 1 free — configurable stamps & rewards',
                  'Works for all menu items (coffee, food, drinks, desserts)',
                  'Auto-stamp when order is placed (POS or QR ordering)',
                  'WhatsApp nudge at 7/8 stamps — "One more to go!"',
                  'Reward notification when earned — "Show this to redeem"',
                  'Admin dashboard — top customers, near-miss list, stats',
                  'Customer profile — view stamps, track progress',
                  'Fully customizable — stamps required, reward type, bonus on signup',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-stone-600">
                    <Check className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/profile" className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-orange-600 transition-colors">
                See Loyalty Card <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="bg-white rounded-3xl p-8 shadow-2xl shadow-orange-500/10 border border-orange-100">
              <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl p-6 text-white mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Gift className="w-5 h-5" />
                  <span className="font-bold">Loyalty Card</span>
                </div>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className={`w-full aspect-square rounded-xl flex items-center justify-center text-lg ${i < 6 ? 'bg-white shadow-md' : 'bg-orange-400/30'}`}>
                      {i < 6 ? '☕' : '○'}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-orange-100 text-sm">6 of 8 stamps</span>
                  <span className="bg-white text-orange-600 px-2 py-0.5 rounded-full text-xs font-bold">2 more!</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="bg-green-50 rounded-xl p-3 border border-green-200">
                  <p className="text-xs text-green-600 font-medium">WhatsApp Sent</p>
                  <p className="text-sm text-stone-700">☕ You&apos;re 1 stamp away from a FREE reward! Visit us soon!</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-3 border border-orange-200">
                  <p className="text-xs text-orange-600 font-medium">Reward Earned!</p>
                  <p className="text-sm text-stone-700">🎉 You&apos;ve earned: Free Coffee (up to ₹200)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Media Integration Spotlight */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="bg-stone-100 rounded-3xl p-8">
                <div className="space-y-4">
                  <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white">
                      <span className="text-xl font-bold">f</span>
                    </div>
                    <div>
                      <p className="font-bold text-stone-800">Auto-Post to Facebook</p>
                      <p className="text-xs text-stone-500">Daily specials posted automatically at 10 AM</p>
                    </div>
                    <div className="ml-auto w-3 h-3 bg-green-500 rounded-full" />
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white">
                      <AtSign className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-stone-800">Instagram Stories</p>
                      <p className="text-xs text-stone-500">Auto-share menu items as stories with price tags</p>
                    </div>
                    <div className="ml-auto w-3 h-3 bg-green-500 rounded-full" />
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-white">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-stone-800">WhatsApp Broadcasts</p>
                      <p className="text-xs text-stone-500">Promo messages to all customers weekly</p>
                    </div>
                    <div className="ml-auto w-3 h-3 bg-green-500 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
                <Send className="w-4 h-4" /> Social Media Automation
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-4">
                Your Cafe, <span className="text-indigo-500">Everywhere</span>
              </h2>
              <p className="text-stone-600 mb-6">
                Auto-post daily specials to Facebook and Instagram. Reply to DMs with order links. Run promotions. Everything from one dashboard — no need to open 3 apps.
              </p>
              <ul className="space-y-3">
                {[
                  'Auto-post daily specials to Facebook Page',
                  'Instagram Stories with menu items + prices',
                  'Reply to DMs with order links',
                  'Schedule promotions in advance',
                  'Track engagement and reach',
                  'Birthday promos shared to social media',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-stone-600">
                    <Check className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="py-20 px-4 sm:px-6 bg-stone-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-4">Up and Running in Minutes</h2>
            <p className="text-stone-500">No technical knowledge required. If you can use a phone, you can set this up.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((h) => (
              <div key={h.step} className="text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 shadow-lg shadow-orange-500/20">
                  {h.step}
                </div>
                <h3 className="font-bold text-stone-800 mb-2">{h.title}</h3>
                <p className="text-sm text-stone-500">{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo */}
      <section id="demo" className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-4">Try It Live</h2>
            <p className="text-stone-500">Click any demo below to see the actual app in action.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {DEMOS.map((d) => (
              <Link
                key={d.name}
                href={d.href}
                className="bg-white rounded-2xl p-5 border border-stone-100 hover:shadow-xl hover:border-orange-200 transition-all flex items-center gap-4 group"
              >
                <div className="w-12 h-12 bg-stone-100 group-hover:bg-orange-50 rounded-xl flex items-center justify-center text-stone-400 group-hover:text-orange-500 transition-colors">
                  {d.icon}
                </div>
                <div>
                  <p className="font-bold text-stone-800 group-hover:text-orange-600 transition-colors">{d.name}</p>
                  <p className="text-xs text-stone-400">{d.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-orange-500 ml-auto transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 sm:px-6 bg-stone-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-4">Simple Pricing</h2>
            <p className="text-stone-500">Pay for what you use. Scale when you&apos;re ready.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PRICING.map((p) => (
              <div key={p.name} className={`bg-white rounded-2xl p-6 border-2 ${p.color} relative ${p.popular ? 'shadow-xl scale-105' : 'shadow-sm'}`}>
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg">
                    MOST POPULAR
                  </div>
                )}
                <h3 className="font-bold text-stone-800 text-lg">{p.name}</h3>
                <p className="text-sm text-stone-500 mt-1">{p.desc}</p>
                <div className="mt-4 mb-6">
                  <span className="text-4xl font-bold text-stone-900">{p.price}</span>
                  <span className="text-stone-400 text-sm">{p.period}</span>
                </div>
                <ul className="space-y-3 mb-6">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-stone-600">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/login" className={`block w-full text-center ${p.btn} text-white py-3 rounded-xl font-medium transition-all`}>
                  {p.name === 'Enterprise' ? 'Contact Sales' : 'Start Free Trial'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Custom APK/iOS */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-3xl p-8 sm:p-12 text-white text-center">
            <Smartphone className="w-12 h-12 mx-auto mb-4 text-orange-400" />
            <h2 className="text-3xl font-bold mb-4">Need a Custom App?</h2>
            <p className="text-stone-300 max-w-xl mx-auto mb-6">
              We can package this as a native <strong className="text-white">Android APK</strong> or <strong className="text-white">iOS app</strong> with your brand, your logo, your colors. White-label solution for your chain.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-stone-400 mb-8">
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-orange-400" /> Custom Logo & Branding</span>
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-orange-400" /> Google Play Store</span>
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-orange-400" /> Apple App Store</span>
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-orange-400" /> Push Notifications</span>
            </div>
            <a href="tel:9774242635" className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:from-orange-600 hover:to-amber-600 transition-all shadow-xl shadow-orange-500/20">
              Call for Custom Quote
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-900 text-white py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center">
                  <Coffee className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg">CafeOS</span>
              </div>
              <p className="text-sm text-stone-400">The complete digital platform for cafes and restaurants. Built in India, for India.</p>
            </div>
            <div>
              <h4 className="font-bold mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-stone-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#demo" className="hover:text-white transition-colors">Live Demo</a></li>
                <li><a href="#how" className="hover:text-white transition-colors">How It Works</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-3">Displays</h4>
              <ul className="space-y-2 text-sm text-stone-400">
                <li><Link href="/" className="hover:text-white transition-colors">Customer Menu</Link></li>
                <li><Link href="/pos" className="hover:text-white transition-colors">POS Counter</Link></li>
                <li><Link href="/kitchen" className="hover:text-white transition-colors">Kitchen Display</Link></li>
                <li><Link href="/menu-board" className="hover:text-white transition-colors">Digital Menu Board</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-3">Contact</h4>
              <ul className="space-y-2 text-sm text-stone-400">
                <li><a href="https://www.avitsolutions.tech" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">AVIT Solutions</a></li>
                <li><a href="tel:9774242635" className="hover:text-white transition-colors">9774242635</a></li>
                <li><span className="text-stone-500">Custom APK & iOS available</span></li>
              </ul>
              <div className="flex gap-3 mt-4">
                <a href="#" className="w-8 h-8 bg-stone-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors"><span className="text-xs font-bold">f</span></a>
                <a href="#" className="w-8 h-8 bg-stone-800 rounded-lg flex items-center justify-center hover:bg-gradient-to-br hover:from-purple-500 hover:to-pink-500 transition-colors"><AtSign className="w-4 h-4" /></a>
                <a href="#" className="w-8 h-8 bg-stone-800 rounded-lg flex items-center justify-center hover:bg-green-600 transition-colors"><MessageSquare className="w-4 h-4" /></a>
              </div>
            </div>
          </div>
          <div className="border-t border-stone-800 pt-8 text-center text-sm text-stone-500">
            <p>&copy; 2026 CafeOS by AVIT Solutions. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
