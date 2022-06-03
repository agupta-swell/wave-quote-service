/* eslint-disable no-plusplus */
export interface ICoordinate {
  lat: number;
  lng: number;
}

const toRad = (Value: number) => (Value * Math.PI) / 180;

export interface ILatLngBound {
  sw: ICoordinate;
  ne: ICoordinate;
}

export const EARTH_R = 6371;

/**
 * Return distance of 2 coordinates in km
 * @param c1
 * @param c2
 * @returns
 */
export const calcCoordinatesDistance = (c1: ICoordinate, c2: ICoordinate): number => {
  const { lat: lat1, lng: lng1 } = c1;
  const { lat: lat2, lng: lng2 } = c2;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lng2 - lng1);
  const rLat1 = toRad(lat1);
  const rLat2 = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(rLat1) * Math.cos(rLat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = EARTH_R * c;
  return d;
};

export const getCenterCoordinate = (bounds: ICoordinate[]): ICoordinate => {
  const lats = bounds.map(b => b.lat);
  const lngs = bounds.map(b => b.lng);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);

  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  return {
    lat: (minLat + maxLat) / 2,
    lng: (minLng + maxLng) / 2,
  };
};

export const isCoordinateInsideBound = (coord: ICoordinate, bound: ILatLngBound): boolean => {
  const {
    ne: { lat: neLat, lng: neLng },
    sw: { lat: swLat, lng: swLng },
  } = bound;

  const { lat: pLat, lng: pLng } = coord;

  return swLat <= pLat && pLat <= neLat && swLng <= pLng && pLng <= neLng;
};

/**
 *
 * @param coords
 * @param bound
 * @param miniumMatch
 * @returns
 */
export const isCoordinatesInsideBoundByAtLeast = (
  coords: ICoordinate[],
  bound: ILatLngBound,
  miniumMatch = -1,
): boolean => {
  if (miniumMatch === 0) return true;

  if (miniumMatch === -1 || miniumMatch >= coords.length) {
    return coords.every(coord => isCoordinateInsideBound(coord, bound));
  }

  let isMatch = true;
  let i = 0;

  while (i < miniumMatch && isMatch) {
    const coord = coords[i];
    isMatch = isCoordinateInsideBound(coord, bound);
    // eslint-disable-next-line no-plusplus
    i++;
  }

  return isMatch;
};

export const getCenterBound = (bounds: ICoordinate[]): ICoordinate => {
  const lats = bounds.map(b => b.lat);
  const lngs = bounds.map(b => b.lng);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);

  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  return {
    lat: (minLat + maxLat) / 2,
    lng: (minLng + maxLng) / 2,
  };
};
