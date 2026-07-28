# CafeOS SaaS — Full Business Plan

## How It Works (No, You Don't Need Separate Repos)

### Architecture: Shared Codebase, Multi-Tenant

```
ONE GitHub repo: seansap-oss/Rabi-ChaBora
ONE Vercel deployment: cafeos.avitsolutions.tech
UNLIMITED cafes, each identified by cafeId
```

Every cafe shares the same code but has its own:
- Menu items, categories, prices
- Theme (colors, fonts, logo)
- Settings (name, UPI, phone, address)
- Loyalty program config
- WhatsApp templates & recipients
- Orders, sales data, reports
- Users (owner + staff)

**How?** Every API call includes a `cafeId`. The database separates data by cafeId. When a new cafe signs up, they get a unique cafeId and their own subdomain.

---

## Customer Journey (How You Sell It)

### Step 1: Customer Sees Your Landing Page
- Goes to `cafeos.avitsolutions.tech`
- Sees features, pricing, live demo
- Clicks "Start Free Trial"

### Step 2: Sign Up (30 seconds)
- Enters: Cafe Name, Owner Name, Email, Phone
- System creates: `cafeId = "mymoon-coffee"`
- Gets instant access to dashboard

### Step 3: Onboarding (5 minutes)
- Uploads logo
- Picks theme colors
- Adds menu items (name, price, category, photo)
- Sets UPI ID for payments
- Enables features they want (loyalty, WhatsApp, etc.)

### Step 4: Gets Their URL
- `cafeos.avitsolutions.tech/mymoon-coffee`
- QR codes auto-generated for each table
- Can also use: `mymoon.cafeos.app` (custom subdomain)

### Step 5: Go Live
- Prints QR codes → puts on tables
- Customers scan → see menu → order → pay
- Orders flow to POS → Kitchen → Delivery
- WhatsApp notifications fire automatically
- Loyalty stamps accumulate
- Sales dashboard tracks everything

---

## Pricing Model

### Tier 1: Starter — ₹999/month
**Target:** Small cafes, 1-2 person team
- QR Code Ordering
- Menu Management
- POS Counter
- Basic Sales View
- 1 User
- Email support

### Tier 2: Growth — ₹2,499/month (MOST POPULAR)
**Target:** Growing restaurants, 3-5 staff
- Everything in Starter
- Kitchen Display
- Delivery Tracking
- Loyalty & Rewards Program
- WhatsApp (5 features)
- Sales Dashboard with Charts
- 3 Users
- Phone support

### Tier 3: Enterprise — ₹4,999/month
**Target:** Multi-outlet chains
- Everything in Growth
- Digital Menu Board
- All 10 WhatsApp Features
- Facebook & Instagram Auto-Post
- Receipt Printer (any size)
- Owner Dashboard + Reports
- Unlimited Users
- Custom Branding (APK/iOS)
- Priority support

### Add-Ons (À La Carte)
- WhatsApp Full Pack: ₹500/month
- Facebook + Instagram: ₹300/month
- Custom APK: ₹50,000 one-time
- Custom iOS App: ₹1,00,000 one-time
- Priority Support: ₹200/month
- API Access: ₹500/month

---

## Revenue Projections

### Conservative (Year 1)
- 50 Starter cafes × ₹999 = ₹49,950/mo
- 20 Growth cafes × ₹2,499 = ₹49,980/mo
- 5 Enterprise cafes × ₹4,999 = ₹24,995/mo
- **Total: ₹1,24,925/mo = ₹14,99,100/year**

### Optimistic (Year 2)
- 200 Starter cafes = ₹1,99,800/mo
- 80 Growth cafes = ₹1,99,920/mo
- 20 Enterprise cafes = ₹99,980/mo
- Add-ons: ₹50,000/mo
- **Total: ₹5,49,700/mo = ₹65,96,400/year**

### Break-Even
- Vercel Pro: ₹1,700/month
- WhatsApp Business API: ₹2,000/month (shared across cafes)
- Domain: ₹800/year
- **Total cost: ~₹4,000/month**
- **Break-even: 4 Starter cafes**

---

## Tech Stack (Current → Future)

### Current (MVP — What We Have)
- Next.js 16 + TypeScript + Tailwind
- Zustand (client state) + localStorage
- Vercel serverless functions (in-memory API)
- QR code generation
- WhatsApp click-to-chat links
- Receipt designer

