# Word Cloud UT

A live, interactive word cloud application built with Next.js and Supabase. Create engaging word clouds for presentations where participants can submit words in real-time.

## Features

- ⚡ **Real-time updates** - See words appear instantly as participants submit them
- 🎨 **Beautiful visuals** - Dynamic word clouds with colors and sizes based on frequency
- 🛡️ **Built-in moderation** - Profanity filter and manual word deletion
- 📱 **Mobile responsive** - Works on all devices
- 🔐 **Anonymous participation** - No login required for participants
- ⏱️ **Time limits** - Optional session time limits
- 🤝 **Smart grouping** - Optional word stemming and grouping

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account and project

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Create a `.env.local` file with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Set up the database schema in Supabase SQL Editor:

Run the SQL script from `/docs/supabase-schema.sql` in your Supabase SQL Editor.

4. Start the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Creating a Session

1. Go to the home page
2. Enter your question or prompt
3. Configure settings:
   - Max words per participant (1-10)
   - Time limit (optional)
   - Enable smart word grouping (optional)
4. Click "Create Session"

### Presenter View

- `/presenter/[sessionId]` - Control panel for the presenter
- Start/stop the session
- View real-time word cloud
- See participant count
- Delete inappropriate words
- Copy join link for participants

### Participant View

- `/join/[sessionId]` - Submission form for participants
- Submit up to the maximum allowed words
- Simple, mobile-friendly interface
- Instant feedback on submissions

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Realtime**: Supabase Realtime
- **Styling**: Tailwind CSS
- **Word Cloud**: wordcloud npm package

## Project Structure

```
/app
  /api/wordcloud          # API routes
  /presenter/[sessionId]  # Presenter view
  /join/[sessionId]       # Participant view
  page.tsx                # Home page
/components
  WordCloudCanvas.tsx     # Canvas rendering
  JoinForm.tsx            # Word submission form
  Controls.tsx            # Session controls
  TimerBadge.tsx          # Timer display
/lib
  supabase.ts             # Supabase client
  wordcloud-utils.ts      # Utility functions
  types.ts                # TypeScript types
/docs
  wordcloud-prd.md        # Product requirements
  supabase-schema.sql     # Database schema
```

## API Routes

- `POST /api/wordcloud` - Create new session
- `GET /api/wordcloud/[id]/status` - Get session details
- `PATCH /api/wordcloud/[id]/status` - Update session status
- `POST /api/wordcloud/[id]/entry` - Submit word
- `GET /api/wordcloud/[id]/summary` - Get word summary
- `DELETE /api/wordcloud/[id]/delete` - Delete word

## Configuration

### Profanity Filter

Edit the `PROFANITY_LIST` in `/lib/wordcloud-utils.ts` to customize filtered words.

### Colors

Modify the `generateColor()` function in `/lib/wordcloud-utils.ts` to change word colors.

### Font Sizing

Adjust the formula in `calculateFontSize()` in `/lib/wordcloud-utils.ts`:

```typescript
const base = 16;  // Base font size
const scale = 10; // Scaling factor
const min = 12;   // Minimum size
const max = 72;   // Maximum size
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Database Setup

Make sure to:
1. Run the SQL schema in Supabase
2. Enable Realtime for the `wordcloud_summary` table
3. Configure Row Level Security policies as needed

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Author

Created by Rina Dwi Utami


