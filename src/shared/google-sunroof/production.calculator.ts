import { chunk, mean, range, sum, sumBy } from 'lodash';

import type { TypedArrayArrayWithDimensions } from 'geotiff';

import { LeanDocument } from 'mongoose';

import { ISolarPanelArraySchema, SystemDesign } from '../../system-designs/system-design.schema';

import type { ArrayProduction, IDriftCorrection, LatLng, Pixel, SystemProduction } from './types';

import { getPanelPixels, mapLatLngPolygonToPixelPolygon, translatePixelPolygon } from './utils';

export class ProductionCalculator {
  /**
   * Calculates the annual and monthly production numbers for a given system
   * design using the provided annual and monthly flux GeoTIFFs.
   *
   * 'Flux' is the productivity (kWh/kW) of a map pixel.
   *
   * 'Drift correction' is the number of pixels to shift the array overlay over
   * the annual heatmap to best align them.
   *
   * @param systemDesign
   * @param annualFluxLayers
   * @param monthlyFluxLayers
   * @param annualDriftCorrection
   */
  public static calculateSystemProduction(
    systemDesign: SystemDesign | LeanDocument<SystemDesign>,
    annualFluxLayers: TypedArrayArrayWithDimensions,
    monthlyFluxLayers: TypedArrayArrayWithDimensions,
    annualDriftCorrection: IDriftCorrection,
  ): SystemProduction {
    const {
      latitude,
      longitude,
      roofTopDesignData: { panelArray: arrays },
    } = systemDesign;

    const origin: LatLng = {
      lat: latitude,
      lng: longitude,
    };

    // parse the GeoTIFF flux layers into 2-dimensional flux arrays
    const { 0: annualFluxLayer, width: annualWidth } = annualFluxLayers;
    const annualFlux = chunk(annualFluxLayer, annualWidth);
    const { width: monthlyWidth } = monthlyFluxLayers;
    const monthlyFluxes = monthlyFluxLayers.map(monthlyFluxLayer => chunk(monthlyFluxLayer, monthlyWidth));

    // calculate the production numbers of each array in the system
    const arrayProductions = arrays.map(array => {
      return ProductionCalculator.calculateArrayProduction(
        annualFlux,
        monthlyFluxes,
        origin,
        array,
        annualDriftCorrection,
      );
    });

    // summarize array production into system level figures
    const annualProduction = sumBy(arrayProductions, 'annualProduction');
    const monthlyProduction = range(12).map(monthIndex => {
      return sum(arrayProductions.map(x => x.monthlyProduction[monthIndex]));
    });

    return {
      annualProduction,
      monthlyProduction,
      byArray: arrayProductions,
    };
  }

  /**
   * Calculates the annual and monthly production numbers for a given array
   * using the provided annual and monthly flux/productivity data.
   *
   * The `array` contains information about the nominal rating and placement
   * of panels.
   *
   * As the annual and monthly flux data is available at different resolutions,
   * an additional computational step is performed to ensure that the monthly
   * production numbers add up to the calculated annual production number.
   *
   * Any drift correction is presumed to be in annual 10cm-pixel figures.
   * Monthly drift correction is computed accordingly.
   *
   * @param annualFlux
   * @param monthlyFluxes
   * @param origin
   * @param array
   * @param annualDriftCorrection
   * @private
   */
  private static calculateArrayProduction(
    annualFlux: number[][],
    monthlyFluxes: number[][][],
    origin: LatLng,
    array: ISolarPanelArraySchema,
    annualDriftCorrection: IDriftCorrection,
  ): ArrayProduction {
    const {
      arrayId,
      panels,
      panelModelDataSnapshot: {
        ratings: { wattsPtc: watts },
      },
    } = array;

    // calculate the total production for the year
    const annualProduction = ProductionCalculator.calculateGenericArrayProduction(
      annualFlux,
      origin,
      10, // the annual flux tiff has a resolution of 10 pixels per meter (10cm per pixel)
      panels,
      watts,
      annualDriftCorrection,
    );

    // calculate the production
    // which is only available at a lower resolution.
    const rawMonthlyProduction = monthlyFluxes.map(monthlyFlux => {
      return ProductionCalculator.calculateGenericArrayProduction(
        monthlyFlux,
        origin,
        2, // the monthly flux tiff has a resolution of 2 pixels per meter (50cm per pixel)
        panels,
        watts,
        {
          x: Math.round(annualDriftCorrection.x / 5), // TODO WAV-1645: is this the right formula?
          y: Math.round(annualDriftCorrection.y / 5), // TODO WAV-1645: is this the right formula?
        },
      );
    });

    // we need to correct the monthly numbers to ensure they sum up to the annual number
    const scalingFactor = annualProduction / sum(rawMonthlyProduction);
    const correctedMonthlyProduction = rawMonthlyProduction.map(x => x * scalingFactor);

    return {
      arrayId: arrayId.toString(),
      annualProduction,
      monthlyProduction: correctedMonthlyProduction,
    };
  }

  /**
   * Calculate the kWh production of some panels in some situation.
   *
   * This function is very generic.
   *
   * `flux` is a two dimensional array of productivity (kWh/kW) numbers,
   * but it works for annual or monthly (single month) data.
   *
   * `origin` contains the lat/lng coordinates of the center data pixel.
   *
   * `pixelsPerMeter` is the resolution of the flux data,
   * which maybe be annual or  monthly (single month).
   *
   * `panels` is the location data (the lat/lng of each corner) of the panels
   * of only a single array of a system design. Panel placement is calculated
   * relative to the provided `origin`.
   *
   * `panelWattage` is the nominal rating of a panel in the array,
   * and it is assumed that all panels in the array have the same rating.
   *
   * `driftCorrection` is a translation to be applied to the panel pixels
   * locations before averaging the flux values, to correct for a poorly
   * aligned system. NB: Since the image are of different resolutions,
   * the _pixel_ drift should be different between annual and monthly
   * calculations for the same system design.
   *
   * TODO As of 2022-05-18, if a panel lies outside of the GeoTIFF flux area,
   *      it is thought that this function will throw an error, because a pixel
   *      coordinate will be calculated outside of the flux data array.
   *
   * @param flux
   * @param origin
   * @param pixelsPerMeter
   * @param panels
   * @param panelWattage
   * @param driftCorrection
   * @private
   */
  private static calculateGenericArrayProduction(
    flux: number[][],
    origin: LatLng,
    pixelsPerMeter: number,
    panels: ISolarPanelArraySchema['panels'],
    panelWattage: number,
    driftCorrection: IDriftCorrection,
  ): number {
    const height = flux.length;
    const width = flux[0].length;

    const originPixel: Pixel = [Math.round(height / 2), Math.round(width / 2)];

    const panelProductions = panels.map(panel => {
      const rawPanelPixelPolygon = mapLatLngPolygonToPixelPolygon(origin, panel, pixelsPerMeter);

      const centeredPanelPixelPolygon = translatePixelPolygon(rawPanelPixelPolygon, originPixel);

      const driftCorrectedPanelPixelPolygon = translatePixelPolygon(centeredPanelPixelPolygon, [
        driftCorrection.x,
        driftCorrection.y,
      ]);

      const allPanelPixels = getPanelPixels(driftCorrectedPanelPixelPolygon);
      const allPanelFluxValues = allPanelPixels.map(([x, y]) => flux[y][x]);
      const panelProductivity = mean(allPanelFluxValues);
      return (panelProductivity * panelWattage) / 1000;
    });

    return sum(panelProductions);
  }
}
