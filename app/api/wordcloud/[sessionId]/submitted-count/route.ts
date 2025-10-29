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

    const { count, error } = await supabase
      .from("wordcloud_entries")
      .select("*", { count: "exact", head: true })
      .eq("session_id", resolvedParams.sessionId)
      .eq("user_hash", userHash);

    if (error) {
      console.error("Error fetching submission count:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }

    return NextResponse.json({ count: count || 0 });
  } catch (error) {
    console.error("Error fetching submission count:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}



