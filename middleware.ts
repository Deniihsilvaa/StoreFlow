import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Liste aqui os domínios que você quer autorizar:
const ALLOWED_ORIGINS = [
  'http://localhost:4000',
  'http://localhost:3000',
  'http://localhost:5173',
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
    const referer = request.headers.get('referer') || ''
    const pathname = request.nextUrl.pathname

    // Log da requisição recebida com informações de debug
    logRequest(request)
    
    // Debug: Log adicional para CORS em desenvolvimento
    if (process.env.NODE_ENV === 'development' && pathname.startsWith('/api/')) {
      console.log('[CORS DEBUG]', {
        method: request.method,
        path: pathname,
        origin: origin || '(no origin)',
        referer: referer || '(no referer)',
        userAgent: request.headers.get('user-agent')?.substring(0, 50),
      })
    }

    // Se não for uma rota /api, passa adiante
    if (!pathname.startsWith('/api/')) {
      return NextResponse.next()
    }

    // Verifica se a origem é permitida
    const originAllowed = isOriginAllowed(origin)

    // Se for preflight (OPTIONS), devolve um 204 com os headers CORS
    if (request.method === 'OPTIONS') {
      const res = new NextResponse(null, { status: 204 })
      
      // Para preflight, SEMPRE responde com headers CORS válidos
      // CRÍTICO: O navegador precisa receber os headers CORS na resposta OPTIONS
      // mesmo que não haja origin (pode ser same-origin ou requisição direta)
      if (origin) {
        // Se há origin, sempre adiciona o header (mesmo se não estiver na lista)
        // O navegador vai validar depois, mas precisa receber uma resposta válida
        res.headers.set('Access-Control-Allow-Origin', origin)
        
        // Só adiciona credentials se a origem for permitida
        if (originAllowed) {
          res.headers.set('Access-Control-Allow-Credentials', 'true')
        }
      } else {
        // Se não há origin, pode ser same-origin ou requisição direta
        // Nesse caso, não precisa de CORS, mas adicionamos '*' como fallback seguro
        // para garantir que o navegador não bloqueie
        res.headers.set('Access-Control-Allow-Origin', '*')
      }
      
      // Headers obrigatórios para preflight
      res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
      res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin')
      res.headers.set('Access-Control-Max-Age', '86400')
      
      const duration = Date.now() - startTime
      logRequest(request, 204, duration)
      return addSecurityHeaders(res)
    }

    // Para requisições normais, cria uma resposta que será modificada pela rota
    // IMPORTANTE: No Next.js, quando a rota retorna NextResponse.json(), ela cria uma nova resposta
    // que não herda os headers do middleware. Por isso, os headers CORS devem ser adicionados
    // diretamente nas respostas das rotas (via ApiResponse.success com request).
    
    // Ainda adicionamos headers aqui como fallback, mas as rotas devem adicionar também
    const response = NextResponse.next()
    
    // Headers CORS - SEMPRE adiciona se houver origin (cross-origin request)
    if (origin) {
      if (originAllowed) {
        response.headers.set('Access-Control-Allow-Origin', origin)
        response.headers.set('Access-Control-Allow-Credentials', 'true')
      } else {
        // Se origin não é permitida, ainda adiciona o header (navegador vai bloquear depois)
        // Mas é melhor ter o header do que não ter
        response.headers.set('Access-Control-Allow-Origin', origin)
      }
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
    const errorOrigin = request.headers.get('origin') || ''
    const errorOriginAllowed = isOriginAllowed(errorOrigin)
    
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
    
    // Adiciona headers CORS mesmo em caso de erro
    if (errorOrigin) {
      errorResponse.headers.set('Access-Control-Allow-Origin', errorOrigin)
      if (errorOriginAllowed) {
        errorResponse.headers.set('Access-Control-Allow-Credentials', 'true')
      }
    }
    
    return addSecurityHeaders(errorResponse)
  }
}

// Aplica esse middleware a TODAS as rotas que começam com /api/
export const config = {
  matcher: "/api/:path*",
}

