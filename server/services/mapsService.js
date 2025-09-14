const axios = require('axios');
const { POI, Route, TrafficUpdate } = require('../models/Map');

// Prefer Mapbox when access token is provided. Otherwise, if Google API key exists, use Google as a fallback.
const hasMapbox = Boolean(process.env.MAPBOX_ACCESS_TOKEN);
const hasGoogle = Boolean(process.env.GOOGLE_MAPS_API_KEY);

// @desc    Get directions between two points (Mapbox preferred, Google fallback, local fallback last)
exports.getDirections = async (origin, destination, options = {}) => {
  try {
    const { mode = 'driving', waypoints = [], optimizeWaypoints = false } = options;

    if (hasMapbox) {
      // Mapbox expects lng,lat pairs
      const coords = [`${origin.lng},${origin.lat}`, `${destination.lng},${destination.lat}`];
      if (waypoints.length > 0) {
        waypoints.forEach(wp => coords.splice(coords.length - 1, 0, `${wp.lng},${wp.lat}`));
      }

      // Mapbox profile mapping
      const profile = mode === 'walking' ? 'walking' : mode === 'driving' ? 'driving-traffic' : 'driving-traffic';

      const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coords.join(';')}`;
      const params = {
        alternatives: true,
        geometries: 'polyline',
        overview: 'full',
        steps: true,
        access_token: process.env.MAPBOX_ACCESS_TOKEN
      };

      const response = await axios.get(url, { params });
      const data = response.data;

      if (!data || !data.routes) {
        throw new Error('Mapbox Directions returned no routes');
      }

      const routes = data.routes.map(route => ({
        distance: (route.distance || 0) / 1000,
        duration: (route.duration || 0) / 60,
        polyline: route.geometry || '',
        steps: (route.legs || []).flatMap(leg => (leg.steps || []).map(step => ({
          instruction: step.maneuver && step.maneuver.instruction ? step.maneuver.instruction : '',
          distance: (step.distance || 0) / 1000,
          duration: (step.duration || 0) / 60,
          startLocation: step.intersections && step.intersections[0] ? { lat: step.intersections[0].location[1], lng: step.intersections[0].location[0] } : null,
          endLocation: step.intersections && step.intersections.length ? { lat: step.intersections[step.intersections.length-1].location[1], lng: step.intersections[step.intersections.length-1].location[0] } : null,
          polyline: step.geometry || ''
        }))),
        bounds: route.bounds || null,
        warnings: []
      }));

      return routes;
    } else if (hasGoogle) {
      // Existing Google Maps fallback behavior
      const params = {
        origin: `${origin.lat},${origin.lng}`,
        destination: `${destination.lat},${destination.lng}`,
        mode: mode,
        key: process.env.GOOGLE_MAPS_API_KEY,
        alternatives: true,
        departure_time: 'now'
      };

      if (waypoints.length > 0) params.waypoints = waypoints.map(wp => `${wp.lat},${wp.lng}`).join('|');

      const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', { params });
      if (response.data.status !== 'OK') throw new Error(`Google Maps API error: ${response.data.status}`);

      const routes = response.data.routes.map(route => ({
        distance: route.legs.reduce((sum, leg) => sum + leg.distance.value, 0) / 1000,
        duration: route.legs.reduce((sum, leg) => sum + leg.duration.value, 0) / 60,
        polyline: route.overview_polyline.points,
        steps: route.legs.flatMap(leg => leg.steps.map(step => ({
          instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
          distance: step.distance.value / 1000,
          duration: step.duration.value / 60,
          startLocation: step.start_location,
          endLocation: step.end_location,
          polyline: step.polyline.points
        }))),
        bounds: route.bounds,
        warnings: route.warnings || []
      }));

      return routes;
    }

    // Final fallback: local simple route
    return getFallbackRoute(origin, destination, options);
  } catch (error) {
    console.error('getDirections error:', error.message || error);
    return getFallbackRoute(origin, destination, options);
  }
};

// @desc    Search for places (Mapbox geocoding preferred, Google Places fallback)
exports.searchPlaces = async (query, location, options = {}) => {
  try {
    const { radius = 5000, type = '', limit = 10 } = options;

    if (hasMapbox) {
      const q = encodeURIComponent(query);
      const proximity = location ? `${location.lng},${location.lat}` : undefined;
      const params = {
        access_token: process.env.MAPBOX_ACCESS_TOKEN,
        limit,
        proximity
      };

      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${q}.json`;
      const response = await axios.get(url, { params });
      const data = response.data;

      if (!data || !data.features) return [];

      return data.features.map(place => ({
        placeId: place.id,
        name: place.text,
        address: place.place_name,
        location: { lat: place.center[1], lng: place.center[0] },
        types: place.place_type || [],
        raw: place
      }));
    } else if (hasGoogle) {
      const params = {
        query,
        location: `${location.lat},${location.lng}`,
        radius,
        key: process.env.GOOGLE_MAPS_API_KEY
      };

      const response = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', { params });
      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') throw new Error(`Google Places API error: ${response.data.status}`);

      return response.data.results.map(place => ({
        placeId: place.place_id,
        name: place.name,
        address: place.formatted_address,
        location: { lat: place.geometry.location.lat, lng: place.geometry.location.lng },
        rating: place.rating || 0,
        types: place.types || []
      }));
    }

    return [];
  } catch (error) {
    console.error('searchPlaces error:', error.message || error);
    return [];
  }
};

