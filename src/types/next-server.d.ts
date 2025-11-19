declare module "next/server" {
  export interface NextRequest extends Request {
    nextUrl: URL;
  }

  export class NextResponse<T = unknown> extends Response {
    static json(
      data: T,
      init?: ResponseInit,
    ): NextResponse<T>;
    static next(request: NextRequest): NextResponse;
    static rewrite(url: URL | string): NextResponse;
  }
}

