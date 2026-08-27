# WasteWise

## 1. Project Objective / Problem Statement

Improper waste disposal on university and institutional campuses is a major barrier to sustainability. Campus community members frequently struggle to distinguish between organic, recyclable, hazardous, and non-recyclable items at the point of disposal. Unclear packaging, confusing bin labels, and a lack of real-time guidance lead to widespread missegregation.

When non-recyclable or food waste is thrown into recycling bins, entire batches of recyclable materials become contaminated and end up in landfills. Conversely, failing to compost organic waste increases methane emissions, while mismanaged hazardous e-waste leaks toxic materials into the environment. Furthermore, campus facilities staff often lack visibility into bin fill levels, leading to overflowing bins in high-traffic zones and inefficient pickup schedules.

**WasteWise** is designed to solve these challenges through an intelligent, campus-tailored waste segregation assistant. The platform provides immediate item classification and bin recommendations with clear explanations, gamifies responsible waste disposal through an interactive points system, and enables users to report overflowing bins or request supplies. By bridging the gap between individual actions and facilities management, WasteWise empowers campus communities to minimize waste contamination and improve recycling efficiency.

---

## 2. Proposed Solution

WasteWise delivers an end-to-end web platform that assists campus users with proper waste disposal while providing facilities staff and administrators with real-time operational oversight.

### User Disposal Flow

```
User → Identify/Upload Waste → Waste Classification → Bin Recommendation → Explanation → Points/Statistics
```

1. **Identify / Upload Waste**: The user captures/uploads a photo of a waste item or selects an item from a pre-configured quick-select grid.
2. **Waste Classification**: An optional AI vision model (Google Gemini or generic vision API) analyzes the uploaded image to identify the item and match it against campus waste rules.
3. **Bin Recommendation**: The application maps the identified item to one of four standardized campus bin streams (*Green*, *Blue*, *Red*, or *Black*).
4. **Explanation**: The user is presented with a clear, one-line explanation detailing why the item belongs in that specific bin.
5. **Points & Statistics**: Upon logging the disposal, the user earns **+10 points** and tracks their personal environmental impact (estimated kilograms of waste diverted from landfills).

### Staff & Admin Operational Workflow

- **Campus Staff**: Staff members access a dedicated Staff Dashboard where they view pending bin pickup and supply requests auto-routed to their designated building or zone. Staff can claim requests (`pending` → `assigned`) and mark them completed (`resolved`).
- **Campus Admin**: Administrators can register new campuses, configure zone-to-staff mappings, and review cross-campus aggregate metrics (total items logged, total kg diverted, and request breakdown per campus).

### Implementation State & System Modes

To ensure seamless demonstration and deployment, WasteWise clearly demarcates fully functional features, fallback behaviors, and optional external integrations:

- **Fully Implemented**: User authentication (JWT + bcrypt), Quick-select item lookup, static category-to-bin mapping with explanatory reasons, disposal logging, personal impact stats, pickup/supply request creation, building/zone auto-routing for staff, request status workflow, multi-campus linkage, staff dashboard, and administrative cross-campus analytics.
- **Fallback / Stub Behavior**:
  - *Cloudinary Uploads*: If Cloudinary credentials are not configured in environment variables, file upload processing safely falls back to local data URL handling without interrupting the user workflow.
  - *Vision Identification*: If no vision provider API key is configured or the vision model returns confidence below threshold (`< 0.6`), the backend gracefully flags `lowConfidence: true` and prompts the user to select the item from the quick-select grid.
- **External API Integrations**:
  - `VISION_PROVIDER=gemini` + `GEMINI_API_KEY`: Enables multimodal AI vision recognition using Google Gemini API (`gemini-flash-latest` or `gemini-3.6-flash`).
  - `VISION_PROVIDER=generic` + `VISION_API_URL` + `VISION_API_KEY`: Enables integration with any OpenAI-compatible vision endpoint.
  - `CLOUDINARY_CLOUD_NAME` + `CLOUDINARY_API_KEY` + `CLOUDINARY_API_SECRET`: Enables Cloudinary image storage for uploaded waste photos.

