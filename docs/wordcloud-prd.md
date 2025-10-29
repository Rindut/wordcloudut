# Word Cloud PRD
# 🧩 Product Requirement Document: Live Word Cloud (AhaSlides-like)

## Overview
A live interactive **Word Cloud feature** where participants submit words, and the results appear instantly on a dynamic canvas. The more frequent a word appears, the larger and bolder it becomes.  
Target: **Web App (Next.js + Supabase)**, optimized for **mobile view**.

---

## 1. Objectives
- Build an engaging, real-time visual word cloud.
- Support multiple participants submitting simultaneously.
- Display updates instantly to presenter.
- Allow moderation (delete words, profanity filter).
- Support export (CSV/PNG later).

---

## 2. Core User Stories
| Role | Story | Priority |
|------|--------|----------|
| Presenter | Create Word Cloud session with a question. | Must |
| Participant | Submit one or more short words. | Must |
| System | Show larger words for higher frequency. | Must |
| System | Filter profanity and normalize case. | Must |
| Presenter | Delete unwanted words in real-time. | Should |
| Presenter | Export results (CSV/PNG). | Later |

---

## 3. Features & Requirements

### Presenter Side
- Create session: question, word limit, time limit, color theme.
- Control panel:
  - Start/Stop session
  - Hide/Show results
  - Delete specific word
  - Export PNG/CSV (optional)
- View participant count in real-time.

### Participant Side
- Join via link or QR (no login required).
- Submit 1–3 words (max 25 chars each).
- “Thank you” screen after submission.
- See message “Session closed” if expired.

### System
- Normalize text (lowercase, strip punctuation).
- Profanity filter before saving.
- Smart grouping (e.g., "happy", "hapy", "happiness" → "happy").
- Realtime update (Supabase Realtime or polling fallback).
- Store counts in `wordcloud_summary` table.

---

## 4. Database Schema (Supabase)

### Table: `wordcloud_sessions`
| Column | Type | Notes |
|---------|------|-------|
| id | uuid (PK) | session ID |
| question | text | main question |
| theme | text | default 'default' |
| max_entries_per_user | int | default 3 |
| time_limit_sec | int | nullable |
| grouping_enabled | bool | default false |
| status | text | enum: draft/live/closed |
| created_by | uuid | optional |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | auto trigger |

---

### Table: `wordcloud_entries`
| Column | Type | Notes |
|---------|------|-------|
| id | uuid (PK) | entry ID |
| session_id | uuid (FK) | → sessions.id |
| user_hash | text | participant hash |
| word_raw | text | original |
| word_norm | text | normalized |
| cluster_key | text | grouping result |
| is_blocked | bool | profanity |
| created_at | timestamptz | default now() |

---

### Table: `wordcloud_summary`
| Column | Type | Notes |
|---------|------|-------|
| session_id | uuid (FK) | part of PK |
| cluster_key | text | part of PK |
| display_word | text | word shown |
| count | int | frequency |
| color | text | hex |
| updated_at | timestamptz | default now() |

---

## 5. API Contract

### POST `/api/wordcloud`
**Description:** Create a new session  
**Body:**
```json
{
  "question": "Describe your mood today",
  "max_entries_per_user": 3,
  "time_limit_sec": 300,
  "grouping_enabled": true
}
Response:

json
Copy code
{ "session_id": "uuid" }
POST /api/wordcloud/:session_id/entry
Description: Submit a word
Body:

json
Copy code
{ "user_hash": "anon_123", "word": "happy" }
Response:

json
Copy code
{ "success": true, "blocked": false }
GET /api/wordcloud/:session_id/summary
Description: Get live word count summary
Response:

json
Copy code
{
  "items": [
    { "cluster_key": "happy", "display_word": "happy", "count": 12, "color": "#2D7" }
  ]
}
DELETE /api/wordcloud/:session_id/delete
Description: Delete a word manually
Body:

json
Copy code
{ "cluster_key": "happy" }
Response:

json
Copy code
{ "deleted": true }
GET /api/wordcloud/:session_id/export
Description: Export as PNG/CSV (later)
Query: ?format=png|csv

6. Realtime Flow
text
Copy code
1. Participant submits word → POST /entry
2. API normalizes + stores word
3. Trigger updates summary (count++)
4. Supabase Realtime → broadcast change
5. Presenter receives update and re-renders canvas
6. Presenter can delete → trigger decrement summary
7. Frontend Components
Component	Description
WordCloudCanvas.tsx	Render canvas using wordcloud2.js
JoinForm.tsx	Participant submission input
Controls.tsx	Presenter buttons: start/stop/hide/delete
TimerBadge.tsx	Show time left (optional)

8. Font Scaling & Layout
Formula:
fontSize = base + log(count + 1) * scale

Base = 16

Scale = 10

Min = 12

Max = 72
Layout: spiral placement with collision avoidance (library handles).

9. Profanity & Normalization
Normalize: lowercase, trim, strip punctuation.

Profanity list: simple array (English + Indonesian).

If match → is_blocked=true, skip summary increment.

10. Success Criteria
Area	Criteria
Realtime	Update latency < 1s
Profanity	No blocked words visible
Grouping	Similar words merged
Export	CSV/PNG matches summary
Responsiveness	Works on mobile & desktop
Stability	5000 submissions < 2s delay

11. Next Steps
 Setup Supabase schema

 Build API routes (create, entry, summary, delete)

 Implement Realtime listener

 Render with wordcloud2.js

 Add export + hide/show

 Add grouping logic refinement

 Deploy to Vercel

12. Notes for Cursor AI
Supabase client is defined in lib/supabase.ts.

APIs live under /app/api/wordcloud/*.

Canvas rendered in WordCloudCanvas.tsx using wordcloud npm package.

Use wordcloud_summary as main data source for realtime UI.

Last updated: 20 Oct 2025 by Rina Dwi Utami

