# Tunnel Setup for Remote Testing

## Method 1: Try ngrok again with clear cache
```bash
npm run start:tunnel -- --clear
```

## Method 2: Manual ngrok tunnel (if Method 1 fails)

### Step 1: Start Expo normally
In terminal 1:
```bash
npm start
```

### Step 2: Create ngrok tunnel in another terminal
In terminal 2:
```bash
ngrok http 8081
```

### Step 3: Update Expo config
Copy the ngrok URL (e.g., https://xxxx.ngrok.io) and tell your client to:
1. Open Expo Go
2. Enter URL manually in this format: `exp://xxxx.ngrok.io`

## Method 3: Use localtunnel (fastest alternative)

### Install localtunnel
```bash
npm install -g localtunnel
```

### Start Expo
```bash
npm start
```

### In another terminal, create tunnel
```bash
lt --port 8081 --subdomain zstmapp
```

The subdomain is optional but makes the URL memorable.

## Method 4: Create EAS Build (Most reliable for client testing)

Instead of using a tunnel, create a preview build that your client can install directly:

### For Android (APK)
```bash
npm run build:android:preview
```

### For iOS (requires Apple Developer account)
```bash
npm run build:ios:preview
```

After build completes, share the download link with your client.
They can install it directly on their device without Expo Go.

**Recommendation**: Method 4 (EAS Build) is the most professional and reliable way for client testing.