---

## 3. Key Features

| Feature | Description | Implementation Status |
| :--- | :--- | :--- |
| **Waste Item Identification** | Allows users to upload a photo of a waste item or choose from a pre-defined item grid. | Fully Implemented |
| **AI / Vision Classification** | Uses Gemini API / OpenAI-compatible endpoint to identify items from images with JSON response parsing and confidence scoring. | External API (with quick-select fallback) |
| **Waste Category Classification** | Categorizes items into 4 distinct streams: `wet_organic`, `dry_recyclable`, `hazardous_ewaste`, and `reject_other`. | Fully Implemented |
| **Bin & Reason Guidance** | Recommends the exact bin color (Green, Blue, Red, Black) alongside a human-readable educational explanation. | Fully Implemented |
| **Gamified Points System** | Awards flat +10 points per logged disposal to encourage active participation in campus waste segregation. | Fully Implemented |
| **Impact Statistics** | Calculates total items logged, estimated kilograms diverted from landfill, and total earned points. | Fully Implemented |
| **Disposal History Log** | Stores a full chronological history of user disposals with timestamps, category tags, bin colors, and points. | Fully Implemented |
| **Pickup & Supply Requests** | Enables users to report full/overflowing bins or request supplies (new bins, bin covers, bags/liners). | Fully Implemented |
| **Zone-Based Auto-Routing** | Automatically matches pickup request locations (building + floor) to registered campus staff members. | Fully Implemented |
| **Request Status Tracking** | Tracks request status progression across three stages: `pending` → `assigned` → `resolved`. | Fully Implemented |
| **Multi-Campus Support** | Allows users to link to multiple campuses and toggle their active campus via top navigation dropdown. | Fully Implemented |
| **Staff Operations Dashboard** | Provides campus staff with open request lists, request filters by fill status/type, status toggle buttons, and recent disposal logs. | Fully Implemented |
| **Admin & Cross-Campus Analytics**| Enables admins to create new campuses, map zone staff, and view aggregated cross-campus disposal and request statistics. | Fully Implemented |
| **Role-Based Access Control** | Secures API endpoints and frontend navigation based on user roles (`user`, `staff`, `admin`) using JWT middleware. | Fully Implemented |

---

## 4. Technologies Used

| Technology | Purpose |
| :--- | :--- |
| **MongoDB** | NoSQL document database used for persistent storage of users, campuses, disposal logs, and pickup requests. |
| **Mongoose (v8)** | Object Data Modeling (ODM) library for MongoDB schema creation, relationship management, and aggregation queries. |
| **Express.js (v4)** | Server-side web framework for Node.js handling REST API routing, authentication middleware, and error handling. |
| **Node.js (v18+)** | JavaScript runtime environment executing backend server operations. |
| **React (v18)** | Frontend UI library for building interactive single-page application components. |
| **Vite (v5)** | High-performance frontend build tool and local development server. |
| **Tailwind CSS (v3)** | Utility-first CSS framework with custom component layers for styled buttons, cards, forms, and badges. |
| **Zustand (v5)** | State management store managing global authentication session tokens, user profiles, and active campus selection. |
| **Axios (v1)** | Promise-based HTTP client for API communication, configured with interceptors for JWT token injection. |
| **React Router DOM (v6)** | Client-side routing library managing navigation across application pages and protected routes. |
| **JSON Web Token (JWT)** | Secure token-based authentication mechanism for verifying user identities across client-server calls. |
| **bcryptjs (v2)** | Password hashing algorithm securing user credentials before storing in MongoDB. |
| **Multer (v2)** | Middleware handling `multipart/form-data` uploads for waste photo submission. |
| **Cloudinary SDK (v2)** | Cloud image storage integration for uploaded waste photos (with graceful base64 fallback). |
| **Google Gemini API** | Multimodal AI vision provider used for automated waste item identification from uploaded images. |

