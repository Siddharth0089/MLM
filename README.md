# ✨ Full-Stack Multilingual Meeting Platform ✨

![Demo App](/frontend/public/screenshot-for-readme.png)

## ✨ Features

- 🎥 **1-on-1 Video Interview Rooms** - Powered by Stream.io
- 📝 **Real-Time Collaborative Notes** - CRDT-based with automatic translation
- 🗣️ **Live Multilingual Captions** - Speech-to-text with instant translation
- 🌍 **Fully Localized UI** - Available in multiple languages (English, Hindi, French, Spanish)
- 📧 **Automated Email Minutes** - Sends translated meeting notes to all participants
- 💬 **Real-time Chat** - Integrated messaging during meetings
- 🔐 **Authentication** - Secure auth via Clerk
- 🧭 **Dashboard** - Track meetings with live stats
- 🔊 **Mic & Camera Toggle, Screen Sharing & Recording**

---

## 🏗️ Architecture

### Backend
- **Node.js + Express** - REST API
- **Socket.IO** - Real-time WebSocket events for notes and captions
- **MongoDB** - Data persistence (users, meetings, notes, captions, translations)
- **Lingo.dev** - Translation and speech-to-text APIs
- **Nodemailer** - Email delivery for meeting minutes

### Frontend
- **React + Vite** - Modern SPA with hot reload
- **i18next** - Internationalization framework
- **Quill** - Rich text editor for collaborative notes
- **Yjs** - CRDT for conflict-free collaborative editing
- **Socket.IO Client** - Real-time communication with backend
- **Stream.io** - Video/audio calling and chat
- **Clerk** - User authentication

---

## 🧪 Environment Setup

### Backend (`/backend/.env`)

```bash
# Server
PORT=3000
NODE_ENV=development

# Database
DB_URL=mongodb://localhost:27017/meeting-platform

# Stream.io (Video/Chat)
STREAM_API_KEY=your_stream_api_key
STREAM_API_SECRET=your_stream_api_secret

# Clerk Auth
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Client URL
CLIENT_URL=http://localhost:5173

# Lingo.dev API (Translation & STT)
LINGO_API_KEY=your_lingo_api_key
LINGO_API_URL=https://api.lingo.dev
LINGO_STT_WS_ENDPOINT=wss://stt.lingo.dev

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_app_password
SMTP_FROM="Meeting Platform" <noreply@meetingplatform.com>

# Translation Settings
NOTES_AUTO_TRANSLATE_INTERVAL_SECONDS=3
CAPTION_CHUNK_MS=250
MAX_TRANSLATION_BATCH_SIZE=5
```

### Frontend (`/frontend/.env`)

```bash
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_API_URL=http://localhost:3000/api
VITE_STREAM_API_KEY=your_stream_api_key
```

---

## 🔧 Run the Application

### Backend

```bash
cd backend
npm install
npm run dev
```

Backend will start on `http://localhost:3000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend will start on `http://localhost:5173`

---

## 🌍 Supported Languages

- 🇺🇸 English (en-US)
- 🇮🇳 हिंदी / Hindi (hi-IN)
- 🇫🇷 Français / French (fr-FR)
- 🇪🇸 Español / Spanish (es-ES)

> **Note**: To add more languages, create translation files in `/frontend/src/i18n/locales` and update the language switcher.

---

## 📡 API Endpoints

### Meetings

- `GET /api/meetings/:id/notes?language=<lang-code>` - Get meeting notes in specific language
- `POST /api/meetings/:id/notes/translate` - Translate notes on demand
- `POST /api/meetings/:id/end` - End meeting and send email minutes
- `PATCH /api/meetings/:id/settings` - Update translation/caption settings

### Users

- `PATCH /api/users/language` - Update user language preference
- `GET /api/users/me?userId=<clerk-id>` - Get user profile

---

## 🔌 WebSocket Events

### Client → Server

