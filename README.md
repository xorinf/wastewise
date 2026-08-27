# WasteWise

Campus waste segregation app — MERN stack (MongoDB, Express, React, Node) + Tailwind.

> Built against the **Team 3 PRD**: item identification, bin suggestion, points/stats, pickup/supply requests, multi-campus support.

---

## Repo layout

```
wastewise/
  backend/    Express + MongoDB API (controllers per module, JWT auth, static category table)
  frontend/   Vite + React + Tailwind + Zustand + Axios
```

## Quick start

### 1. MongoDB (local)

The repo expects a plain, non-TLS mongod on `mongodb://127.0.0.1:27017`.

```bash
# if a system-managed mongod already runs (often with TLS or a replica set), stop it first:
brew services stop mongodb-community 2>/dev/null

mkdir -p .mongo-data
mongod --dbpath ./.mongo-data --port 27017 --bind_ip 127.0.0.1 \
       --logpath ./.mongo-data/mongod.log &

# leave the dev .env values, or set MONGO_URI in backend/.env
```

### 2. Backend

```bash
cd backend
cp .env.example .env             # edit if you have Cloudinary or vision model keys
npm install
npm run seed                     # creates admin/staff/user accounts + 1 campus
npm start                        # http://localhost:4000
```

Seed accounts (password = `password123`):

| Email                        | Role  |
|------------------------------|-------|
| admin@wastewise.local        | admin |
| staff@wastewise.local        | staff |
| user@wastewise.local         | user  |

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                     # http://localhost:5173 (proxies /api -> :4000)
```

---

## What's implemented (every PRD section)

| PRD § | Feature                          | Backend                                  | Frontend                          |
|------:|----------------------------------|------------------------------------------|-----------------------------------|
| A     | Upload image OR quick-select     | `POST /api/items/identify`, `/quick-select` | `pages/Identify.jsx`              |
| A     | Vision model fallback (low conf) | `itemId.controller.js → callVisionModel` (stub, lights up when `VISION_API_URL` is set) | `Identify.jsx` shows suggestion prompt |
| B     | Bin + one-line reason            | `utils/lookup.js → BIN_TABLE`            | `Identify.jsx` result card        |
| C     | Flat +10 points, kg estimate     | `DisposalLog`, `KG_PER_ITEM`             | `pages/History.jsx`               |
| D     | Pickup/supply + location         | `PickupRequest`, `modules/pickupRequests/` | `pages/Pickup.jsx`                |
| D     | Zone → staff auto-routing        | `pickupRequests.controller.js → assignStaff` | staff sees it in dashboard       |
| D     | Pending → Assigned → Resolved    | `PATCH /api/requests/:id/status`         | `pages/StaffDashboard.jsx`        |
| E     | Multi-campus linkage             | `User.campusIds[]`                       | `Nav.jsx` campus selector         |
| E     | Admin cross-campus aggregate     | `GET /api/staff/cross-campus`            | `pages/Admin.jsx`                 |

---

## Map of repo → PRD section

This helps the team split work cleanly. **Each section is owned by one teammate.**

| Section | Files |
|---|---|
| Auth (§A,B,C,E login flow) | `backend/src/modules/auth/*`, `frontend/src/pages/Login.jsx`, `frontend/src/store/authStore.js` |
| Item ID (§A,B,C) | `backend/src/modules/itemId/*`, `backend/src/utils/lookup.js`, `frontend/src/pages/Identify.jsx`, `frontend/src/pages/History.jsx`, `frontend/src/utils/lookups.js` |
| Pickup/Supply (§D) | `backend/src/modules/pickupRequests/*`, `frontend/src/pages/Pickup.jsx` |
| Staff dashboard (§D) | `backend/src/modules/staffDashboard/*`, `frontend/src/pages/StaffDashboard.jsx` |
| Campuses + admin (§E) | `backend/src/modules/campuses/*`, `frontend/src/pages/Admin.jsx` |
| Vision model call (§A) | `itemId.controller.js → callVisionModel()` |
| Cloudinary upload (§A) | `backend/src/config/cloudinary.js` |

---

## Optional integrations (zero-config fallbacks)

Both **Cloudinary** and the **vision model** are stubbed so the app boots and runs the full UX without keys.

| Env var | Effect |
|---|---|
| `CLOUDINARY_CLOUD_NAME` + `CLOUDINARY_API_KEY` + `CLOUDINARY_API_SECRET` | Image uploads actually go to Cloudinary. Without it, `/api/items/identify` still returns a response so the demo keeps working. |
| `VISION_PROVIDER=gemini` + `GEMINI_API_KEY` (+ optional `GEMINI_MODEL`, default `gemini-flash-latest`) | Gemini is called inline with the uploaded image; the model is prompted to return strict JSON `{name, category, confidence}`. Without these, the API falls back to the quick-select path with `lowConfidence: true`. |
| `VISION_PROVIDER=generic` + `VISION_API_URL` + `VISION_API_KEY` | Generic OpenAI-compatible endpoint accepting `{image}` and returning `{name, category, confidence}`. |

The expected vision response shape is `{ name, category, confidence }` where `category` is one of `wet_organic | dry_recyclable | hazardous_ewaste | reject_other`. The Gemini prompt asks for JSON only and the controller falls back to manual selection when `confidence < 0.6`.

> ⚠️ As of Aug 2026 the `gemini-flash-latest` alias returns 503 for image traffic. Pin `GEMINI_MODEL=gemini-3.6-flash` in `.env` to use the model currently serving image requests.

---

## API tour (curl)

```bash
# health
curl http://localhost:4000/api/health

# login
TOKEN=$(curl -s -XPOST http://localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@wastewise.local","password":"password123"}' | jq -r .token)

# quick-select grid (no auth)
curl http://localhost:4000/api/items/quick-select

# log a quick-select item
CAMPUS=$(curl -s http://localhost:4000/api/campuses | jq -r '.campuses[0]._id')
curl -XPOST http://localhost:4000/api/items/log \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d "{\"itemName\":\"Plastic bottle\",\"category\":\"dry_recyclable\",\"campusId\":\"$CAMPUS\",\"source\":\"quick_select\"}"

# my stats
curl -H "Authorization: Bearer $TOKEN" http://localhost:4000/api/items/stats

# raise a pickup request (auto-routes by zone)
curl -XPOST http://localhost:4000/api/requests \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d "{\"campusId\":\"$CAMPUS\",\"building\":\"Block A\",\"floor\":\"Ground\",\"binId\":\"A-G-01\",
       \"fillStatus\":\"overflowing\",\"requestType\":\"pickup\",\"quantity\":3}"
```

---

## Notes / known cuts

- The seed creates a fixed staff user who is mapped to `Block A` on `MAIN`. Real campus onboarding is admin-driven: `POST /api/campuses/:id/zone-staff`.
- Vision model is intentionally an opaque single call — swap the body of `callVisionModel()` in `itemId.controller.js` to point at your provider.
- Frontend uses Zustand for a single auth store. The rest of state is per-page `useState`.
- Tailwind theme is minimal + monochrome. Buttons, cards, fields, chips are defined under `@layer components` in `frontend/src/index.css`.

---

## License

Internal — Team 3 submission.
