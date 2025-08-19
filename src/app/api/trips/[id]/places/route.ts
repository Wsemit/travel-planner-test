import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'
import { requireAuth } from '../../../../../lib/auth'
import { createPlaceSchema } from '../../../../../lib/schemas'

async function checkTripAccess(tripId: string, userId: string) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { access: { where: { userId } } }
  })

  if (!trip) return { hasAccess: false, trip: null }

  const isOwner = trip.ownerId === userId
  const userAccess = trip.access[0]
  const hasAccess = isOwner || !!userAccess

  return { hasAccess, trip, isOwner, userRole: isOwner ? 'OWNER' : userAccess?.role || null }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    const segments = request.nextUrl.pathname.split('/').filter(Boolean)
    const tripId = segments[segments.length - 2] // передостанній сегмент - [id]

    const { hasAccess } = await checkTripAccess(tripId, user.id)

    if (!hasAccess) {
      return NextResponse.json({ error: 'Немає доступу до цієї подорожі' }, { status: 403 })
    }

    const places = await prisma.place.findMany({
      where: { tripId },
      orderBy: { dayNumber: 'asc' }
    })

    return NextResponse.json({ places })
  } catch (error) {
    console.error('Get places error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Необхідна авторизація' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Помилка отримання місць' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    const segments = request.nextUrl.pathname.split('/').filter(Boolean)
    const tripId = segments[segments.length - 2] // передостанній сегмент - [id]

    const body = await request.json()
    const validatedData = createPlaceSchema.parse(body)

    const { hasAccess } = await checkTripAccess(tripId, user.id)

    if (!hasAccess) {
      return NextResponse.json({ error: 'Немає доступу до цієї подорожі' }, { status: 403 })
    }

    const place = await prisma.place.create({
      data: { ...validatedData, tripId }
    })

    return NextResponse.json({ message: 'Місце додано успішно', place })
  } catch (error) {
    console.error('Create place error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Необхідна авторизація' }, { status: 401 })
    }
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Невірні дані', details: error }, { status: 400 })
    }
    return NextResponse.json({ error: 'Помилка створення місця' }, { status: 500 })
  }
}
