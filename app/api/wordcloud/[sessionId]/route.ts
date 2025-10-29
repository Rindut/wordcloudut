import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET - Fetch session details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { data, error } = await supabase
      .from("wordcloud_sessions")
      .select("*")
      .eq("id", resolvedParams.sessionId)
      .single();

    if (error) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Update session
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const { question, description, background_image_url, max_entries_per_user, cooldown_hours } = body;

    if (!question || question.trim() === "") {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    // Validate max_entries_per_user
    if (max_entries_per_user !== undefined) {
      if (!Number.isInteger(max_entries_per_user) || max_entries_per_user < 1 || max_entries_per_user > 10) {
        return NextResponse.json({ error: "Max entries per user must be between 1 and 10" }, { status: 400 });
      }
    }

    // Validate cooldown_hours
    if (cooldown_hours !== undefined) {
      if (!Number.isInteger(cooldown_hours) || cooldown_hours < 1 || cooldown_hours > 168) {
        return NextResponse.json({ error: "Cooldown hours must be between 1 and 168" }, { status: 400 });
      }
    }

    const updateData: any = {
      question: question.trim(),
      updated_at: new Date().toISOString(),
    };

    // Only update fields that are provided
    if (description !== undefined) {
      updateData.description = description.trim() || null;
    }
    if (background_image_url !== undefined) {
      updateData.background_image_url = background_image_url.trim() || null;
    }
    if (max_entries_per_user !== undefined) {
      updateData.max_entries_per_user = max_entries_per_user;
    }
    if (cooldown_hours !== undefined) {
      updateData.cooldown_hours = cooldown_hours;
    }

    const { data, error } = await supabase
      .from("wordcloud_sessions")
      .update(updateData)
      .eq("id", resolvedParams.sessionId)
      .select()
      .single();

    if (error) {
      console.error("Update error:", error);
      return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
