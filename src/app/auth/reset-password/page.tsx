'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { api } from '../../../lib/api'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card'
import { Alert, AlertDescription } from '../../../components/ui/alert'
import { Navigation } from '../../../components/Navigation'
import { toast } from 'sonner'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic';

function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const [token, setToken] = useState<string | null>(null)
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' })
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Встановлюємо токен лише на клієнті
  useEffect(() => {
    const t = searchParams.get('token')
    if (!t) {
      setError('Токен відновлення не надано')
      setStatus('error')
      return
    }
    setToken(t)
    setStatus('loading')
  }, [searchParams])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setIsSubmitting(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Паролі не співпадають')
      setIsSubmitting(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Пароль має містити мінімум 6 символів')
      setIsSubmitting(false)
      return
    }

    try {
      await api.resetPassword(token, formData.password)
      toast.success('Пароль успішно оновлено!')
      setStatus('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка оновлення паролю')
      setStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Новий пароль</CardTitle>
            <CardDescription>Введіть новий пароль для вашого акаунту</CardDescription>
          </CardHeader>
          <CardContent>
            {status === 'loading' && (
              <div className="py-8 text-center">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-600">Перевіряємо токен...</p>
              </div>
            )}
            {status === 'success' && (
              <div className="text-center py-8">
                <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Пароль оновлено!</h3>
                <p className="text-gray-600 mb-6">
                  Ваш пароль успішно оновлено. Тепер ви можете увійти з новим паролем.
                </p>
                <Link href="/auth/login">
                  <Button className="w-full">Увійти в акаунт</Button>
                </Link>
              </div>
            )}
            {status === 'error' && (
              <div className="text-center py-8">
                <XCircle className="mx-auto h-12 w-12 text-red-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Помилка</h3>
                <Alert variant="destructive" className="mb-6">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
                {token && (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Новий пароль</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Підтвердіть пароль</Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? 'Оновлення...' : 'Оновити пароль'}
                    </Button>
                  </form>
                )}
                {!token && (
                  <Link href="/auth/forgot-password">
                    <Button>Запросити нове посилання</Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

const DynamicResetPasswordPage = dynamic(() => Promise.resolve(ResetPasswordPage), {
  ssr: false,
});

export default DynamicResetPasswordPage;
