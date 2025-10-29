import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { validateWord, normalizeText, getClusterKey, generateColor } from "@/lib/wordcloud-utils";
import type { SubmitWordRequest, SubmitWordResponse } from "@/lib/types";

/**
 * POST /api/wordcloud/[sessionId]/entry
 * Submit a word to the session
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const body: SubmitWordRequest = await request.json();
    const { user_hash, word } = body;

    // Validate inputs
    if (!user_hash) {
      return NextResponse.json(
        { error: "User hash is required" },
        { status: 400 }
      );
    }

    if (!word) {
      return NextResponse.json(
        { error: "Word is required" },
        { status: 400 }
      );
    }

    // Validate word content
    const validation = validateWord(word);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          blocked: true,
          message: validation.error,
        } as SubmitWordResponse,
        { status: 400 }
      );
    }

    // Call RPC function for server-side quota enforcement
    console.log("Calling RPC with:", { sessionId, user_hash, word });
    const { data: rpcData, error: rpcError } = await supabase.rpc('use_word_attempt', {
      p_session_id: sessionId,
      p_user_hash: user_hash,
      p_word: word
    });

    console.log("RPC Response:", { rpcData, rpcError });

    if (rpcError) {
      console.error("RPC Error:", rpcError);
      // RPC function doesn't exist - likely not installed in Supabase yet
      // Fall back to simple insertion without quota enforcement
      console.log("RPC not available, falling back to simple insertion");
      
      // Simple fallback: just insert the word
      const { error: insertError } = await supabase
        .from("wordcloud_entries")
        .insert({
          session_id: sessionId,
          user_hash: user_hash,
          word_raw: word,
          word_norm: word.toLowerCase().trim(),
          cluster_key: word.toLowerCase().trim(),
          is_blocked: false
        });

      if (insertError) {
        console.error("Insert error:", insertError);
        return NextResponse.json(
          { error: `Failed to submit word: ${insertError.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        blocked: false,
        message: "Word submitted (quota system not active)"
      }, { status: 201 });
    }

    const result = rpcData?.[0];
    
    if (!result) {
      console.error("No result from RPC:", rpcData);
      return NextResponse.json(
        { error: "No result from server" },
        { status: 500 }
      );
    }

    console.log("RPC Result:", result);

    // Handle different RPC responses
    if (!result.ok) {
      if (result.message === 'COOLDOWN') {
        return NextResponse.json({
          success: false,
          blocked: false,
          message: result.message,
          attempts_left: result.attempts_left,
          cooldown_remaining_seconds: result.cooldown_remaining_seconds
        }, { status: 429 });
      } else if (result.message === 'No attempts left') {
        return NextResponse.json({
          success: false,
          blocked: false,
          message: result.message,
          attempts_left: result.attempts_left,
        }, { status: 429 });
      } else if (result.message.includes('Session not found')) {
        return NextResponse.json({
          error: result.message
        }, { status: 404 });
      } else {
        return NextResponse.json({
          error: result.message
        }, { status: 400 });
      }
    }

    // Success - return the result from RPC
    return NextResponse.json({
      success: true,
      blocked: false,
      attempts_left: result.attempts_left,
      cooldown_remaining_seconds: result.cooldown_remaining_seconds
    }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/wordcloud/[sessionId]/entry:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

