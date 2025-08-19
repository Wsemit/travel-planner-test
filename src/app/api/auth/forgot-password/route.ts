import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateRandomToken } from '@/lib/auth'
import { sendPasswordResetEmail } from '@/lib/email'
import { resetPasswordRequestSchema } from '@/lib/schemas'
import { addHours } from 'date-fns'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = resetPasswordRequestSchema.parse(body)

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (!user) {
      // Don't reveal if user exists for security
      return NextResponse.json({
        message: 'Якщо користувач з таким email існує, йому буде надіслано інструкції для відновлення паролю'
      })
    }

    // Generate reset token
    const resetToken = generateRandomToken()
    const resetExpires = addHours(new Date(), 1) // 1 hour from now

    // Update user with reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires
      }
    })

    // Send reset email
    try {
      await sendPasswordResetEmail(user.email, resetToken)
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError)
      return NextResponse.json(
        { error: 'Помилка надсилання email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Якщо користувач з таким email існує, йому буде надіслано інструкції для відновлення паролю'
    })
  } catch (error) {
    console.error('Forgot password error:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Невірні дані', details: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Помилка запиту відновлення паролю' },
      { status: 500 }
    )
  }
}
