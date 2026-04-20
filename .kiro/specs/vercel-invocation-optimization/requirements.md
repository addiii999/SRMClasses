# Requirements Document

## Introduction

This feature optimizes the SRM Classes full-stack application (React + Vite client, Node.js/Express server, deployed on Vercel) to reduce unnecessary Vercel Function Invocations, which are capped at 1 million per month. The optimization must be purely additive — no business logic changes, no API response format changes, no feature removals, and no UI/UX changes. The goal is to prevent duplicate requests, add client-side caching, debounce user-triggered API calls, remove any auto-polling, strengthen rate limiting and bot protection, combine redundant API calls, prevent infinite error retry loops, optimize admin panel data loading, and add monitoring for high-frequency endpoints.

## Glossary

- **API_Client**: The Axios instance defined in `client/src/lib/api.js` used by all client-side API calls.
- **Cache_Layer**: The in-memory cache utility in `client/src/lib/cache.js` (`cachedFetch`, `invalidateCache`, `clearCache`).
- **Rate_Limiter**: The `express-rate-limit` middleware instances defined in `server/middleware/rateLimits.js` and applied in route files.
- **Debounce_Hook**: A custom React hook that delays invoking a callback until a specified wait period has elapsed since the last call.
- **Deduplication_Guard**: A mechanism (e.g., an in-flight request map or React ref flag) that prevents the same API endpoint from being called concurrently more than once.
- **Admin_Panel**: The set of React components under `client/src/pages/admin/` rendered inside `AdminDashboard.jsx`.
- **Public_Endpoint**: Any server route accessible without authentication (e.g., `/api/branches`, `/api/gallery`, `/api/results`, `/api/courses`, `/api/enquiries` POST, `/api/demo` POST).
- **Student_Dashboard**: The `StudentDashboard.jsx` page rendered at `/dashboard` for authenticated students.
- **Overview_Component**: The `Overview` function component inside `AdminDashboard.jsx` that fetches stats on mount.
- **Enquiry_Limiter**: The `enquirySubmitLimiter` rate limiter applied to `POST /api/enquiries`.
- **Demo_Limiter**: A rate limiter to be applied to `POST /api/demo`.
- **Public_Read_Limiter**: A rate limiter to be applied to high-frequency public GET endpoints.
- **Frequency_Logger**: Server-side middleware or utility that logs the count of requests per endpoint per time window for monitoring purposes.
- **Bot_Score**: A numeric confidence score (0–1) computed from honeypot field presence, submission timing, and mobile number pattern to detect automated form submissions.

---

## Requirements

### Requirement 1: Prevent Duplicate Concurrent API Calls

**User Story:** As a developer, I want the API client to deduplicate in-flight requests, so that rapid re-renders or double-mounts do not trigger multiple identical API calls to the server.

#### Acceptance Criteria

1. THE `API_Client` SHALL maintain an in-flight request registry keyed by HTTP method and URL.
2. WHEN a request is initiated for a method+URL combination that already has an in-flight request, THE `API_Client` SHALL return the existing Promise instead of creating a new HTTP request.
3. WHEN an in-flight request completes (success or error), THE `API_Client` SHALL remove its entry from the in-flight registry.
4. THE `API_Client` SHALL apply deduplication only to GET requests; POST, PUT, PATCH, and DELETE requests SHALL NOT be deduplicated.
5. IF a GET request fails, THEN THE `API_Client` SHALL reject all callers that were waiting on the same deduplicated request with the same error.

---

### Requirement 2: Extend Client-Side Caching to All Frequently-Read Public Data

**User Story:** As a developer, I want all frequently-read public API responses to be cached client-side, so that navigating between pages does not re-fetch unchanged data.

#### Acceptance Criteria

1. WHEN `GET /api/results` is called, THE `Cache_Layer` SHALL cache the response for 10 minutes under the key `results`.
2. WHEN `GET /api/courses` is called, THE `Cache_Layer` SHALL cache the response for 10 minutes under the key `courses`.
3. WHEN `GET /api/faculty` is called, THE `Cache_Layer` SHALL cache the response for 10 minutes under the key `faculty`.
4. WHEN `GET /api/gallery` is called with a category parameter, THE `Cache_Layer` SHALL cache the response for 5 minutes under the key `gallery-{category}` (already implemented; this requirement confirms the pattern is applied consistently).
5. WHEN `GET /api/branches` is called, THE `Cache_Layer` SHALL cache the response for 10 minutes under the key `branches` (already implemented; this requirement confirms the pattern is applied consistently).
6. THE `Cache_Layer` SHALL NOT cache authenticated student or admin API responses.
7. WHEN an admin performs a write operation (create, update, delete) on a resource, THE `Cache_Layer` SHALL invalidate the corresponding public cache key for that resource.

---

### Requirement 3: Debounce Search and Filter Inputs in the Admin Panel

