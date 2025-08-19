'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../contexts/AuthContext'
import { api } from '../../../lib/api'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Textarea } from '../../../components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog'
import { Alert, AlertDescription } from '../../../components/ui/alert'
import { Navigation } from '../../../components/Navigation'
import {
  Plus,
  Edit,
  Trash2,
  Users,
  Calendar,
  MapPin,
  ArrowLeft,
  MoreHorizontal,
  UserPlus
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { uk } from 'date-fns/locale'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu'

interface Trip {
  id: string
  title: string
  description?: string
  startDate?: string
  endDate?: string
  userRole: 'OWNER' | 'COLLABORATOR'
  owner: {
    id: string
    name?: string
    email: string
  }
  places: Place[]
  access: Array<{
    id: string
    role: string
    user: {
      id: string
      name?: string
      email: string
    }
  }>
  invitations: Array<{
    id: string
    email: string
    createdAt: string
    expiresAt: string
  }>
}

interface Place {
  id: string
  locationName: string
  notes?: string
  dayNumber: number
  createdAt: string
}

interface TripDetailsPageProps {
  params: Promise<{ id: string }>
}

export default function TripDetailsPage({ params }: TripDetailsPageProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  // ✅ unwrap params
  const { id: tripId } = React.use(params)

  const [trip, setTrip] = useState<Trip | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showAddPlace, setShowAddPlace] = useState(false)
  const [showEditTrip, setShowEditTrip] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [editingPlace, setEditingPlace] = useState<Place | null>(null)

  const [placeForm, setPlaceForm] = useState({ locationName: '', notes: '', dayNumber: 1 })
  const [tripForm, setTripForm] = useState({ title: '', description: '', startDate: '', endDate: '' })
  const [inviteEmail, setInviteEmail] = useState('')

  // Завантаження подорожі при логіні користувача
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
      return
    }
    if (user) loadTrip()
  }, [user, loading, router, tripId])

  useEffect(() => {
    if (trip) {
      setTripForm({
        title: trip.title,
        description: trip.description || '',
        startDate: trip.startDate ? trip.startDate.split('T')[0] : '',
        endDate: trip.endDate ? trip.endDate.split('T')[0] : ''
      })
    }
  }, [trip])

  const loadTrip = async () => {
    try {
      setIsLoading(true)
      const response = await api.getTrip(tripId)
      setTrip(response.trip)
    } catch (error) {
      toast.error('Помилка завантаження подорожі')
      router.push('/trips')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddPlace = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.createPlace(tripId, placeForm)
      toast.success('Місце додано!')
      setShowAddPlace(false)
      setPlaceForm({ locationName: '', notes: '', dayNumber: 1 })
      loadTrip()
    } catch (error) {
      toast.error('Помилка додавання місця')
    }
  }

  const handleEditPlace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPlace) return
    try {
      await api.updatePlace(tripId, editingPlace.id, placeForm)
      toast.success('Місце оновлено!')
      setEditingPlace(null)
      setPlaceForm({ locationName: '', notes: '', dayNumber: 1 })
      loadTrip()
    } catch (error) {
      toast.error('Помилка оновлення місця')
    }
  }

  const handleDeletePlace = async (placeId: string) => {
    if (!confirm('Ви впевнені, що хочете видалити це місце?')) return
    try {
      await api.deletePlace(tripId, placeId)
      toast.success('Місце видалено!')
      loadTrip()
    } catch (error) {
      toast.error('Помилка видалення місця')
    }
  }

  const handleEditTrip = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const tripData = {
        title: tripForm.title,
        description: tripForm.description || undefined,
        startDate: tripForm.startDate ? new Date(tripForm.startDate).toISOString() : null,
        endDate: tripForm.endDate ? new Date(tripForm.endDate).toISOString() : null
      }
      await api.updateTrip(tripId, tripData)
      toast.success('Подорож оновлена!')
      setShowEditTrip(false)
      loadTrip()
    } catch (error) {
      toast.error('Помилка оновлення подорожі')
    }
  }

  const handleDeleteTrip = async () => {
    if (!confirm('Ви впевнені, що хочете видалити цю подорож?')) return
    try {
      await api.deleteTrip(tripId)
      toast.success('Подорож видалена!')
      router.push('/trips')
    } catch (error) {
      toast.error('Помилка видалення подорожі')
    }
  }

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.inviteUser(tripId, inviteEmail)
      toast.success('Запрошення надіслано!')
      setShowInvite(false)
      setInviteEmail('')
      loadTrip()
    } catch (error) {
      toast.error('Помилка надсилання запрошення')
    }
  }

  const startEditPlace = (place: Place) => {
    setEditingPlace(place)
    setPlaceForm({
      locationName: place.locationName,
      notes: place.notes || '',
      dayNumber: place.dayNumber
    })
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Завантаження...</p>
        </div>
      </div>
    )
  }

  if (!user || !trip) return null

  // групування та сортування днів
  const groupedPlaces = trip.places.reduce((acc, place) => {
    if (!acc[place.dayNumber]) acc[place.dayNumber] = []
    acc[place.dayNumber].push(place)
    return acc
  }, {} as Record<number, Place[]>)

  const sortedDays = Object.keys(groupedPlaces).map(Number).sort((a, b) => a - b)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link href="/trips">
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Назад
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{trip.title}</h1>
              <div className="flex items-center gap-4 mt-2">
                <Badge variant={trip.userRole === 'OWNER' ? 'default' : 'secondary'}>
                  {trip.userRole === 'OWNER' ? 'Власник' : 'Співавтор'}
                </Badge>
                {trip.startDate && trip.endDate && (
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    {format(new Date(trip.startDate), 'dd MMM', { locale: uk })} - {format(new Date(trip.endDate), 'dd MMM yyyy', { locale: uk })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {trip.userRole === 'OWNER' && (
              <>
                <Button onClick={() => setShowInvite(true)} variant="outline">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Запросити
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setShowEditTrip(true)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Редагувати
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDeleteTrip} className="text-red-600">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Видалити
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>

        {trip.description && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <p className="text-gray-700">{trip.description}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Places Section */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Місця подорожі</h2>
              <Button onClick={() => setShowAddPlace(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Додати місце
              </Button>
            </div>

            {sortedDays.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Ще немає місць</h3>
                  <p className="text-gray-600 mb-4">Додайте перше місце для вашої подорожі</p>
                  <Button onClick={() => setShowAddPlace(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Додати місце
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {sortedDays.map(day => (
                  <Card key={day}>
                    <CardHeader>
                      <CardTitle className="text-lg">День {day}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {groupedPlaces[day].map(place => (
                          <div key={place.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{place.locationName}</h4>
                              {place.notes && (
                                <p className="text-gray-600 text-sm mt-1">{place.notes}</p>
                              )}
                            </div>
                            <div className="flex gap-1 ml-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startEditPlace(place)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeletePlace(place.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Collaborators */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Users className="h-5 w-5 mr-2" />
                  Учасники
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{trip.owner.name || trip.owner.email}</p>
                      <p className="text-sm text-gray-600">Власник</p>
                    </div>
                    <Badge>Власник</Badge>
                  </div>

                  {trip.access.map(access => (
                    <div key={access.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{access.user.name || access.user.email}</p>
                        <p className="text-sm text-gray-600">Співавтор</p>
                      </div>
                      <Badge variant="secondary">Співавтор</Badge>
                    </div>
                  ))}

                  {trip.invitations.length > 0 && (
                    <>
                      <div className="border-t pt-3 mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">Очікують підтвердження</p>
                        {trip.invitations.map(invitation => (
                          <div key={invitation.id} className="flex items-center justify-between">
                            <p className="text-sm text-gray-600">{invitation.email}</p>
                            <Badge variant="outline">Очікує</Badge>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Add Place Dialog */}
      <Dialog open={showAddPlace} onOpenChange={setShowAddPlace}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Додати місце</DialogTitle>
            <DialogDescription>
              Додайте нове місце до вашої подорожі
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddPlace} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="locationName">Назва місця *</Label>
              <Input
                id="locationName"
                value={placeForm.locationName}
                onChange={(e) => setPlaceForm(prev => ({ ...prev, locationName: e.target.value }))}
                placeholder="Наприклад: Ейфелева вежа"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Примітки</Label>
              <Textarea
                id="notes"
                value={placeForm.notes}
                onChange={(e) => setPlaceForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Додаткова інформація..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dayNumber">День подорожі *</Label>
              <Input
                id="dayNumber"
                type="number"
                min="1"
                value={placeForm.dayNumber}
                onChange={(e) => setPlaceForm(prev => ({ ...prev, dayNumber: parseInt(e.target.value) }))}
                required
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">Додати</Button>
              <Button type="button" variant="outline" onClick={() => setShowAddPlace(false)}>
                Скасувати
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Place Dialog */}
      <Dialog open={!!editingPlace} onOpenChange={() => setEditingPlace(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редагувати місце</DialogTitle>
            <DialogDescription>
              Оновіть інформацію про місце
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditPlace} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editLocationName">Назва місця *</Label>
              <Input
                id="editLocationName"
                value={placeForm.locationName}
                onChange={(e) => setPlaceForm(prev => ({ ...prev, locationName: e.target.value }))}
                placeholder="Наприклад: Ейфелева вежа"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editNotes">Примітки</Label>
              <Textarea
                id="editNotes"
                value={placeForm.notes}
                onChange={(e) => setPlaceForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Додаткова інформація..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editDayNumber">День подорожі *</Label>
              <Input
                id="editDayNumber"
                type="number"
                min="1"
                value={placeForm.dayNumber}
                onChange={(e) => setPlaceForm(prev => ({ ...prev, dayNumber: parseInt(e.target.value) }))}
                required
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">Зберегти</Button>
              <Button type="button" variant="outline" onClick={() => setEditingPlace(null)}>
                Скасувати
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Trip Dialog */}
      <Dialog open={showEditTrip} onOpenChange={setShowEditTrip}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редагувати подорож</DialogTitle>
            <DialogDescription>
              Оновіть інформацію про подорож
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditTrip} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editTitle">Назва подорожі *</Label>
              <Input
                id="editTitle"
                value={tripForm.title}
                onChange={(e) => setTripForm(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editDescription">Опис</Label>
              <Textarea
                id="editDescription"
                value={tripForm.description}
                onChange={(e) => setTripForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editStartDate">Дата початку</Label>
                <Input
                  id="editStartDate"
                  type="date"
                  value={tripForm.startDate}
                  onChange={(e) => setTripForm(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editEndDate">Дата завершення</Label>
                <Input
                  id="editEndDate"
                  type="date"
                  value={tripForm.endDate}
                  onChange={(e) => setTripForm(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">Зберегти</Button>
              <Button type="button" variant="outline" onClick={() => setShowEditTrip(false)}>
                Скасувати
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Invite User Dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Запросити користувача</DialogTitle>
            <DialogDescription>
              Надішліть запрошення для співпраці над цією подорожжю
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInviteUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inviteEmail">Email користувача *</Label>
              <Input
                id="inviteEmail"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="user@example.com"
                required
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">Надіслати запрошення</Button>
              <Button type="button" variant="outline" onClick={() => setShowInvite(false)}>
                Скасувати
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
