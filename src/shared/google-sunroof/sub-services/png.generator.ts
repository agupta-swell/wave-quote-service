
import type { TypedArrayArrayWithDimensions } from 'geotiff';

import { chunk } from 'lodash';
import { PNG } from 'pngjs';

import { ISolarPanelArraySchema } from 'src/system-designs/system-design.schema';

import type { Pixel, Color, LatLng } from './types';
import { black, white, blue, red } from '../constants';

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
  // public static generateMonthlyHeatmap (monthlyLayers: TypedArrayArrayWithDimensions): Array<PNG> {
  //   return (monthlyLayers)
  //     .map( x => x.map ( value => value * 12 ))
  //     .map( x => chunk(x, monthlyLayers.width))
  //     .map(x => PngGenerator.generateHeatmapPng(x))
  //     .map(x => PngGenerator.upscalePng(x, 5))
  // }

  /**
   * Expected input is three layers, for red, green, and blue values.
   *
   * These are combined into an RGB PNG.
   * The height and width of the image are defined on the input.
   *
   * @param rgbLayers
   */
  public static generateRgbPng (
    rgbLayers: TypedArrayArrayWithDimensions
  ) : PNG {
    const { height, width } = rgbLayers;
    const [redLayer, greenLayer, blueLayer] = rgbLayers;
    const reds = chunk(redLayer, width)
    const greens = chunk(greenLayer, width)
    const blues = chunk(blueLayer, width)

    const rbgPng = new PNG({ height, width });

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const driftPixel: Pixel = [x, y];
        const driftColor: Color = [
          reds[y][x] as number,
          greens[y][x] as number,
          blues[y][x] as number,
        ];
        setPixelColor(rbgPng, driftPixel, driftColor);
      }
    }

    return rbgPng;
  }

  /**
   * Expected input is one layer, full of ones and zeroes.
   *
   * The output is a black and white PNG, where zeroes are black and ones are white.
   * The height and width of the image are defined on the input.
   *
   * @param maskLayers
   */
  public static generateBlackAndWhitePng (maskLayers: TypedArrayArrayWithDimensions) : PNG {
    const { height, width } = maskLayers;
    const [layer] = maskLayers;
    const mask = chunk(layer, width);

    const newPng = new PNG({ height, width });

    for (let y = 0; y < maskLayers.height; y++) {
      for (let x = 0; x < maskLayers.width; x++) {
        const pixel: Pixel = [x, y];
        const color = mask[y][x] ? white: black;
        setPixelColor(newPng, pixel, color);
      }
    }

    return newPng;
  }

  /**
   * Expected input is a multi-dimensional array of flux values.
   * Flux values are annual productivity of a given pixel area.
   * The unit of the flux values is kilowatt-hours per kilowatts per year; kWh/kW/yr.
   * That is, how many kWh of energy will produced per kW of panels at this pixel location.
   * Typical values are in the 1000-3000 range.
   *
   * The output is a color-gradient heat map PNG.
   * The height and width of the image are assumed by the dimensions of the input array.
   *
   * @param flux
   */
  public static generateHeatmapPng (
    flux: number[][]
  ) : PNG {
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

  /**
   * The input is two pre-existing pngs and a mask. The mask is a multidimensional array of
   * ones and zeroes.
   *
   * The output is a new PNG. In this PNG ,pixels coordinates which are set to 1 in the mask
   * come from the foreground image, and pixels coordinates set to 0 in the mask come from
   * the background image.
   *
   * @param foregroundPng
   * @param backgroundPng
   * @param mask
   */
  // TODO more robust dimension detection
  public static applyMaskedOverlay (
    foregroundPng: PNG,
    backgroundPng: PNG,
    mask: number[][],
  ) : PNG {
    const height = foregroundPng.height;
    const width = foregroundPng.width;

    const maskedPng = new PNG({ height, width });
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixel: Pixel = [x, y];
        let color: Color;
        if (mask[y]?.[x]) {
          color = getPixelColor(foregroundPng, pixel);
        } else {
          color = getPixelColor(backgroundPng, pixel);
        }
        setPixelColor(maskedPng, pixel, color);
      }
    }

    return maskedPng;
  }

  /**
   * The input is an existing PNG and a scaling factor. Linear
   * smoothing/interpolation is applied to the enlarged image.
   *
   * The output is a new, larger PNG.
   *
   * @param png
   * @param factor
   */
  public static upscalePng (png: PNG, factor: number) : PNG {
    const interpolatedHeight = (png.height - 1) * factor;
    const interpolatedWidth = (png.width - 1) * factor;
    const interpolated = new PNG({
      height: interpolatedHeight,
      width: interpolatedWidth,
    });
    for (let y = 0; y < png.height - 1; y++) {
      for (let x = 0; x < png.width - 1; x++) {
        const thisColor = getPixelColor(png, [x, y]);
        const xColor = getPixelColor(png, [x + 1, y]);
        const yColor = getPixelColor(png, [x, y + 1]);
        const xyColor = getPixelColor(png, [x + 1, y + 1]);
        for (let b = 0; b < factor; b++) {
          const percentB = b / factor;
          const leftColor = lerpColor(thisColor, yColor, percentB);
          const rightColor = lerpColor(xColor, xyColor, percentB);
          for (let a = 0; a < factor; a++) {
            const pixel: Pixel = [
              factor * x + a,
              factor * y + b,
            ];
            const percentA = a / factor;
            const color = lerpColor(leftColor, rightColor, percentA);
            setPixelColor(interpolated, pixel, color);
          }
        }
      }
    }

    return interpolated
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
}
