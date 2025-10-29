import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * GET /api/wordcloud/[sessionId]/quota
 * Get user's quota status (attempts_left, cooldown_until) for a session
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const { searchParams } = new URL(request.url);
    const userHash = searchParams.get("user_hash");

    if (!userHash) {
      return NextResponse.json(
        { error: "User hash is required" },
        { status: 400 }
      );
    }

    // Get quota from database
    const { data: quota, error: quotaError } = await supabase
      .from("word_quota")
      .select("attempts_left, cooldown_until")
      .eq("session_id", sessionId)
      .eq("user_hash", userHash)
      .single();

    if (quotaError && quotaError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error("Error fetching quota:", quotaError);
      return NextResponse.json(
        { error: "Failed to fetch quota" },
        { status: 500 }
      );
    }

    // If no quota exists, user hasn't submitted yet - default to max attempts
    const attemptsLeft = quota?.attempts_left ?? 3;
    const cooldownUntil = quota?.cooldown_until;

    // Calculate cooldown remaining seconds if cooldown is active
    let cooldownRemainingSeconds = 0;
    if (cooldownUntil) {
      const now = Date.now();
      const cooldownEnd = new Date(cooldownUntil).getTime();
      cooldownRemainingSeconds = Math.max(0, Math.floor((cooldownEnd - now) / 1000));
    }

    return NextResponse.json({
      attempts_left: attemptsLeft,
      cooldown_remaining_seconds: cooldownRemainingSeconds,
      cooldown_until: cooldownUntil
    }, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/wordcloud/[sessionId]/quota:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}



