# Serveo Tunnel Setup — M3 Dashboard Frontend

## What it does
Creates a public URL for `localhost:5175` (Dashboard frontend) so other modules can access it via the internet (no same-WiFi needed).

## How to use
1. Start the frontend first: `npx vite --port 5175 --strictPort`
2. **Open a new terminal** and run:
   ```bash
   ssh -o ServerAliveInterval=60 -R 80:localhost:5175 serveo.net
   ```
3. You'll see output like:
   ```
   Forwarding HTTP traffic from https://RANDOM.serveo.net
   ```
4. **Copy that URL** (e.g. `https://xyz789.serveo.net`)
5. Update `../.env`:
   ```
   VITE_INVENTORY_URL=https://INVENTORY.serveo.net  ← M1 frontend URL
   VITE_POS_URL=https://POS.serveo.net              ← M2 frontend URL
   ```
6. Restart frontend if needed

## Windows
Run `start_serveo_tunnel.bat` (requires SSH — comes with Windows 10/11 or Git Bash).

## Important
- Each restart generates a **new random URL** → update `.env` again
- Keep the terminal window with serveo open while presenting
- SSH must be installed