### What We Need to Add for SaaS
1. **Database** — PostgreSQL (Supabase or Neon)
   - Tables: cafes, users, menu_items, orders, loyalty_members, settings
   - Row-level security (each cafe sees only their data)
   
2. **Authentication** — NextAuth.js or Clerk
   - Email/password login
   - Role-based: Owner, Staff, Kitchen, Delivery
   
3. **Multi-Tenant Middleware**
   - Extract cafeId from URL/domain
   - Attach to every API request
   - Filter all DB queries by cafeId
   
4. **WhatsApp Business API** (not click-to-chat)
   - Official WhatsApp Business API via Twilio/360dialog
   - Template messages (pre-approved)
   - Webhook for delivery tracking
   
5. **Facebook/Instagram API**
   - Facebook Graph API for auto-posting
   - Instagram Basic Display API
   - Scheduled posts via cron jobs
   
6. **Payment Gateway** (optional upgrade)
   - Razorpay for online payments
   - Currently using UPI deep links (works fine)

---

## Facebook & Instagram Integration (How It Works)

### Facebook Auto-Posting
1. Cafe owner connects their Facebook Page (one-time OAuth)
2. Admin sets posting schedule (e.g., daily at 10 AM)
3. System auto-posts:
   - Daily specials with photos and prices
   - New menu items
   - Promotions and discounts
   - Birthday offers
4. Posts include order link → opens menu on phone

### Instagram Integration
1. Cafe connects Instagram Business account
2. System auto-creates stories:
   - Menu items as story cards with price stickers
   - Daily specials with "Swipe Up to Order"
   - Behind-the-scenes content
3. DM auto-reply:
   - Customer DMs "menu" → gets link to order page
   - Customer DMs "order" → gets order status
   - Customer DMs "location" → gets map link

### How to Sell This to Cafes
"Your cafe posts to Facebook and Instagram every day automatically. No need to hire a social media person. The system takes your menu items, creates beautiful posts, and publishes them at the best time for engagement. When someone sees your post and DMs you, they get an instant reply with your order link."

---

## What to Build Next (Priority Order)

### Phase 1: SaaS Infrastructure (2-3 weeks)
1. Database setup (Supabase)
2. Authentication (NextAuth)
3. Multi-tenant middleware
4. Cafe signup flow
5. Onboarding wizard

### Phase 2: Social Media (1-2 weeks)
1. Facebook Graph API integration
2. Instagram Basic Display API
3. Auto-post scheduler
4. DM auto-reply bot
5. Social media section in admin

### Phase 3: WhatsApp Real API (1 week)
1. WhatsApp Business API setup (Twilio/360dialog)
2. Template message registration
3. Webhook for delivery tracking
4. Replace click-to-chat with real API

### Phase 4: Polish & Launch (1 week)
1. Landing page with working signup
2. Pricing page with payment (Razorpay)
3. Email notifications (welcome, trial ending)
4. Admin analytics (how many cafes, MRR)

---

## Key Questions to Answer

1. **Database:** Supabase (free tier) or Neon (free tier)?
   → Supabase has auth built-in, easier

2. **WhatsApp API:** Twilio or 360dialog?
   → 360dialog is cheaper for India

3. **Custom domains:** Do cafes get their own domain?
   → Subdomain first (mymoon.cafeos.app), custom domain later

4. **Free tier:** How long is the trial?
   → 14 days, then must pick a plan

5. **Payment:** How do cafes pay you?
   → Razorpay subscription (monthly auto-debit)

---

## Summary

**You DON'T need separate repos.** One codebase, one Vercel project, unlimited cafes. Each cafe is just a `cafeId` in the database.

**How you sell it:**
1. Customer visits your landing page
2. Signs up (30 sec)
3. Sets up menu (5 min)
4. Gets their URL + QR codes
5. Starts taking orders
6. Pays monthly subscription

**Revenue:** ₹999-₹4,999/month per cafe + add-ons
**Cost:** ~₹4,000/month total (Vercel + APIs)
**Break-even:** 4 cafes

**Next step:** Build the SaaS infrastructure (database + auth + multi-tenant) so real cafes can sign up and use it.
