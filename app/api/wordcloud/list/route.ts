import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    // Fetch all sessions with their details
    const { data: sessions, error } = await supabase
      .from("wordcloud_sessions")
      .select(`
        *,
        wordcloud_summary(count)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching sessions:", error);
      return NextResponse.json(
        { error: "Failed to fetch sessions" },
        { status: 500 }
      );
    }

    // Get participant counts and total entries for each session
    const sessionsWithCounts = await Promise.all(
      sessions.map(async (session) => {
        const { data: entries } = await supabase
          .from("wordcloud_entries")
          .select("user_hash")
          .eq("session_id", session.id);

        const uniqueParticipants = new Set(
          entries?.map((entry) => entry.user_hash) || []
        ).size;

        const wordCount = session.wordcloud_summary?.length || 0;
        const totalEntries = entries?.length || 0;

        return {
          ...session,
          participant_count: uniqueParticipants,
          word_count: wordCount,
          total_entries: totalEntries,
        };
      })
    );

    return NextResponse.json(sessionsWithCounts);
  } catch (error) {
    console.error("Error in list sessions API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
