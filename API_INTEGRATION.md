# API Integration Documentation

This document provides a comprehensive overview of all API calls made by the Floor Client application, including request payloads, expected responses, and how the data is used in the application.

---

## Base Configuration

- **Base URL**: Configured via `VITE_API_BASE_URL` environment variable (default: `http://localhost:3000`)
- **Authentication**: HTTP-only cookies containing `{_id, email, role}`
- **Request Headers**: `Content-Type: application/json`
- **Credentials**: `withCredentials: true` (to send cookies)

---

## ⚠️ Important Rules

1. **UI MUST NEVER display MongoDB fields**: `_id`, `room_id`, `created_by` - use them only for API calls
2. **Cookie contains**: `_id`, `email`, `role` - set by backend on login/signup
3. **Logout has NO API call** - manually clear cookie + Zustand store client-side
4. **Use snake_case** for all API fields: `room_id`, `created_by`, `start_time`, `end_time`

---

## Authentication APIs

### 1. **POST /api/v1/user/login**

**Purpose**: Authenticate user and establish session

**Called From**:
- [src/components/auth/LoginForm.tsx](src/components/auth/LoginForm.tsx)
- `authService.login()`

**Request Payload**:
```typescript
{
  email: string;      // User's email address
  password: string;   // User's password
}
```

**Example Request**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Expected Response** (200 OK):
```typescript
{
  success: boolean;
  message: string;
}
```

**Example Response**:
```json
{
  "success": true,
  "message": "Login successful"
}
```

**What Happens With Response**:
1. Backend sets httpOnly cookie with user data: `{_id, email, role}`
2. Frontend extracts user info from cookie (if needed for display)
3. User data is stored in Zustand `authStore`:
   - `userId`: from cookie._id
   - `email`: from cookie.email
   - `isLoggedIn`: true
4. User is redirected to `/dashboard`
5. Success toast is shown

**Error Handling**:
- 401: Invalid credentials → Toast "Invalid email or password"
- 500: Server error → Toast "Server error. Please try again later."
- Network error → Toast "Network error. Please check your connection."

---

### 2. **POST /api/v1/user/signup**

**Purpose**: Create new user account and establish session

**Called From**:
- [src/components/auth/RegisterForm.tsx](src/components/auth/RegisterForm.tsx)
- `authService.register()`

**Request Payload**:
```typescript
{
  name: string;       // User's full name
  email: string;      // User's email address
  password: string;   // User's password
}
```

**Example Request**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Expected Response** (201 Created):
```typescript
{
  success: boolean;
  message: string;
}
```

**Example Response**:
```json
{
  "success": true,
  "message": "Signup successful"
}
```

**What Happens With Response**:
1. Backend sets httpOnly cookie with created user: `{_id, email, role}`
2. User data is stored in Zustand `authStore`
3. User is redirected to `/dashboard`
4. Success toast is shown

**Error Handling**:
- 409: User already exists → Toast "An account with this email already exists."
- 400: Validation error → Toast error message

---

### 3. **Logout (Client-Side Only)**

**Purpose**: End user session

**Called From**:
- [src/components/layout/Header.tsx](src/components/layout/Header.tsx)
- `authService.logout()`

**Implementation**: NO API CALL

**Client-Side Actions**:
```javascript
// Clear cookie
document.cookie = "_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
document.cookie = "email=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
document.cookie = "role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

// Clear Zustand store
authStore.logout();

// Redirect to login
navigate('/login');
```

**What Happens**:
1. Cookies are cleared client-side
2. Zustand `authStore` is cleared:
   - All user data set to null
   - `isLoggedIn`: false
3. User is redirected to `/login`
4. Success toast is shown

---

## Availability Search API

### 4. **POST /api/v1/availability/search**

**Purpose**: Search for available rooms based on capacity, features, and time window

**Called From**:
- [src/components/availability/AvailabilitySearchForm.tsx](src/components/availability/AvailabilitySearchForm.tsx)
- `bookingService.searchAvailability()`

**Request Payload**:
```typescript
{
  capacity: number;           // Required capacity
  features: string[];         // Selected features: ["whiteboard", "wifi", "projector"]
  windowStart: string;        // ISO 8601 datetime - search window start
  windowEnd: string;          // ISO 8601 datetime - search window end
}
```

**Example Request**:
```json
{
  "capacity": 10,
  "features": ["whiteboard", "wifi", "projector"],
  "windowStart": "2025-11-24T09:00:00Z",
  "windowEnd": "2025-11-24T17:00:00Z"
}
```

