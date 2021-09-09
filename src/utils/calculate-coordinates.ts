interface ICoordinate {
  lat: number;
  lng: number;
}

export const EARTH_R = 6371;

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

const toRad = (Value: number) => (Value * Math.PI) / 180;
