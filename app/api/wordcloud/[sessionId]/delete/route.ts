import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { DeleteWordRequest, DeleteWordResponse } from "@/lib/types";

/**
 * DELETE /api/wordcloud/[sessionId]/delete
 * Delete a word from the word cloud
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const body: DeleteWordRequest = await request.json();
    const { cluster_key } = body;

    if (!cluster_key) {
      return NextResponse.json(
        { error: "Cluster key is required" },
        { status: 400 }
      );
    }

    // Delete from summary
    const { error: summaryError } = await supabase
      .from("wordcloud_summary")
      .delete()
      .eq("session_id", sessionId)
      .eq("cluster_key", cluster_key);

    if (summaryError) {
      console.error("Error deleting from summary:", summaryError);
      return NextResponse.json(
        { error: "Failed to delete word" },
        { status: 500 }
      );
    }

    // Optionally, mark entries as blocked
    await supabase
      .from("wordcloud_entries")
      .update({ is_blocked: true })
      .eq("session_id", sessionId)
      .eq("cluster_key", cluster_key);

    const response: DeleteWordResponse = {
      deleted: true,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error in DELETE /api/wordcloud/[sessionId]/delete:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

