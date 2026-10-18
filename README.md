# 🎬 ReelVault

> **ReelVault** is a modern, production-ready personal reel & short-video link organizer. Save, categorize, search, and curate your favorite Instagram Reels, YouTube Shorts, TikToks, Facebook Reels, and X (Twitter) videos in one sleek, secure personal vault.

---

## 🌟 Key Features

- **⚡ Instant Platform Detection**: Paste any video URL (Instagram, YouTube Shorts, TikTok, Facebook, X/Twitter, or generic video) and ReelVault instantly detects the platform and lights up the branded logo & badge.
- **🛡️ Smart Link Normalization & Duplicate Prevention**: Automatically strips tracking query junk (`utm_*`, `igshid`, `si`, `fbclid`, etc.) and prevents saving duplicate links with a friendly notification.
- **🏷️ Smart Categorization**: 10 pre-seeded categories (*Educational 📚, Romantic ❤️, Funny 😂, Motivational 🔥, Inspirational ✨, Music 🎵, Food 🍔, Travel ✈️, Fitness 💪, Other 📌*) + unlimited custom categories with custom icons and color palettes.
- **Safe Category Deletion**: Deleting a category never orphans your reels—they are safely and automatically reassigned to the default *"Other"* category.
- **🔍 Fast Search & Filter**: Real-time search with a 400ms debounce across title, personal notes, and `#tags`, alongside category chips with live count badges, platform filters, and favorites-only toggle.
- **⭐ Favorites & Notes**: Star your favorite reels, add markdown-friendly personal notes and custom titles, and tag videos for quick recall.
- **🌙 Dark & Light Mode**: Seamless theme toggle with persistent user preference across sessions.
- **📱 Mobile-First & Share Target**: Responsive layout optimized for smartphones, tablets, and desktops, including a `/add?url=...` share-target page ready for mobile share sheets and browser bookmarklets.
- **🌐 Cold-Start Friendly**: Built-in detector and friendly *"Server is waking up..."* banner to handle Render free-tier spinning up from sleep gracefully.

---

## 🏗️ Architecture & Tech Stack

```
reelvault/
├── frontend/             # React (Vite) + Tailwind CSS + Lucide Icons + React Router + Axios
│   ├── public/
│   ├── src/
│   │   ├── api/          # Axios client with JWT interceptor & cold-start detector
│   │   ├── components/   # Navbar, ReelCard, AddReelForm, CategoryFilter, SearchBar, Modal, etc.
│   │   ├── context/      # AuthContext (persistent JWT, theme toggle, state)
│   │   ├── hooks/        # useDebounce, useReels
│   │   ├── pages/        # Login, Register, Dashboard, ShareAdd, NotFound
│   │   ├── utils/        # detectPlatform.js, validators.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env.example
│   ├── vercel.json       # SPA rewrite configuration
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
├── backend/              # Node.js + Express (REST API) + Neon DB (PostgreSQL)
│   ├── src/
│   │   ├── config/       # Neon DB (PostgreSQL) connection with auto-table initialization
│   │   ├── controllers/  # auth.controller.js, reel.controller.js, category.controller.js
│   │   ├── middleware/   # JWT auth, errorHandler, Zod validate, rateLimiter
│   │   ├── models/       # User, Reel, Category (compound indexes & full text search)
│   │   ├── routes/       # auth.routes.js, reel.routes.js, category.routes.js
│   │   ├── utils/        # detectPlatform.js, fetchMetadata.js (SSRF protection), asyncHandler.js
│   │   ├── app.js        # Helmet, CORS, mongoSanitize, compression, morgan
│   │   ├── server.js     # Server entry point & graceful shutdown
│   │   ├── seed.js       # Database seeder with sample user & reels
│   │   └── test-api.js   # Automated integration test suite
│   ├── .env.example
│   └── package.json
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- **Node.js** v18+ (tested on Node 20+)
- **NPM** v9+
- Optional: MongoDB Atlas URI (or uses automatic local fallback)

### 1. Clone & Setup Backend

```bash
cd backend
npm install
cp .env.example .env
```

Configure your `.env` in `backend/`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/reelvault?retryWrites=true&w=majority
JWT_SECRET=super_secret_jwt_key_reelvault_development_2026_secure
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```
*(Note: If `MONGODB_URI` is not set or set to `memory`, the backend automatically uses an embedded in-memory MongoDB instance for offline local testing!)*

### 2. Run Backend Tests & Seed Sample Data

```bash
# Run the automated backend API test suite
npm run test:api

# (Optional) Seed demo user (demo@reelvault.app / Password123) and sample reels
npm run seed

# Start the backend server in development mode
npm run dev
```
The backend will run on **http://localhost:5000** (Health check: `http://localhost:5000/api/health`).

