# Floor Management System

Floor Management System is a React + TypeScript client that lets Admins manage office floors/rooms and clients book meeting spaces. It follows the API contract defined in `API_INTEGRATION.md`, supports role-based access, and works even when offline thanks to IndexedDB caching and a custom sync queue.

---

**🚀 Live Demo:** [Insert Frontend URL Here](https://fpmsfrontend2.vercel.app/)  
**🔗 Backend Repository:** [Insert Backend Repo Link Here](https://github.com/HariNarayan04/MoveInSync_Backend)

---

## Table of Contents

1. [Features](#features)  
2. [Technologies Used](#technologies-used)  
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
  - **Admin**: manage floors, rooms and all bookings.  
  - **Client**: search availability, create/update/cancel own bookings.  
- **Floor & Room Management**  
  - Tabs for floors, cards for rooms, modal-driven CRUD.
  - Only Admin can view layout and make changes to floor plan(floor/room).  
- **Booking Workflow**  
  - 1. Availability search based on room capacity, time slot and features like projector/whiteboard.
  - 2. Choose the right room and proceed with booking.
  - 3. Manage your booking in "My Bookings" in the navigation bar.
- **Offline operations**  
  - IndexedDB cache for floors/rooms.  
  - Persistent queue for Admin mutations performed offline.  
  - Automatic replay when the network returns; temp IDs replaced with server IDs

---

## Technologies Used

### Frontend
* **React (Vite):** Utilized for building a fast, interactive, and highly performant user interface.
* **TypeScript:** Used for static typing to ensure code reliability, better developer experience, and fewer runtime errors.
* **Tailwind CSS:** A utility-first CSS framework used for rapid and responsive UI styling.
* **Context API:** Utilized for global state management across the application without prop drilling.

### Backend
* **Node.js:** Runtime environment for executing JavaScript on the server side.
* **Express.js:** A minimal and flexible Node.js web application framework used for handling API routes.

### Database
* **MongoDB:** NoSQL database used for flexible and scalable data storage.
* **Mongoose:** ODM (Object Data Modeling) library used to model application data and interact with MongoDB.

### DevOps & Deployment
* **Vercel:** Used to deploy and host the client-side (Frontend) application.
* **Render:** Used to host the server-side (Backend) API.
* **Git/GitHub:** Version control and source code management.

---

## Getting Started

### Frontend

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

### Backend

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Configure environment**
   ```env
    PORT=8080
    MONGO_URI=mongodb://localhost:27017/FPMS
    JWT_SECRET=your_jwt_secret_here
    CLIENT_URL=your_frontend_url_here
    NODE_ENV=development
   ```
3. **Run dev server**
   ```bash
   npm run dev
   ```
4. **Build / Preview**
   ```bash
    npm start
   ```

---

## Project Structure

### Frontend

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

### Backend

```
src/
 ├─ controllers/       # Request handlers (availability, booking, floor, room, user)
 ├─ middlewares/       # auth, logger, error handler
 ├─ models/            # Mongoose schemas
 ├─ routes/            # Express routes
 ├─ utils/             # DB connection, auth helpers
 ├─ logs/              # runtime logs
 ├─ index.js           # app entrypoint
 .env.example
 package.json
 ```

---

## Functional Flow

### Authentication
1. Login and Signup required as initial step, it sets user accessiblility depending on role. 
2. Login persists using JWT token in cookies.
3. `authStore` persists the minimal user object; `ProtectedRoute` and `AdminRoute` enforce access.
Note : Admin cannot be created directly from fronted for security reasons, you need to manually set admin role in DB.

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
| Rooms    | `PUT /api/v1/rooms/:id`, `DELETE /rooms/:id` | Admin only          |
| Booking  | `POST /api/v1/rooms/:roomId/bookings`      | Clients               |
| Booking  | `GET/PUT/DELETE /api/v1/bookings/:id`      | Clients (own data)    |

All requests use snake_case fields and send credentials (`withCredentials: true`). Error handling follows the shared schema from `API_INTEGRATION.md`.

---