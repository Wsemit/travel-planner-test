'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '../../../lib/api'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Alert, AlertDescription } from '../../../components/ui/alert'
import { Navigation } from '../../../components/Navigation'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [isLoading, setIsLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setError('Токен верифікації не надано')
      setIsLoading(false)
      return
    }

    verifyEmail()
  }, [token])

  const verifyEmail = async () => {
    try {
      await api.verifyEmail(token!)
      setSuccess(true)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Помилка верифікації email')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Верифікація Email</CardTitle>
            <CardDescription>
              Підтвердження вашої email адреси
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            {isLoading ? (
              <div className="py-8">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-600">Перевіряємо ваш токен...</p>
              </div>
            ) : success ? (
              <div className="py-8">
                <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Email підтверджено!</h3>
                <p className="text-gray-600 mb-6">
                  Ваша email адреса успішно підтверджена. Тепер ви можете користуватися всіма функціями сервісу.
                </p>
                <div className="space-y-2">
                  <Link href="/trips" className="block">
                    <Button className="w-full">Перейти до подорожей</Button>
                  </Link>
                  <Link href="/auth/login" className="block">
                    <Button variant="outline" className="w-full">Увійти в акаунт</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="py-8">
                <XCircle className="mx-auto h-12 w-12 text-red-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Помилка верифікації</h3>
                <Alert variant="destructive" className="mb-6">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
                <p className="text-gray-600 mb-6">
                  Можливо, токен прострочений або невірний. Спробуйте зареєструватися знову або зв'яжіться з підтримкою.
                </p>
                <div className="space-y-2">
                  <Link href="/auth/register" className="block">
                    <Button className="w-full">Реєстрація</Button>
                  </Link>
                  <Link href="/auth/login" className="block">
                    <Button variant="outline" className="w-full">Увійти в акаунт</Button>
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
