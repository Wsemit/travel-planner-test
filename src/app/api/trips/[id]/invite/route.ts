import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'
import { requireAuth, generateRandomToken } from '../../../../../lib/auth'
import { sendInvitationEmail } from '../../../../../lib/email'
import { inviteUserSchema } from '../../../../../lib/schemas'
import { addHours } from 'date-fns'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)

    const tripId = params.id; // Correctly get tripId from params

    console.log('Invite API: Received tripId:', tripId); // Log tripId

    const body = await request.json()
    const validatedData = inviteUserSchema.parse(body)

    console.log('Invite API: Validated email:', validatedData.email); // Log email

    // Перевірка власника подорожі
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { owner: true }
    })

    if (!trip) {
      console.error('Invite API: Trip not found for ID:', tripId); // Log if trip not found
      return NextResponse.json({ error: 'Подорож не знайдена' }, { status: 404 })
    }

    console.log('Invite API: Trip title:', trip.title); // Log trip title

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
      console.log('Attempting to send email to:', validatedData.email, 'for trip:', trip.title, 'with token:', token); // Log email details
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
