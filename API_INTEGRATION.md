# Floor Management API Summary

Condensed reference for all endpoints consumed by the Floor Management System. See git history for the previous long-form version if you need exhaustive examples.

---

## 1. Base Config & Conventions
- **Base URL**: `VITE_API_BASE_URL` (default `http://localhost:3000`)
- **Auth**: httpOnly cookie storing `{ _id, email, role }`
- **Headers**: `Content-Type: application/json`
- **Credentials**: Requests always send `withCredentials: true`
- **Naming**: Use snake_case when talking to the backend (`room_id`, `start_time`, etc.)
- **UI Rule**: Never render internal IDs (`_id`, `room_id`, `created_by`)

---

## 2. Authentication

| Endpoint | Purpose | Notes |
|----------|---------|-------|
| `POST /api/v1/user/login` | Login + set cookie | Body `{ email, password }`. On success update `authStore` and redirect to `/dashboard`. Handle 401/500 with toasts. |
| `POST /api/v1/user/signup` | Create account + set cookie | Body `{ name, email, password }`. Same post-success flow as login. |
| Logout | Client-side only | Clear cookies + `authStore.logout()`. No API call. |

`httpClient` intercepts 401 responses → emits `auth:unauthorized` → `App.tsx` logs the user out.

---

## 3. Availability & Booking

### 3.1 Availability Search
`POST /api/v1/availability/search`

```ts
{
  capacity: number;
  features?: string[];
  windowStart: string; // ISO 8601
  windowEnd: string;   // ISO 8601
}
```

Response rooms (internal `roomId`) populate `bookingStore.searchResults` and render as `RoomCard`s.

### 3.2 Booking CRUD

| Endpoint | Usage | Key Fields / Behavior |
|----------|-------|-----------------------|
| `POST /api/v1/rooms/:roomId/bookings` | Create booking | UI adds `room_id` + `created_by` automatically. |
| `GET /api/v1/bookings/:userId` | List user bookings | Render room name, description, formatted times. |
| `PUT /api/v1/bookings/:id` | Update booking | Send only changed fields (`description`, `start_time`, `end_time`). |
| `DELETE /api/v1/bookings/:id` | Cancel booking | Confirm before calling; remove from list afterward. |

Errors: `400` validation, `403` unauthorized, `409` conflict (overlapping booking).

---

## 4. Floor & Room Management (Admin)

| Method & Endpoint | Purpose | Notes |
|-------------------|---------|-------|
| `GET /api/v1/floors` | Fetch all floors | Feed tabs; auto-select first floor. |
| `POST /api/v1/floors` | Create floor | Payload `{ floorName, floorNumber, floorDescription?, rooms?[] }`. |
| `GET /api/v1/floors/:floorId/rooms` | Rooms per floor | Render cards with name/capacity/features only. |
| `POST /api/v1/floors/:floorId/rooms` | Create room | Payload `{ floor_id, name, capacity, features[] }`. |
| `PUT /api/v1/rooms/:id` | Update room | Send partial fields (`name`, `capacity`, `features`). |
| `DELETE /api/v1/rooms/:id` | Delete room | Backend should block deletes if room has active bookings. |

All endpoints require Admin cookie; UI hides them for Clients but backend must enforce role.

---

## 5. Offline & Sync Expectations

1. `IndexedDBService` seeds floors/rooms when online and replaces temporary IDs with real IDs after sync.
2. `OfflineQueueService` stores Admin mutations in `localStorage` (each entry has `clientId`, optional `tempFloorId`/`tempRoomId`, and tracked `floorId`).
3. `SyncService` listens for online events, replays queued operations FIFO, rewrites cached/queued records with server IDs, and finally refreshes floors/rooms from the backend.
4. `public/service-worker.js` caches the SPA shell so the installed PWA can boot offline; once loaded, IndexedDB persists between sessions.

Server requirements: expose HTTPS endpoint, allow credentials via CORS, and set cookies with `SameSite=None; Secure` so Vercel deployments can authenticate.

---

## 6. Error Schema & Status Codes

```ts
{
  success: false;
  code?: string;
  message: string;
  details?: any;
}
```

Codes in use: `200/201/204` success, `400` bad request, `401` unauthenticated, `403` forbidden, `404` not found, `409` conflict, `500` server error.

---

## 7. Environment & Field Mapping

```env
VITE_API_BASE_URL=http://localhost:3000
```

Production value should be HTTPS and allow credentials.

- Requests send snake_case (`room_id`, `start_time`, `created_by`).
- Responses may return snake_case (`room_name`, `createdAt`). UI converts to human-readable text and never surfaces internal identifiers.

---

## 8. Endpoint Matrix (Quick Reference)

| Area | Method | Endpoint | Auth | Admin |
|------|--------|----------|------|-------|
| Auth | POST | `/api/v1/user/login` | No | No |
| Auth | POST | `/api/v1/user/signup` | No | No |
| Availability | POST | `/api/v1/availability/search` | Yes | No |
| Booking | POST | `/api/v1/rooms/:roomId/bookings` | Yes | No |
| Booking | GET | `/api/v1/bookings/:userId` | Yes | No |
| Booking | PUT | `/api/v1/bookings/:id` | Yes | No |
| Booking | DELETE | `/api/v1/bookings/:id` | Yes | No |
| Floors | GET | `/api/v1/floors` | Yes | **Yes** |
| Floors | POST | `/api/v1/floors` | Yes | **Yes** |
| Rooms | GET | `/api/v1/floors/:floorId/rooms` | Yes | **Yes** |
| Rooms | POST | `/api/v1/floors/:floorId/rooms` | Yes | **Yes** |
| Rooms | PUT | `/api/v1/rooms/:id` | Yes | **Yes** |
| Rooms | DELETE | `/api/v1/rooms/:id` | Yes | **Yes** |

---

Keep this summary in sync with backend updates. When new endpoints or fields appear, extend the relevant table or section.