// @desc    Get place details (Mapbox geocoding can be used to fetch basic details)
exports.getPlaceDetails = async (placeIdOrCoords) => {
  try {
    if (hasMapbox) {
      // If input looks like coordinates 'lng,lat' or an array
      if (typeof placeIdOrCoords === 'string' && placeIdOrCoords.indexOf(',') > 0 && !placeIdOrCoords.startsWith('place.')) {
        const [lng, lat] = placeIdOrCoords.split(',').map(Number);
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`;
        const response = await axios.get(url, { params: { access_token: process.env.MAPBOX_ACCESS_TOKEN } });
        const place = response.data && response.data.features && response.data.features[0];
        if (!place) return null;
        return {
          placeId: place.id,
          name: place.text,
          address: place.place_name,
          location: { lat: place.center[1], lng: place.center[0] },
          raw: place
        };
      }

      // If we have a Mapbox place id
      if (typeof placeIdOrCoords === 'string' && placeIdOrCoords.startsWith('place.')) {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(placeIdOrCoords)}.json`;
        const response = await axios.get(url, { params: { access_token: process.env.MAPBOX_ACCESS_TOKEN } });
        const place = response.data && response.data.features && response.data.features[0];
        if (!place) return null;
        return {
          placeId: place.id,
          name: place.text,
          address: place.place_name,
          location: { lat: place.center[1], lng: place.center[0] },
          raw: place
        };
      }
    }

    if (hasGoogle) {
      const params = {
        place_id: placeIdOrCoords,
        fields: 'name,formatted_address,geometry,rating,price_level,opening_hours,formatted_phone_number,website,reviews,photos',
        key: process.env.GOOGLE_MAPS_API_KEY
      };
      const response = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', { params });
      if (response.data.status !== 'OK') throw new Error(`Google Places API error: ${response.data.status}`);
      const place = response.data.result;
      return {
        placeId: place.place_id,
        name: place.name,
        address: place.formatted_address,
        location: { lat: place.geometry.location.lat, lng: place.geometry.location.lng },
        rating: place.rating || 0,
        priceLevel: place.price_level || 0,
        phone: place.formatted_phone_number,
        website: place.website,
        openingHours: place.opening_hours ? { openNow: place.opening_hours.open_now, periods: place.opening_hours.periods || [], weekdayText: place.opening_hours.weekday_text || [] } : null,
        reviews: place.reviews ? place.reviews.map(review => ({ author: review.author_name, rating: review.rating, text: review.text, time: new Date(review.time * 1000) })) : [],
        photos: place.photos ? place.photos.map(photo => ({ reference: photo.photo_reference, width: photo.width, height: photo.height })) : []
      };
    }

    return null;
  } catch (error) {
    console.error('getPlaceDetails error:', error.message || error);
    return null;
  }
};

