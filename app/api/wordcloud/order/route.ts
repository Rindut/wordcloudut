import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET - Retrieve session order
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('session_order')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching session order:', error);
      return NextResponse.json({ error: 'Failed to fetch session order' }, { status: 500 });
    }

    return NextResponse.json({ order: data || [] });
  } catch (error) {
    console.error('Error in GET /api/wordcloud/order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Save session order
export async function POST(request: NextRequest) {
  try {
    const { sessionIds } = await request.json();

    if (!Array.isArray(sessionIds)) {
      return NextResponse.json({ error: 'sessionIds must be an array' }, { status: 400 });
    }

    // Clear existing order
    await supabase.from('session_order').delete().neq('id', 0);

    // Insert new order
    const orderData = sessionIds.map((sessionId, index) => ({
      session_id: sessionId,
      order_index: index
    }));

    const { data, error } = await supabase
      .from('session_order')
      .insert(orderData)
      .select();

    if (error) {
      console.error('Error saving session order:', error);
      return NextResponse.json({ error: 'Failed to save session order' }, { status: 500 });
    }

    return NextResponse.json({ success: true, order: data });
  } catch (error) {
    console.error('Error in POST /api/wordcloud/order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


