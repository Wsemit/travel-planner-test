import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'
import { requireAuth, generateRandomToken } from '../../../../../lib/auth'
import { sendInvitationEmail } from '../../../../../lib/email'
import { inviteUserSchema } from '../../../../../lib/schemas'
import { addHours } from 'date-fns'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    // Витягаємо [id] динамічного маршруту
    const tripId = request.nextUrl.pathname
      .split('/')
      .filter(Boolean)
      .slice(-2, -1)[0] // передостанній сегмент перед 'invite'

    const body = await request.json()
    const validatedData = inviteUserSchema.parse(body)

    // Перевірка власника подорожі
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { owner: true }
    })

    if (!trip) {
      return NextResponse.json({ error: 'Подорож не знайдена' }, { status: 404 })
    }

    if (trip.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Тільки власник може запрошувати користувачів' },
        { status: 403 }
      )
    }

    if (validatedData.email === user.email) {
      return NextResponse.json({ error: 'Ви не можете запросити самого себе' }, { status: 400 })
    }

    // Перевірка існуючого доступу
    const existingAccess = await prisma.tripAccess.findFirst({
      where: { tripId, user: { email: validatedData.email } }
    })

    if (existingAccess) {
      return NextResponse.json(
        { error: 'Цей користувач вже має доступ до подорожі' },
        { status: 400 }
      )
    }

    // Перевірка існуючого запрошення
    const existingInvitation = await prisma.invitation.findFirst({
      where: { tripId, email: validatedData.email, status: 'PENDING' }
    })

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'Запрошення для цього email вже надіслано' },
        { status: 400 }
      )
    }

    // Генерація токена та створення запрошення
    const token = generateRandomToken()
    const expiresAt = addHours(new Date(), 24)

    const invitation = await prisma.invitation.create({
      data: { email: validatedData.email, token, expiresAt, senderId: user.id, tripId }
    })

    // Надсилання email
    try {
      await sendInvitationEmail(validatedData.email, user.name || user.email, trip.title, token)
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError)
      await prisma.invitation.delete({ where: { id: invitation.id } })
      return NextResponse.json({ error: 'Помилка надсилання запрошення' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Запрошення надіслано успішно',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        createdAt: invitation.createdAt,
        expiresAt: invitation.expiresAt
      }
    })
  } catch (error) {
    console.error('Invite user error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Необхідна авторизація' }, { status: 401 })
    }

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Невірні дані', details: error }, { status: 400 })
    }

    return NextResponse.json({ error: 'Помилка надсилання запрошення' }, { status: 500 })
  }
}
