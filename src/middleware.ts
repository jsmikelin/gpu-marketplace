import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as Parameters<typeof supabaseResponse.cookies.set>[2])
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // Protected routes
  const adminPath = path.startsWith('/admin')
  const supplierPath = path.startsWith('/supplier')
  const resellerPath = path.startsWith('/reseller')
  const dashboardPath = path.startsWith('/dashboard')

  if (!user && (adminPath || supplierPath || resellerPath || dashboardPath)) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (user) {
    const role = user.user_metadata?.role ?? 'customer'

    if (adminPath && role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
    if (supplierPath && role !== 'supplier' && role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
    if (resellerPath && role !== 'reseller' && role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
    if (dashboardPath && role !== 'customer' && role !== 'admin') {
      // Redirect to correct portal
      if (role === 'supplier') return NextResponse.redirect(new URL('/supplier', request.url))
      if (role === 'reseller') return NextResponse.redirect(new URL('/reseller', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
