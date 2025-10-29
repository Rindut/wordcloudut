import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * PATCH /api/wordcloud/[sessionId]/status
 * Update session status (draft/live/closed)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !["draft", "live", "closed"].includes(status)) {
      return NextResponse.json(
        { error: "Valid status is required (draft/live/closed)" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("wordcloud_sessions")
      .update({ status })
      .eq("id", sessionId);

    if (error) {
      console.error("Error updating session status:", error);
      return NextResponse.json(
        { error: "Failed to update status" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error in PATCH /api/wordcloud/[sessionId]/status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/wordcloud/[sessionId]/status
 * Get session details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    const { data, error } = await supabase
      .from("wordcloud_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/wordcloud/[sessionId]/status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

