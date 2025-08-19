import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { createTripSchema, searchTripsSchema } from '@/lib/schemas'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { searchParams } = new URL(request.url)

    const search = searchParams.get('search') || undefined
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Validate query parameters
    const validatedQuery = searchTripsSchema.parse({
      search,
      sortBy,
      sortOrder
    })

    // Build where clause
    const whereClause: any = {
      OR: [
        { ownerId: user.id }, // Trips I own
        {
          access: {
            some: {
              userId: user.id
            }
          }
        } // Trips I have access to
      ]
    }

    // Add search filter
    if (validatedQuery.search) {
      whereClause.AND = {
        OR: [
          { title: { contains: validatedQuery.search, mode: 'insensitive' } },
          { description: { contains: validatedQuery.search, mode: 'insensitive' } }
        ]
      }
    }

    // Get trips
    const trips = await prisma.trip.findMany({
      where: whereClause,
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        access: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        _count: {
          select: { places: true }
        }
      },
      orderBy: {
        [validatedQuery.sortBy!]: validatedQuery.sortOrder
      }
    })

    // Add user role to each trip
    const tripsWithRole = trips.map(trip => {
      const isOwner = trip.ownerId === user.id
      const userAccess = trip.access.find(access => access.userId === user.id)

      return {
        ...trip,
        userRole: isOwner ? 'OWNER' : userAccess?.role || null
      }
    })

    return NextResponse.json({ trips: tripsWithRole })
  } catch (error) {
    console.error('Get trips error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Необхідна авторизація' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Помилка отримання подорожей' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    const validatedData = createTripSchema.parse(body)

    // Create trip
    const trip = await prisma.trip.create({
      data: {
        ...validatedData,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        ownerId: user.id
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { places: true }
        }
      }
    })

    return NextResponse.json({
      message: 'Подорож створена успішно',
      trip: {
        ...trip,
        userRole: 'OWNER'
      }
    })
  } catch (error) {
    console.error('Create trip error:', error)

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
      { error: 'Помилка створення подорожі' },
      { status: 500 }
    )
  }
}
