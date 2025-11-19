import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Liste aqui os domínios que você quer autorizar:
const ALLOWED_ORIGINS = [
  'http://localhost:4000',
  'http://localhost:3000',
  ...(process.env.ALLOWED_ORIGINS?.split(',') || [])
]

// Logger simples para Edge Runtime (não pode usar pino aqui)
function logRequest(req: NextRequest, status?: number, duration?: number) {
  const method = req.method
  const path = req.nextUrl.pathname
  const origin = req.headers.get('origin') || 'no-origin'
  
  const logData = {
    method,
    path,
    origin,
    status: status || 'pending',
    duration: duration ? `${duration}ms` : undefined,
    timestamp: new Date().toISOString(),
  }
  
  // Em produção, você pode enviar para um serviço de logging
  if (process.env.NODE_ENV === 'development') {
    console.log(`[${method}] ${path}`, logData)
  }
}

// Verifica se a origem é permitida
function isOriginAllowed(origin: string): boolean {
  if (!origin) return false
  return ALLOWED_ORIGINS.includes(origin) || origin.includes('localhost')
}

// Adiciona headers de segurança
function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  return response
}

export function middleware(req: NextRequest) {
  const startTime = Date.now()
  const origin = req.headers.get('origin') || ''
  const pathname = req.nextUrl.pathname

  // Log da requisição recebida
  logRequest(req)

  // Se não for uma rota /api, passa adiante
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next(req)
  }

  // Verifica se a origem é permitida
  const originAllowed = isOriginAllowed(origin)

  // Se for preflight (OPTIONS), devolve um 204 com os headers CORS
  if (req.method === 'OPTIONS') {
    const res = new NextResponse(null, { status: 204 })
    
    if (originAllowed) {
      res.headers.set('Access-Control-Allow-Origin', origin)
      res.headers.set('Access-Control-Allow-Credentials', 'true')
      res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
      res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin')
      res.headers.set('Access-Control-Max-Age', '86400')
    }
    
    const duration = Date.now() - startTime
    logRequest(req, 204, duration)
    return addSecurityHeaders(res)
  }

  // Para requisições normais, permite o fluxo mas injeta os headers
  const res = NextResponse.next(req)
  
  // Headers CORS
  if (originAllowed) {
    res.headers.set('Access-Control-Allow-Origin', origin)
    res.headers.set('Access-Control-Allow-Credentials', 'true')
  }
  
  // Headers de segurança
  addSecurityHeaders(res)
  
  // Log após processamento (a duração real será logada no handler da rota)
  // Aqui só logamos que passou pelo middleware
  const duration = Date.now() - startTime
  if (duration > 100) {
    // Log apenas se demorar mais de 100ms no middleware
    logRequest(req, undefined, duration)
  }
  
  return res
}

// Aplica esse middleware a TODAS as rotas que começam com /api/
export const config = {
  matcher: "/api/:path*",
}

