import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Токен запрошення не надано' },
        { status: 400 }
      )
    }

    // Find valid invitation
    const invitation = await prisma.invitation.findFirst({
      where: {
        token,
        status: 'PENDING',
        expiresAt: {
          gt: new Date() // Not expired
        }
      },
      include: {
        trip: {
          include: {
            owner: true
          }
        }
      }
    })

    if (!invitation) {
      return NextResponse.json(
        { error: 'Запрошення не знайдено або прострочено' },
        { status: 404 }
      )
    }

    // Check if user is authenticated
    let currentUser
    try {
      currentUser = await requireAuth(request)
    } catch {
      // User is not authenticated, redirect to login with invitation token
      return NextResponse.json({
        redirectToLogin: true,
        message: 'Для прийняття запрошення необхідно увійти в систему',
        invitationToken: token
      })
    }

    // Check if the authenticated user's email matches the invitation
    if (currentUser.email !== invitation.email) {
      return NextResponse.json(
        { error: 'Це запрошення призначене для іншого email адреси' },
        { status: 403 }
      )
    }

    // Check if user already has access
    const existingAccess = await prisma.tripAccess.findFirst({
      where: {
        tripId: invitation.tripId,
        userId: currentUser.id
      }
    })

    if (existingAccess) {
      // Update invitation status and return success
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          receiverId: currentUser.id
        }
      })

      return NextResponse.json({
        message: 'Ви вже маєте доступ до цієї подорожі',
        trip: invitation.trip
      })
    }

    // Create trip access and update invitation in a transaction
    await prisma.$transaction([
      prisma.tripAccess.create({
        data: {
          userId: currentUser.id,
          tripId: invitation.tripId,
          role: 'COLLABORATOR'
        }
      }),
      prisma.invitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          receiverId: currentUser.id
        }
      })
    ])

    return NextResponse.json({
      message: 'Запрошення прийнято! Тепер ви можете співпрацювати над цією подорожжю.',
      trip: invitation.trip
    })
  } catch (error) {
    console.error('Accept invitation error:', error)

    return NextResponse.json(
      { error: 'Помилка прийняття запрошення' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}