---

## 5. Implementation Details

### System Architecture

The following diagram illustrates the data flow between the user client, React frontend, Express API backend, MongoDB database, and optional external services:

```
┌─────────────────────────────────────────────────────────┐
│                      User Interface                     │
│               React 18 SPA (Vite + Tailwind)            │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼ Axios HTTP (Bearer Token)
┌─────────────────────────────────────────────────────────┐
│                   Express.js REST API                   │
│          Authentication, Routing & Controllers           │
└──────────────┬───────────────────────────┬──────────────┘
               │                           │
               ▼ Mongoose                  ▼ Fetch HTTP
┌────────────────────────────┐  ┌─────────────────────────┐
│      MongoDB Database      │  ┌  External Vision API /  │
│ Users, Campuses, Logs, Req │  │  Cloudinary Storage    │
└────────────────────────────┘  └─────────────────────────┘
```

### Frontend

- **Structure**: Built as a SPA using Vite, React 18, and `react-router-dom` v6.
- **Pages & Components**:
  - `Login.jsx`: Handles user login and signup with client-side role toggle and demo account quick-fill options.
  - `Home.jsx`: Main dashboard presenting primary action cards and navigation links.
  - `Identify.jsx`: Waste identification interface supporting file upload and quick-select item grid.
  - `Pickup.jsx`: Form for submitting bin pickup/supply requests with datalist auto-suggestions for buildings, floors, and bin IDs.
  - `History.jsx`: Personal impact dashboard displaying logged items, calculated kg diverted, total points, and historical disposal log list.
  - `StaffDashboard.jsx`: Staff operations view featuring request metrics cards, interactive request status toggles (`pending` → `assigned` → `resolved`), and recent campus disposals.
  - `Admin.jsx`: Admin panel for creating new campus entries and inspecting cross-campus aggregate metrics.
  - `Nav.jsx`: Header component with active tab highlighting, multi-campus dropdown switcher, user role indicator, and logout action.
- **State Management**: Zustand store (`store/authStore.js`) manages JWT session token, user details, and active `selectedCampusId`, persisting state across page reloads via `localStorage`.
- **API Communication**: Centralized Axios client (`api/client.js`) configured with a base URL of `/api` and a request interceptor that dynamically injects `Authorization: Bearer <token>`.
- **Styling**: Vanilla Tailwind CSS augmented with custom component utilities defined in `@layer components` inside `index.css` (`.btn`, `.field`, `.card`, `.label`, `.chip`).
- **Authentication Handling**: `RequireAuth` higher-order route wrapper checks Zustand auth state and automatically redirects unauthenticated users to `/login`.

### Backend

- **Express Server**: `server.js` initializes CORS, JSON body parsing (2MB limit), Morgan HTTP logging, database connection, and custom error middleware.
- **Modules & Routes**:
  - `/api/auth` (`modules/auth`): Handles user signup, login, current profile verification (`/me`), and campus linking.
  - `/api/items` (`modules/itemId`): Manages quick-select list retrieval, photo identification, disposal logging, history listing, and aggregate stats.
  - `/api/requests` (`modules/pickupRequests`): Handles pickup/supply request creation, listing, individual lookup, and status updates.
  - `/api/campuses` (`modules/campuses`): Supports campus listing, creation, bin registration, and zone-staff mapping.
  - `/api/staff` (`modules/staffDashboard`): Provides staff metrics aggregations and cross-campus administrative statistics.
