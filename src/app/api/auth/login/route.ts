import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { comparePassword, signToken } from '@/lib/auth'
import { loginSchema } from '@/lib/schemas'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = loginSchema.parse(body)

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Невірний email або пароль' },
        { status: 401 }
      )
    }

    // Check password
    const isValidPassword = await comparePassword(validatedData.password, user.password)

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Невірний email або пароль' },
        { status: 401 }
      )
    }

    // Generate JWT token
    const token = signToken({ userId: user.id, email: user.email })

    return NextResponse.json({
      message: 'Успішний вхід',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified
      },
      token
    })
  } catch (error) {
    console.error('Login error:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Невірні дані', details: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Помилка входу' },
      { status: 500 }
    )
  }
}
