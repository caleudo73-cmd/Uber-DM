import { authRequest } from './http';

const nearQuery = (location) =>
  location ? `&lat=${location.latitude}&lon=${location.longitude}` : '';

export const searchPlaces = (query, location) =>
  authRequest(`/places/search?q=${encodeURIComponent(query)}${nearQuery(location)}`);

export const getSuggestions = (location) =>
  authRequest(`/places/suggestions?${nearQuery(location).slice(1)}`);