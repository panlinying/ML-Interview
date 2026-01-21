import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  // Proxy to backend
  const url = new URL(`${API_URL}/api/auth/github`)
  
  // Forward query parameters
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.append(key, value)
  })

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('GitHub auth error:', error)
      return NextResponse.json(
        { error: 'Failed to initiate GitHub authentication' },
        { status: response.status }
      )
    }

    // Backend returns JSON with {url: "github_oauth_url"}
    const data = await response.json()
    
    // Redirect to GitHub OAuth URL
    if (data.url) {
      return NextResponse.redirect(data.url)
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('GitHub auth proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to connect to authentication service' },
      { status: 500 }
    )
  }
}