**Expected Response** (200 OK):
```typescript
{
  success: boolean;
  data: Array<{
    roomId: string;          // ⚠️ INTERNAL - Do NOT display in UI
    name: string;            // Display this
    description: string;     // Display this
    capacity: number;        // Display this
    features: string[];      // Display this
    availableSlots: Array<{
      start: string;         // ISO 8601 datetime
      end: string;           // ISO 8601 datetime
    }>;
  }>;
}
```

**Example Response**:
```json
{
  "success": true,
  "data": [
    {
      "roomId": "657g12ab...",
      "name": "Conference Room A",
      "description": "Large meeting room with video conferencing",
      "capacity": 12,
      "features": ["whiteboard", "wifi"],
      "availableSlots": [
        {
          "start": "2025-11-24T09:00:00Z",
          "end": "2025-11-24T10:00:00Z"
        },
        {
          "start": "2025-11-24T14:00:00Z",
          "end": "2025-11-24T15:00:00Z"
        }
      ]
    }
  ]
}
```

**What Happens With Response**:
1. Results are stored in Zustand `bookingStore.searchResults`
2. Search params are stored in `bookingStore.searchParams`
3. Results are displayed in `AvailableRoomsList` component
4. Each room is rendered as a `RoomCard`
5. Success toast shows: "Found X available rooms"

**UI Display** (What to Show):
- ✅ Room name
- ✅ Description
- ✅ Capacity
- ✅ Features
- ❌ **DO NOT show**: `roomId` (internal use only)

**What to Do With `roomId`**:
- Store it in component state
- Use it when creating booking (POST /api/v1/rooms/:roomId/bookings)

**Error Handling**:
- 400: Invalid params → Toast error
- 404: No rooms found → Empty state displayed

---

## Booking Management APIs

### 5. **POST /api/v1/rooms/:roomId/bookings**

**Purpose**: Create a new booking for a room

**Called From**:
- [src/components/bookings/BookingModal.tsx](src/components/bookings/BookingModal.tsx)
- `bookingService.createBooking()`

**URL Parameter**:
- `:roomId` - The room ID from search results (internal, not displayed)

**Request Payload**:
```typescript
{
  room_id: string;        // ⚠️ Internal - same as :roomId in URL
  created_by: string;     // ⚠️ Internal - user ID from cookie._id
  description: string;    // Booking description/title
  start_time: string;     // ISO 8601 datetime
  end_time: string;       // ISO 8601 datetime
}
```

**Example Request**:
```json
{
  "room_id": "657g12ab...",
  "created_by": "user-id-here",
  "description": "Project meeting",
  "start_time": "2025-11-24T10:00:00Z",
  "end_time": "2025-11-24T11:00:00Z"
}
```

**Expected Response** (201 Created):
```typescript
{
  success: boolean;
  message: string;
}
```

**Example Response**:
```json
{
  "success": true,
  "message": "Booking created successfully"
}
```

**What Happens With Response**:
1. Booking modal closes
2. Success toast: "Booking created successfully!"
3. User can navigate to "My Bookings" to see the new booking

**UI Considerations**:
- User only enters: `description`, `start_time`, `end_time`
- Frontend automatically adds: `room_id` (from selected room), `created_by` (from auth cookie)
- Frontend NEVER displays: `room_id`, `created_by`, `_id`

**Error Handling**:
- 409: Booking conflict → Toast "This time slot conflicts with an existing booking."
- 400: Invalid time → Toast with specific error
- 403: Unauthorized → Toast error

---

### 6. **GET /api/v1/bookings/:userId**

**Purpose**: Get all bookings for a specific user

**Called From**:
- [src/components/bookings/BookingList.tsx](src/components/bookings/BookingList.tsx)
- `bookingService.getBookingsByUser()`

**URL Parameter**:
- `:userId` - User ID from cookie._id

**Request Payload**: None

**Expected Response** (200 OK):
```typescript
{
  success: boolean;
  data: Array<{
    id: string;            // ⚠️ INTERNAL - Booking ID, do NOT display
    room_name: string;     // Display this
    description: string;   // Display this
    start_time: string;    // Display this (format: "MMM dd, yyyy - h:mm a")
    end_time: string;      // Display this
  }>;
}
```

