export interface IBaseRating {
  watts: number;
}

export interface IRating<T = IBaseRating> {
  ratings: T;
}
