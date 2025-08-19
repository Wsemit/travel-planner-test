import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { hashPassword, signToken, generateRandomToken } from '../../../../lib/auth'
import { sendVerificationEmail } from '../../../../lib/email'
import { registerSchema } from '../../../../lib/schemas'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Користувач з таким email вже існує' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password)

    // Generate email verification token
    const emailVerificationToken = generateRandomToken()

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
        emailVerificationToken
      },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true
      }
    })

    // Send verification email
    try {
      await sendVerificationEmail(user.email, emailVerificationToken)
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      // Continue with registration even if email fails
    }

    // Generate JWT token
    const token = signToken({ userId: user.id, email: user.email })

    return NextResponse.json({
      message: 'Користувач створений успішно. Перевірте ваш email для підтвердження акаунту.',
      user,
      token
    })
  } catch (error) {
    console.error('Registration error:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Невірні дані', details: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Помилка реєстрації' },
      { status: 500 }
    )
  }
}
