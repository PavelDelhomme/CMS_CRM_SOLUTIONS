"""
API views for booking models
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from .models import Booking
from .serializers import (
    BookingSerializer, BookingCreateSerializer,
    BookingUpdateSerializer, BookingListSerializer, BookingStatusSerializer
)


class BookingViewSet(viewsets.ModelViewSet):
    """ViewSet for managing bookings"""
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter bookings based on tenant context"""
        user = self.request.user
        if hasattr(user, 'tenant') and user.tenant:
            return Booking.objects.filter(tenant=user.tenant)
        return Booking.objects.none()

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return BookingCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return BookingUpdateSerializer
        elif self.action == 'list':
            return BookingListSerializer
        return BookingSerializer

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Confirm a booking"""
        booking = self.get_object()
        booking.status = 'confirmed'
        booking.save()
        serializer = BookingStatusSerializer(booking)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def start_trip(self, request, pk=None):
        """Start a trip"""
        booking = self.get_object()
        booking.status = 'in_progress'
        booking.save()
        serializer = BookingStatusSerializer(booking)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Complete a booking"""
        booking = self.get_object()
        booking.status = 'completed'
        booking.save()
        serializer = BookingStatusSerializer(booking)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a booking"""
        booking = self.get_object()
        booking.status = 'cancelled'
        booking.cancellation_reason = request.data.get('reason', '')
        booking.save()
        serializer = BookingStatusSerializer(booking)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get pending bookings"""
        queryset = self.get_queryset().filter(status='pending')
        serializer = BookingListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def confirmed(self, request):
        """Get confirmed bookings"""
        queryset = self.get_queryset().filter(status='confirmed')
        serializer = BookingListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def in_progress(self, request):
        """Get in-progress bookings"""
        queryset = self.get_queryset().filter(status='in_progress')
        serializer = BookingListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def completed(self, request):
        """Get completed bookings"""
        queryset = self.get_queryset().filter(status='completed')
        serializer = BookingListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def today(self, request):
        """Get today's bookings"""
        today = timezone.now().date()
        queryset = self.get_queryset().filter(
            pickup_datetime__date=today
        )
        serializer = BookingListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get upcoming bookings"""
        now = timezone.now()
        queryset = self.get_queryset().filter(
            pickup_datetime__gte=now,
            status__in=['pending', 'confirmed']
        ).order_by('pickup_datetime')
        serializer = BookingListSerializer(queryset, many=True)
        return Response(serializer.data)
