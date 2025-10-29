import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { SummaryResponse } from "@/lib/types";

/**
 * GET /api/wordcloud/[sessionId]/summary
 * Get the current word cloud summary
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    // Fetch summary data
    const { data, error } = await supabase
      .from("wordcloud_summary")
      .select("*")
      .eq("session_id", sessionId)
      .order("count", { ascending: false });

    if (error) {
      console.error("Error fetching summary:", error);
      return NextResponse.json(
        { error: "Failed to fetch summary" },
        { status: 500 }
      );
    }

    const response: SummaryResponse = {
      items: data || [],
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/wordcloud/[sessionId]/summary:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

