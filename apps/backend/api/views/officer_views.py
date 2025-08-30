from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from api.services import OfficerService
from api.serializers import (
    OfficerSerializer, 
    OfficerCreateSerializer, 
    OfficerUpdateSerializer,
    OfficerReorderSerializer
)


@api_view(['GET'])
def get_officers(request):
    """Get all publicly displayed officers (public endpoint)."""
    try:
        officers = OfficerService.get_all_officers()
        serializer = OfficerSerializer(officers, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response(
            {'error': f'Failed to fetch officers: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def get_officer_by_id(request, officer_id):
    """Get a single officer by ID."""
    try:
        officer = OfficerService.get_officer_by_id(officer_id)
        if not officer:
            return Response({'error': 'Officer not found'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = OfficerSerializer(officer)
        return Response(serializer.data)
    except Exception as e:
        return Response(
            {'error': f'Failed to fetch officer: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def create_officer(request):
    """Create a new officer (officers hub - no auth required)."""
    serializer = OfficerCreateSerializer(data=request.data)
    if serializer.is_valid():
        try:
            # For now, we'll need to handle the user association differently
            # Since we don't have request.user, we'll need to modify the service
            officer = OfficerService.create_officer_profile_without_user(serializer.validated_data)
            response_serializer = OfficerSerializer(officer)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {'error': f'Failed to create officer: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'PATCH'])  # Accept both PUT and PATCH
def update_officer(request, officer_id):
    """Update an existing officer (officers hub - no auth required)."""
    try:
        officer = OfficerService.get_officer_by_id(officer_id)
        if not officer:
            return Response({'error': 'Officer not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Use partial=True for PATCH requests to allow partial updates
        partial = request.method == 'PATCH'
        serializer = OfficerUpdateSerializer(
            officer, 
            data=request.data, 
            partial=partial
        )
        
        if serializer.is_valid():
            updated_officer = OfficerService.update_officer_profile(
                officer, 
                serializer.validated_data
            )
            response_serializer = OfficerSerializer(updated_officer)
            return Response(response_serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response(
            {'error': f'Failed to update officer: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['DELETE'])
def delete_officer(request, officer_id):
    """Delete an officer (officers hub - no auth required)."""
    try:
        officer = OfficerService.get_officer_by_id(officer_id)
        if not officer:
            return Response({'error': 'Officer not found'}, status=status.HTTP_404_NOT_FOUND)
        
        OfficerService.delete_officer_profile(officer)
        return Response(status=status.HTTP_204_NO_CONTENT)
    except Exception as e:
        return Response(
            {'error': f'Failed to delete officer: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def reorder_officers(request):
    """Reorder officers (officers hub - no auth required)."""
    serializer = OfficerReorderSerializer(data=request.data)
    if serializer.is_valid():
        try:
            OfficerService.reorder_officers(serializer.validated_data['officer_orders'])
            return Response({'message': 'Officers reordered successfully'})
        except Exception as e:
            return Response(
                {'error': f'Failed to reorder officers: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST) 