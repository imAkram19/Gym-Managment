# Iron Gym Biometric Sync-Agent Production Deployment Guide

This guide details the steps to deploy, configure, and maintain the ZKTeco K40 Biometric Sync-Agent as a 24/7 production service on the Hyderabad reception Windows PC. 

The agent runs in the background, handles K40 device reconnects, gracefully handles internet drops, prevents duplicate instances, and automatically starts up after reboots or power outages.

---

## 📋 Production Deployment Checklist

Perform these steps in order to install and run the sync-agent under PM2.

### Step 1: Install Node.js
- Download and install Node.js (LTS version 18 or 20 recommended) from the official website: [nodejs.org](https://nodejs.org/).
- Alternatively, install via Windows Command Prompt (Administrator) using `winget`:
  ```powershell
  winget install OpenJS.NodeJS.LTS
  ```

### Step 2: Install Local Dependencies
Open PowerShell or Command Prompt, navigate to the `sync-agent` directory, and install dependencies:
```powershell
cd d:\Azhar\Code\Gym-Managment\sync-agent
npm install
```

### Step 3: Configure Environment Variables
Verify that the `d:\Azhar\Code\Gym-Managment\sync-agent\.env` file is present and properly configured:
```ini
SUPABASE_URL=https://mwftzqunwpdorbxbxhgi.supabase.co
SUPABASE_KEY=your-supabase-service-role-or-anon-key
ZK_DEVICE_IP=192.168.1.5
ZK_DEVICE_PORT=4370
ZK_SIMULATE=false
```

### Step 4: Install PM2 Globally
PM2 is our production process manager. Install it globally:
```powershell
npm install -g pm2
```

### Step 5: Start the Sync-Agent with PM2
Launch the sync-agent using the predefined ecosystem file:
```powershell
pm2 start ecosystem.config.js
```

### Step 6: Save the PM2 Process List
Save the active process list so it can be restored automatically:
```powershell
pm2 save
```

---

## 🚀 Configure Automatic Startup on Windows Boot

To ensure the sync-agent starts automatically when Windows starts (after reboots or power cuts) without requiring user login, configure **Windows Task Scheduler** (Recommended and most robust option for Windows).

### Method A: Windows Task Scheduler (Recommended)

1. Open **Task Scheduler** (type `taskschd.msc` in the Windows Start menu).
2. Click **Create Task...** on the right side panel.
3. In the **General** tab:
   - **Name**: `PM2 Startup Resurrect`
   - Select **Run whether user is logged on or not**.
   - Check **Run with highest privileges** (Administrator).
   - Configure for: **Windows 10** (or your current OS version).
4. In the **Triggers** tab:
   - Click **New...**
   - **Begin the task**: Select **At startup**.
   - Click **OK**.
5. In the **Actions** tab:
   - Click **New...**
   - **Action**: Select **Start a program**.
   - **Program/script**: Enter `cmd.exe`
   - **Add arguments**: Enter `/c pm2 resurrect`
   - Click **OK**.
6. In the **Settings** tab:
   - Uncheck **Stop the task if it runs longer than**. (We want it to run indefinitely).
7. Click **OK** and enter your Windows administrator credentials when prompted.

### Method B: Using `pm2-windows-startup` package
Alternatively, you can register PM2 as a startup trigger via npm:
1. Open Command Prompt / PowerShell as Administrator and run:
   ```powershell
   npm install -g pm2-windows-startup
   pm2-startup install
   ```
2. Save the current process list again to ensure it loads at boot:
   ```powershell
   pm2 save
   ```

---

## 📂 Logs & Diagnostics

The sync-agent keeps independent logs for operations and errors, located in the `logs/` directory:

- **Location**: `d:\Azhar\Code\Gym-Managment\sync-agent\logs\`
- **Application Log (`logs/application.log`)**: Stores startup, shutdown, K40 connection events, database sync jobs, and audit logs.
- **Error Log (`logs/errors.log`)**: Stores uncaught crashes and connection/network failures only, making it easy to isolate issues.

### Viewing Logs in Real-time
To watch the live log output from PM2:
```powershell
pm2 logs iron-gym-sync-agent
```

---

## 🛠️ Management Commands

| Action | Command | Description |
|---|---|---|
| **View Process Status** | `pm2 status` | Lists running applications and memory usage |
| **Restart Service** | `pm2 restart iron-gym-sync-agent` | Restarts the sync agent |
| **Stop Service** | `pm2 stop iron-gym-sync-agent` | Halts the background service |
| **Start Service** | `pm2 start iron-gym-sync-agent` | Starts the stopped service |
| **View PM2 Logs** | `pm2 logs iron-gym-sync-agent --lines 100` | Displays last 100 lines of console logs |

---

## 🔄 Update Procedure

If you update the sync-agent code in the future:
1. Stop the running service:
   ```powershell
   pm2 stop iron-gym-sync-agent
   ```
2. Apply changes (e.g. pull from git or replace files).
3. Install any new dependencies if `package.json` changed:
   ```powershell
   npm install
   ```
4. Restart and save:
   ```powershell
   pm2 start iron-gym-sync-agent
   pm2 save
   ```

---

## 🔍 Troubleshooting

### 1. K40 Device is marked "offline" in Supabase
- **Check physical connection**: Ensure the K40 ethernet cable is connected and the device shows a green light.
- **Check logs**: Open `logs/application.log` to see if connection retry requests are logged every 30 seconds.
- **Test IP Ping**: Run `ping 192.168.1.5` from Windows cmd to verify the PC can reach the device.

### 2. Supabase Connection Failures
- If reception internet goes down, the sync agent will log: `[Supabase Error] Network/Connection failure...` to `logs/errors.log`.
- **Automatic recovery**: The agent will not crash. Once internet is restored, it will automatically resume syncing and process any offline scans stored on the K40 memory.

### 3. Duplicate Instance Port Conflict
- The sync agent uses local port `4379` as a lock to prevent running multiple instances. If another instance is running, the agent logs `Port 4379 is already in use` and exits.
- **Fix**: Check `pm2 status` to see if `iron-gym-sync-agent` is already running. If it's running outside of PM2, terminate the stray Node processes.