**User Story:** As a developer, I want search and filter inputs in the Admin Panel to debounce API calls, so that each keystroke does not trigger a separate server request.

#### Acceptance Criteria

1. THE system SHALL provide a `Debounce_Hook` (`useDebounce`) that accepts a value and a delay in milliseconds and returns the debounced value.
2. WHEN a user types in the search input of the Enquiries page, THE `Enquiries` component SHALL wait 400ms after the last keystroke before sending `GET /api/enquiries`.
3. WHEN a user types in the search input of the Fee Management page, THE `AdminFeeManagement` component SHALL filter the already-fetched student list client-side without making additional API calls.
4. WHEN a user types in the search input of the Student Verification page, THE `StudentVerification` component SHALL wait 400ms after the last keystroke before sending the search API request.
5. IF a debounced search value is empty, THEN THE component SHALL fetch the full list immediately without waiting for the debounce delay.

---

### Requirement 4: Cache Student Dashboard Tab Data Within a Session

**User Story:** As a student, I want switching between dashboard tabs to reuse already-fetched data, so that revisiting a tab does not trigger a redundant API call.

#### Acceptance Criteria

1. WHEN a student visits a dashboard tab for the first time, THE `Student_Dashboard` SHALL fetch data from the server and store it in component state.
2. WHEN a student switches to a tab whose data has already been fetched in the current session, THE `Student_Dashboard` SHALL render the cached state data without making a new API call.
3. THE `Student_Dashboard` SHALL track which tabs have been loaded using a `loadedTabs` ref or state set.
4. WHEN a student explicitly triggers a refresh action (e.g., a manual refresh button), THE `Student_Dashboard` SHALL re-fetch data for the active tab and update the cached state.
5. THE `Student_Dashboard` SHALL NOT cache profile tab data across tab switches, because profile data may change after a board change request or profile update; it SHALL always re-fetch when the profile tab is activated.

---

### Requirement 5: Eliminate Auto-Polling and Replace with Event-Driven Fetches

**User Story:** As a developer, I want to remove any `setInterval`-based API polling, so that the server is not hit repeatedly on a fixed schedule from the client.

#### Acceptance Criteria

1. THE system SHALL NOT contain any `setInterval` call in client-side code that triggers an API request.
2. WHEN the `Student_Dashboard` mounts, THE system SHALL fetch notifications once; it SHALL NOT schedule repeated notification fetches via `setInterval`.
3. WHERE a component previously used `setInterval` to refresh data, THE component SHALL replace the interval with a manual refresh button that triggers a single fetch on user interaction.
4. THE `Overview_Component` in the Admin Panel SHALL fetch stats once on mount and SHALL NOT schedule repeated fetches.

---

### Requirement 6: Apply Rate Limiting to the Demo Booking Endpoint

**User Story:** As a developer, I want the demo booking endpoint to be rate-limited, so that bots and abusive clients cannot flood the server with demo booking requests.

#### Acceptance Criteria

1. THE server SHALL apply a `Demo_Limiter` to `POST /api/demo` that allows a maximum of 5 requests per IP per 10 minutes.
2. WHEN a client exceeds the `Demo_Limiter` threshold, THE server SHALL respond with HTTP 429 and the message `"Too many demo booking requests. Please try again after 10 minutes."`.
3. THE `Demo_Limiter` SHALL use `standardHeaders: true` and `legacyHeaders: false`.
4. THE `Demo_Limiter` SHALL be applied only to the POST route, not to admin GET routes on the same path.

---

### Requirement 7: Apply Rate Limiting to High-Frequency Public Read Endpoints

**User Story:** As a developer, I want public read endpoints to be rate-limited, so that scrapers and bots cannot exhaust Vercel Function Invocations by repeatedly fetching public data.

#### Acceptance Criteria

1. THE server SHALL apply a `Public_Read_Limiter` to `GET /api/branches`, `GET /api/gallery`, `GET /api/results`, `GET /api/courses`, and `GET /api/faculty`.
2. THE `Public_Read_Limiter` SHALL allow a maximum of 60 requests per IP per minute.
3. WHEN a client exceeds the `Public_Read_Limiter` threshold, THE server SHALL respond with HTTP 429 and the message `"Too many requests. Please slow down."`.
4. THE `Public_Read_Limiter` SHALL use `standardHeaders: true` and `legacyHeaders: false`.
5. THE `Public_Read_Limiter` SHALL NOT apply to authenticated admin routes on the same endpoints.

---

### Requirement 8: Strengthen Bot Detection on Public Form Submissions

**User Story:** As a developer, I want public form submissions (enquiry and demo booking) to include server-side bot detection, so that automated submissions are rejected before consuming database writes.

#### Acceptance Criteria

