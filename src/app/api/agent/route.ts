import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runAgent } from "@/lib/agent";

const payloadSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1),
      }),
    )
    .min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = payloadSchema.parse(body);

    const reply = await runAgent(payload.messages);

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Agent request failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected error while running the agent.",
      },
      { status: 400 },
    );
  }
}
