# E-Commerce Website Specification

## Project Overview
- **Project Name**: NavyShop E-Commerce
- **Type**: Full-stack e-commerce web application
- **Core Functionality**: Online shopping platform with product catalog, shopping cart, and checkout (with/without account)
- **Target Users**: Online shoppers seeking a clean, professional shopping experience

## Technology Stack
- **Backend**: Django 5.x (Python)
- **Frontend**: HTML5, Tailwind CSS 3.x (via CDN)
- **Database**: SQLite (default Django)
- **JavaScript**: Vanilla JS for slider and cart functionality

## UI/UX Specification

### Color Palette
- **Primary**: Navy Blue `#1e3a8a` (RGB: 30, 58, 138)
- **Primary Dark**: `#1e293b` (slate-900)
- **Primary Light**: `#3b82f6` (blue-500)
- **Secondary**: White `#ffffff`
- **Background**: `#f8fafc` (slate-50)
- **Accent**: `#fbbf24` (amber-400)
- **Text Primary**: `#1e293b` (slate-900)
- **Text Secondary**: `#64748b` (slate-500)
- **Border**: `#e2e8f0` (slate-200)

### Typography
- **Font Family**: Inter (Google Fonts)
- **Headings**: Bold, sizes: h1=3rem, h2=2.25rem, h3=1.5rem
- **Body**: Regular, 1rem (16px)
- **Small**: 0.875rem (14px)

### Layout Structure
- **Header**: Fixed top navigation with logo, nav links, search, cart icon, account
- **Banner**: Full-width slider with navigation dots
- **Content**: Responsive grid (1 col mobile, 2 col tablet, 4 col desktop)
- **Footer**: Multi-column with links, newsletter, social

### Responsive Breakpoints
- Mobile: < 640px (sm)
- Tablet: 640px - 1024px (md/lg)
- Desktop: > 1024px (xl)

### Components

#### Navigation Bar
- Logo (left)
- Nav links: Home, Shop, About, Contact (center)
- Search bar with icon
- Cart icon with badge (item count)
- Account dropdown (Login/Register or Profile/Logout)
- Background: Navy blue `#1e3a8a`

#### Banner Slider
- Full-width carousel
- 3 slides with promotional content
- Auto-advance every 5 seconds
- Manual navigation (arrows + dots)
- Background images with overlay
- CTA buttons

#### Product Card
- Image container (aspect-ratio 1:1)
- Product name (truncate 2 lines)
- Price (bold, navy blue)
- "Add to Cart" button
- Hover: slight scale + shadow

#### Shopping Cart
- Slide-out panel from right
- Item list with quantity controls
- Remove item button
- Subtotal calculation
- "Checkout" button
- Empty cart message

#### Checkout Page
- Guest checkout option (no account)
- Login prompt for existing customers
- Form: Name, Email, Address, Payment
- Order summary sidebar
- Place Order button

#### Footer
- 4 columns: About, Quick Links, Customer Service, Newsletter
- Social media icons
- Copyright text

## Functionality Specification

### Core Features

1. **Product Catalog**
   - Display products in responsive grid
   - Product images, names, prices
   - Category filtering
   - Search functionality

2. **Shopping Cart**
   - Add/remove items
   - Update quantities
   - Calculate totals
   - Persist cart in session

3. **Checkout System**
   - Guest checkout (no account required)
   - Registered user checkout (faster with saved info)
   - Order submission and confirmation

4. **User Accounts (Optional)**
   - Registration
   - Login/Logout
   - Order history (for logged-in users)

5. **Banner Slider**
   - Auto-rotating slides
   - Manual navigation
   - Promotional content

### User Interactions
- Click product → Add to cart (with animation feedback)
- Click cart icon → Open cart panel
- Click checkout → Show checkout form
- Submit order → Show confirmation

### Data Models

#### Product
- name: CharField
- description: TextField
- price: DecimalField
- image: ImageField
- category: ForeignKey
- created_at: DateTimeField
- in_stock: BooleanField

#### Order
- user: ForeignKey (optional, can be null for guest)
- guest_email: EmailField (for guest orders)
- full_name: CharField
- address: TextField
- total_amount: DecimalField
- status: CharField (pending, completed)
- created_at: DateTimeField

#### OrderItem
- order: ForeignKey
- product: ForeignKey
- quantity: IntegerField
- price: DecimalField

#### User (Django built-in)
- Extended with profile for optional fields

## File Structure
```
Project/
├── manage.py
├── requirements.txt
├── shop/
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── templates/
│   ├── base.html
│   ├── home.html
│   ├── shop.html
│   ├── product_detail.html
│   ├── cart.html
│   ├── checkout.html
│   ├── order_confirmation.html
│   ├── login.html
│   ├── register.html
│   └── account.html
├── static/
│   ├── css/
│   │   └── styles.css (Tailwind + custom)
│   └── js/
│       ├── main.js
│       └── slider.js
└── apps/
    └── shop/
        ├── __init__.py
        ├── models.py
        ├── views.py
        ├── urls.py
        ├── admin.py
        └── apps.py
```

## Acceptance Criteria

### Visual Checkpoints
- [ ] Navy blue (#1e3a8a) is the dominant color in header/footer
- [ ] White (#ffffff) backgrounds for content areas
- [ ] Banner slider displays and auto-advances
- [ ] Product cards display in responsive grid
- [ ] Cart panel slides in from right
- [ ] All text is readable with proper contrast

### Functional Checkpoints
- [ ] Products display from database
- [ ] Add to cart works (session-based)
- [ ] Cart quantity can be updated
- [ ] Checkout works for guests (no account)
- [ ] Checkout works for registered users
- [ ] Account registration/login works
- [ ] Banner slider navigation works

### Technical Checkpoints
- [ ] Django server runs without errors
- [ ] All templates render correctly
- [ ] Database migrations applied
- [ ] Static files (CSS/JS) load properly
- [ ] No console errors in browser