**Example Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "booking-id-here",
      "room_name": "Conference Room A",
      "description": "Project meeting",
      "start_time": "2025-11-24T10:00:00Z",
      "end_time": "2025-11-24T11:00:00Z"
    }
  ]
}
```

**What Happens With Response**:
1. Bookings are stored in local component state
2. Each booking is displayed as a card showing:
   - Room name
   - Description
   - Start time (formatted as "MMM dd, yyyy - h:mm a")
   - End time (formatted as "MMM dd, yyyy - h:mm a")
   - Edit and Cancel buttons

**UI Display** (What to Show):
- ✅ Room name
- ✅ Description
- ✅ Start time (formatted)
- ✅ End time (formatted)
- ❌ **DO NOT show**: `id`, `_id`, `room_id`, `created_by`

**What to Do With `id`**:
- Store it in component state
- Use it for Edit (PUT /api/v1/bookings/:id)
- Use it for Cancel (DELETE /api/v1/bookings/:id)

**Empty State**:
- Show empty state if no bookings

---

### 7. **PUT /api/v1/bookings/:id**

**Purpose**: Update an existing booking

**Called From**:
- [src/components/bookings/EditBookingModal.tsx](src/components/bookings/EditBookingModal.tsx)
- `bookingService.updateBooking()`

**URL Parameter**:
- `:id` - Booking ID (internal)

**Request Payload** (can send full object or only changed fields):

**Option 1: Full update**
```typescript
{
  description: string;
  start_time: string;
  end_time: string;
}
```

**Option 2: Partial update (only changed fields)**
```typescript
{
  description?: string;
  start_time?: string;
  end_time?: string;
}
```

**Example Request (Full)**:
```json
{
  "description": "Updated meeting",
  "start_time": "2025-11-24T10:30:00Z",
  "end_time": "2025-11-24T11:30:00Z"
}
```

**Example Request (Partial)**:
```json
{
  "description": "Updated meeting"
}
```

**Expected Response** (200 OK):
```typescript
{
  success: boolean;
  message: string;
}
```

**Example Response**:
```json
{
  "success": true,
  "message": "Booking updated successfully"
}
```

**What Happens With Response**:
1. Modal closes
2. Success toast: "Booking updated successfully!"
3. Booking list is refreshed via `onSuccess` callback
4. Updated booking appears in the list

**Error Handling**:
- 404: Booking not found
- 409: Update causes conflict
- 403: User not authorized to edit this booking

---

### 8. **DELETE /api/v1/bookings/:id**

**Purpose**: Cancel/delete a booking

**Called From**:
- [src/components/bookings/BookingList.tsx](src/components/bookings/BookingList.tsx)
- `bookingService.cancelBooking()`

**URL Parameter**:
- `:id` - Booking ID (internal)

**Request Payload**: None (empty body)

**Expected Response** (200 OK):
```typescript
{
  success: boolean;
  message: string;
}
```

**Example Response**:
```json
{
  "success": true,
  "message": "Booking cancelled successfully"
}
```

**What Happens With Response**:
1. Success toast: "Booking cancelled successfully"
2. Booking list is refreshed
3. Cancelled booking is removed from the list

**User Confirmation**:
- Before calling API, user is prompted: "Are you sure you want to cancel this booking?"

---

## Error Response Format

All API errors should follow this format:

```typescript
{
  success: false;
  code?: string;       // Optional error code
  message: string;     // Human-readable error message
  details?: any;       // Optional: additional error details
}
```

**Example Error Response**:
```json
{
  "success": false,
  "code": "BOOKING_CONFLICT",
  "message": "This time slot conflicts with an existing booking.",
  "details": {
    "conflictingBookingId": "booking-456",
    "conflictingTimeSlot": {
      "start": "2025-11-24T09:00:00Z",
      "end": "2025-11-24T10:00:00Z"
    }
  }
}
```

---

## HTTP Status Codes Used

- **200 OK**: Successful GET, PUT, DELETE
- **201 Created**: Successful POST (resource created)
- **204 No Content**: Successful DELETE (no response body)
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Not authenticated or session expired
- **403 Forbidden**: Authenticated but not authorized
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource conflict (e.g., booking overlap)
- **500 Internal Server Error**: Server error

---

## Authentication Flow

1. **User logs in** → Backend sets httpOnly cookie `{_id, email, role}`
2. **All subsequent requests** include cookie automatically (withCredentials: true)
3. **Session expires/401 received** →
   - `httpClient` intercepts 401 response
   - Fires custom event `auth:unauthorized`
   - App.tsx listens and calls `logout()`
   - Cookies cleared client-side
   - User redirected to `/login`
   - Session cleared from Zustand store

---

## State Management Summary

### Zustand Stores

**authStore**:
- Stores: userId, email, name, isLoggedIn
- Updated by: Login, Signup APIs
- Persisted in localStorage

**bookingStore**:
- Stores: searchResults, searchParams, selectedRoom
- Updated by: Availability Search API
- Not persisted (session only)

**uiStore**:
- Stores: toasts, modal state, loading state
- Not persisted (session only)

---

## Data Flow Examples

### Login Flow
```
User enters credentials
  ↓
