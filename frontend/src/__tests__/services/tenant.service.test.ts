import tenantService from '@/services/tenant.service'
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

describe('TenantService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getAll', () => {
    it('should fetch all tenants', async () => {
      const mockTenants = [
        { id: 1, name: 'Tenant 1', email: 'tenant1@test.com' },
        { id: 2, name: 'Tenant 2', email: 'tenant2@test.com' },
      ]
      ;(api.get as jest.Mock).mockResolvedValue({ data: mockTenants })

      const result = await tenantService.getAll()

      expect(api.get).toHaveBeenCalledWith('/tenants/', { params: undefined })
      expect(result).toEqual(mockTenants)
    })

    it('should pass query parameters', async () => {
      ;(api.get as jest.Mock).mockResolvedValue({ data: [] })

      await tenantService.getAll({ search: 'test', status: 'active', page: 1 })

      expect(api.get).toHaveBeenCalledWith('/tenants/', {
        params: { search: 'test', status: 'active', page: 1 },
      })
    })
  })

  describe('getById', () => {
    it('should fetch tenant by id', async () => {
      const mockTenant = { id: 1, name: 'Test Tenant' }
      ;(api.get as jest.Mock).mockResolvedValue({ data: mockTenant })

      const result = await tenantService.getById(1)

      expect(api.get).toHaveBeenCalledWith('/tenants/1/')
      expect(result).toEqual(mockTenant)
    })
  })

  describe('create', () => {
    it('should create a new tenant', async () => {
      const newTenant = { name: 'New Tenant', email: 'new@test.com', plan: 'starter' }
      const mockResponse = { data: { id: 1, ...newTenant } }
      ;(api.post as jest.Mock).mockResolvedValue(mockResponse)

      const result = await tenantService.create(newTenant)

      expect(api.post).toHaveBeenCalledWith('/tenants/', newTenant)
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('update', () => {
    it('should update tenant', async () => {
      const updates = { name: 'Updated Tenant' }
      const mockResponse = { data: { id: 1, ...updates } }
      ;(api.patch as jest.Mock).mockResolvedValue(mockResponse)

      const result = await tenantService.update(1, updates)

      expect(api.patch).toHaveBeenCalledWith('/tenants/1/', updates)
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('delete', () => {
    it('should delete tenant', async () => {
      ;(api.delete as jest.Mock).mockResolvedValue({ data: {} })

      await tenantService.delete(1)

      expect(api.delete).toHaveBeenCalledWith('/tenants/1/')
    })
  })

  describe('suspend', () => {
    it('should suspend tenant', async () => {
      ;(api.post as jest.Mock).mockResolvedValue({ data: { status: 'suspended' } })

      const result = await tenantService.suspend(1)

      expect(api.post).toHaveBeenCalledWith('/tenants/1/suspend/')
      expect(result.status).toBe('suspended')
    })
  })

  describe('activate', () => {
    it('should activate tenant', async () => {
      ;(api.post as jest.Mock).mockResolvedValue({ data: { status: 'active' } })

      const result = await tenantService.activate(1)

      expect(api.post).toHaveBeenCalledWith('/tenants/1/activate/')
      expect(result.status).toBe('active')
    })
  })

  describe('restore', () => {
    it('should restore tenant', async () => {
      ;(api.post as jest.Mock).mockResolvedValue({ data: { deleted_at: null } })

      const result = await tenantService.restore(1)

      expect(api.post).toHaveBeenCalledWith('/tenants/1/restore/')
      expect(result.deleted_at).toBeNull()
    })
  })

  describe('getAdminInfo', () => {
    it('should get admin info for tenant', async () => {
      const mockInfo = { email: 'admin@test.com', username: 'admin' }
      ;(api.get as jest.Mock).mockResolvedValue({ data: mockInfo })

      const result = await tenantService.getAdminInfo(1)

      expect(api.get).toHaveBeenCalledWith('/tenants/1/get_admin_info/')
      expect(result).toEqual(mockInfo)
    })
  })

  describe('resetAdminPassword', () => {
    it('should reset admin password', async () => {
      ;(api.post as jest.Mock).mockResolvedValue({ data: { success: true } })

      const result = await tenantService.resetAdminPassword(1, 'newpassword')

      expect(api.post).toHaveBeenCalledWith('/tenants/1/reset_admin_password/', {
        password: 'newpassword',
      })
      expect(result.success).toBe(true)
    })

    it('should use default password if not provided', async () => {
      ;(api.post as jest.Mock).mockResolvedValue({ data: { success: true } })

      await tenantService.resetAdminPassword(1)

      expect(api.post).toHaveBeenCalledWith('/tenants/1/reset_admin_password/', {
        password: 'admin123',
      })
    })
  })
})

