import { NextResponse } from "next/server";

export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
};

export class ApiResponse {
  static success<T>(
    data: T,
    init?: {
      message?: string;
      status?: number;
    },
  ): NextResponse<ApiSuccessResponse<T>> {
    return NextResponse.json(
      {
        success: true,
        data,
        message: init?.message,
        timestamp: new Date().toISOString(),
      },
      {
        status: init?.status ?? 200,
      },
    );
  }
}

