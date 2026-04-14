# 🛒 Gopal Trading Company — Full Stack Web Application

A complete production-ready grocery distribution and preorder system built with Node.js, Express, MongoDB, and Vanilla JS.

---

## 🗂️ Project Structure

```
gopal-trading/
├── client/                   # Frontend (HTML + CSS + JS)
│   ├── index.html            # Single Page Application
│   └── app.js                # All frontend logic
│
└── server/                   # Backend (Node.js + Express)
    ├── index.js              # Entry point
    ├── package.json
    ├── .env.example          # Environment variable template
    ├── models/
    │   ├── User.js           # User schema (customers + admins)
    │   └── Order.js          # Order schema
    ├── routes/
    │   ├── auth.js           # /api/auth/*
    │   ├── orders.js         # /api/orders/*
    │   ├── admin.js          # /api/admin/*
    │   └── users.js          # /api/users/*
    ├── controllers/
    │   ├── authController.js
    │   ├── orderController.js
    │   └── adminController.js
    ├── middleware/
    │   ├── auth.js           # JWT protect + adminOnly
    │   └── upload.js         # Multer file upload config
    └── uploads/              # Uploaded files stored here
```

---

## ⚙️ Prerequisites

- **Node.js** v16+ — https://nodejs.org
- **MongoDB** v5+ (local) OR a free **MongoDB Atlas** cluster — https://mongodb.com/atlas
- **npm** (comes with Node.js)

---

## 🚀 Setup Instructions

### Step 1 — Clone or extract the project

```bash
cd gopal-trading/server
```

### Step 2 — Install backend dependencies

```bash
cd server
npm install
```

### Step 3 — Configure environment variables

```bash
# Copy the example file
cp .env.example .env

# Edit .env with your actual values
nano .env   # or use any text editor
```

**Minimum required values in `.env`:**
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/gopal_trading
JWT_SECRET=replace_with_a_long_random_string_here
ADMIN_EMAIL=admin@gopaltrading.com
ADMIN_PASSWORD=YourSecurePassword123
```

### Step 4 — Start MongoDB (if running locally)

```bash
# macOS (with Homebrew)
brew services start mongodb-community

# Ubuntu/Debian
sudo systemctl start mongod

# Windows — run MongoDB Compass or mongod.exe
```

### Step 5 — Start the server

```bash
# Development (with auto-restart on file changes)
npm run dev

# Production
npm start
```

You should see:
```
✅ MongoDB connected successfully
👤 Admin account created: admin@gopaltrading.com
🚀 Server running on http://localhost:5000
```

### Step 6 — Open the application

Open your browser and visit:
```
http://localhost:5000
```

---

## 🔐 Default Admin Credentials

After first run, an admin account is auto-created using your `.env` values:

| Field    | Value                            |
|----------|----------------------------------|
| Email    | `admin@gopaltrading.com`         |
| Password | `Admin@1234` (change in `.env`)  |

On the Login page, click **"Admin Login"** hint to pre-fill the email placeholder.

---

## 📡 API Reference

### Auth Routes
| Method | Endpoint              | Auth | Description         |
|--------|-----------------------|------|---------------------|
| POST   | `/api/auth/signup`    | ❌   | Register new user   |
| POST   | `/api/auth/login`     | ❌   | Login               |
| GET    | `/api/auth/me`        | ✅   | Get current user    |
| PUT    | `/api/auth/profile`   | ✅   | Update profile      |
| PUT    | `/api/auth/password`  | ✅   | Change password     |

### Order Routes
| Method | Endpoint                  | Auth  | Description             |
|--------|---------------------------|-------|-------------------------|
| POST   | `/api/orders`             | User  | Create order (+ upload) |
| GET    | `/api/orders/user`        | User  | Get my orders           |
| GET    | `/api/orders`             | Admin | Get all orders          |
| GET    | `/api/orders/:id`         | User  | Get order details       |
| PUT    | `/api/orders/:id`         | Admin | Update order status     |
| GET    | `/api/orders/stats`       | Admin | Order statistics        |

### Admin Routes
| Method | Endpoint                          | Auth  | Description          |
|--------|-----------------------------------|-------|----------------------|
| GET    | `/api/admin/dashboard`            | Admin | Dashboard stats      |
| GET    | `/api/admin/users`                | Admin | All customers        |
| PUT    | `/api/admin/users/:id/toggle`     | Admin | Activate/deactivate  |

---

## 🌐 Deployment (Production)

### Option A — Deploy to Railway (Free)
1. Push code to GitHub
2. Go to https://railway.app and create a new project
3. Connect your GitHub repo
4. Add environment variables from `.env`
5. Add a MongoDB plugin or use MongoDB Atlas URI

### Option B — Deploy to Render (Free)
1. Push to GitHub
2. Create a Web Service on https://render.com
3. Set build command: `cd server && npm install`
4. Set start command: `cd server && npm start`
5. Add environment variables

### Option C — VPS (DigitalOcean / AWS)
```bash
# Install Node.js and PM2
npm install -g pm2

# Start server with PM2 (keeps it running)
pm2 start server/index.js --name gopal-trading

# Enable nginx reverse proxy on port 80 → 5000
```

---

## 🔒 Security Checklist

- ✅ Passwords hashed with bcrypt (salt rounds: 10)
- ✅ JWT tokens with expiry (7 days by default)
- ✅ Admin routes protected with `adminOnly` middleware
- ✅ File upload restricted to safe types + size limit
- ✅ Input validation on all API endpoints
- ✅ MongoDB injection prevented by Mongoose
- ⚠️ In production: use HTTPS, set secure cookies, enable rate limiting

---

## 📱 Pages Overview

| Page       | URL              | Access      |
|------------|------------------|-------------|
| Home       | `/`              | Public      |
| Login      | `/#login`        | Public      |
| Sign Up    | `/#signup`       | Public      |
| Dashboard  | `/#dashboard`    | Logged-in   |
| Admin      | `/#admin`        | Admin only  |

---

## 💡 Feature Highlights

- **Drag & Drop** file upload with preview
- **Order status tracking**: Pending → Accepted → Out for Delivery → Delivered
- **Admin analytics**: Bar chart + status breakdown
- **Responsive**: Works on mobile, tablet, desktop
- **Toast notifications** for all actions
- **WhatsApp floating button** for quick contact
- **Scroll animations** on home page
- **Auto-seed** admin account on first start

---

## 📦 Tech Stack

| Layer      | Technology          |
|------------|---------------------|
| Frontend   | HTML5, CSS3, Vanilla JS |
| Backend    | Node.js + Express.js |
| Database   | MongoDB + Mongoose  |
| Auth       | JWT + bcryptjs      |
| Upload     | Multer              |
| Fonts      | Playfair Display + DM Sans |

---

## 🛠️ Customization

- **Company name/address**: Edit `client/index.html` (hero section + contact section)
- **WhatsApp number**: Find `wa.me/91...` in `index.html` and replace
- **Colors**: Edit CSS variables in `<style>` block: `--green`, `--red`
- **Time slots**: Edit `Order.js` model enum + `index.html` select options
- **File size limit**: Edit `middleware/upload.js` → `fileSize`

---

_Built for Gopal Trading Company — Chennai, Tamil Nadu_