1. THE `EnquiryForm` component SHALL include a hidden honeypot field (e.g., `website`) that is not visible to human users.
2. WHEN the enquiry form is submitted with a non-empty honeypot field value, THE server SHALL reject the request with HTTP 400 and the message `"Bot submission detected."` without writing to the database.
3. THE server SHALL compute a `Bot_Score` for each enquiry and demo submission based on: presence of a non-empty honeypot field, and a mobile number that does not match the pattern `^[6-9]\d{9}$`.
4. WHEN the `Bot_Score` indicates a bot (honeypot filled), THE server SHALL reject the submission with HTTP 400.
5. THE honeypot field SHALL be rendered with `display: none` styling and SHALL NOT be included in the visible form layout.
6. THE `Contact.jsx` demo booking form SHALL include the same honeypot field mechanism.

---

### Requirement 9: Combine Admin Overview API Calls into a Single Bulk Request

**User Story:** As a developer, I want the Admin Overview page to fetch all dashboard stats in a single API call, so that loading the overview does not generate 4 separate Vercel Function Invocations.

#### Acceptance Criteria

1. THE server SHALL expose a `GET /api/admin/dashboard-stats` endpoint that returns enquiry count, demo booking count, study material count, and student stats in a single response.
2. WHEN the `Overview_Component` mounts, THE `Overview_Component` SHALL call `GET /api/admin/dashboard-stats` once instead of making 4 separate API calls.
3. THE `GET /api/admin/dashboard-stats` endpoint SHALL require admin authentication.
4. THE response from `GET /api/admin/dashboard-stats` SHALL include the fields: `enquiryCount`, `demoCount`, `materialCount`, `totalStudents`, `activeStudents`, and `recentEnquiries` (last 5).
5. IF the `GET /api/admin/dashboard-stats` endpoint fails, THEN THE `Overview_Component` SHALL display a user-visible error state without crashing.

---

### Requirement 10: Prevent Infinite Retry Loops on Failed API Calls

**User Story:** As a developer, I want failed API calls to have a bounded retry policy, so that a server error does not cause the client to hammer the server with infinite retries.

#### Acceptance Criteria

1. THE `API_Client` SHALL retry a failed request at most once for network errors or connection timeouts (already implemented via `_retried` flag; this requirement confirms the limit is exactly 1 retry).
2. THE `API_Client` SHALL NOT retry requests that fail with HTTP 4xx status codes.
3. THE `API_Client` SHALL NOT retry requests that fail with HTTP 5xx status codes.
4. WHEN a retry is attempted, THE `API_Client` SHALL wait exactly 3000ms before retrying (already implemented; this requirement confirms the delay is fixed and not exponential).
5. IF a retried request also fails, THEN THE `API_Client` SHALL reject the Promise with the final error and SHALL NOT schedule any further retries.

---

### Requirement 11: Add Server-Side Frequency Logging for High-Traffic Endpoints

**User Story:** As a developer, I want the server to log request counts for high-frequency endpoints, so that I can identify unusual spikes and take corrective action.

#### Acceptance Criteria

1. THE server SHALL apply a `Frequency_Logger` middleware to `POST /api/enquiries`, `POST /api/demo`, `GET /api/gallery`, `GET /api/results`, and `GET /api/branches`.
2. WHEN a request is received on a monitored endpoint, THE `Frequency_Logger` SHALL log the endpoint path, HTTP method, client IP, and UTC timestamp using the existing `logger` utility.
3. WHEN a single IP sends more than 20 requests to any monitored endpoint within 1 minute, THE `Frequency_Logger` SHALL log a warning with the label `"HIGH_FREQUENCY_ALERT"` including the IP and endpoint.
4. THE `Frequency_Logger` SHALL maintain per-IP counters in memory and reset them every 60 seconds.
5. THE `Frequency_Logger` SHALL NOT block or delay the request; it SHALL only log and then call `next()`.

---

### Requirement 12: Add HTTP Cache-Control Headers to Public Read Responses

**User Story:** As a developer, I want public read API responses to include `Cache-Control` headers, so that Vercel's CDN edge layer can serve repeated identical requests without invoking the serverless function.

#### Acceptance Criteria

1. WHEN `GET /api/branches` responds successfully, THE server SHALL include the header `Cache-Control: public, max-age=300, stale-while-revalidate=60`.
2. WHEN `GET /api/gallery` responds successfully, THE server SHALL include the header `Cache-Control: public, max-age=300, stale-while-revalidate=60`.
3. WHEN `GET /api/results` responds successfully, THE server SHALL include the header `Cache-Control: public, max-age=600, stale-while-revalidate=120`.
4. WHEN `GET /api/courses` responds successfully, THE server SHALL include the header `Cache-Control: public, max-age=600, stale-while-revalidate=120`.
5. WHEN `GET /api/faculty` responds successfully, THE server SHALL include the header `Cache-Control: public, max-age=600, stale-while-revalidate=120`.
6. THE server SHALL NOT add `Cache-Control` headers to authenticated endpoints or write endpoints.