LoginForm calls authService.login()
  ↓
POST /api/v1/user/login
  ↓
Backend returns success + sets cookie {_id, email, role}
  ↓
authStore.login(user) updates state
  ↓
Navigate to /dashboard
  ↓
Show success toast
```

### Signup Flow
```
User enters name, email, password
  ↓
RegisterForm calls authService.register()
  ↓
POST /api/v1/user/signup
  ↓
Backend returns success + sets cookie {_id, email, role}
  ↓
authStore.login(user) updates state
  ↓
Navigate to /dashboard
  ↓
Show success toast
```

### Logout Flow
```
User clicks "Logout"
  ↓
authService.logout() (client-side only)
  ↓
Clear cookies manually
  ↓
authStore.logout() clears state
  ↓
Navigate to /login
  ↓
Show success toast
```

### Search & Book Flow
```
User fills search form
  ↓
POST /api/v1/availability/search
  ↓
bookingStore.setSearchResults(results)
  ↓
RoomCards displayed (roomId hidden)
  ↓
User clicks "Book Now"
  ↓
BookingModal opens
  ↓
User fills description, start_time, end_time
  ↓
Frontend adds room_id (from selected room) + created_by (from cookie)
  ↓
POST /api/v1/rooms/:roomId/bookings
  ↓
Success → Close modal + show toast
```

### View Bookings Flow
```
Navigate to /my-bookings
  ↓
GET /api/v1/bookings/:userId (userId from cookie._id)
  ↓
Display BookingList
  ↓
User clicks "Edit"
  ↓
EditBookingModal opens (booking.id stored but not shown)
  ↓
User modifies description/times
  ↓
PUT /api/v1/bookings/:id
  ↓
Refresh bookings list
```

### Cancel Booking Flow
```
User clicks "Cancel Booking"
  ↓
Confirmation: "Are you sure?"
  ↓
User confirms
  ↓
DELETE /api/v1/bookings/:id (id from booking, not shown to user)
  ↓
Success → Refresh list + show toast
```

---

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_API_BASE_URL=http://localhost:3000
```

For production:
```env
VITE_API_BASE_URL=https://api.yourproduction.com
```

---

## Field Mapping: Frontend ↔ Backend

### What Frontend Sends (snake_case):
```javascript
{
  room_id: "...",      // NOT roomId
  created_by: "...",   // NOT createdBy
  start_time: "...",   // NOT startTime
  end_time: "..."      // NOT endTime
}
```

### What Frontend Receives (snake_case):
```javascript
{
  room_name: "...",    // NOT roomName
  start_time: "...",   // NOT startTime
  end_time: "..."      // NOT endTime
}
```

### What UI Displays:
- ✅ Room name
- ✅ Description
- ✅ Start time (formatted)
- ✅ End time (formatted)
- ✅ Capacity
- ✅ Features

### What UI NEVER Displays:
- ❌ `_id`
- ❌ `roomId` or `room_id`
- ❌ `created_by`
- ❌ `id` (booking ID)

---

## Notes for Backend Implementation

1. **httpOnly Cookies**: Must be set with `httpOnly`, `secure` (in production), and `sameSite` flags
2. **Cookie Contents**: `{_id, email, role}` - nothing more
3. **CORS**: Must allow credentials and specify allowed origins
4. **Date Formats**: Use ISO 8601 format for all date/time fields
5. **Validation**: Validate all incoming data and return appropriate error codes
6. **Authorization**: Check user ownership for booking operations (compare `created_by` with cookie._id)
7. **Conflict Detection**: Implement proper booking conflict detection for overlapping times
8. **Field Names**: Use snake_case: `room_id`, `created_by`, `start_time`, `end_time`, `room_name`

---

## Cookie Handling

### Backend Sets Cookie (Login/Signup):
```javascript
res.cookie('auth', {
  _id: user._id,
  email: user.email,
  role: user.role
}, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
});
```

