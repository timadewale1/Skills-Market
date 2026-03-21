// src/__tests__/testUtils.ts
import React from 'react'

// Mock auth context
export const createMockAuthContext = (user?: any) => ({
  user: user || null,
  loading: false,
  error: null,
  signupWithEmail: jest.fn(),
  loginWithEmail: jest.fn(),
  logout: jest.fn(),
  updateUserProfile: jest.fn(),
})

// Mock router
export const createMockRouter = () => ({
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
})

// Create mock user data
export const createMockUser = (overrides?: any) => ({
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: 'https://example.com/photo.jpg',
  emailVerified: true,
  ...overrides,
})

// Create mock workspace data
export const createMockWorkspace = (overrides?: any) => ({
  id: 'ws_123',
  title: 'Test Project',
  description: 'Test workspace description',
  clientUid: 'client-123',
  talentUid: 'talent-123',
  budget: 50000,
  status: 'active',
  createdAt: new Date(),
  ...overrides,
})

// Create mock gig data
export const createMockGig = (overrides?: any) => ({
  id: 'gig_123',
  title: 'Test Gig',
  description: 'Test gig description',
  category: 'design',
  budget: {
    min: 10000,
    max: 50000,
    currency: 'NGN',
  },
  duration: '1-3 months',
  skills: ['UI/UX', 'Figma'],
  clientId: 'client-123',
  status: 'open',
  createdAt: new Date(),
  ...overrides,
})

// Create mock review data
export const createMockReview = (overrides?: any) => ({
  id: 'review_123',
  workspaceId: 'ws_123',
  fromUserId: 'client-123',
  toUserId: 'talent-123',
  rating: 5,
  title: 'Excellent work',
  comment: 'Great communication and quality work',
  isPublic: true,
  createdAt: new Date(),
  ...overrides,
})

// Wait for async operations
export const waitFor = (callback: () => void, options = {}) =>
  new Promise((resolve) => {
    const interval = setInterval(() => {
      try {
        callback()
        clearInterval(interval)
        resolve(true)
      } catch (e) {
        // Continue waiting
      }
    }, 50)
    setTimeout(() => {
      clearInterval(interval)
      resolve(false)
    }, (options as any).timeout || 3000)
  })

// Mock fetch for API calls
export const mockFetch = (response: any, init?: any) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(response),
      ...init,
    })
  ) as jest.Mock
}