// @desc    Get nearby POIs from database
exports.getNearbyPOIs = async (location, options = {}) => {
  try {
    const {
      radius = 5000, // 5km in meters
      category = null,
      limit = 50
    } = options;

    const query = {
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [location.lng, location.lat]
          },
          $maxDistance: radius
        }
      }
    };

    if (category) {
      query.category = category;
    }

    const pois = await POI.find(query)
      .limit(limit)
      .select('name category location address rating description images contact tags');

    return pois.map(poi => ({
      id: poi._id,
      name: poi.name,
      category: poi.category,
      location: {
        lat: poi.location.coordinates[1],
        lng: poi.location.coordinates[0]
      },
      address: poi.address,
      rating: poi.rating,
      description: poi.description,
      images: poi.images,
      contact: poi.contact,
      tags: poi.tags
    }));
  } catch (error) {
    console.error('Get nearby POIs error:', error);
    return [];
  }
};

// @desc    Get traffic information (Mapbox driving-traffic can provide duration; Google fallback available)
exports.getTrafficInfo = async (route) => {
  try {
    const { startLocation, endLocation } = route;

    if (hasMapbox) {
      const coords = `${startLocation.coordinates.lng},${startLocation.coordinates.lat};${endLocation.coordinates.lng},${endLocation.coordinates.lat}`;
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${coords}`;
      const params = { access_token: process.env.MAPBOX_ACCESS_TOKEN, alternatives: false, overview: 'simplified' };
      const response = await axios.get(url, { params });
      const data = response.data;
      if (data && data.routes && data.routes[0]) {
        const leg = data.routes[0];
        const trafficInfo = {
          distance: (leg.distance || 0) / 1000,
          durationInTraffic: (leg.duration || 0) / 60,
          normalDuration: null,
          delay: null,
          congestionLevel: 'unknown'
        };
        return trafficInfo;
      }
      return null;
    }

    if (hasGoogle) {
      const params = {
        origin: `${startLocation.coordinates.lat},${startLocation.coordinates.lng}`,
        destination: `${endLocation.coordinates.lat},${endLocation.coordinates.lng}`,
        departure_time: 'now',
        traffic_model: 'best_guess',
        key: process.env.GOOGLE_MAPS_API_KEY
      };
      const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', { params });
      if (response.data.status === 'OK' && response.data.routes.length > 0) {
        const routeRes = response.data.routes[0];
        const leg = routeRes.legs[0];
        const trafficInfo = {
          distance: leg.distance.value / 1000,
          durationInTraffic: leg.duration_in_traffic ? leg.duration_in_traffic.value / 60 : leg.duration.value / 60,
          normalDuration: leg.duration.value / 60,
          delay: leg.duration_in_traffic ? (leg.duration_in_traffic.value - leg.duration.value) / 60 : 0,
          congestionLevel: 'low'
        };
        if (trafficInfo.delay > 30) trafficInfo.congestionLevel = 'severe';
        else if (trafficInfo.delay > 15) trafficInfo.congestionLevel = 'high';
        else if (trafficInfo.delay > 5) trafficInfo.congestionLevel = 'moderate';
        return trafficInfo;
      }
      return null;
    }

    return null;
  } catch (error) {
    console.error('getTrafficInfo error:', error.message || error);
    return null;
  }
};

// @desc    Geocode address to coordinates (Mapbox preferred)
exports.geocodeAddress = async (address) => {
  try {
    if (hasMapbox) {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json`;
      const response = await axios.get(url, { params: { access_token: process.env.MAPBOX_ACCESS_TOKEN, limit: 1 } });
      const feat = response.data && response.data.features && response.data.features[0];
      if (!feat) return null;
      return { address: feat.place_name, location: { lat: feat.center[1], lng: feat.center[0] }, placeId: feat.id, types: feat.place_type };
    }

    if (hasGoogle) {
      const params = { address, key: process.env.GOOGLE_MAPS_API_KEY };
      const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', { params });
      const result = response.data.results && response.data.results[0];
      if (!result) return null;
      return { address: result.formatted_address, location: { lat: result.geometry.location.lat, lng: result.geometry.location.lng }, placeId: result.place_id, types: result.types };
    }

    return null;
  } catch (error) {
    console.error('geocodeAddress error:', error.message || error);
    return null;
  }
};

