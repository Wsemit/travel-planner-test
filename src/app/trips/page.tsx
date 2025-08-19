'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../lib/api'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Navigation } from '../../components/Navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { Plus, Search, MapPin, Users, Calendar, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { uk } from 'date-fns/locale'

interface Trip {
  id: string
  title: string
  description?: string
  startDate?: string
  endDate?: string
  createdAt: string
  owner: {
    id: string
    name?: string
    email: string
  }
  userRole: 'OWNER' | 'COLLABORATOR'
  _count: {
    places: number
  }
}

export default function TripsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [trips, setTrips] = useState<Trip[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'createdAt' | 'title' | 'startDate'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
      return
    }

    if (user) {
      loadTrips()
    }
  }, [user, loading, router, search, sortBy, sortOrder])

  const loadTrips = async () => {
    try {
      setIsLoading(true)
      const response = await api.getTrips({ search, sortBy, sortOrder })
      setTrips(response.trips)
    } catch (error) {
      toast.error('Помилка завантаження подорожей')
      console.error('Load trips error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTrip = () => {
    router.push('/trips/create')
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Завантаження...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Мої подорожі</h1>
            <p className="text-gray-600">
              Тут ви можете керувати своїми подорожами та переглядати ті, до яких маєте доступ
            </p>
          </div>
          <Button onClick={handleCreateTrip} className="mt-4 sm:mt-0">
            <Plus className="mr-2 h-4 w-4" />
            Нова подорож
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Пошук подорожей..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'createdAt' | 'title' | 'startDate')}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Сортування" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">За датою створення</SelectItem>
              <SelectItem value="title">За назвою</SelectItem>
              <SelectItem value="startDate">За датою початку</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as 'asc' | 'desc')}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Порядок" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">↓ Спадання</SelectItem>
              <SelectItem value="asc">↑ Зростання</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Trips Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Завантаження подорожей...</p>
          </div>
        ) : trips.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {search ? 'Подорожі не знайдено' : 'Ще немає подорожей'}
            </h3>
            <p className="text-gray-600 mb-6">
              {search
                ? 'Спробуйте змінити пошуковий запит'
                : 'Створіть свою першу подорож, щоб розпочати планування'
              }
            </p>
            {!search && (
              <Button onClick={handleCreateTrip}>
                <Plus className="mr-2 h-4 w-4" />
                Створити подорож
              </Button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <Link key={trip.id} href={`/trips/${trip.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="line-clamp-2">{trip.title}</CardTitle>
                      <Badge variant={trip.userRole === 'OWNER' ? 'default' : 'secondary'}>
                        {trip.userRole === 'OWNER' ? 'Власник' : 'Співавтор'}
                      </Badge>
                    </div>
                    {trip.description && (
                      <CardDescription className="line-clamp-2">
                        {trip.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-gray-600">
                      {trip.startDate && trip.endDate && (
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4" />
                          {format(new Date(trip.startDate), 'dd MMM', { locale: uk })} - {format(new Date(trip.endDate), 'dd MMM yyyy', { locale: uk })}
                        </div>
                      )}

                      <div className="flex items-center">
                        <MapPin className="mr-2 h-4 w-4" />
                        {trip._count.places} {trip._count.places === 1 ? 'місце' : 'місць'}
                      </div>

                      <div className="flex items-center">
                        <Users className="mr-2 h-4 w-4" />
                        {trip.owner.name || trip.owner.email}
                      </div>

                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4" />
                        {format(new Date(trip.createdAt), 'dd MMM yyyy', { locale: uk })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
