import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * POST /api/wordcloud/[sessionId]/reset-cooldown
 * Reset cooldown for all users in a session
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const resolvedParams = await params;
    const sessionId = resolvedParams.sessionId;
    
    // Verify session exists
    const { data: session, error: sessionError } = await supabase
      .from("wordcloud_sessions")
      .select("id, cooldown_hours")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Note: We can't directly clear localStorage from server-side
    // This endpoint is for future use if we implement server-side cooldown tracking
    // For now, the client-side logic will handle clearing old cooldowns
    
    return NextResponse.json({ 
      success: true, 
      message: "Cooldown reset logic handled client-side",
      cooldown_hours: session.cooldown_hours 
    });
    
  } catch (error) {
    console.error("Error resetting cooldown:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
