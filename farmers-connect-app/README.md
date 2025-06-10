# Farmers Connector App WPA

A mobile-first, AI-powered progressive web app for Zimbabwean farmers. Built with React, Tailwind CSS, Node.js/Express, and Firebase.

## Features
- Agri-eCommerce (buy/sell crops)
- AI Chatbot (advisory support)
- Smart farm management (weather, irrigation, satellite)
- Digital wallet, loans, insurance
- AI-powered learning feed
- Post-harvest tools
- Firebase Auth
- PWA support (installable)

## Getting Started

### 1. Clone the repo
```bash
git clone <repo-url>
cd farmers-connect-app-wpa
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up Firebase
- Create a Firebase project at [firebase.google.com](https://firebase.google.com/)
- Enable Auth, Firestore, and Storage
- Copy your config to `.env` (see `.env.example`)

### 4. Run the app locally
```bash
npm start
```

### 5. Run the backend API
```bash
cd api
npm install
node index.js
```

### 6. Deploy
- Deploy frontend to Vercel/Netlify
- Deploy backend API to Render/Heroku

## Folder Structure
```
farmers-connect-app-wpa/
├── api/                # Express backend (Node.js)
├── public/             # Static assets
├── src/
│   ├── assets/         # Images, icons, etc.
│   ├── components/     # Reusable React components
│   ├── context/        # React context providers
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Main app pages
│   ├── styles/         # Tailwind and custom CSS
│   ├── utils/          # Utility functions
│   ├── firebaseConfig.js
│   └── App.js
├── tailwind.config.js
├── package.json
└── README.md
```

## License
© 2024 Pique Squid Consultancy. All rights reserved. 