import { calcCoordinatesDistance, ICoordinate } from './calculate-coordinates';

export const calculateSystemDesignRadius = (systemDesignCenterBound: ICoordinate, polygons: ICoordinate[]): number => {
  const longestDistance = Math.max(...polygons.map(p => calcCoordinatesDistance(systemDesignCenterBound, p))) * 1000;

  return Math.min(Math.max(25, longestDistance), 100);
};
