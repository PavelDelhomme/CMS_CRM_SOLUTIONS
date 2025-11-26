import bookingService from '@/services/booking.service'
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

describe('BookingService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getAll', () => {
    it('should fetch all bookings', async () => {
      const mockBookings = [
        { id: 1, customer_name: 'John Doe', status: 'pending' },
        { id: 2, customer_name: 'Jane Doe', status: 'confirmed' },
      ]
      ;(api.get as jest.Mock).mockResolvedValue({ data: mockBookings })

      const result = await bookingService.getAll()

      expect(api.get).toHaveBeenCalledWith('/bookings/', { params: undefined })
      expect(result).toEqual(mockBookings)
    })

    it('should handle paginated response', async () => {
      const mockResponse = {
        data: {
          results: [{ id: 1, customer_name: 'John Doe' }],
        },
      }
      ;(api.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await bookingService.getAll()

      expect(result).toEqual(mockResponse.data.results)
    })

    it('should pass query parameters', async () => {
      ;(api.get as jest.Mock).mockResolvedValue({ data: [] })

      await bookingService.getAll({
        status: 'pending',
        date_from: '2024-01-01',
        date_to: '2024-12-31',
      })

      expect(api.get).toHaveBeenCalledWith('/bookings/', {
        params: {
          status: 'pending',
          date_from: '2024-01-01',
          date_to: '2024-12-31',
        },
      })
    })
  })

  describe('getById', () => {
    it('should fetch booking by id', async () => {
      const mockBooking = { id: 1, customer_name: 'Test Customer' }
      ;(api.get as jest.Mock).mockResolvedValue({ data: mockBooking })

      const result = await bookingService.getById(1)

      expect(api.get).toHaveBeenCalledWith('/bookings/1/')
      expect(result).toEqual(mockBooking)
    })
  })

  describe('create', () => {
    it('should create a new booking', async () => {
      const newBooking = {
        customer_name: 'John Doe',
        customer_email: 'john@test.com',
        pickup_address: '123 Main St',
        dropoff_address: '456 Oak Ave',
      }
      const mockResponse = { data: { id: 1, ...newBooking } }
      ;(api.post as jest.Mock).mockResolvedValue(mockResponse)

      const result = await bookingService.create(newBooking)

      expect(api.post).toHaveBeenCalledWith('/bookings/', newBooking)
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('update', () => {
    it('should update booking', async () => {
      const updates = { status: 'confirmed' }
      const mockResponse = { data: { id: 1, ...updates } }
      ;(api.patch as jest.Mock).mockResolvedValue(mockResponse)

      const result = await bookingService.update(1, updates)

      expect(api.patch).toHaveBeenCalledWith('/bookings/1/', updates)
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('delete', () => {
    it('should delete booking', async () => {
      ;(api.delete as jest.Mock).mockResolvedValue({ data: {} })

      await bookingService.delete(1)

      expect(api.delete).toHaveBeenCalledWith('/bookings/1/')
    })
  })

  describe('confirm', () => {
    it('should confirm booking', async () => {
      ;(api.post as jest.Mock).mockResolvedValue({ data: { status: 'confirmed' } })

      const result = await bookingService.confirm(1)

      expect(api.post).toHaveBeenCalledWith('/bookings/1/confirm/')
      expect(result.status).toBe('confirmed')
    })
  })
})

