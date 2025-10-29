import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * DELETE /api/wordcloud/[sessionId]/session
 * Delete an entire session and all its data
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    // Delete all related data in the correct order (due to foreign key constraints)
    
    // 1. Delete word cloud summary entries
    const { error: summaryError } = await supabase
      .from("wordcloud_summary")
      .delete()
      .eq("session_id", sessionId);

    if (summaryError) {
      console.error("Error deleting summary entries:", summaryError);
      return NextResponse.json(
        { error: "Failed to delete session summary" },
        { status: 500 }
      );
    }

    // 2. Delete word cloud entries
    const { error: entriesError } = await supabase
      .from("wordcloud_entries")
      .delete()
      .eq("session_id", sessionId);

    if (entriesError) {
      console.error("Error deleting entries:", entriesError);
      return NextResponse.json(
        { error: "Failed to delete session entries" },
        { status: 500 }
      );
    }

    // 3. Delete the session itself
    const { error: sessionError } = await supabase
      .from("wordcloud_sessions")
      .delete()
      .eq("id", sessionId);

    if (sessionError) {
      console.error("Error deleting session:", sessionError);
      return NextResponse.json(
        { error: "Failed to delete session" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Session deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in DELETE /api/wordcloud/[sessionId]/session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
