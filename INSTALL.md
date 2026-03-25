# Installation Guide

This guide explains how to install and run LeadGenius AI locally in a reliable way.

## 1. Requirements

- Node.js 18 or newer (Node.js 20 LTS recommended)
- npm 9 or newer
- A Google Gemini API key from Google AI Studio

Get API key: https://aistudio.google.com/app/apikey

## 2. Clone and Install

```bash
git clone <your-repo-url>
cd leadgenius-ai
npm install
```

## 3. Configure Environment

Create an environment file:

```bash
cp .env.example .env.local
```

Set your API key in .env.local:

```env
NEXT_PUBLIC_GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

## 4. Start the App

```bash
npm run dev
```

Open in browser:

- http://localhost:3000

## 5. Build for Production

```bash
npm run build
npm run start
```

## 6. Quality Checks

```bash
npm run lint
```

## 7. Troubleshooting

- API key errors
  - Ensure NEXT_PUBLIC_GEMINI_API_KEY is set correctly.
  - Or open app Settings and save key there.
- Port already in use
  - Stop process on port 3000, or run with a custom port.
- Rate limit/quota messages
  - Wait and retry, or review Gemini API quota in Google AI Studio.

## 8. Security Note

The default setup runs AI requests from the browser. For higher security, use a backend API route as a proxy so keys are not exposed in client-side contexts.