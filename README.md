# Floor Management System

Floor Management System is a React + TypeScript client that lets Admins manage office floors/rooms and clients book meeting spaces. It follows the API contract defined in `API_INTEGRATION.md`, supports role-based access, and works even when offline thanks to IndexedDB caching and a custom sync queue.

---

## Table of Contents

1. [Features](#features)  
2. [Tech Stack](#tech-stack)  
3. [Getting Started](#getting-started)  
4. [Project Structure](#project-structure)  
5. [Functional Flow](#functional-flow)  
6. [Offline-First Architecture](#offline-first-architecture)  
7. [API Overview](#api-overview)  
8. [Development Notes](#development-notes)

---

## Features

- **Modern UI** built with React Router and Tailwind-styled components.  
- **Role-aware experience**  
  - **Admin**: manage floors/rooms, review bookings.  
  - **Client**: search availability, create/update/cancel own bookings.  
- **Floor & Room Management**  
  - Tabs for floors, cards for rooms, modal-driven CRUD.  
  - All data maps directly to backend endpoints described in `API_INTEGRATION.md`.  
- **Booking Workflow**  
  - Availability search, booking modal, “My Bookings” history.  
- **Offline operations**  
  - IndexedDB cache for floors/rooms.  
  - Persistent queue for Admin mutations performed offline.  
  - Automatic replay when the network returns; temp IDs replaced with server IDs.  
- **Reusable factories** for toasts, loaders, buttons, and modals.

---

## Tech Stack

| Layer      | Libraries / Tools                               |
|-----------|--------------------------------------------------|
| UI        | React 18, React Router v6, Tailwind CSS          |
| State     | Zustand (auth, booking, UI/toast stores)         |
| HTTP      | Axios + interceptors, centralized error handler  |
| Offline   | IndexedDB (native), OfflineQueueService, SyncService |
| Tooling   | TypeScript, Vite, ESLint                         |

---

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Configure environment**
   ```env
   VITE_API_BASE_URL=http://localhost:3000
   ```
3. **Run dev server**
   ```bash
   npm run dev
   ```
4. **Build / Preview**
   ```bash
   npm run build
   npm run preview
   ```

---

## Project Structure

```
src/
 ├─ api/                # HTTP services (Auth, Floor, Booking, etc.)
 ├─ components/         # Shared UI blocks (forms, modals, cards)
 ├─ pages/              # Route-level screens (Dashboard, Floors, etc.)
 ├─ services/           # IndexedDBService, OfflineQueueService, SyncService
 ├─ store/              # Zustand stores for auth, bookings, and UI
 ├─ utils/              # Route guards, helpers
 └─ factory/            # Toast, Modal, Loader, Button factories
```

---

## Functional Flow

### Authentication
- Login and Signup call `/api/v1/user/login` & `/api/v1/user/signup` (see `API_INTEGRATION.md`).  
- Backend sets an httpOnly cookie with `{ _id, email, role }`.  
- `authStore` persists the minimal user object; `ProtectedRoute` and `AdminRoute` enforce access.

### Booking
1. User searches availability (`POST /api/v1/availability/search`).  
2. Results populate `bookingStore.searchResults`.  
3. Booking modal submits `POST /api/v1/rooms/:roomId/bookings`.  
4. “My Bookings” screen uses the GET/PUT/DELETE booking endpoints for the authenticated user.

### Floor Management (Admin)
1. GET `/api/v1/floors` populates tabs.  
2. GET `/api/v1/floors/:floorId/rooms` loads cards per floor.  
3. Add/Edit/Delete actions invoke POST/PUT/DELETE room/floor APIs and refresh the list.  
4. UI never displays internal fields like `_id` or `created_by`, honoring the rules in `API_INTEGRATION.md`.

---

## Offline-First Architecture

| Component              | Responsibility |
|------------------------|----------------|
| `IndexedDBService`     | Initializes IndexedDB, stores floors/rooms/sync metadata, swaps temp IDs with real ones after sync. |
| `OfflineQueueService`  | Persists queued Admin operations in `localStorage`. Each entry stores `clientId`, `tempFloorId`, `tempRoomId`, and `floorId` so duplicates are suppressed and dependencies are tracked. |
| `SyncService`          | Listens for online/offline events, replays the queue FIFO, updates IndexedDB entries with real IDs, and refreshes data from the server. |

### Example Flow
1. **Offline create floor** → stored as `temp_floor_*` and queued.  
2. **Offline create room** referencing that temp floor → cached & queued with the temp ID.  
3. **Reconnect**:  
   - Floor operation runs, server returns real ID.  
   - IndexedDB replaces the temp floor, updates cached rooms, and rewrites queued room operations to the new floor ID.  
   - Room operation replays using the real floor ID; its temp row is replaced with the real room record.  
4. Queue entries are removed immediately after each execution (success or logged failure) so nothing replays later.

### Guarantees
- Queue deduplicates by `clientId`.  
- IndexedDB always reflects the latest backend response once sync completes.  
- Offline data survives reload; sync resumes automatically when a connection is restored.

---

## API Overview

All endpoints, payloads, and response shapes are documented in [`API_INTEGRATION.md`](API_INTEGRATION.md). Highlights:

| Area     | Endpoint                                   | Notes                 |
|----------|--------------------------------------------|-----------------------|
| Auth     | `POST /api/v1/user/login`, `POST /signup`  | Sets httpOnly cookies |
| Floors   | `GET /api/v1/floors`                       | Admin only            |
| Rooms    | `GET /api/v1/floors/:floorId/rooms`        | Admin only            |
| Rooms    | `POST /api/v1/floors/:floorId/rooms`       | Admin only            |
| Rooms    | `PUT /api/v1/rooms/:id`, `DELETE /rooms/:id` | Admin only         |
| Booking  | `POST /api/v1/rooms/:roomId/bookings`      | Clients               |
| Booking  | `GET/PUT/DELETE /api/v1/bookings/:id`      | Clients (own data)    |

All requests use snake_case fields and send credentials (`withCredentials: true`). Error handling follows the shared schema from `API_INTEGRATION.md`.

---

## Development Notes

- **Error Handling**: `errors/errorHandler.ts` normalizes Axios failures; 401 responses trigger a logout event caught in `App.tsx`.  
- **State Persistence**: `authStore` uses `zustand/persist`; booking + UI stores are session-only.  
- **Role Awareness**: Header hides Admin actions for non-admins; server-side auth must still enforce role checks.  
- **Offline Testing Tips**:  
  1. Simulate offline in DevTools.  
  2. Create floors/rooms → verify IndexedDB and queue contents.  
  3. Reload while offline → data remains thanks to IndexedDB.  
  4. Reconnect → queue flushes, IndexedDB rewrites temp IDs with real ones.

---

For endpoint-level details, payload examples, and UI mapping, refer to [`API_INTEGRATION.md`](API_INTEGRATION.md). PRs should keep both the README and API spec in sync as features evolve.