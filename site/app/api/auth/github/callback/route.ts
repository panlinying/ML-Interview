import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  // Proxy to backend callback
  const url = new URL(`${API_URL}/api/auth/github/callback`)
  
  // Forward query parameters (code, state, etc.)
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.append(key, value)
  })

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      redirect: 'manual',
    })

    // If it's a redirect, return it
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      if (location) {
        return NextResponse.redirect(location)
      }
    }

    // Otherwise return the response
    const data = await response.text()
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
      },
    })
  } catch (error) {
    console.error('GitHub callback proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to complete authentication' },
      { status: 500 }
    )
  }
}
