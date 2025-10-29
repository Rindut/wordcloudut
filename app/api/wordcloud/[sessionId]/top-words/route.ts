import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    // Fetch top 3 words by count
    const { data, error } = await supabase
      .from("wordcloud_summary")
      .select("*")
      .eq("session_id", sessionId)
      .order("count", { ascending: false })
      .limit(3);

    if (error) {
      console.error("Error fetching top words:", error);
      return NextResponse.json(
        { error: "Failed to fetch top words" },
        { status: 500 }
      );
    }

    return NextResponse.json({ words: data || [] });
  } catch (error) {
    console.error("Error in GET /api/wordcloud/[sessionId]/top-words:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}