- **Models**:
  - `User.js`: Schema storing user name, lowercase unique email, hashed password, role (`user`, `staff`, `admin`), linked campus ObjectIds, points balance, and items logged count.
  - `Campus.js`: Schema storing campus name, uppercase code, `bins` array (`building`, `floor`, `binId`), and `zoneStaff` array (`building`, `floor`, `staffUserIds[]`).
  - `DisposalLog.js`: Schema recording user reference, campus reference, item name, category enum, bin color, points earned (default 10), estimated kg diverted, image URL, and source (`upload` or `quick_select`).
  - `PickupRequest.js`: Schema storing reporter reference, campus reference, location (`building`, `floor`, `binId`), fill status (`full`, `nearly_full`, `overflowing`), request type (`pickup`, `new_bin`, `bin_cover`, `bags_liners`), quantity, optional note, assigned staff user, request status (`pending`, `assigned`, `resolved`), and resolution timestamp.

### Waste Identification Flow

1. **Upload Request**: The user submits a photo file via `POST /api/items/identify` using `multipart/form-data` alongside the selected `campusId`.
2. **Image Processing**: Multer captures the file buffer in memory. `uploadImage()` in `config/cloudinary.js` uploads the image to Cloudinary if keys are present; otherwise, it returns a safe data URI fallback.
3. **Vision Model Dispatcher**: `callVisionModel()` evaluates `VISION_PROVIDER`:
   - If set to `gemini`, it sends the base64 image data to Google Gemini API (`GEMINI_MODEL` or default `gemini-flash-latest`) using a strict prompt enforcing JSON response `{ name, category, confidence }`.
   - If set to `generic`, it sends the image URL to an OpenAI-compatible endpoint.
4. **Confidence Thresholding**:
   - If confidence is **$\ge 0.6$**, the backend returns the identified `itemName`, category, bin color, explanation reason, points (+10), and estimated kg.
   - If confidence is **$< 0.6$** or no vision provider is configured, the backend returns `lowConfidence: true` with a message instructing the user to choose an item from the quick-select grid.
5. **Quick-Select Flow**: When a user selects an item from the grid, the app invokes `POST /api/items/log` directly, bypassing the vision API while applying the same category bin mapping, points, and kg calculations.

### Waste Categories

WasteWise implements 4 standardized waste streams defined in `utils/lookup.js`:

| Category Enum | Bin Color | Stream Label | Explanation / Reason | Estimated Weight |
| :--- | :--- | :--- | :--- | :--- |
| `wet_organic` | **Green** | Wet Waste | Food scraps decompose naturally and become compost | 0.15 kg / item |
| `dry_recyclable` | **Blue** | Dry Recyclables | It is a clean recyclable that can be reprocessed | 0.05 kg / item |
| `hazardous_ewaste` | **Red** | Hazardous / E-waste | It contains chemicals or metals that must be disposed of safely | 0.30 kg / item |
| `reject_other` | **Black** | General / Reject | It does not belong in the recycling or organic streams | 0.10 kg / item |

### Points and Statistics

- **Points Allocation**: Every logged waste disposal awards a flat **+10 points**. The backend updates the user's profile atomically using Mongoose `$inc` (`points: 10`, `itemsLogged: 1`).
- **Landfill Diversion Estimation**: Weight diverted is calculated dynamically based on the category weight coefficient (`KG_PER_ITEM`).
- **User Impact Aggregation**: The `GET /api/items/stats` endpoint runs a Mongoose aggregation pipeline over the user's `DisposalLog` entries:
  ```javascript
  [
    { $match: { userId: req.user._id } },
    { $group: { _id: null, total: { $sum: 1 }, kg: { $sum: '$estimatedKg' } } }
  ]
  ```

### Authentication and Roles

System access is secured using JWT authentication with three distinct role levels:

1. **`user`**: Standard student or campus resident.
   - Access to waste identification, disposal logging, personal impact stats, pickup request creation, and campus linking.
2. **`staff`**: Campus facilities or logistics personnel.
   - Access to all user features plus the **Staff Dashboard** (`/staff`).
   - View open requests mapped to their assigned campus/zone.
   - Self-assign open requests (`pending` → `assigned`) and mark completed requests (`resolved`).
   - Monitor recent campus disposals.
