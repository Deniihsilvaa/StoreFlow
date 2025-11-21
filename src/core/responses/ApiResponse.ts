import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
};

// Helper para adicionar headers CORS baseado no request
function addCorsHeaders(response: NextResponse, request: NextRequest): NextResponse {
  const origin = request.headers.get('origin');
  
  if (origin) {
    // Lista de origens permitidas (deve corresponder ao middleware)
    const ALLOWED_ORIGINS = [
      'http://localhost:4000',
      'http://localhost:3000',
      'https://store-flow-one.vercel.app',
      'https://store-flow-git-main-denilson-silvas-projects-63b429e7.vercel.app',
      'https://store-flow-inurnro5e-denilson-silvas-projects-63b429e7.vercel.app',
      ...(process.env.ALLOWED_ORIGINS?.split(',').filter(Boolean) || [])
    ];
    
    // Verifica se a origem é permitida
    const isAllowed = 
      ALLOWED_ORIGINS.includes(origin) ||
      origin.includes('localhost') ||
      origin.match(/^https:\/\/.*\.vercel\.app$/);
    
    if (isAllowed) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }
  }
  
  return response;
}

export class ApiResponse {
  static success<T>(
    data: T,
    init?: {
      message?: string;
      status?: number;
      request?: NextRequest;
    },
  ): NextResponse<ApiSuccessResponse<T>> {
    const response = NextResponse.json(
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
    
    // Adiciona headers CORS se o request foi fornecido
    if (init?.request) {
      return addCorsHeaders(response, init.request);
    }
    
    return response;
  }
}

