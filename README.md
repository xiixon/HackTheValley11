# MedModi - Your 24/7 Medical Assistant
Medmodi is a mobile application that helps users track the time and dosage of medications. Once the users enter the information of the medications they are taking, Medmodi will remind them to take the medication through push notifications on their logged-in devices. Medmodi also provides users with an interactive AI assistant that suggests personalized medications based on the symptoms or situations described, as well as users' health conditions.

# Prerequisites
- [Node.js](https://nodejs.org/) and npm
- A PostgreSQL database (our application uses a hosted [Neon](https://neon.tech/) database)
- [Expo Go](https://expo.dev/go) or a development build on a physical device (for receiving push notifications)

# Installation
To install Medmodi, clone the GitHub repo using [the link](https://github.com/xiixon/HackTheValley11.git).

## 1. Clone the repository

```bash
git clone https://github.com/xiixon/HackTheValley11.git
cd HackTheValley11
```

## 2. Set up the backend

```bash
cd apps/backend
npm install
```

## 3. Set up the database and create the Prisma client

```bash
npx prisma migrate deploy --config prisma7.config.ts
npx prisma generate --config prisma7.config.ts
```

Start the server:

```bash
npm run dev
```

## 4. Set up the mobile application

```bash
cd packages/apps/mobile
npm install
npx expo start
```

Scan the QR code with Expo Go on a mobile device. The mobile device and computer need to be connected to the same Wi-Fi network, and the app must point to your computer's local IP address to reach the backend.

## Contributors / Developers
Patrick Ng, Onyx Chavanond, Jason Yu, Jerry Yang
