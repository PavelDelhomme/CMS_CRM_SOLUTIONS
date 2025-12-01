import userService from '@/services/user.service'
import api from '@/lib/api'

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}))

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getAll', () => {
    it('should fetch all users', async () => {
      const mockUsers = [
        { id: 1, email: 'user1@test.com', role: 'operator' },
        { id: 2, email: 'user2@test.com', role: 'tenant-admin' },
      ]
      ;(api.get as jest.Mock).mockResolvedValue({ data: mockUsers })

      const result = await userService.getAll()

      expect(api.get).toHaveBeenCalledWith('/users/', { params: undefined })
      expect(result).toEqual(mockUsers)
    })

    it('should handle paginated response', async () => {
      const mockResponse = {
        data: {
          results: [
            { id: 1, email: 'user1@test.com' },
            { id: 2, email: 'user2@test.com' },
          ],
          count: 2,
        },
      }
      ;(api.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await userService.getAll()

      expect(result).toEqual(mockResponse.data.results)
    })

    it('should pass query parameters', async () => {
      ;(api.get as jest.Mock).mockResolvedValue({ data: [] })

      await userService.getAll({ search: 'test', status: 'active' })

      expect(api.get).toHaveBeenCalledWith('/users/', {
        params: { search: 'test', status: 'active' },
      })
    })
  })

  describe('getById', () => {
    it('should fetch user by id', async () => {
      const mockUser = { id: 1, email: 'user@test.com' }
      ;(api.get as jest.Mock).mockResolvedValue({ data: mockUser })

      const result = await userService.getById(1)

      expect(api.get).toHaveBeenCalledWith('/users/1/')
      expect(result).toEqual(mockUser)
    })
  })

  describe('create', () => {
    it('should create a new user', async () => {
      const newUser = {
        email: 'new@test.com',
        password: 'password123',
        role: 'operator',
      }
      const mockResponse = { data: { id: 1, ...newUser } }
      ;(api.post as jest.Mock).mockResolvedValue(mockResponse)

      const result = await userService.create(newUser)

      expect(api.post).toHaveBeenCalledWith('/users/', newUser)
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('update', () => {
    it('should update user', async () => {
      const updates = { email: 'updated@test.com' }
      const mockResponse = { data: { id: 1, ...updates } }
      ;(api.patch as jest.Mock).mockResolvedValue(mockResponse)

      const result = await userService.update(1, updates)

      expect(api.patch).toHaveBeenCalledWith('/users/1/', updates)
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('delete', () => {
    it('should delete user', async () => {
      ;(api.delete as jest.Mock).mockResolvedValue({ data: {} })

      await userService.delete(1)

      expect(api.delete).toHaveBeenCalledWith('/users/1/')
    })
  })

  describe('activate', () => {
    it('should activate user', async () => {
      ;(api.post as jest.Mock).mockResolvedValue({ data: { status: 'active' } })

      const result = await userService.activate(1)

      expect(api.post).toHaveBeenCalledWith('/users/1/activate/')
      expect(result.status).toBe('active')
    })
  })

  describe('deactivate', () => {
    it('should deactivate user', async () => {
      ;(api.post as jest.Mock).mockResolvedValue({ data: { status: 'inactive' } })

      const result = await userService.deactivate(1)

      expect(api.post).toHaveBeenCalledWith('/users/1/deactivate/')
      expect(result.status).toBe('inactive')
    })
  })

  describe('suspend', () => {
    it('should suspend user', async () => {
      ;(api.post as jest.Mock).mockResolvedValue({ data: { status: 'suspended' } })

      const result = await userService.suspend(1)

      expect(api.post).toHaveBeenCalledWith('/users/1/suspend/')
      expect(result.status).toBe('suspended')
    })
  })
})

