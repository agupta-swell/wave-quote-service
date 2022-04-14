import type { ReadRasterResult, TypedArray } from 'geotiff';
import { chunk } from 'lodash';
import { PNG } from 'pngjs';

import { ISolarPanelArraySchema } from 'src/system-designs/system-design.schema';

import type { Pixel, Color, LatLng } from './types';
import { magenta, black, white, blue, red } from '../constants';

import {
  drawPolygon,
  getHeatmapColor,
  getPixelColor,
  lerpColor,
  mapLatLngPolygonToPixelPolygon,
  setPixelColor,
  translatePixelPolygon,
} from '../utils';

// TODO generate PNGs on another thread? e.g. require('worker_threads')
export class PngGenerator {
  // TODO delete this. contains too much logic. move up to google-sunroof.service
  public static generateMonthlyHeatmap (monthlyLayers: ReadRasterResult): Array<PNG> {
    return (monthlyLayers as TypedArray[])
      .map( x => x.map ( value => value * 12 ))
      .map( x => chunk(x, monthlyLayers.width))
      .map(x => PngGenerator.generateHeatmap(x))
      .map(x => PngGenerator.upscalePng(x, 5))
  }

  public static generateHeatmap (flux: number[][]) : PNG {
    const height = flux.length;
    const width = flux[0].length;

    const newPng = new PNG({ height, width });

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixel: Pixel = [x, y];
        const fluxValue = flux[y][x] as number;

        const color = getHeatmapColor(fluxValue);
        setPixelColor(newPng, pixel, color);
      }
    }

    return newPng;
  }

  private static upscalePng (heatMapPng: PNG, resizeFactor: number) : PNG {
    const interpolatedHeight = (heatMapPng.height - 1) * resizeFactor;
    const interpolatedWidth = (heatMapPng.width - 1) * resizeFactor;
    const interpolated = new PNG({
      height: interpolatedHeight,
      width: interpolatedWidth,
    });
    for (let y = 0; y < heatMapPng.height - 1; y++) {
      for (let x = 0; x < heatMapPng.width - 1; x++) {
        const thisColor = getPixelColor(heatMapPng, [x, y]);
        const xColor = getPixelColor(heatMapPng, [x + 1, y]);
        const yColor = getPixelColor(heatMapPng, [x, y + 1]);
        const xyColor = getPixelColor(heatMapPng, [x + 1, y + 1]);
        for (let b = 0; b < resizeFactor; b++) {
          const percentB = b / resizeFactor;
          const leftColor = lerpColor(thisColor, yColor, percentB);
          const rightColor = lerpColor(xColor, xyColor, percentB);
          for (let a = 0; a < resizeFactor; a++) {
            const pixel: Pixel = [
              resizeFactor * x + a,
              resizeFactor * y + b,
            ];
            const percentA = a / resizeFactor;
            const color = lerpColor(leftColor, rightColor, percentA);
            setPixelColor(interpolated, pixel, color);
          }
        }
      }
    }

    return interpolated
  }

  public static generateMask (layers: ReadRasterResult) : PNG {
    const { height, width } = layers;
    const [layer] = layers as TypedArray[];
    const mask = chunk(layer, width);

    const newPng = new PNG({ height, width });

    for (let y = 0; y < layers.height; y++) {
      for (let x = 0; x < layers.width; x++) {
        const pixel: Pixel = [x, y];
        const color = mask[y][x] ? white: black;
        setPixelColor(newPng, pixel, color);
      }
    }

    return newPng;
  }

  public static generateSatellite (layers: ReadRasterResult) : PNG {
    const { height, width } = layers;
    const [redLayer, greenLayer, blueLayer] = layers as TypedArray[];
    const rgbColors = {
      reds: chunk(redLayer, width),
      greens: chunk(greenLayer, width),
      blues: chunk(blueLayer, width)
    }

    // show center pixels
    const newPng = new PNG({
      height: height,
      width: width,
    });

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const driftPixel: Pixel = [x, y];
        const driftColor: Color = [
          rgbColors.reds[y][x] as number,
          rgbColors.greens[y][x] as number,
          rgbColors.blues[y][x] as number,
        ];
        setPixelColor(newPng, driftPixel, driftColor);
      }
    }

    return newPng;
  }

  public static generateArrayPng (
    arrays: ISolarPanelArraySchema[],
    origin: LatLng,
    pixelsPerMeter: number,
    height: number,
    width:number
  ) : PNG {
    const polygonPng = new PNG({
      height: height,
      width: width,
    });

    const originPixel: Pixel = [ Math.round(height / 2), Math.round(width / 2) ];

    arrays.map( async (array) => {
      const { boundPolygon: arrayPolygon, panels } = array;
      panels.forEach( (panel) => {
        let pixels = mapLatLngPolygonToPixelPolygon(
          origin,
          panel,
          pixelsPerMeter
        );

        pixels = translatePixelPolygon(pixels, originPixel);
        drawPolygon(polygonPng, pixels, blue);
      })

      let pixels = mapLatLngPolygonToPixelPolygon(
        origin,
        arrayPolygon,
        pixelsPerMeter
      );
      pixels = translatePixelPolygon(pixels,originPixel);
      drawPolygon(polygonPng,pixels,red);
    })

    return polygonPng;
  }

  public static applyMaskedOverlay (heatMapPng: PNG, maskLayer: number[][], rgbPng: PNG) : PNG {
    const height = heatMapPng.height;
    const width = heatMapPng.width;

    if ( process.env.DEBUG_SUNROOF ) {
      console.log( `flux height: ${height} || width: ${width}`);
    }

    const maskedPng = new PNG({ height, width });
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixel: Pixel = [x, y];
        let color: Color = magenta;

        if (maskLayer[y]?.[x]) {
          color = getPixelColor(heatMapPng, pixel);
        } else {
          color = getPixelColor(rgbPng, pixel);
        }
        setPixelColor(maskedPng, pixel, color);
      }
    }

    return maskedPng;
  }
}
