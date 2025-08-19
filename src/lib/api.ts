import { SearchTripsInput } from './schemas'

class ApiClient {
  private baseUrl = ''

  private async request(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('auth_token')

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      ...options,
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, config)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong')
    }

    return data
  }

  // Auth methods
  async login(email: string, password: string) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async register(email: string, password: string, name?: string) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    })
  }

  async forgotPassword(email: string) {
    return this.request('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }

  async resetPassword(token: string, password: string) {
    return this.request('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    })
  }

  async verifyEmail(token: string) {
    return this.request(`/api/auth/verify-email?token=${token}`, {
      method: 'POST',
    })
  }

  // Trip methods
  async getTrips(params?: SearchTripsInput) {
    const searchParams = new URLSearchParams()
    if (params?.search) searchParams.append('search', params.search)
    if (params?.sortBy) searchParams.append('sortBy', params.sortBy)
    if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder)

    const queryString = searchParams.toString()
    return this.request(`/api/trips${queryString ? `?${queryString}` : ''}`)
  }

  async getTrip(id: string) {
    return this.request(`/api/trips/${id}`)
  }

  async createTrip(data: any) {
    return this.request('/api/trips', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateTrip(id: string, data: any) {
    return this.request(`/api/trips/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteTrip(id: string) {
    return this.request(`/api/trips/${id}`, {
      method: 'DELETE',
    })
  }

  // Place methods
  async getPlaces(tripId: string) {
    return this.request(`/api/trips/${tripId}/places`)
  }

  async createPlace(tripId: string, data: any) {
    return this.request(`/api/trips/${tripId}/places`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updatePlace(tripId: string, placeId: string, data: any) {
    return this.request(`/api/trips/${tripId}/places/${placeId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deletePlace(tripId: string, placeId: string) {
    return this.request(`/api/trips/${tripId}/places/${placeId}`, {
      method: 'DELETE',
    })
  }

  // Invitation methods
  async inviteUser(tripId: string, email: string) {
    return this.request(`/api/trips/${tripId}/invite`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }

  async acceptInvitation(token: string) {
    return this.request(`/api/invitations/accept?token=${token}`, {
      method: 'POST',
    })
  }

  async revokeInvitation(invitationId: string) {
    return this.request(`/api/invitations/${invitationId}/revoke`, {
      method: 'POST',
    })
  }
}

export const api = new ApiClient()