3. **`admin`**: Campus sustainability administrator.
   - Access to all user and staff features plus the **Admin Panel** (`/admin`).
   - Create new campus profiles and define building/floor bins.
   - Map staff members to specific campus zones.
   - View cross-campus aggregate statistics (total items logged, kg diverted, and open request metrics).

### Campus and Pickup Management

- **Campus Setup**: Campuses contain registered bin locations (`building`, `floor`, `binId`) and zone staff mappings (`zoneStaff`).
- **Pickup Request Creation**: Users select campus, building, floor, bin ID, fill status (`full`, `nearly_full`, `overflowing`), request type (`pickup`, `new_bin`, `bin_cover`, `bags_liners`), quantity, and optional note.
- **Zone Auto-Routing**: When a request is created, the backend executes `assignStaff()`:
  1. Searches `zoneStaff` for an exact match on `building` and `floor`.
  2. Falls back to matching any staff assigned to the `building`.
  3. Falls back to matching any staff registered on the `campus`.
  4. If staff is found, `assignedTo` is populated and status is set to `assigned`; otherwise, status defaults to `pending`.
- **Status Workflow**: Staff update request status via `PATCH /api/requests/:id/status`. Resolving a request automatically records a `resolvedAt` timestamp.

---

## 6. Future Scope

The following features represent realistic potential enhancements based on the current WasteWise codebase:

- **Advanced Object Detection**: Upgrading the vision pipeline to support multi-item recognition with bounding box annotations using fine-tuned campus waste vision models.
- **Real-Time Staff Notifications**: Implementing WebSockets (Socket.io) or Server-Sent Events (SSE) to notify on-duty staff instantly when a bin reaches `overflowing` status.
- **Campus Leaderboards & Reward Redemption**: Introduces campus-wide public leaderboards, dormitory competitions, and point redemption for campus bookstore or cafeteria vouchers.
- **IoT Smart Bin Integration**: Connecting fill-level ultrasonic sensors and physical QR codes on campus bins to automate pickup triggering without requiring manual user reports.
- **Native Mobile Application**: Building a cross-platform mobile application using React Native or PWA capabilities for offline photo capture and push notifications.
- **Enhanced Environmental Modeling**: Expanding impact calculations to estimate saved water, reduced carbon dioxide equivalent ($CO_2e$) emissions, and energy savings.
- **Automated Collection Route Optimization**: Providing staff with optimized daily bin collection routes based on real-time fill levels across campus buildings.

---

## 7. References / Bibliography

