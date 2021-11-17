export interface IDocusignContextRouteMapper {
  checkRoute(method: string, path: string): boolean;

  initRoutesMapper(): void
}
