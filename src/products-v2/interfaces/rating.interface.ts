export interface IBaseRating {
  watts: number;
  wattsPtc: number;
}

export interface IRating<T = IBaseRating> {
  ratings: T;
}
