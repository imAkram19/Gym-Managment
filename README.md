# Gym Management & Biometrics Access Control System

A complete, cloud-replicated Gym Management and Access Control System designed to replace ZKBio Time Cloud. The application manages member profiles, payment terms, subscription plans, and features automated membership expiry with a standalone sync agent for real-time ZKTeco K40 fingerprint hardware integration.

---

## 🏗️ System Architecture

The system utilizes a decoupled, cloud-synchronized architecture to allow remote monitoring, cloud hosting, and robust local operation:

```
+---------------------------+              +------------------------------+
|     ZKTeco K40 Device     |              |     Vite + React SPA App     |
|     (Local Gym Network)   |              |     (Cloud Hosted on Vercel) |
+-------------+-------------+              +--------------+---------------+
              |                                           |
    Port 4370 | TCP Socket                                | HTTPS API
              |                                           |
+-------------v-------------+              +--------------v---------------+
|    Local Sync Agent       |------------->|    Supabase Cloud Database   |
|   (Reception Node Daemon) |  HTTPS API   |  (PostgreSQL + RLS + RPC)    |
+---------------------------+              +------------------------------+
```

---

## 🛠️ Tech Stack
- **Frontend Dashboard**: React, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts.
- **Backend & Database**: Supabase (PostgreSQL), Row Level Security (RLS), Postgres Functions (Expiry Automation).
- **Biometric Integration**: Node.js standalone daemon, `node-zklib` TCP socket SDK, Express (Simulation endpoints).

---

## 📂 Project Structure
```
├── src/                      # Vite + React SPA Frontend
│   ├── components/           # Layouts and modal elements
│   ├── lib/                  # Supabase clients & api endpoints
│   ├── pages/                # Dashboard, Members, Payments, Biometrics, Attendance
│   └── types.ts              # TypeScript interfaces
├── sync-agent/               # Standalone Local Biometric Sync Agent
│   ├── index.js              # Sync Agent entry point (Production / Simulation)
│   ├── package.json          # Node dependencies
│   ├── .env.example          # Sample environment variables
│   └── README.md             # Sync Agent setup instructions
├── supabase/
│   └── migrations/           # Database migration files (Tables, Expiry functions)
└── package.json              # Frontend Vite app configuration
```

---

## 🚀 Getting Started

### 1. Database Setup
Ensure that you have applied the migrations inside the `supabase/migrations/` folder to your Supabase instance to create the biometric tables (`biometric_devices`, `biometric_enrollments`, `biometric_attendance_logs`) and the membership expiry automation function.

### 2. Frontend Development Server
To launch the gym management web dashboard locally:
```bash
# Install root dependencies
npm install

# Start Vite dev server (defaults to http://localhost:5173)
npm run dev
```

### 3. Running the Sync Agent in Simulation Mode
For Bangalore-based development (without access to the physical ZKTeco K40 device), the agent runs a local Express server on port `4371` to mock hardware scans:
```bash
# Navigate to agent directory
cd sync-agent

# Install dependencies
npm install

# Set ZK_SIMULATE=true in sync-agent/.env
# Start the simulation agent (defaults to port 4371)
npm start
```
Once active, you can use the **Attendance** screen on the frontend dashboard to select any enrolled member and click **Trigger Fingerprint Scan** to simulate a physical access event.

---

## 🔒 Security & Row Level Security (RLS)
RLS is enabled on all PostgreSQL tables. While public access policies are configured for Vite's client anonymous requests, the production `sync-agent/` should ideally use Supabase's `service_role` key inside its local `.env` configuration file to ensure administrative security and integrity.

---

## 🚀 Production Deployment to Hyderabad Gym
To deploy the biometric sync agent in Hyderabad:
1. Install Node.js on the gym's reception PC.
2. Copy the `sync-agent/` directory to the PC.
3. Configure `ZK_SIMULATE=false` in its `.env`.
4. Enter the real **K40 Static Local IP** (`ZK_DEVICE_IP`) and your cloud Supabase keys.
5. Deploy and persist the daemon process using **PM2**:
   ```bash
   npm install pm2 -g
   pm2 start index.js --name "zkteco-sync-agent"
   pm2 save
   ```
   
*Detailed go-live guidelines can be found in `C:/Users/PC/.gemini/antigravity-ide/brain/209674f6-9f8e-493a-b555-c2d955896f7b/go_live_checklist.md`.*
