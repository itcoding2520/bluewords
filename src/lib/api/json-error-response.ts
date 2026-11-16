import { NextResponse } from "next/server";

export function jsonErrorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}
