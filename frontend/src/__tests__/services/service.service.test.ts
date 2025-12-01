import serviceService from '@/services/service.service'
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

describe('ServiceService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getAll', () => {
    it('should fetch all services', async () => {
      const mockServices = [
        { id: 1, name: 'Service 1', slug: 'service-1' },
        { id: 2, name: 'Service 2', slug: 'service-2' },
      ]
      ;(api.get as jest.Mock).mockResolvedValue({ data: mockServices })

      const result = await serviceService.getAll()

      expect(api.get).toHaveBeenCalledWith('/services/', { params: undefined })
      expect(result).toEqual(mockServices)
    })

    it('should handle paginated response', async () => {
      const mockResponse = {
        data: {
          results: [{ id: 1, name: 'Service 1' }],
        },
      }
      ;(api.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await serviceService.getAll()

      expect(result).toEqual(mockResponse.data.results)
    })

    it('should pass query parameters', async () => {
      ;(api.get as jest.Mock).mockResolvedValue({ data: [] })

      await serviceService.getAll({ is_active: true })

      expect(api.get).toHaveBeenCalledWith('/services/', {
        params: { is_active: true },
      })
    })
  })

  describe('getById', () => {
    it('should fetch service by id', async () => {
      const mockService = { id: 1, name: 'Test Service' }
      ;(api.get as jest.Mock).mockResolvedValue({ data: mockService })

      const result = await serviceService.getById(1)

      expect(api.get).toHaveBeenCalledWith('/services/1/')
      expect(result).toEqual(mockService)
    })
  })

  describe('create', () => {
    it('should create a new service', async () => {
      const newService = { name: 'New Service', slug: 'new-service' }
      const mockResponse = { data: { id: 1, ...newService } }
      ;(api.post as jest.Mock).mockResolvedValue(mockResponse)

      const result = await serviceService.create(newService)

      expect(api.post).toHaveBeenCalledWith('/services/', newService)
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('update', () => {
    it('should update service', async () => {
      const updates = { name: 'Updated Service' }
      const mockResponse = { data: { id: 1, ...updates } }
      ;(api.patch as jest.Mock).mockResolvedValue(mockResponse)

      const result = await serviceService.update(1, updates)

      expect(api.patch).toHaveBeenCalledWith('/services/1/', updates)
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('delete', () => {
    it('should delete service', async () => {
      ;(api.delete as jest.Mock).mockResolvedValue({ data: {} })

      await serviceService.delete(1)

      expect(api.delete).toHaveBeenCalledWith('/services/1/')
    })
  })

  describe('activate', () => {
    it('should activate service', async () => {
      ;(api.post as jest.Mock).mockResolvedValue({ data: { is_active: true } })

      const result = await serviceService.activate(1)

      expect(api.post).toHaveBeenCalledWith('/services/1/activate/')
      expect(result.is_active).toBe(true)
    })
  })

  describe('deactivate', () => {
    it('should deactivate service', async () => {
      ;(api.post as jest.Mock).mockResolvedValue({ data: { is_active: false } })

      const result = await serviceService.deactivate(1)

      expect(api.post).toHaveBeenCalledWith('/services/1/deactivate/')
      expect(result.is_active).toBe(false)
    })
  })

  describe('getActive', () => {
    it('should fetch active services', async () => {
      const mockServices = [{ id: 1, name: 'Active Service', is_active: true }]
      ;(api.get as jest.Mock).mockResolvedValue({ data: mockServices })

      const result = await serviceService.getActive()

      expect(api.get).toHaveBeenCalledWith('/services/active/')
      expect(result).toEqual(mockServices)
    })
  })
})

