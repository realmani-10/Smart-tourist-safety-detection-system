import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { MapPin, Navigation, AlertTriangle } from 'lucide-react';

interface NearbyArea {
  id: string;
  name: string;
  position: { lat: number; lng: number };
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  distance: number;
  type: string;
}

interface LiveLocationMapProps {
  userLocation?: { lat: number; lng: number };
  onLocationUpdate?: (location: { lat: number; lng: number }) => void;
}

const LiveLocationMap: React.FC<LiveLocationMapProps> = ({
  userLocation: propUserLocation,
  onLocationUpdate
}) => {
  const { t } = useLanguage();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const nearbyMarkersRef = useRef<google.maps.Marker[]>([]);

  const [isLoaded, setIsLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(
    propUserLocation || null
  );
  const [locationError, setLocationError] = useState<string | null>(null);
  const [nearbyAreas, setNearbyAreas] = useState<NearbyArea[]>([]);

  const predefinedAreas: NearbyArea[] = [
    {
      id: '1',
      name: 'India Gate',
      position: { lat: 28.6129, lng: 77.2295 },
      risk: 'LOW',
      distance: 0,
      type: 'Monument'
    },
    {
      id: '2',
      name: 'Red Fort',
      position: { lat: 28.6562, lng: 77.2410 },
      risk: 'MEDIUM',
      distance: 0,
      type: 'Historical Site'
    },
    {
      id: '3',
      name: 'Connaught Place',
      position: { lat: 28.6315, lng: 77.2167 },
      risk: 'LOW',
      distance: 0,
      type: 'Shopping District'
    },
    {
      id: '4',
      name: 'Chandni Chowk',
      position: { lat: 28.6506, lng: 77.2334 },
      risk: 'HIGH',
      distance: 0,
      type: 'Market Area'
    },
    {
      id: '5',
      name: 'Lotus Temple',
      position: { lat: 28.5535, lng: 77.2588 },
      risk: 'LOW',
      distance: 0,
      type: 'Religious Site'
    },
    {
      id: '6',
      name: 'Qutub Minar',
      position: { lat: 28.5245, lng: 77.1855 },
      risk: 'LOW',
      distance: 0,
      type: 'Monument'
    }
  ];

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const updateNearbyAreas = (currentLocation: { lat: number; lng: number }) => {
    const areasWithDistance = predefinedAreas.map(area => ({
      ...area,
      distance: calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        area.position.lat,
        area.position.lng
      )
    }));

    areasWithDistance.sort((a, b) => a.distance - b.distance);
    setNearbyAreas(areasWithDistance.slice(0, 5));
  };

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setUserLocation({ lat: 28.6139, lng: 77.2090 });
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(newLocation);
        setLocationError(null);
        updateNearbyAreas(newLocation);

        if (onLocationUpdate) {
          onLocationUpdate(newLocation);
        }

        if (mapInstanceRef.current && userMarkerRef.current) {
          userMarkerRef.current.setPosition(newLocation);
          mapInstanceRef.current.panTo(newLocation);
        }
      },
      (error) => {
        console.warn('Geolocation error:', error);
        const defaultLocation = { lat: 28.6139, lng: 77.2090 };
        setLocationError('Using default location (New Delhi)');
        setUserLocation(defaultLocation);
        updateNearbyAreas(defaultLocation);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  useEffect(() => {
    const checkGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setIsLoaded(true);
        initializeMap();
      } else {
        setTimeout(checkGoogleMaps, 100);
      }
    };
    checkGoogleMaps();

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const initializeMap = () => {
    if (!mapRef.current || mapInstanceRef.current) return;

    try {
      const initialCenter = userLocation || { lat: 28.6139, lng: 77.2090 };

      mapInstanceRef.current = new google.maps.Map(mapRef.current, {
        zoom: 14,
        center: initialCenter,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'on' }]
          }
        ],
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        mapTypeControlOptions: {
          style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
          position: google.maps.ControlPosition.TOP_RIGHT,
          mapTypeIds: [
            google.maps.MapTypeId.ROADMAP,
            google.maps.MapTypeId.SATELLITE,
            google.maps.MapTypeId.HYBRID
          ]
        }
      });

      getUserLocation();

      if (userLocation) {
        addUserMarker(userLocation);
        updateNearbyAreas(userLocation);
      }
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError('Failed to initialize map');
    }
  };

  const getRiskColor = (risk: string): string => {
    switch (risk) {
      case 'HIGH': return '#ef4444';
      case 'MEDIUM': return '#f59e0b';
      case 'LOW': return '#10b981';
      default: return '#6b7280';
    }
  };

  const addUserMarker = (location: { lat: number; lng: number }) => {
    if (!mapInstanceRef.current) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
    }

    userMarkerRef.current = new google.maps.Marker({
      position: location,
      map: mapInstanceRef.current,
      title: 'Your Location',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#3b82f6',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3,
      },
      animation: google.maps.Animation.DROP,
      zIndex: 1000
    });

    const accuracyCircle = new google.maps.Circle({
      map: mapInstanceRef.current,
      center: location,
      radius: 100,
      fillColor: '#3b82f6',
      fillOpacity: 0.1,
      strokeColor: '#3b82f6',
      strokeOpacity: 0.3,
      strokeWeight: 1
    });

    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div class="p-3 text-center">
          <div class="font-bold text-blue-600 mb-1">Your Current Location</div>
          <div class="text-sm text-gray-600">Live tracking active</div>
          <div class="text-xs text-gray-500 mt-1">${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}</div>
        </div>
      `
    });

    userMarkerRef.current.addListener('click', () => {
      infoWindow.open(mapInstanceRef.current, userMarkerRef.current);
    });
  };

  useEffect(() => {
    if (isLoaded && mapInstanceRef.current && nearbyAreas.length > 0) {
      nearbyMarkersRef.current.forEach(marker => marker.setMap(null));
      nearbyMarkersRef.current = [];

      nearbyAreas.forEach((area) => {
        if (!mapInstanceRef.current) return;

        const riskColor = getRiskColor(area.risk);

        const marker = new google.maps.Marker({
          position: area.position,
          map: mapInstanceRef.current,
          title: `${area.name} - ${area.risk} Risk`,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: riskColor,
            fillOpacity: 0.8,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
          zIndex: area.risk === 'HIGH' ? 100 : (area.risk === 'MEDIUM' ? 50 : 10)
        });

        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div class="p-3 min-w-[200px]">
              <div class="flex items-center justify-between mb-2">
                <h3 class="font-bold text-gray-900">${area.name}</h3>
                <span class="px-2 py-1 rounded text-xs font-medium" style="background-color: ${riskColor}20; color: ${riskColor}">
                  ${area.risk}
                </span>
              </div>
              <div class="text-sm text-gray-600 space-y-1">
                <div>Type: ${area.type}</div>
                <div>Distance: ${area.distance.toFixed(2)} km</div>
              </div>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(mapInstanceRef.current, marker);
        });

        nearbyMarkersRef.current.push(marker);
      });
    }
  }, [nearbyAreas, isLoaded]);

  useEffect(() => {
    if (userLocation && mapInstanceRef.current && !userMarkerRef.current) {
      addUserMarker(userLocation);
    }
  }, [userLocation, isLoaded]);

  if (mapError) {
    return (
      <div className="w-full h-64 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center border border-red-200 dark:border-red-800">
        <div className="text-center p-4">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-600 dark:text-red-400">{mapError}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-64 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600 dark:text-gray-300">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <div
          ref={mapRef}
          className="w-full h-64 rounded-xl shadow-lg"
        />

        <div className="absolute top-3 left-3 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-lg p-2 border border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-gray-900 dark:text-white">Live Location</span>
          </div>
        </div>

        <div className="absolute top-3 right-3 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-lg p-2 border border-gray-200 dark:border-gray-600">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-xs text-gray-700 dark:text-gray-300">High Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-xs text-gray-700 dark:text-gray-300">Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-700 dark:text-gray-300">Low</span>
            </div>
          </div>
        </div>

        {locationError && (
          <div className="absolute bottom-3 left-3 right-3 bg-yellow-500/90 text-white px-3 py-2 rounded-lg text-xs shadow-lg">
            {locationError}
          </div>
        )}
      </div>

      {nearbyAreas.length > 0 && (
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Navigation className="w-4 h-4" />
            Nearby Areas
          </h3>
          <div className="space-y-2">
            {nearbyAreas.map((area) => (
              <div
                key={area.id}
                className="flex items-center justify-between text-sm bg-white/5 rounded-lg p-2"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getRiskColor(area.risk) }}
                  />
                  <div>
                    <div className="font-medium">{area.name}</div>
                    <div className="text-xs text-gray-300">{area.type}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-300">{area.distance.toFixed(1)} km</div>
                  <div
                    className="text-xs font-medium"
                    style={{ color: getRiskColor(area.risk) }}
                  >
                    {area.risk}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveLocationMap;
