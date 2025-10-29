# 🐱 Join Page Logic Flow

## 📋 Overview
The join page allows users to submit words to a word cloud session with cooldown management and submission limits.

---

## 🔄 Main Flow

### 1. **Page Initialization** (`/join/[sessionId]/page.tsx`)

```
User visits /join/[sessionId]
    ↓
Extract sessionId from URL params
    ↓
Initialize states:
- session: null
- loading: true
- userHash: ""
- submittedCount: 0
```

### 2. **User Hash Generation** (useEffect #1)

```
Check localStorage for existing hash
    ↓
If exists: Use saved hash
If not exists: Generate new hash + save to localStorage
    ↓
Set userHash state
```

### 3. **Session Data Fetching** (useEffect #2)

```
Fetch session details from /api/wordcloud/[sessionId]/status
    ↓
If successful: Set session data
If failed: Keep session as null
    ↓
Set loading: false
```

### 4. **Page Rendering Logic**

```
If loading: Show loading spinner
    ↓
If !session: Show "Session Not Found"
    ↓
If session.status === "closed": Show "Session Closed"
    ↓
If session.status === "draft": Show "Session Not Started"
    ↓
If session.status === "live": Show JoinForm
```

---

## 🎯 JoinForm Component Logic (`JoinForm.tsx`)

### 1. **Component Initialization**

```
Props received:
- sessionId: string
- userHash: string
- maxEntries: number (from session.max_entries_per_user)
- onSubmit: function
- submittedCount: number

States initialized:
- word: ""
- isSubmitting: false
- error: ""
- cooldownEndTime: null
- timeRemaining: ""
- lastSubmissionTime: ""

Calculated:
- remainingEntries = cooldownEndTime && cooldownEndTime > Date.now() ? 0 : maxEntries - submittedCount
```

### 2. **Cooldown Management** (useEffect #1)

```
Check localStorage for cooldown_${sessionId}_${userHash}
    ↓
If exists and not expired: Set cooldownEndTime
If expired: Remove from localStorage
```

### 3. **Last Submission Fetch** (useEffect #2)

```
Only if submittedCount === 0:
    ↓
Fetch from /api/wordcloud/[sessionId]/last-submission?user_hash=${userHash}
    ↓
If successful: Set lastSubmissionTime
If failed: Silently handle error
```

### 4. **Countdown Timer** (useEffect #3)

```
If cooldownEndTime exists:
    ↓
Start interval timer (every 1 second)
    ↓
Calculate remaining time
    ↓
If expired: Clear cooldown + remove from localStorage
If active: Update timeRemaining display
```

---

## 📝 Submission Flow

### 1. **Form Submission** (`handleSubmit`)

```
User submits form
    ↓
Validate input:
- Check if word is not empty
- Check if word length ≤ 10 characters
- Check if not in cooldown period
    ↓
If validation fails: Show error message
If validation passes: Continue
```

### 2. **API Call**

```
Set isSubmitting: true
    ↓
Call onSubmit(word) → calls parent handleSubmit
    ↓
Parent makes POST to /api/wordcloud/[sessionId]/entry
    ↓
If successful: Increment submittedCount
If failed: Show error message
    ↓
Set isSubmitting: false
```

### 3. **Cooldown Trigger**

```
If submittedCount === maxEntries - 1 (final submission):
    ↓
Calculate endTime = Date.now() + 24 hours
    ↓
Set cooldownEndTime
    ↓
Save to localStorage
```

---

## 🎨 UI States

### 1. **Active Form State** (remainingEntries > 0)

```
Display:
- Input field (max 10 characters)
- Submit button (image)
- "Kamu masih punya X kesempatan"
- "Maksimal input 3 nama kucing per hari"
- Last submission time (if exists)
- Cooldown timer (if active)
```

### 2. **Completion State** (remainingEntries ≤ 0)

```
Display:
- "Terima Kasih!" message
- Link to presenter page
- Cooldown timer (if active)
```

---

## 🔧 API Endpoints

### 1. **Session Status** (`/api/wordcloud/[sessionId]/status`)
```
Returns: Session details (question, status, max_entries_per_user, etc.)
```

### 2. **Submit Entry** (`/api/wordcloud/[sessionId]/entry`)
```
POST Body: { user_hash, word }
Returns: Success/error response
Validates: Word content, session status, user limits
```

### 3. **Last Submission** (`/api/wordcloud/[sessionId]/last-submission`)
```
Query: ?user_hash=${userHash}
Returns: { lastSubmission: "formatted_date" | null }
```

---

## 💾 Data Storage

### 1. **localStorage Keys**
```
wordcloud_user_${sessionId}: User hash
cooldown_${sessionId}_${userHash}: Cooldown end timestamp
```

### 2. **Database Tables**
```
wordcloud_sessions: Session details
wordcloud_entries: User submissions
wordcloud_summary: Word counts
```

---

## ⚡ Key Features

### 1. **Cooldown System**
- 24-hour cooldown after max submissions
- Client-side timer with localStorage persistence
- Real-time countdown display

### 2. **Submission Limits**
- Max 3 submissions per user per session
- Character limit: 10 characters per word
- Duplicate word prevention

### 3. **Error Handling**
- Session not found
- Session closed/draft
- Validation errors
- Network errors

### 4. **User Experience**
- Persistent user identity
- Real-time feedback
- Mobile-first design
- Indonesian language

---

## 🔄 State Flow Summary

```
Initial Load → User Hash → Session Fetch → Form Display
    ↓
User Input → Validation → API Call → Success/Error
    ↓
Update Count → Check Limits → Cooldown Management
    ↓
UI Update → Timer Display → Completion State
```

---

## 🎯 Current Optimizations

1. **Single Source of Truth**: Cooldown managed only on frontend
2. **Efficient API Calls**: Last submission only fetched when needed
3. **Clean State Management**: Simplified remaining entries calculation
4. **No Debug Code**: Production-ready without console logs
5. **Consistent Timing**: Cooldown triggers after final submission


