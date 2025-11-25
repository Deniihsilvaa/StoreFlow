import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
};

// Lista de origens permitidas (deve corresponder ao middleware)
const ALLOWED_ORIGINS = [
  'http://localhost:4000',
  'http://localhost:3000',
  'http://localhost:5173',
  'https://store-flow-one.vercel.app',
  'https://store-flow-git-main-denilson-silvas-projects-63b429e7.vercel.app',
  'https://store-flow-inurnro5e-denilson-silvas-projects-63b429e7.vercel.app',
  ...(process.env.ALLOWED_ORIGINS?.split(',').filter(Boolean) || [])
];

// Verifica se a origem é permitida (mesma lógica do middleware)
function isOriginAllowed(origin: string): boolean {
  if (!origin) return false;
  
  // Verifica se está na lista de origens permitidas
  if (ALLOWED_ORIGINS.includes(origin)) {
    return true;
  }
  
  // Permite localhost em desenvolvimento
  if (origin.includes('localhost')) {
    return true;
  }
  
  // Permite qualquer subdomínio .vercel.app (para previews automáticos)
  if (origin.match(/^https:\/\/.*\.vercel\.app$/)) {
    return true;
  }
  
  return false;
}

// Helper para adicionar headers CORS baseado no request
function addCorsHeaders(response: NextResponse, request: NextRequest): NextResponse {
  const origin = request.headers.get('origin');
  
  if (origin) {
    const originAllowed = isOriginAllowed(origin);
    
    if (originAllowed) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }
  }
  
  // Adiciona headers de segurança
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return response;
}

export class ApiResponse {
  /**
   * Retorna uma resposta de sucesso padronizada com headers CORS
   * 
   * @param data - Dados a serem retornados
   * @param init - Opções de resposta (message, status, request)
   * @returns NextResponse com headers CORS e dados formatados
   * 
   * @example
   * ```typescript
   * return ApiResponse.success({ users: [] }, { request, status: 200 });
   * ```
   */
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
    
    // SEMPRE adiciona headers CORS se o request foi fornecido
    // Isso garante que mesmo quando NextResponse.json() cria uma nova resposta,
    // os headers CORS são preservados
    if (init?.request) {
      return addCorsHeaders(response, init.request);
    }
    
    return response;
  }
  
  /**
   * Retorna uma resposta de erro padronizada com headers CORS
   * 
   * @param message - Mensagem de erro
   * @param status - Status HTTP (padrão: 500)
   * @param request - Request opcional para adicionar headers CORS
   * @returns NextResponse com headers CORS e erro formatado
   * 
   * @example
   * ```typescript
   * return ApiResponse.error("Recurso não encontrado", 404, request);
   * ```
   */
  static error(
    message: string,
    status: number = 500,
    request?: NextRequest,
  ): NextResponse {
    const response = NextResponse.json(
      {
        success: false,
        error: {
          message,
          status,
          timestamp: new Date().toISOString(),
        },
      },
      {
        status,
      },
    );
    
    // Adiciona headers CORS se o request foi fornecido
    if (request) {
      return addCorsHeaders(response, request);
    }
    
    return response;
  }
}

