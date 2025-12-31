# TSSR Monitor - Cloud Deployment Guide
# دليل النشر على الـ Cloud

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Vercel      │────▶│     Render      │────▶│    Supabase     │
│   (Frontend)    │     │   (Backend)     │     │   (Database)    │
│                 │     │                 │     │                 │
│  React + Vite   │     │  Express.js     │     │  PostgreSQL     │
│  Static Files   │     │  REST API       │     │  Realtime       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## Step 1: Supabase Setup (Database)

### 1.1 Create Project (Already Done)
- Project ID: `kszdatqbykpodxmnfzfg`
- URL: `https://kszdatqbykpodxmnfzfg.supabase.co`

### 1.2 Run Migrations
Go to Supabase Dashboard > SQL Editor and run:

```sql
-- Create sites table (if not exists)
CREATE TABLE IF NOT EXISTS sites (
    id BIGSERIAL PRIMARY KEY,
    site_id TEXT NOT NULL,
    phase_name TEXT,
    final_site_name TEXT,
    site_owner TEXT,
    site_code TEXT,
    site_type TEXT,
    governorate TEXT,
    latitude REAL,
    longitude REAL,
    tssr_subcon TEXT,
    tssr_overall_status TEXT,
    ti_status TEXT,
    ti_comment TEXT,
    rf_plan_status TEXT,
    rf_plan_comment TEXT,
    rf_opt_status TEXT,
    rf_opt_comment TEXT,
    civil_status TEXT,
    civil_comment TEXT,
    mw_status TEXT,
    nokia_npo_status TEXT,
    nokia_npo_comment TEXT,
    -- Add all other columns as needed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(site_id, phase_name)
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'contractor',
    contractor_name VARCHAR(200),
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activity_log table
CREATE TABLE IF NOT EXISTS activity_log (
    id BIGSERIAL PRIMARY KEY,
    action TEXT,
    site_id TEXT,
    user_id INTEGER,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sites_site_id ON sites(site_id);
CREATE INDEX IF NOT EXISTS idx_sites_phase_name ON sites(phase_name);
CREATE INDEX IF NOT EXISTS idx_sites_tssr_subcon ON sites(tssr_subcon);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Enable RLS
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Create policies for service role
CREATE POLICY "Service role full access" ON sites FOR ALL USING (true);
CREATE POLICY "Service role full access" ON users FOR ALL USING (true);
CREATE POLICY "Service role full access" ON activity_log FOR ALL USING (true);

-- Insert default admin user (password: 123456)
INSERT INTO users (username, password, role, is_active)
VALUES ('admin', '$2a$10$8K1p/a0dR1LXMw1gQ9b5Z.5n5Z5n5Z5n5Z5n5Z5n5Z5n5Z5n5Z5n5', 'admin', 1)
ON CONFLICT (username) DO NOTHING;
```

### 1.3 Get API Keys
From Supabase Dashboard > Settings > API:
- `SUPABASE_URL`: Project URL
- `SUPABASE_ANON_KEY`: anon public key
- `SUPABASE_SERVICE_KEY`: service_role key (keep secret!)

---

## Step 2: Deploy Backend to Render

### 2.1 Create Web Service
1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **New** > **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `tssr-monitor-api`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### 2.2 Add Environment Variables
In Render Dashboard > Environment:

| Key | Value |
|-----|-------|
| `SUPABASE_URL` | `https://kszdatqbykpodxmnfzfg.supabase.co` |
| `SUPABASE_SERVICE_KEY` | `eyJ...` (from Supabase) |
| `SUPABASE_ANON_KEY` | `eyJ...` (from Supabase) |
| `JWT_SECRET` | (auto-generate or set strong secret) |
| `JWT_EXPIRY` | `24h` |
| `NODE_ENV` | `production` |

### 2.3 Deploy
Click **Deploy** and wait for build to complete.

### 2.4 Test API
```bash
curl https://tssr-monitor-api.onrender.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "mode": "cloud",
  "database": "supabase"
}
```

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Import Project
1. Go to [vercel.com](https://vercel.com)
2. Click **Add New** > **Project**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `.` (root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 3.2 Add Environment Variables
In Vercel Dashboard > Settings > Environment Variables:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://tssr-monitor-api.onrender.com/api` |
| `VITE_SUPABASE_URL` | `https://kszdatqbykpodxmnfzfg.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` (anon key) |

### 3.3 Deploy
Click **Deploy** and wait for build to complete.

### 3.4 Test Frontend
Open your Vercel URL (e.g., `https://tssr-monitor.vercel.app`)

---

## Step 4: Post-Deployment

### 4.1 Create Admin User
If default admin doesn't work, create via API:

```bash
# First login with default credentials
curl -X POST https://tssr-monitor-api.onrender.com/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}'
```

### 4.2 Import Data
You can import Excel data through the app or use the API.

### 4.3 Monitor
- **Render**: Check logs in Dashboard
- **Vercel**: Check Function logs
- **Supabase**: Check Database logs

---

## Troubleshooting

### CORS Issues
If you see CORS errors:
1. Check that Render backend has CORS enabled (it should)
2. Verify the API URL in Vercel env variables

### Database Connection Failed
1. Check Supabase credentials
2. Verify RLS policies allow service role access
3. Check Render logs for connection errors

### Login Not Working
1. Verify users table has data
2. Check password hash format (bcrypt)
3. Try creating new user via SQL

### API Returns 404
1. Check the endpoint path
2. Verify backend is running (check /api/health)
3. Check Render logs for errors

---

## Local Development

### Run Backend Locally
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

### Run Frontend Locally
```bash
npm install
npm run dev
```

---

## File Structure

```
tssr-app/
├── server/                 # Backend (Render)
│   ├── index.js           # Entry point
│   ├── package.json       # Dependencies
│   ├── routes/            # API routes
│   │   ├── auth.js
│   │   ├── sites.js
│   │   ├── stats.js
│   │   ├── users.js
│   │   ├── contractors.js
│   │   └── auditLogs.js
│   └── middleware/
│       └── auth.js        # JWT middleware
│
├── src/                    # Frontend (Vercel)
│   ├── services/
│   │   ├── api.js
│   │   └── apiClient.js
│   └── context/
│       └── AuthContext.jsx
│
├── render.yaml            # Render config
├── vercel.json            # Vercel config
├── .env.production        # Production env
└── DEPLOYMENT_GUIDE.md    # This file
```

---

## Security Checklist

- [ ] Change default admin password
- [ ] Use strong JWT_SECRET
- [ ] Keep SUPABASE_SERVICE_KEY secret
- [ ] Enable Supabase RLS
- [ ] Use HTTPS only
- [ ] Rotate keys periodically

---

## Support

For issues:
1. Check logs (Render/Vercel/Supabase)
2. Test API endpoints manually
3. Verify environment variables
4. Check network connectivity

---

**TSSR Monitor v2.0.0 - Cloud Edition**