- `meeting:join` - Join a meeting with language preference
- `note:update` - Send note updates (triggers translation)
- `note:yjs-sync` - Yjs CRDT binary updates
- `caption:send` - Send caption text (if client-side STT)
- `audio:chunk` - Stream audio for server-side STT
- `meeting:end` - End meeting

### Server → Client

- `participant:joined` - New participant joined
- `note:yjs-update` - Broadcast Yjs updates to other clients
- `note:translated` - Translated note content
- `caption:incoming` - Live caption with translations
- `meeting:ended` - Meeting has ended

---

## 🎯 How It Works

### Real-Time Collaborative Notes

1. User types in meeting notes using Quill editor
2. Changes synced via Yjs CRDT (conflict-free)
3. Backend detects note updates via Socket.IO
4. Backend calls Lingo.dev to translate to all participant languages
5. Translated notes broadcast to each participant in their preferred language

### Live Multilingual Captions

1. Client captures audio from Stream.io video call
2. Audio chunks streamed to backend via WebSocket
3. Backend sends audio to Lingo.dev STT API
4. Transcript translated to all participant languages
5. Captions broadcast to clients and displayed in user's language

### Email Meeting Minutes

1. Host clicks "End Meeting" button
2. Backend compiles final notes and translations
3. Email service sends personalized minutes to each participant in their language
4. All participants receive email within 1 minute

---

## 📚 Project Structure

```
├── backend/
│   ├── src/
│   │   ├── models/          # MongoDB schemas
│   │   ├── services/        # Business logic (lingo, email, notes, captions)
│   │   ├── sockets/         # Socket.IO event handlers
│   │   ├── routes/          # REST API endpoints
│   │   └── server.js        # Express + Socket.IO initialization
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── meeting/     # MeetingNotesPanel, CaptionOverlay
│   │   ├── i18n/            # Internationalization configs
│   │   │   └── locales/     # Translation files (en, hi, fr, es)
│   │   ├── hooks/           # Custom React hooks
│   │   ├── pages/           # SessionPage, DashboardPage
│   │   └── main.jsx
│   └── package.json
│
└── README.md
```

---

## 🧩 Key Technologies

| Technology     | Purpose                          |
|----------------|----------------------------------|
| **Express**    | REST API server                  |
| **Socket.IO**  | Real-time WebSocket events       |
| **MongoDB**    | Database (meetings, notes, etc.) |
| **Yjs**        | CRDT for collaborative editing   |
| **Quill**      | Rich text editor                 |
| **i18next**    | UI internationalization          |
| **Lingo.dev**  | Translation & speech-to-text     |
| **Nodemailer** | Email delivery                   |
| **Stream.io**  | Video/voice calling              |
| **Clerk**      | Authentication                   |

---

## 🚀 Deployment

See [implementation_plan.md](implementation_plan.md) for detailed deployment instructions.

---

## 📝 Development Notes

### Lingo.dev Integration

The `lingo.service.js` file contains placeholder implementation for Lingo.dev APIs. You need to:

1. Review [Lingo.dev API documentation](https://lingo.dev/docs)
2. Update endpoint URLs in `lingo.service.js`
3. Adjust request/response formats to match their API
4. Test translation and STT endpoints

### Adding New Languages

1. Create new translation file: `frontend/src/i18n/locales/<lang-code>.json`
2. Add language to `frontend/src/i18n/config.js`:
   ```js
   const resources = {
     "en-US": { translation: en },
     "new-LANG": { translation: newLang },
   };
   ```
3. Add to LanguageSwitcher component
4. Update email templates in `backend/src/services/email.service.js`

---

## 🤝 Contributing

Contributions are welcome! Please ensure all new features include:
- Proper internationalization (i18n keys)
- Backend API endpoints if needed
- Socket.IO event handlers for real-time features
- Documentation updates

---

## 📄 License

MIT

---

**Built with ❤️ for global collaboration**
