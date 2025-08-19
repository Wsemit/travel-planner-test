'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { api } from '../../../lib/api'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card'
import { Alert, AlertDescription } from '../../../components/ui/alert'
import { Navigation } from '../../../components/Navigation'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic';

function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const [token, setToken] = useState<string | null>(null)
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    const t = searchParams.get('token')
    if (!t) {
      setError('Токен верифікації не надано')
      setStatus('error')
      return
    }
    setToken(t)
    setStatus('loading')

    const verify = async () => {
      try {
        await api.verifyEmail(t)
        setStatus('success')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Помилка верифікації email')
        setStatus('error')
      }
    }

    verify()
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Верифікація Email</CardTitle>
            <CardDescription>Підтвердження вашої email адреси</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            {status === 'loading' && (
              <div className="py-8">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-600">Перевіряємо токен...</p>
              </div>
            )}
            {status === 'success' && (
              <div className="py-8">
                <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Email підтверджено!</h3>
                <p className="text-gray-600 mb-6">Ваша email адреса успішно підтверджена.</p>
                <Link href="/trips">
                  <Button className="w-full">Перейти до подорожей</Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="outline" className="w-full mt-2">Увійти в акаунт</Button>
                </Link>
              </div>
            )}
            {status === 'error' && (
              <div className="py-8">
                <XCircle className="mx-auto h-12 w-12 text-red-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Помилка верифікації</h3>
                <Alert variant="destructive" className="mb-6">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
                <Link href="/auth/register">
                  <Button className="w-full">Реєстрація</Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="outline" className="w-full mt-2">Увійти в акаунт</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

const DynamicVerifyEmailPage = dynamic(() => Promise.resolve(VerifyEmailPage), {
  ssr: false,
});

export default DynamicVerifyEmailPage;
