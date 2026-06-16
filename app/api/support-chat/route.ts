import { NextResponse } from "next/server";
import {
  getSupportReply,
  type SupportChatContext,
} from "@/lib/support-chat/matcher";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = typeof body?.message === "string" ? body.message : "";
    const context = body?.context as SupportChatContext | undefined;

    if (message.length > 1200) {
      return NextResponse.json(
        {
          error:
            "Mensagem muito longa. Envie uma descrição mais curta do problema.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(getSupportReply(message, context));
  } catch {
    return NextResponse.json(
      {
        error:
          "Não foi possível processar a mensagem agora. Tente novamente em instantes.",
      },
      { status: 400 }
    );
  }
}