### Frontend Clears Cookie (Logout):
```javascript
document.cookie = "_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
document.cookie = "email=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
document.cookie = "role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
```

---

---

## Floor Management APIs (Admin Only)

### 9. **GET /api/v1/floors**

**Purpose**: Get all available floors

**Called From**:
- [src/pages/FloorsPage.tsx](src/pages/FloorsPage.tsx)
- `floorService.getAllFloors()`

**Authorization**: Admin role required

**Request Payload**: None

**Expected Response** (200 OK):
```typescript
{
  success: boolean;
  data: Array<{
    id: string;          // Floor ID (internal)
    name: string;        // Display
    description: string; // Display
  }>;
}
```

**Example Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "floor-1",
      "name": "Ground Floor",
      "description": "Main floor with reception and common areas"
    },
    {
      "id": "floor-2",
      "name": "First Floor",
      "description": "Meeting rooms and collaborative spaces"
    }
  ]
}
```

**What Happens With Response**:
1. Floors are displayed as tabs for selection
2. First floor is auto-selected
3. User clicks a floor to view its rooms

---

### 10. **GET /api/v1/floors/:floorId/rooms**

**Purpose**: Get all rooms for a specific floor

**Called From**:
- [src/pages/FloorsPage.tsx](src/pages/FloorsPage.tsx)
- `floorService.getRoomsByFloorId()`

**URL Parameter**:
- `:floorId` - Floor ID (internal)

**Authorization**: Admin role required

**Request Payload**: None

**Expected Response** (200 OK):
```typescript
{
  success: boolean;
  data: Array<{
    id: string;          // ⚠️ INTERNAL - Room _id, do NOT display
    floor_id: string;    // ⚠️ INTERNAL - Floor _id, do NOT display
    name: string;        // Display this
    capacity: number;    // Display this
    features: string[];  // Display this: ['wifi', 'whiteboard', 'projector']
    created_by: string;  // ⚠️ INTERNAL - do NOT display
    updated_by: string;  // ⚠️ INTERNAL - do NOT display
    createdAt: string;   // Optional display
    updatedAt: string;   // Optional display
  }>;
}
```

**Example Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "room-abc123",
      "floor_id": "floor-1",
      "name": "Conference Room A",
      "capacity": 12,
      "features": ["wifi", "whiteboard", "projector"],
      "created_by": "admin-id-here",
      "updated_by": "admin-id-here",
      "createdAt": "2025-11-20T10:00:00Z",
      "updatedAt": "2025-11-20T10:00:00Z"
    }
  ]
}
```

**What Happens With Response**:
1. Rooms are displayed as cards
2. Each card shows: name, capacity, features
3. Each card has Edit and Delete buttons
4. Internal fields (`id`, `floor_id`, `created_by`, `updated_by`) are NOT displayed

**UI Display** (What to Show):
- ✅ Room name
- ✅ Capacity
- ✅ Features (as badges)
- ❌ **DO NOT show**: `id`, `floor_id`, `created_by`, `updated_by`

---

### 11. **POST /api/v1/floors/:floorId/rooms**

**Purpose**: Create a new room for a floor

**Called From**:
- [src/components/floors/AddFloorRoomModal.tsx](src/components/floors/AddFloorRoomModal.tsx)
- `floorService.createFloorRoom()`

**URL Parameter**:
- `:floorId` - Floor ID where the room will be created

**Authorization**: Admin role required

**Request Payload**:
```typescript
{
  floor_id: string;    // Same as :floorId in URL
  name: string;
  capacity: number;
  features: string[];  // Array: ['wifi', 'whiteboard', 'projector']
}
```

**Example Request**:
```json
{
  "floor_id": "floor-1",
  "name": "Conference Room A",
  "capacity": 12,
  "features": ["wifi", "whiteboard", "projector"]
}
```

**Expected Response** (201 Created):
```typescript
{
  success: boolean;
  message: string;
  data?: {
    id: string;
    floor_id: string;
    name: string;
    capacity: number;
    features: string[];
  };
}
```

**Example Response**:
```json
{
  "success": true,
  "message": "Room created successfully",
  "data": {
    "id": "room-abc123",
    "floor_id": "floor-1",
    "name": "Conference Room A",
    "capacity": 12,
    "features": ["wifi", "whiteboard", "projector"]
  }
}
```

**What Happens With Response**:
1. Modal closes
2. Success toast: "Room created successfully!"
3. Rooms list refreshes to show the new room

