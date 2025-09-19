# TicketCap - מערכת ניהול כרטיסים

מערכת ניהול כרטיסים לאירועים ומשחקים עם הגבלת כמות ורשימת המתנה.

## 🚀 Deploy to Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/YwKJMg)

### Quick Railway Deployment:

1. **Click the Railway button above** or go to [Railway.app](https://railway.app)
2. **Connect your GitHub account** and fork this repository
3. **Add PostgreSQL service** in Railway dashboard
4. **Deploy automatically** - Railway will detect the Node.js project
5. **Set environment variables** (Railway auto-provides DATABASE_URL)
6. **Done!** Your ticket system is live

### Environment Variables for Railway:
```env
DATABASE_URL=postgresql://... (auto-provided by Railway PostgreSQL service)
NEXTAUTH_SECRET=your-random-secret-key
NEXTAUTH_URL=https://your-app.railway.app
```

## 🏠 Local Development

### Requirements
- Node.js 18+
- Docker Desktop
- PostgreSQL (via Docker)

### Setup

1. **Clone repository:**
```bash
git clone git@github.com:MichaelMishaev/ticketsSchool.git
cd ticketsSchool
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start database:**
```bash
# Start Docker Desktop first
docker-compose up -d
```

4. **Initialize database:**
```bash
npx prisma generate
npx prisma migrate dev --name init
```

5. **Start development server:**
```bash
npm run dev
```

Access at: http://localhost:3000

## 🎯 Features

### 👨‍💼 Admin Interface
- ✅ Hebrew RTL responsive dashboard
- ✅ Event creation with custom field builder
- ✅ Real-time capacity tracking
- ✅ Registration management (view/edit/delete)
- ✅ Waitlist promotion to confirmed
- ✅ CSV export with Hebrew support
- ✅ Mobile-first design with hamburger menu

### 👥 Public Registration
- ✅ Beautiful mobile-first Hebrew interface
- ✅ Live capacity indicator with progress bar
- ✅ Automatic waitlist when full
- ✅ Instant confirmation with unique code
- ✅ Screenshot-friendly confirmation screen
- ✅ Terms acceptance checkbox
- ✅ Duplicate prevention by phone number

### 🔧 Technical Features
- ✅ Atomic capacity enforcement
- ✅ Phone number normalization (Israeli format)
- ✅ Custom field types: text, number, dropdown, checkbox
- ✅ Prisma ORM with PostgreSQL
- ✅ RESTful API architecture
- ✅ Production-ready error handling

## 📁 Project Structure

```
/app
  /admin         # Admin interface (Hebrew RTL)
    /events      # Event management
      /new       # Create new event
      /[id]      # Event details & registrations
  /api          # API endpoints
    /events     # Event CRUD operations
    /p          # Public registration APIs
  /p            # Public registration pages
    /[slug]     # Event registration page

/components     # Reusable React components
/lib           # Utility functions
/prisma        # Database schema & migrations
/types         # TypeScript definitions
```

## 📊 Database Schema

- **Events:** title, capacity, custom fields, status
- **Registrations:** attendee data, confirmation codes, status
- **Atomic transactions** for capacity enforcement
- **Automatic waitlist** when capacity reached

## 🔗 API Endpoints

### Admin APIs
- `GET /api/events` - List all events
- `POST /api/events` - Create new event
- `GET /api/events/[id]` - Get event details
- `PATCH /api/events/[id]` - Update event
- `GET /api/events/[id]/export` - Export CSV

### Public APIs
- `GET /api/p/[slug]` - Get public event info
- `POST /api/p/[slug]/register` - Submit registration

## 🌐 Tech Stack

- **Frontend:** Next.js 15, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** PostgreSQL
- **Deployment:** Railway.app
- **Development:** Docker Compose

## 📱 Mobile-First Design

Optimized for Israeli mobile users:
- Hebrew RTL interface throughout
- Touch-friendly forms and buttons
- Responsive grid layouts
- Hamburger navigation for mobile
- Large confirmation codes for screenshots

## 🔒 Security Features

- Server-side validation
- Rate limiting
- Duplicate prevention
- Unique event slugs
- Atomic database transactions
- Input sanitization

## 📈 Production Ready

- Health check endpoint (`/api/health`)
- Error handling & logging
- Database migrations
- Environment variable management
- Docker containerization
- Railway deployment configuration

---

**Built with ❤️ for Israeli schools, clubs, and organizations managing limited-capacity events.**