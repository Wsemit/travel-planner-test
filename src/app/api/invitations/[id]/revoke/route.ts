import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'
import { requireAuth } from '../../../../../lib/auth'

interface RouteParams {
  params: { id: string }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request)
    const invitationId = params.id

    // Find invitation and check if user is the sender
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      include: {
        trip: true
      }
    })

    if (!invitation) {
      return NextResponse.json(
        { error: 'Запрошення не знайдено' },
        { status: 404 }
      )
    }

    // Check if user is the trip owner (invitation sender)
    if (invitation.trip.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Тільки власник подорожі може скасувати запрошення' },
        { status: 403 }
      )
    }

    // Check if invitation is still pending
    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Це запрошення вже не можна скасувати' },
        { status: 400 }
      )
    }

    // Update invitation status to revoked
    await prisma.invitation.update({
      where: { id: invitationId },
      data: { status: 'REVOKED' }
    })

    return NextResponse.json({
      message: 'Запрошення скасовано успішно'
    })
  } catch (error) {
    console.error('Revoke invitation error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Необхідна авторизація' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Помилка скасування запрошення' },
      { status: 500 }
    )
  }
}