**Available Features**:
- `wifi`
- `whiteboard`
- `projector`

Admin can select one or more features (multiple selection).

**Error Handling**:
- 400: Invalid data → Toast error
- 403: Not admin → Toast "Unauthorized"
- 409: Room name already exists on floor → Toast error

---

### 12. **PUT /api/v1/rooms/:id**

**Purpose**: Update an existing room

**Called From**:
- [src/components/floors/EditFloorRoomModal.tsx](src/components/floors/EditFloorRoomModal.tsx)
- `floorService.updateFloorRoom()`

**URL Parameter**:
- `:id` - Room ID (internal `_id`)

**Authorization**: Admin role required

**Request Payload** (can send full or partial update):
```typescript
{
  name?: string;
  capacity?: number;
  features?: string[];
}
```

**Example Request (Full)**:
```json
{
  "name": "Updated Conference Room A",
  "capacity": 15,
  "features": ["wifi", "whiteboard", "projector"]
}
```

**Example Request (Partial)**:
```json
{
  "capacity": 15
}
```

**Expected Response** (200 OK):
```typescript
{
  success: boolean;
  message: string;
}
```

**Example Response**:
```json
{
  "success": true,
  "message": "Room updated successfully"
}
```

**What Happens With Response**:
1. Modal closes
2. Success toast: "Room updated successfully!"
3. Rooms list refreshes with updated data

**Error Handling**:
- 404: Room not found
- 400: Invalid data
- 403: Not admin

---

### 13. **DELETE /api/v1/rooms/:id**

**Purpose**: Delete a room

**Called From**:
- [src/components/floors/FloorRoomCard.tsx](src/components/floors/FloorRoomCard.tsx)
- `floorService.deleteFloorRoom()`

**URL Parameter**:
- `:id` - Room ID (internal `_id`)

**Authorization**: Admin role required

**Request Payload**: None (empty body)

**Expected Response** (200 OK):
```typescript
{
  success: boolean;
  message: string;
}
```

**Example Response**:
```json
{
  "success": true,
  "message": "Room deleted successfully"
}
```

**What Happens With Response**:
1. Success toast: "Room deleted successfully"
2. Rooms list refreshes (deleted room removed)

**User Confirmation**:
- Before calling API, user is prompted: "Are you sure you want to delete [Room Name]?"

**Error Handling**:
- 404: Room not found
- 403: Not admin
- 409: Room has active bookings (cannot delete)

---

## API Endpoints Summary

| Method | Endpoint | Purpose | Auth Required | Admin Only |
|--------|----------|---------|---------------|------------|
| POST | `/api/v1/user/login` | User login | No | No |
| POST | `/api/v1/user/signup` | User registration | No | No |
| POST | `/api/v1/availability/search` | Search rooms | Yes | No |
| POST | `/api/v1/rooms/:roomId/bookings` | Create booking | Yes | No |
| GET | `/api/v1/bookings/:userId` | Get user bookings | Yes | No |
| PUT | `/api/v1/bookings/:id` | Update booking | Yes | No |
| DELETE | `/api/v1/bookings/:id` | Cancel booking | Yes | No |
| GET | `/api/v1/floors` | Get all floors | Yes | **Yes** |
| GET | `/api/v1/floors/:floorId/rooms` | Get rooms by floor | Yes | **Yes** |
| POST | `/api/v1/floors/:floorId/rooms` | Create room | Yes | **Yes** |
| PUT | `/api/v1/rooms/:id` | Update room | Yes | **Yes** |
| DELETE | `/api/v1/rooms/:id` | Delete room | Yes | **Yes** |

---

## Role-Based Access Control

### Admin Users
- Have `role: "admin"` in auth response
- Can access all user features PLUS:
  - View Floors page (button in header)
  - View all floors and their rooms
  - Create new rooms
  - Edit existing rooms
  - Delete rooms

### Regular Users
- Have `role: "user"` in auth response
- Can access:
  - Dashboard
  - Search availability
  - Create bookings
  - View my bookings
  - Edit/cancel their own bookings

### Frontend Implementation
- Role is stored in Zustand `authStore`
- Header conditionally shows "Floors" button for admins
- All floor management routes are protected
- Backend must verify admin role for all floor management APIs

---

This documentation covers all API integrations in the Floor Client application according to the FINAL API SPECIFICATION. Update this document as new endpoints are added or existing ones are modified.
