import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export async function POST(request: Request) {
  const { reviewId, currentLikes } = await request.json();

  const { data, error } = await supabase
  .rpc("increment_review_like", {
    review_id: reviewId,
  });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
  likes: data,
});
}