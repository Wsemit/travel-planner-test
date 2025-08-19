import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'
import { requireAuth } from '../../../../../lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    // Витягаємо [id] динамічного маршруту
    const invitationId = request.nextUrl.pathname
      .split('/')
      .filter(Boolean) // видаляємо порожні елементи
      .slice(-2, -1)[0] // беремо передостанній сегмент перед 'revoke'

    // Знаходимо запрошення та перевіряємо користувача
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      include: { trip: true }
    })

    if (!invitation) {
      return NextResponse.json({ error: 'Запрошення не знайдено' }, { status: 404 })
    }

    if (invitation.trip.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Тільки власник подорожі може скасувати запрошення' },
        { status: 403 }
      )
    }

    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Це запрошення вже не можна скасувати' },
        { status: 400 }
      )
    }

    // Оновлюємо статус запрошення
    await prisma.invitation.update({
      where: { id: invitationId },
      data: { status: 'REVOKED' }
    })

    return NextResponse.json({ message: 'Запрошення скасовано успішно' })
  } catch (error) {
    console.error('Revoke invitation error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Необхідна авторизація' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Помилка скасування запрошення' }, { status: 500 })
  }
}