- **React Documentation**: [https://react.dev](https://react.dev)
- **Node.js Documentation**: [https://nodejs.org](https://nodejs.org)
- **Express.js Documentation**: [https://expressjs.com](https://expressjs.com)
- **MongoDB Documentation**: [https://www.mongodb.com/docs/](https://www.mongodb.com/docs/)
- **Mongoose ODM Documentation**: [https://mongoosejs.com](https://mongoosejs.com)
- **Tailwind CSS Documentation**: [https://tailwindcss.com](https://tailwindcss.com)
- **Vite Documentation**: [https://vitejs.dev](https://vitejs.dev)
- **Zustand Documentation**: [https://github.com/pmndrs/zustand](https://github.com/pmndrs/zustand)
- **Axios HTTP Client**: [https://axios-http.com](https://axios-http.com)
- **JSON Web Token (JWT) Specification**: [https://jwt.io](https://jwt.io)
- **Cloudinary Documentation**: [https://cloudinary.com/documentation](https://cloudinary.com/documentation)
- **Google Gemini API Documentation**: [https://ai.google.dev](https://ai.google.dev)

---

## 8. Project Structure

```
wastewise/
├── backend/
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── server.js
│       ├── config/
│       │   ├── db.js
│       │   └── cloudinary.js
│       ├── middleware/
│       │   └── auth.js
│       ├── models/
│       │   ├── User.js
│       │   ├── Campus.js
│       │   ├── DisposalLog.js
│       │   └── PickupRequest.js
│       ├── modules/
│       │   ├── auth/
│       │   │   ├── auth.controller.js
│       │   │   └── auth.routes.js
│       │   ├── campuses/
│       │   │   ├── campuses.controller.js
│       │   │   └── campuses.routes.js
│       │   ├── itemId/
│       │   │   ├── itemId.controller.js
│       │   │   ├── itemId.routes.js
│       │   │   └── upload.js
│       │   ├── pickupRequests/
│       │   │   ├── pickupRequests.controller.js
│       │   │   └── pickupRequests.routes.js
│       │   └── staffDashboard/
│       │       ├── staffDashboard.controller.js
│       │       └── staffDashboard.routes.js
│       └── utils/
│           ├── asyncHandler.js
│           ├── lookup.js
│           └── seed.js
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── index.css
│       ├── api/
│       │   └── client.js
│       ├── components/
│       │   └── Nav.jsx
│       ├── pages/
│       │   ├── Admin.jsx
│       │   ├── History.jsx
│       │   ├── Home.jsx
│       │   ├── Identify.jsx
│       │   ├── Login.jsx
│       │   ├── Pickup.jsx
│       │   └── StaffDashboard.jsx
│       ├── store/
│       │   └── authStore.js
│       └── utils/
│           └── lookups.js
└── README.md
```

---

## 9. Getting Started

### Prerequisites

Ensure you have the following installed on your development machine:
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)
- **MongoDB** (running locally on `mongodb://127.0.0.1:27017` or a remote MongoDB Atlas URI)

### 1. Database Setup

Ensure a local MongoDB server instance is running on port `27017`:

```bash
mongod --dbpath ./.mongo-data --port 27017 --bind_ip 127.0.0.1
```

### 2. Backend Setup

Navigate to the `backend` directory and configure environment variables:

```bash
cd backend
cp .env.example .env
```

Environment variables configuration (`backend/.env`):

```env
MONGO_URI=mongodb://127.0.0.1:27017/wastewise
JWT_SECRET=your-secure-jwt-secret-key
JWT_EXPIRES_IN=7d
PORT=4000
CLIENT_ORIGIN=http://localhost:5173

# Optional: Cloudinary configuration
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Optional: AI Vision provider configuration
VISION_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-3.6-flash
```

Install backend dependencies:

```bash
npm install
```

Seed initial database records (creates demo users and `MAIN` campus):

```bash
npm run seed
```

Start the backend server:

```bash
npm run dev
# Server running at http://localhost:4000
```

#### Pre-seeded Demo Accounts

| Email | Password | Role | Mapped Campus / Zone |
| :--- | :--- | :--- | :--- |
| `admin@wastewise.local` | `password123` | `admin` | Main Campus (`MAIN`) |
| `staff@wastewise.local` | `password123` | `staff` | Main Campus (`MAIN`) - Block A |
| `user@wastewise.local` | `password123` | `user` | Main Campus (`MAIN`) |

### 3. Frontend Setup

In a separate terminal, navigate to the `frontend` directory:

```bash
cd frontend
npm install
```

Start the Vite development server:

```bash
npm run dev
# Frontend running at http://localhost:5173
```

Open `http://localhost:5173` in your browser and sign in using any of the demo accounts listed above.

---

## 10. Conclusion

**WasteWise** transforms campus waste management by converting passive disposal into an engaging, educated, and operational workflow. By combining intelligent item classification, clear bin guidance, gamified incentives, and automated facilities request routing, WasteWise empowers university communities to drastically reduce waste contamination at the source. Its flexible architecture enables immediate zero-config deployment while allowing seamless integration with modern AI vision models and facilities logistics platforms, paving the way for smarter, cleaner, and more sustainable campuses.
