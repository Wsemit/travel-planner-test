import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { requireAuth } from '../../../../lib/auth'
import { updateTripSchema } from '../../../../lib/schemas'

async function getUserTripAccess(tripId: string, userId: string) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { access: { where: { userId } } }
  })

  if (!trip) return null

  const isOwner = trip.ownerId === userId
  const userAccess = trip.access[0]

  return {
    trip,
    isOwner,
    userRole: isOwner ? 'OWNER' : userAccess?.role || 'VIEWER', // Default to 'VIEWER' if role is null
    hasAccess: isOwner || !!userAccess
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const segments = request.nextUrl.pathname.split('/').filter(Boolean)
    const tripId = segments[segments.length - 2] // [id]

    const accessInfo = await getUserTripAccess(tripId, user.id)

    if (!accessInfo || !accessInfo.hasAccess) {
      return NextResponse.json({ error: 'Подорож не знайдена або немає доступу' }, { status: 404 })
    }

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        places: { orderBy: { dayNumber: 'asc' } },
        access: { include: { user: { select: { id: true, name: true, email: true } } } },
        invitations: { where: { status: 'PENDING' }, select: { id: true, email: true, createdAt: true, expiresAt: true } }
      }
    })

    return NextResponse.json({ trip: { ...trip, userRole: accessInfo.userRole } })
  } catch (error) {
    console.error('Get trip error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Необхідна авторизація' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Помилка отримання подорожі' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const segments = request.nextUrl.pathname.split('/').filter(Boolean)
    const tripId = segments[segments.length - 2] // [id]

    const body = await request.json()
    const validatedData = updateTripSchema.parse(body)

    const accessInfo = await getUserTripAccess(tripId, user.id)

    if (!accessInfo || !accessInfo.isOwner) {
      return NextResponse.json({ error: 'Немає прав для редагування цієї подорожі' }, { status: 403 })
    }

    const updatedTrip = await prisma.trip.update({
      where: { id: tripId },
      data: {
        ...validatedData,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { places: true } }
      }
    })

    return NextResponse.json({ message: 'Подорож оновлена успішно', trip: { ...updatedTrip, userRole: 'OWNER' } })
  } catch (error) {
    console.error('Update trip error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Необхідна авторизація' }, { status: 401 })
    }
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Невірні дані', details: error }, { status: 400 })
    }
    return NextResponse.json({ error: 'Помилка оновлення подорожі' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const segments = request.nextUrl.pathname.split('/').filter(Boolean)
    const tripId = segments[segments.length - 2] // [id]

    const accessInfo = await getUserTripAccess(tripId, user.id)

    if (!accessInfo || !accessInfo.isOwner) {
      return NextResponse.json({ error: 'Немає прав для видалення цієї подорожі' }, { status: 403 })
    }

    await prisma.trip.delete({ where: { id: tripId } })

    return NextResponse.json({ message: 'Подорож видалена успішно' })
  } catch (error) {
    console.error('Delete trip error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Необхідна авторизація' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Помилка видалення подорожі' }, { status: 500 })
  }
}
