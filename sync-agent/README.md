# ZKTeco K40 Biometric Sync Agent

This local sync agent connects to a physical ZKTeco K40 fingerprint device via TCP socket (port 4370) and replicates scan events to the cloud Supabase database. It also contains a local HTTP simulation server on port 4371 for developer testing.

---

## Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher) installed on the local reception computer.

### Step-by-step Setup
1. Copy this `sync-agent/` directory to the local computer running inside the gym.
2. Open terminal/command prompt in the copied folder.
3. Install dependencies by running:
   ```bash
   npm install
   ```
4. Create your local configuration file by copying the template:
   ```bash
   copy .env.example .env
   ```
5. Open the `.env` file and configure:
   - `SUPABASE_URL`: Your cloud Supabase project URL.
   - `SUPABASE_KEY`: Your Supabase API Key.
   - `ZK_DEVICE_IP`: IP address of the K40 device on your local network (e.g. `192.168.1.201`).
   - `ZK_DEVICE_PORT`: Usually `4370`.
   - `ZK_SIMULATE`: Set to `false` for production hardware, or `true` for local mock simulation.

---

## Running the Agent

### Start the Agent
To start the synchronization daemon:
```bash
npm start
```

It will output:
- Whether it connected to Supabase and the K40 device successfully.
- Heartbeat confirmations (device online/offline statuses updated in Supabase).
- Live check-in scan notifications showing whether gym members are admitted or denied entry.

---

## Developer Simulation Mode (`ZK_SIMULATE=true`)

When simulation mode is active, the agent runs a local Express server on port `4371`. This is designed for development and testing in Bangalore, so you do not need the physical device.

### Simulate a Fingerprint Scan
Send a POST request to trigger a scan:
- **Endpoint**: `POST http://localhost:4371/simulate-scan`
- **Body** (JSON):
  ```json
  {
    "deviceUserId": 101
  }
  ```

This executes the identical database lookup, active plan validation, and check-in insert code paths as if a physical finger was placed on the K40.