// @desc    Reverse geocode coordinates to address
exports.reverseGeocode = async (lat, lng) => {
  try {
    if (hasMapbox) {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`;
      const response = await axios.get(url, { params: { access_token: process.env.MAPBOX_ACCESS_TOKEN, limit: 1 } });
      const result = response.data && response.data.features && response.data.features[0];
      if (!result) return null;
      return { address: result.place_name, placeId: result.id, types: result.place_type, addressComponents: result.context || [] };
    }

    if (hasGoogle) {
      const params = { latlng: `${lat},${lng}`, key: process.env.GOOGLE_MAPS_API_KEY };
      const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', { params });
      const result = response.data.results && response.data.results[0];
      if (!result) return null;
      return { address: result.formatted_address, placeId: result.place_id, types: result.types, addressComponents: result.address_components };
    }

    return null;
  } catch (error) {
    console.error('reverseGeocode error:', error.message || error);
    return null;
  }
};

// @desc    Get elevation data for coordinates (uses open-elevation service as a free alternative)
exports.getElevation = async (locations) => {
  try {
    if (!locations || locations.length === 0) return [];
    const locParam = locations.map(l => `${l.lat},${l.lng}`).join('|');
    const url = `https://api.open-elevation.com/api/v1/lookup?locations=${encodeURIComponent(locParam)}`;
    const response = await axios.get(url);
    if (response.data && response.data.results) {
      return response.data.results.map(r => ({ location: { lat: r.latitude, lng: r.longitude }, elevation: r.elevation, resolution: null }));
    }
    return [];
  } catch (error) {
    console.error('getElevation error:', error.message || error);
    return [];
  }
};

// @desc    Fallback route calculation
const getFallbackRoute = (origin, destination, options) => {
  const distance = calculateDistance(origin, destination);
  const duration = estimateDuration(distance, options.mode);
  
  return [{
    distance: distance,
    duration: duration,
    polyline: '', // Would need to implement basic polyline encoding
    steps: [{
      instruction: `Head ${getDirection(origin, destination)} towards ${destination.name || 'destination'}`,
      distance: distance,
      duration: duration,
      startLocation: origin,
      endLocation: destination,
      polyline: ''
    }],
    bounds: {
      northeast: {
        lat: Math.max(origin.lat, destination.lat),
        lng: Math.max(origin.lng, destination.lng)
      },
      southwest: {
        lat: Math.min(origin.lat, destination.lat),
        lng: Math.min(origin.lng, destination.lng)
      }
    },
    copyrights: 'Fallback route calculation',
    warnings: ['This is a fallback route calculation. Actual route may vary.']
  }];
};

// @desc    Calculate distance between two coordinates
const calculateDistance = (coord1, coord2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// @desc    Estimate duration based on distance and mode
const estimateDuration = (distance, mode = 'driving') => {
  const speeds = {
    driving: 50, // km/h average speed
    walking: 5,  // km/h
    bicycling: 15, // km/h
    transit: 30  // km/h average including stops
  };
  
  return (distance / speeds[mode]) * 60; // Convert to minutes
};

// @desc    Get general direction between two points
const getDirection = (origin, destination) => {
  const dLat = destination.lat - origin.lat;
  const dLng = destination.lng - origin.lng;
  
  if (Math.abs(dLat) > Math.abs(dLng)) {
    return dLat > 0 ? 'north' : 'south';
  } else {
    return dLng > 0 ? 'east' : 'west';
  }
};

// @desc    Get Mapbox static map URL
exports.getStaticMapUrl = (center, zoom = 12, size = '600x400', markers = []) => {
  try {
    const baseUrl = 'https://api.mapbox.com/styles/v1/mapbox/streets-v11/static';
    
    let markersParam = '';
    if (markers.length > 0) {
      markersParam = markers.map(marker => 
        `pin-s-${marker.color || 'red'}+${marker.label || ''}(${marker.lng},${marker.lat})`
      ).join(',');
    }
    
    const url = `${baseUrl}/${markersParam}/${center.lng},${center.lat},${zoom}/${size}?access_token=${process.env.MAPBOX_ACCESS_TOKEN}`;
    
    return url;
  } catch (error) {
    console.error('Static map URL error:', error);
    return null;
  }
};

module.exports = exports;
