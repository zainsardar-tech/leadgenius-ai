<div align="center">
   <img width="1200" height="475" alt="LeadGenius AI Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

   <h1>LeadGenius AI</h1>
   <p><strong>Advanced AI Lead Intelligence and Sales Strategy Assistant</strong></p>

   <p>
      Generate business strategy, discover high-potential leads, and create conversion-focused outreach templates
      using Google Gemini, Google Maps, and Google Search.
   </p>
</div>

## Overview

LeadGenius AI is a Next.js web application that helps sales teams, agencies, and founders move from planning to outreach in one workflow:

1. Define your business profile
2. Generate strategic analysis
3. Discover qualified leads in target geographies
4. Produce personalized outreach sequences
5. Build a final summary report with opportunity insights

The project was originally bootstrapped from Google AI Studio app tooling and extended into a complete, production-ready web app.

AI Studio app link: https://ai.studio/apps/89d36ffe-7764-40f5-90a1-99e40f6700ad

## Core Features

- Business profile intake with structured targeting inputs
- Magic Auto-Fill using Gemini to convert a plain-language description into form data
- AI strategy generation (business model, 30-day plan, 90-day scaling path)
- Lead discovery powered by Google Maps and Google Search tools
- Lead qualification labels (Hot/Warm/Cold) with in-app status tracking
- CSV export for downstream CRM workflows
- General and lead-specific outreach templates
- Final report generation with conversion and revenue potential framing
- Local browser API key storage flow for quick onboarding

## Tech Stack

- Next.js 15
- React 19 + TypeScript
- Google GenAI SDK (@google/genai)
- Tailwind CSS 4
- React Markdown + remark-gfm
- Lucide icons

## Project Structure

- app/page.tsx: Main application workflow UI and AI actions
- app/layout.tsx: Global layout and metadata
- app/globals.css: Global styles
- lib/utils.ts: Shared utility helpers
- hooks/use-mobile.ts: Responsive helper hook

## Getting Started

### Prerequisites

- Node.js 18+ (Node.js 20 LTS recommended)
- npm 9+
- A Google Gemini API key from Google AI Studio

### Quick Start

1. Clone the repository.
2. Install dependencies:

```bash
npm install
```

3. Create an environment file:

```bash
cp .env.example .env.local
```

4. Add your key in .env.local:

```env
NEXT_PUBLIC_GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

5. Start development server:

```bash
npm run dev
```

6. Open http://localhost:3000

You can also set the API key directly from the in-app Settings modal. The key is stored in browser localStorage for that browser profile.

## Available Scripts

- npm run dev: Start local development server
- npm run build: Build for production
- npm run start: Start production server
- npm run lint: Run ESLint
- npm run clean: Clean Next.js artifacts

## Environment Variables

- NEXT_PUBLIC_GEMINI_API_KEY: Gemini API key used by the frontend

Note: This app executes AI calls from the client. For strict enterprise security controls, route requests through a backend proxy and avoid exposing API keys to browser environments.

## Deployment

Deploy on Vercel (recommended) or any platform that supports Next.js.

Basic Vercel flow:

1. Import repository into Vercel
2. Set NEXT_PUBLIC_GEMINI_API_KEY in project environment variables
3. Deploy

## Documentation

- Installation guide: INSTALL.md
- User manual: USER_MANUAL.md
- Contribution guide and credits: CONTRIBUTING.md

## Credits

- Project contributor: Zain Sardar

## License

This repository currently does not define a root project license. Add a LICENSE file before public/commercial reuse.
