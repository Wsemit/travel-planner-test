import { z } from 'zod'

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email('Некоректний email'),
  password: z.string().min(6, 'Пароль має містити мінімум 6 символів'),
  name: z.string().min(2, "Ім'я має містити мінімум 2 символи").optional()
})

export const loginSchema = z.object({
  email: z.string().email('Некоректний email'),
  password: z.string().min(1, 'Пароль обов\'язковий')
})

export const resetPasswordRequestSchema = z.object({
  email: z.string().email('Некоректний email')
})

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6, 'Пароль має містити мінімум 6 символів')
})

// Trip schemas
export const createTripSchema = z.object({
  title: z.string().min(1, 'Назва подорожі обов\'язкова'),
  description: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate)
    }
    return true
  },
  {
    message: 'Дата початку не може бути пізніше дати завершення',
    path: ['endDate']
  }
)

export const updateTripSchema = z.object({
  title: z.string().min(1, 'Назва подорожі обов\'язкова').optional(),
  description: z.string().optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable()
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate)
    }
    return true
  },
  {
    message: 'Дата початку не може бути пізніше дати завершення',
    path: ['endDate']
  }
)

// Place schemas
export const createPlaceSchema = z.object({
  locationName: z.string().min(1, 'Назва місця обов\'язкова'),
  notes: z.string().optional(),
  dayNumber: z.number().int().min(1, 'Номер дня має бути позитивним числом')
})

export const updatePlaceSchema = z.object({
  locationName: z.string().min(1, 'Назва місця обов\'язкова').optional(),
  notes: z.string().optional(),
  dayNumber: z.number().int().min(1, 'Номер дня має бути позитивним числом').optional()
})

// Invitation schemas
export const inviteUserSchema = z.object({
  email: z.string().email('Некоректний email')
})

// Query schemas
export const searchTripsSchema = z.object({
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'title', 'startDate']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
})

// Types
export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ResetPasswordRequestInput = z.infer<typeof resetPasswordRequestSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type CreateTripInput = z.infer<typeof createTripSchema>
export type UpdateTripInput = z.infer<typeof updateTripSchema>
export type CreatePlaceInput = z.infer<typeof createPlaceSchema>
export type UpdatePlaceInput = z.infer<typeof updatePlaceSchema>
export type InviteUserInput = z.infer<typeof inviteUserSchema>
export type SearchTripsInput = z.infer<typeof searchTripsSchema>
