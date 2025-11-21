import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Liste aqui os domínios que você quer autorizar:
const ALLOWED_ORIGINS = [
  'http://localhost:4000',
  'http://localhost:3000',
  // Domínios da Vercel (produção e preview)
  'https://store-flow-one.vercel.app',
  'https://store-flow-git-main-denilson-silvas-projects-63b429e7.vercel.app',
  'https://store-flow-inurnro5e-denilson-silvas-projects-63b429e7.vercel.app',
  'https://store-flow-one.vercel.app',
  ...(process.env.ALLOWED_ORIGINS?.split(',').filter(Boolean) || [])
]

// Logger simples para Edge Runtime (não pode usar pino aqui)
function logRequest(req: NextRequest, status?: number, duration?: number) {
  const method = req.method
  const path = req.nextUrl.pathname
  const origin = req.headers.get('origin') || 'no-origin'
  const referer = req.headers.get('referer') || 'no-referer'
  
  const logData = {
    method,
    path,
    origin,
    referer,
    status: status || 'pending',
    duration: duration ? `${duration}ms` : undefined,
    timestamp: new Date().toISOString(),
  }
  
  // Log sempre em desenvolvimento, e em produção para CORS issues
  if (process.env.NODE_ENV === 'development' || method === 'OPTIONS') {
    console.log(`[MIDDLEWARE] ${method} ${path}`, logData)
  }
}

// Verifica se a origem é permitida
function isOriginAllowed(origin: string): boolean {
  // Se não houver origin (requisição same-origin), permite
  if (!origin) return true
  
  // Verifica se está na lista de origens permitidas
  if (ALLOWED_ORIGINS.includes(origin)) {
    return true
  }
  
  // Permite localhost em desenvolvimento
  if (origin.includes('localhost')) {
    return true
  }
  
  // Permite qualquer subdomínio .vercel.app (para previews automáticos)
  if (origin.match(/^https:\/\/.*\.vercel\.app$/)) {
    return true
  }
  
  return false
}

// Adiciona headers de segurança
function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  return response
}

export async function middleware(
  request: NextRequest
) {
  try {
    const startTime = Date.now()
    const origin = request.headers.get('origin') || ''
    const pathname = request.nextUrl.pathname

    // Log da requisição recebida
    logRequest(request)

    // Se não for uma rota /api, passa adiante
    if (!pathname.startsWith('/api/')) {
      return NextResponse.next()
    }

    // Verifica se a origem é permitida
    const originAllowed = isOriginAllowed(origin)
    
    // Determina qual origem usar nos headers CORS
    // Se não houver origin (same-origin), não precisa de CORS
    // Se origin for permitida, usa ela
    const corsOrigin = origin && originAllowed ? origin : null

    // Se for preflight (OPTIONS), devolve um 204 com os headers CORS
    if (request.method === 'OPTIONS') {
      const res = new NextResponse(null, { status: 204 })
      
      // Para preflight, SEMPRE responde com headers CORS válidos
      if (corsOrigin) {
        res.headers.set('Access-Control-Allow-Origin', corsOrigin)
        res.headers.set('Access-Control-Allow-Credentials', 'true')
      } else if (origin) {
        // Se há origin mas não é permitida, ainda responde ao preflight
        // O navegador vai bloquear a requisição real depois, mas precisa de resposta ao preflight
        res.headers.set('Access-Control-Allow-Origin', origin)
      }
      // Se não há origin (same-origin), não precisa de CORS headers
      
      res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
      res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin')
      res.headers.set('Access-Control-Max-Age', '86400')
      
      const duration = Date.now() - startTime
      logRequest(request, 204, duration)
      return addSecurityHeaders(res)
    }

    // Para requisições normais, cria uma resposta que será modificada pela rota
    // Mas já adiciona os headers CORS necessários
    const response = NextResponse.next()
    
    // Headers CORS - só adiciona se origin for permitida
    if (corsOrigin) {
      response.headers.set('Access-Control-Allow-Origin', corsOrigin)
      response.headers.set('Access-Control-Allow-Credentials', 'true')
    }
    
    // Headers de segurança
    addSecurityHeaders(response)
    
    // Log após processamento (a duração real será logada no handler da rota)
    const duration = Date.now() - startTime
    if (duration > 100 || process.env.NODE_ENV === 'development') {
      logRequest(request, undefined, duration)
    }
    
    return response
  } catch (error) {
    // Em caso de erro no middleware, retorna uma resposta de erro com CORS
    console.error('[MIDDLEWARE ERROR]', error)
    const origin = request.headers.get('origin') || ''
    const originAllowed = isOriginAllowed(origin)
    const corsOrigin = origin && originAllowed ? origin : null
    
    const errorResponse = new NextResponse(
      JSON.stringify({
        success: false,
        error: {
          message: 'Erro no middleware',
          code: 'MIDDLEWARE_ERROR',
          status: 500,
        },
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
    
    if (corsOrigin) {
      errorResponse.headers.set('Access-Control-Allow-Origin', corsOrigin)
      errorResponse.headers.set('Access-Control-Allow-Credentials', 'true')
    }
    
    return addSecurityHeaders(errorResponse)
  }
}

// Aplica esse middleware a TODAS as rotas que começam com /api/
export const config = {
  matcher: "/api/:path*",
}

