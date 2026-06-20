# Live Site Audit: events.cubelelo.com
**Audited:** June 20, 2026 | **Logged in as:** prabhakar@cubelelo.com (CL ID: 26CLPAT205)  
**Tech stack:** Angular 14 (not React/Next.js) — identified via `_ngcontent-*` attributes and `ng-version="14.3.0"`

---

## Navigation (Global — all pages)

**Left side:**
- Logo → `/`
- Search bar: placeholder "Search For CLID, Name" → submits to `/search/[query]`

**Right side (logged-in):**
- User dropdown: profile photo + name
  - "Edit Profile" → `/profile/[clid]`
  - "Feedback" → external link (tinyurl)
  - "Sign out"
- Navigation links (sidebar on mobile, top on desktop):
  - About Us → `/about-us`
  - Rules → `/rules`
  - FAQ → `/faqs`
  - Privacy Policy → `/privacy-policy`
  - Contact Us → `/contact-us`

**Right side (logged-out):**
- Login / Sign Up buttons

---

## Pages Inventory

### 1. Homepage — `/`
**Structure:**
- Hero carousel (auto-rotating banner images)
- Announcement/info banner (dismissible)
- **Featured competition card** (highlighted, full-width)
- **Upcoming competitions** section: grid of competition cards
- **Past competitions** section: grid of cards with "Results" button
- Blogs section: links to external blog posts on `cubelelo.com/blogs/cubing`

**Competition card features:**
- Competition name + event chips (3x3, 2x2, Pyraminx, etc.)
- Date range
- Status badge
- "Register" / "Registered" / "Results" button

---

### 2. Competitions — Future `/competitions/future`
**Structure:**
- Flat list of upcoming competitions
- Each card: name, events, date, register button
- No filters or search on this page

---

### 3. Competitions — Past `/competitions/past`
**Structure:**
- Flat list of all past competitions
- Each card: name, events, date, "Results" button
- "Results" navigates to `/competition/[id]` (same detail page)
- No separate results route exists

---

### 4. Competition Detail — `/competition/[id]`
**Structure:**
- Event type chips at top (clickable filters: 3x3x3 Cube, 2x2x2 Cube, etc.)
- Competition name (large heading)
- Registration date + CL ID shown
- Full description text (markdown-style with emoji, schedule, prizes, rules text)
- **Three tabs:** Schedule | Rules | FAQs
- **Schedule tab (default):** List of event time slots
  - Each slot: Event name, time window (e.g. 19:00–19:30), "Participate" button
- **Rules tab:** Rules text
- **FAQs tab:** FAQ accordion

**Buttons:**
- "Register" (if not registered, not past) → registration flow
- "Registered" (badge, if already registered)
- "Results" → same page (for past comps, no separate results URL)
- "Participate" (per event slot) → timer page (only accessible during active round window)

**Notes:**
- URL uses short alphanumeric ID: `/competition/Q0QZW81ZKZ`
- No separate lobby or results sub-route that renders differently; `/competition/[id]/results` and `/competition/[id]/solve` both just render the same competition detail page

---

### 5. Timer / Solve Page
**Access:** Only reachable by clicking "Participate" during an active round time window  
**URL pattern:** Unknown — likely `/competition/[id]/solve` or navigates client-side within the same Angular route  
**Could not access:** Round for CC 8.0 opens at 19:00 IST; audit conducted at 14:45 IST

**Expected features (from PRD + site structure):**
- Server-locked scramble revealed at round open
- Built-in timer (spacebar / touch)
- Auto-submit on stop
- Video link submission after solve

---

### 6. Search Results — `/search/[query]`
**Structure:**
- Search bar (pre-filled with query)
- Results table: # | NAME | CL ID
- Rows are `cursor-pointer` — clicking navigates to that user's profile `/profile/[clid]`
- No pagination visible; all matching results shown

---

### 7. Public Profile — `/profile/[clid]`
**Structure:**
- Profile photo (circular)
- Full name + CL ID
- Personal info: DOB, gender, state, WCA ID (if set)
- **Personal Bests table:** Event | Single | Average (ao5)
- **Competition Results table:** Competition name | Event | Round | Result | Rank
- "Edit Profile" button (own profile only)
- "Delete Image" button (own profile only)

---

### 8. Edit Profile — `/edit-profile`
**Structure (form fields):**
- WCA ID
- Date of Birth
- Gender (dropdown)
- Country
- State
- Social links (Instagram, YouTube, etc.)
- Submit button

**Note:** Basic info (name, email) not editable here — likely set at registration only

---

### 9. Login — `/auth/login`
**Structure:**
- Email field
- Password field
- "Forgot password?" link → `/auth/forget-password`
- Login button
- "Sign up" link → `/auth/signup`
- Google OAuth button

---

### 10. Signup — `/auth/signup`
**Structure:**
- Email field only (step 1)
- OTP sent to email (step 2)
- **No name or password on signup** — account created from email + OTP only
- No Google OAuth on this page

---

### 11. Forgot Password — `/auth/forget-password`
**Structure:**
- Email field
- "Send OTP" button
- OTP input
- New password (after OTP verified)

---

### 12. About Us — `/about-us`
Static informational page.

---

### 13. Rules — `/rules`
Static rules page.

---

### 14. FAQ — `/faqs`
Static FAQ page.

---

### 15. Privacy Policy — `/privacy-policy`
Static privacy policy page.

---

### 16. Contact Us — `/contact-us`
Static contact form / info page.

---

## Key Observations vs Our Build

| Feature | Live Site | Our Build | Notes |
|---|---|---|---|
| URL scheme | `/competition/[id]` (singular) | `/competitions/[id]` (plural) | We use plural — fine |
| Auth routes | `/auth/login`, `/auth/signup` | `/login`, `/signup` | Simpler, better |
| Signup flow | Email + OTP only | Name + Email + Password + Google | Ours is better (collects name upfront) |
| Results page | No separate route (reuses detail page) | `/compete/[id]/results` (separate) | Ours is better |
| Lobby | No separate lobby route | `/compete/[id]/lobby` | Ours adds PRD feature |
| Search | `/search/[query]` | Not yet built | **Gap to fill** |
| Practice hub | No practice hub | `/practice`, `/daily-challenge` | We add this |
| Timer standalone | Not standalone (competition-only) | `/terminal` standalone | We add this |
| Admin panel | Not accessible from user account | `/admin` | We have full admin |
| My registrations | No dashboard / my-registrations page | Shown on `/profile/me` | Covered |
| Profile edit | Separate `/edit-profile` route | `/profile/me/settings` | Covered |
| WCA ID link | In edit profile | In settings | Covered |
| Streak / daily challenge | Not on live site | `/daily-challenge` | We add this |
| Announcement banner | On homepage | Wired to DB | We have this |

## Gaps to Build

1. **User search page** — `/search/[query]` — search by name or CL ID, results table linking to profiles
2. **My registrations view** — currently on `/profile/me`, but live site shows registered badge on competition cards; ensure registration status shown on competition cards in our build
3. **Referral system** — live site mentions "Refer a cuber → earn 12% cashback" (may be Phase 2)
4. **Certificate download** — live site likely has post-competition certificate download (Task #48)
