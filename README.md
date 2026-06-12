# 👑 Solar Samrat

**Where every dealer rules.** An open, India-first community super-app for the
solar trade — dealers, distributors, EPC/installers, brands and approved
customers. Three pillars: **Community feed + Q&A**, **Leads / RFQs**, and an
**AI solar quote tool** — wrapped in a royal **rank & Crowns** status system.

Standalone Expo (React Native) app. It talks to the **MuscleGrid CRM backend**,
which hosts the `/api/samrat/*` API and the founder's admin/approval console
(CRM → **Solar Samrat** tab at `/admin/solar-samrat`).

## Stack
- Expo SDK 54 / React Native 0.81 / expo-router (typed routes)
- TanStack Query, axios, expo-secure-store
- "Royal Dark" theme (`src/theme.ts`) — navy + gold
- Backend: FastAPI + MongoDB (the MuscleGrid CRM monolith)

## Run
```bash
npm install
npx expo start            # dev (Expo Go / dev client)
npm run typecheck         # tsc --noEmit
```
Override the API base for staging: `EXPO_PUBLIC_API_URL=https://… npx expo start`.

## Structure
```
app/
  (auth)/login.tsx        phone-OTP open signup
  apply.tsx               membership application + pending/rejected gate
  (tabs)/                 Feed · Leads · AI Quote · Rank · Profile
  new-post / new-lead / ask     create modals
  post/[id] · lead/[id] · question/[id]   detail screens
  qa.tsx · directory.tsx
src/
  api/        client, auth, samrat (all endpoints), types
  AuthContext.tsx · ui.tsx · theme.ts · config.ts
```

## Membership flow
1. Open signup (phone OTP) → 2. Apply (business + GSTIN) → 3. **Founder approves
in the CRM Solar Samrat tab** → 4. Verified member unlocks posting, leads,
ranks. Crowns are earned for verification, posts, answers, upvotes, best-answers
and lead responses; ranks climb **Sipahi → Sardar → Raja → Maharaja → Samrat**.

## Build / ship
`codemagic.yaml` mirrors the proven MuscleGrid pipeline (iOS→TestFlight,
Android APK/AAB). Before first build: create the App Store Connect + Google Play
records for `in.solarsamrat.app`, run `eas init` to fill `extra.eas.projectId`
in `app.json`, and set the Codemagic integrations named in the YAML header.

## Roadmap (post-MVP)
Phase 2 = transactional **marketplace** (orders + Razorpay escrow + commission),
then memberships, promoted listings/ads, financing, price index.
