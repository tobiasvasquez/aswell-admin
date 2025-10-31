import { NextResponse } from 'next/server'

const AUTH_COOKIE = 'sm_auth'

export async function POST(request: Request) {
  const { password } = await request.json().catch(() => ({ password: '' }))
  const expected = process.env.ADMIN_PASSWORD

  if (!expected) {
    return NextResponse.json({ message: 'El servidor no tiene ADMIN_PASSWORD configurado' }, { status: 503 })
  }

  if (password !== expected) {
    return NextResponse.json({ message: 'Credenciales inválidas' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(AUTH_COOKIE, expected, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 días
  })
  return res
}
