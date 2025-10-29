import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { CreateSessionRequest, CreateSessionResponse } from "@/lib/types";

/**
 * POST /api/wordcloud
 * Create a new word cloud session
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateSessionRequest = await request.json();

    const { question, description, background_image_url, max_entries_per_user, cooldown_hours, time_limit_sec, grouping_enabled, theme } = body;

    // Validate required fields
    if (!question || question.trim().length === 0) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    // Insert new session
    const { data, error } = await supabase
      .from("wordcloud_sessions")
      .insert({
        question: question.trim(),
        ...(description && { description: description.trim() }),
        ...(background_image_url && { background_image_url: background_image_url.trim() }),
        max_entries_per_user: max_entries_per_user || 3,
        cooldown_hours: cooldown_hours || 24,
        time_limit_sec: time_limit_sec || null,
        grouping_enabled: grouping_enabled || false,
        theme: theme || "default",
        status: "draft",
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error creating session:", error);
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 }
      );
    }

    const response: CreateSessionResponse = {
      session_id: data.id,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/wordcloud:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


