
export type Color = [red: number, green: number, blue: number, alpha?: number];

export type Vector2 = [x: number, y: number];
export type Pixel = Vector2;
export type PixelPolygon = Pixel[]

export type LatLng = {
  lat: number,
  lng: number,
}

export type LatLngPolygon = LatLng[]
export type Panel = [LatLng, LatLng, LatLng, LatLng]

export type PanelArray = {
  bound_polygon: LatLngPolygon,
  panels: Panel[],
}

export type SystemDesign = {
  latitude: number,
  longitude: number,
  roof_top_design_data: {
    panel_array: PanelArray[],
  },
}
