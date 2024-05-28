import { NextRequest, NextResponse } from 'next/server'
import { refreshAccessToken } from '../services'
import { AuthToken } from '../types/auth.types'
import { getUserIdFromToken, isAccessTokenExpired } from '../utils/auth.utils'

export async function authRequiredMiddleware(req: NextRequest): Promise<{ redirectTo?: URL; token?: AuthToken }> {
  const tokenCookie = req.cookies.get('jwt')
  if (!tokenCookie) {
    return {
      redirectTo: new URL(`/signin?redirect=${encodeURIComponent(req.nextUrl.pathname)}`, req.url),
    }
  }
  const accessToken = JSON.parse(tokenCookie.value).accessToken
  if (isAccessTokenExpired(accessToken)) {
    const userId = getUserIdFromToken(accessToken)
    const refreshToken = JSON.parse(tokenCookie.value).refreshToken
    const newAccessToken = await refreshAccessToken(userId, refreshToken)
    if (!newAccessToken) {
      return {
        redirectTo: new URL(`/signin?redirect=${encodeURIComponent(req.nextUrl.pathname)}`, req.url),
      }
    }
    const response = NextResponse.next()
    response.cookies.set({
      name: 'jwt',
      value: JSON.stringify({ accessToken: newAccessToken, refreshToken }),
      httpOnly: true,
      path: '/',
      domain:
        process.env.NODE_ENV === 'production'
          ? '.' + process.env.NEXT_PUBLIC_API_ENDPOINT!.replace('https://', '')
          : 'localhost',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    })
    return {
      token: { accessToken: newAccessToken, refreshToken },
    }
  }
  return {}
}
