import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { updatePlaceSchema } from '@/lib/schemas'

interface RouteParams {
  params: { id: string; placeId: string }
}

async function checkPlaceAccess(placeId: string, tripId: string, userId: string) {
  const place = await prisma.place.findUnique({
    where: { id: placeId },
    include: {
      trip: {
        include: {
          access: {
            where: { userId }
          }
        }
      }
    }
  })

  if (!place || place.tripId !== tripId) {
    return { hasAccess: false, place: null }
  }

  const isOwner = place.trip.ownerId === userId
  const userAccess = place.trip.access[0]
  const hasAccess = isOwner || !!userAccess

  return { hasAccess, place }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request)
    const tripId = params.id
    const placeId = params.placeId
    const body = await request.json()
    const validatedData = updatePlaceSchema.parse(body)

    const { hasAccess, place } = await checkPlaceAccess(placeId, tripId, user.id)

    if (!hasAccess || !place) {
      return NextResponse.json(
        { error: 'Місце не знайдено або немає доступу' },
        { status: 404 }
      )
    }

    // Update place
    const updatedPlace = await prisma.place.update({
      where: { id: placeId },
      data: validatedData
    })

    return NextResponse.json({
      message: 'Місце оновлено успішно',
      place: updatedPlace
    })
  } catch (error) {
    console.error('Update place error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Необхідна авторизація' },
        { status: 401 }
      )
    }

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Невірні дані', details: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Помилка оновлення місця' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request)
    const tripId = params.id
    const placeId = params.placeId

    const { hasAccess, place } = await checkPlaceAccess(placeId, tripId, user.id)

    if (!hasAccess || !place) {
      return NextResponse.json(
        { error: 'Місце не знайдено або немає доступу' },
        { status: 404 }
      )
    }

    // Delete place
    await prisma.place.delete({
      where: { id: placeId }
    })

    return NextResponse.json({
      message: 'Місце видалено успішно'
    })
  } catch (error) {
    console.error('Delete place error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Необхідна авторизація' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Помилка видалення місця' },
      { status: 500 }
    )
  }
}
