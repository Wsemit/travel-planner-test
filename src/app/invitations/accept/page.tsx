'use client'
export const dynamicParams = true // примусово динамічні параметри

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../../../contexts/AuthContext'
import { api } from '../../../lib/api'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Alert, AlertDescription } from '../../../components/ui/alert'
import { Navigation } from '../../../components/Navigation'
import { CheckCircle, XCircle, Loader2, Users } from 'lucide-react'
import { toast } from 'sonner'
import dynamic from 'next/dynamic';

function AcceptInvitationPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [trip, setTrip] = useState<any>(null)
  const [needsLogin, setNeedsLogin] = useState(false)

  // Отримуємо токен тільки на клієнті
  useEffect(() => {
    const t = searchParams.get('token')
    if (!t) {
      setError('Токен запрошення не надано')
      setIsLoading(false)
      return
    }
    setToken(t)
  }, [searchParams])

  // Приймаємо запрошення після того, як токен і завантаження користувача готові
  useEffect(() => {
    if (!token || loading) return

    const acceptInvitation = async () => {
      setIsLoading(true)
      try {
        const response = await api.acceptInvitation(token)
        if (response.redirectToLogin) {
          setNeedsLogin(true)
          setError('Для прийняття запрошення необхідно увійти в систему')
        } else {
          setSuccess(true)
          setTrip(response.trip)
          toast.success('Запрошення прийнято!')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Помилка прийняття запрошення')
      } finally {
        setIsLoading(false)
      }
    }

    acceptInvitation()
  }, [token, loading])

  const handleLoginRedirect = () => {
    if (token) localStorage.setItem('pending_invitation_token', token)
    router.push('/auth/login')
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8 max-w-md">
          <Card>
            <CardContent className="text-center py-8">
              <XCircle className="mx-auto h-12 w-12 text-red-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Невірне посилання</h3>
              <p className="text-gray-600 mb-6">Посилання запрошення невірне або не надано.</p>
              <Link href="/">
                <Button>На головну</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Запрошення до співпраці</CardTitle>
            <CardDescription>Прийняття запрошення для участі в подорожі</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            {isLoading ? (
              <div className="py-8">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-600">Обробляємо запрошення...</p>
              </div>
            ) : success ? (
              <div className="py-8">
                <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Запрошення прийнято!</h3>
                <p className="text-gray-600 mb-2">Ви успішно приєдналися до подорожі</p>
                {trip && <p className="font-medium text-gray-900 mb-6">"{trip.title}"</p>}
                <div className="space-y-2">
                  {trip && (
                    <Link href={`/trips/${trip.id}`} className="block">
                      <Button className="w-full">Перейти до подорожі</Button>
                    </Link>
                  )}
                  <Link href="/trips" className="block">
                    <Button variant="outline" className="w-full">Всі мої подорожі</Button>
                  </Link>
                </div>
              </div>
            ) : needsLogin ? (
              <div className="py-8">
                <Users className="mx-auto h-12 w-12 text-blue-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Необхідна авторизація</h3>
                <Alert className="mb-6">
                  <AlertDescription>Для прийняття запрошення спочатку увійдіть в систему або створіть акаунт.</AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Button onClick={handleLoginRedirect} className="w-full">Увійти в акаунт</Button>
                  <Link href="/auth/register" className="block">
                    <Button variant="outline" className="w-full">Створити акаунт</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="py-8">
                <XCircle className="mx-auto h-12 w-12 text-red-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Помилка запрошення</h3>
                <Alert variant="destructive" className="mb-6">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Link href="/trips" className="block">
                    <Button className="w-full">Мої подорожі</Button>
                  </Link>
                  <Link href="/" className="block">
                    <Button variant="outline" className="w-full">На головну</Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

const DynamicAcceptInvitationPage = dynamic(() => Promise.resolve(AcceptInvitationPage), {
  ssr: false,
});

export default DynamicAcceptInvitationPage;
