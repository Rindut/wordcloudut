import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { searchParams } = new URL(request.url);
    const userHash = searchParams.get("user_hash");

    if (!userHash) {
      return NextResponse.json(
        { error: "user_hash is required" },
        { status: 400 }
      );
    }

    const { data: lastEntry, error } = await supabase
      .from("wordcloud_entries")
      .select("created_at")
      .eq("session_id", resolvedParams.sessionId)
      .eq("user_hash", userHash)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error || !lastEntry || lastEntry.length === 0) {
      return NextResponse.json({ lastSubmission: null });
    }

    // Format the date
    const date = new Date(lastEntry[0].created_at);
    const formattedDate = date.toLocaleString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    return NextResponse.json({ lastSubmission: formattedDate });
  } catch (error) {
    console.error("Error fetching last submission:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