### 3. Setup & Run Frontend

Open a new terminal window:
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The frontend will run on **http://localhost:5173**. Open your browser and navigate to `http://localhost:5173/`!

---

## 📡 API Documentation

All API endpoints are prefixed with `/api` and return standardized JSON responses:
```json
{
  "success": true,
  "data": { ... },
  "message": "Status description"
}
```

### 1. Authentication (`/api/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new user & auto-seeds 10 default categories |
| `POST` | `/api/auth/login` | Public | Login with email & password, returns JWT token |
| `GET` | `/api/auth/me` | Protected | Get currently authenticated user profile |

### 2. Reels (`/api/reels`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/reels` | Protected | Save new reel (normalizes URL, detects platform, scrapes metadata) |
| `GET` | `/api/reels` | Protected | Get user's reels with query params: `category`, `platform`, `search`, `favorite`, `page`, `limit`, `sort` |
| `GET` | `/api/reels/:id` | Protected | Get single reel by ID |
| `PUT` | `/api/reels/:id` | Protected | Update reel title, notes, category, tags, or favorite status |
| `DELETE` | `/api/reels/:id` | Protected | Delete reel from vault |
| `PATCH` | `/api/reels/:id/favorite` | Protected | Toggle favorite status |

### 3. Categories (`/api/categories`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/categories` | Protected | List all categories with live reel count per category |
| `POST` | `/api/categories` | Protected | Create custom category (name, color, icon emoji) |
| `PUT` | `/api/categories/:id` | Protected | Rename or recolor an existing category |
| `DELETE`| `/api/categories/:id` | Protected | Delete category (reels are safely reassigned to "Other") |

### 4. Health Check

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Returns `{ status: "ok", timestamp, uptime }` for Render uptime checks |

---

## 🔒 Security Best Practices Implemented

1. **Strict User Scoping**: Every database query is strictly scoped to `req.user._id`. Users cannot view, modify, or delete another user's reels or categories.
2. **SSRF Protection on Metadata Scraping**:
   - Only HTTP and HTTPS protocols are accepted.
   - Hostnames are resolved through DNS and checked against private, loopback, link-local, and multicast IP ranges (`127.0.0.0/8`, `10.0.0.0/8`, `192.168.0.0/16`, `172.16.0.0/12`, `169.254.0.0/16`, `::1`, `fc00::/7`).
   - Hard 4-second timeout prevents slowloris hangs.
3. **HTTP Security Headers**: `helmet()` configured on all Express endpoints.
4. **NoSQL Injection Sanitization**: `express-mongo-sanitize` strips `$` and `.` operators from client inputs.
5. **Rate Limiting**: `express-rate-limit` enforces strict limits on auth routes (30 requests/15m) and general API protection (300 requests/15m).
6. **Input Validation**: Strongly typed schemas with `zod` for every route.
7. **Safe Error Handling**: Stack traces are stripped in production environments.

---

## ☁️ Deployment Guide

### A. Deploy Backend to Render

1. Sign up at [Render](https://render.com).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Set the following settings:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js` (or `npm start`)
5. In **Environment Variables**, add:
   - `NODE_ENV`: `production`
   - `PORT`: `10000` (or leave default, Render sets `PORT` automatically)
   - `MONGODB_URI`: *Your MongoDB Atlas connection string*
   - `JWT_SECRET`: *A secure 64-character random string*
   - `JWT_EXPIRES_IN`: `7d`
   - `CLIENT_URL`: `https://your-reelvault-frontend.vercel.app` *(update with your Vercel URL)*
6. Click **Create Web Service**. Note your Render URL (e.g. `https://reelvault-api.onrender.com`).
7. **Free Tier Tip**: Free tier Render services spin down after 15 minutes of inactivity. Use a free uptime monitor like [UptimeRobot](https://uptimerobot.com) to ping `https://reelvault-api.onrender.com/api/health` every 10 minutes to keep it active.

---

### B. Deploy Frontend to Vercel

1. Sign up at [Vercel](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository.
4. Set the following configuration:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. In **Environment Variables**, add:
   - `VITE_API_URL`: `https://reelvault-api.onrender.com/api` *(Your Render backend URL + /api)*
6. Click **Deploy**.
7. Once deployed, copy your production Vercel domain (e.g., `https://reelvault-frontend.vercel.app`) and ensure it is included in your Render backend `CLIENT_URL` environment variable for CORS.

---

## 📄 License

MIT License. Built for seamless personal reel curation.
