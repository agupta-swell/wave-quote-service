/* eslint-disable no-use-before-define */
/* eslint-disable no-restricted-syntax */
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { isMongoId } from 'class-validator';
import type { TypedArrayArrayWithDimensions } from 'geotiff';
import * as geotiff from 'geotiff';
import { chunk } from 'lodash';
import { LeanDocument } from 'mongoose';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { PNG } from 'pngjs';
import { MountTypesService } from 'src/mount-types-v2/mount-types-v2.service';
import { SystemDesign } from '../../system-designs/system-design.schema';
import {
  calcCoordinatesDistance,
  ICoordinate,
  isCoordinatesInsideBoundByAtLeast,
} from '../../utils/calculate-coordinates';
import { S3Service } from '../aws/services/s3.service';
import { DAY_COUNT_BY_MONTH_INDEX } from './constants';
import { GoogleSunroofGateway } from './google-sunroof.gateway';
import { PngGenerator } from './png.generator';
import { ProductionCalculator } from './production.calculator';
import type {
  GoogleSunroof,
  GoogleSunroofOrientationInformation,
  IClosestBuildingKey,
  SystemProduction,
} from './types';

const DEBUG = ['yes', 'true', 'on', '1'].includes(process.env.GOOGLE_SUNROOF_DEBUG?.toLowerCase() || 'false');
const DEBUG_FOLDER = path.join(__dirname, 'debug');

@Injectable()
export class GoogleSunroofService {
  private readonly GOOGLE_SUNROOF_S3_BUCKET: string;

  constructor(
    private readonly googleSunroofGateway: GoogleSunroofGateway,
    private readonly s3Service: S3Service,
    private readonly mountTypesService: MountTypesService,
  ) {
    const bucket = process.env.GOOGLE_SUNROOF_S3_BUCKET;
    if (!bucket) throw new Error('Missing GOOGLE_SUNROOF_S3_BUCKET environment variable');
    this.GOOGLE_SUNROOF_S3_BUCKET = bucket;
  }

  /**
   * Build a file path for `closestBuilding.json`
   *
   * If the `systemDesign` is not created yet or to look up by the opportunity address, use `lat/lng` instead of `systemDesignId/arrayId`
   *
   * @param opportunityId
   * @param systemDesignId
   * @param arrayId
   * @param lat
   * @param lng
   * @returns
   */
  public static BuildClosestBuildingKey(
    opportunityId: string,
    systemDesignId?: string,
    arrayId?: string,
    lat?: number,
    lng?: number,
  ): IClosestBuildingKey {
    if (arrayId && systemDesignId && isMongoId(arrayId) && isMongoId(systemDesignId)) {
      return { key: `${opportunityId}/${systemDesignId}/${arrayId}/closestBuilding.json` };
    }

    if (!lat || !lng) throw new TypeError('Either lat/lng or systemDesignId/arrayId must be provided');

    return {
      key: `${opportunityId}/${lat}/${lng}/closestBuilding.json`,
    };
  }

  /**
   * Check S3 for the cached `closestBuilding.json` file for the given opportunityId.
   * Fetch, and cache, it from Google Sunroof if the file does not already exist.
   *
   * @param opportunityId
   * @param latitude
   * @param longitude
   */
  public async getClosestBuilding(
    closestBuildingKey: IClosestBuildingKey,
    latitude: number,
    longitude: number,
  ): Promise<GoogleSunroof.Building> {
    const { key } = closestBuildingKey;
    let closestBuilding = await this.getS3FileAsJson<GoogleSunroof.Building>(key);
    if (!closestBuilding) {
      closestBuilding = await this.googleSunroofGateway.findClosestBuilding(latitude, longitude);
      await this.saveObjectAsJsonToS3(closestBuilding, key);
    }
    return closestBuilding;
  }

  /**
   * For the given system design details, determine the appropriate array polygon azimuth side,
   * pitch (degrees), and azimuth (degrees) based on the available closestBuilding data.
   *
   * Returns an empty object if there is a problem.
   *
   * @param opportunityId
   * @param latitude
   * @param longitude
   * @param centerLat
   * @param centerLng
   * @param sideAzimuths
   * @param polygons
   */
  public async getOrientationInformation(
    closestBuildingKey: IClosestBuildingKey,
    centerLat: number,
    centerLng: number,
    sideAzimuths: number[],
    polygons: ICoordinate[],
  ): Promise<GoogleSunroofOrientationInformation> {
    const closestBuilding = await this.getClosestBuilding(closestBuildingKey, centerLat, centerLng);

    if (!Array.isArray(closestBuilding?.solarPotential?.roofSegmentStats)) {
      return {};
    }

    const segmentsContainPanel = closestBuilding.solarPotential.roofSegmentStats.filter(segment =>
      isCoordinatesInsideBoundByAtLeast(polygons, {
        ne: {
          lat: segment.boundingBox.ne.latitude,
          lng: segment.boundingBox.ne.longitude,
        },
        sw: {
          lat: segment.boundingBox.sw.latitude,
          lng: segment.boundingBox.sw.longitude,
        },
      }),
    );

    let closestSegment: GoogleSunroof.Building['solarPotential']['roofSegmentStats'][number];

    if (segmentsContainPanel.length === 1) {
      const [segment] = segmentsContainPanel;

      closestSegment = segment;
    } else
      closestSegment = (segmentsContainPanel.length
        ? segmentsContainPanel
        : closestBuilding.solarPotential.roofSegmentStats
      )
        .map(e => {
          const distance = calcCoordinatesDistance(
            {
              lat: centerLat,
              lng: centerLng,
            },
            {
              lat: e.center.latitude,
              lng: e.center.longitude,
            },
          );

          return {
            ...e,
            distance,
          };
        })
        .sort((a, b) => a.distance - b.distance)[0];

    if (!closestSegment.azimuthDegrees) {
      return {};
    }

    const closestSide = sideAzimuths
      .map((e, idx) => ({
        side: idx + 1,
        val: Math.abs(closestSegment.azimuthDegrees - e),
      }))
      .sort((a, b) => a.val - b.val)[0].side;

    return {
      sunroofPrimaryOrientationSide: closestSide,
      sunroofPitch: closestSegment.pitchDegrees,
      sunroofAzimuth: closestSegment.azimuthDegrees,
      boundingBoxes: this.formatRoofSegmentStats(closestBuilding.solarPotential.roofSegmentStats, sideAzimuths),
    };
  }

  /**
   *
   * @param roofSegmentStats
   * @param sideAzimuths
   * @returns format return data for bounding boxes
   */
  public formatRoofSegmentStats(roofSegmentStats: GoogleSunroof.RoofSegmentStats[], sideAzimuths: number[]) {
    return roofSegmentStats
      .map(({ azimuthDegrees, boundingBox, pitchDegrees }) => ({
        ...boundingBox,
        azimuthDegrees,
        pitchDegrees,
      }))
      .filter(e => e.azimuthDegrees !== undefined && e.pitchDegrees !== undefined)
      .map(e => ({
        ...e,
        sunroofPrimaryOrientationSide: sideAzimuths
          .map((side, idx) => ({
            side: idx + 1,
            val: Math.abs(e.azimuthDegrees - side),
          }))
          .sort((a, b) => a.val - b.val)[0].side,
      }));
  }

  /**
   * This function fetches everything needed from Google Sunroof and generates
   * all relevant PNGs for the given system design.
   *
   * It is lengthy, but the verbose variable naming should make it readable.
   *
   * It relies heavily on Promises for parallelization. There is only one final
   * `await` statement at the bottom of the function.
   *
   * @param systemDesign
   */
  public async generateHeatmapPngs(systemDesign: SystemDesign, radiusMeters = 25): Promise<void> {
    const { latitude, longitude, opportunityId, _id } = systemDesign;

    const systemDesignId = _id.toString();

    const solarInfo = await this.googleSunroofGateway.getSolarInfo(latitude, longitude, radiusMeters);

    const savingSolarInfoJsonToS3 = this.saveObjectAsJsonToS3(
      solarInfo,
      `${opportunityId}/${systemDesignId}/solarInfo.json`,
    );

    const { rgbUrl, maskUrl, annualFluxUrl, monthlyFluxUrl } = solarInfo;

    const downloadingRgbTiffBuffer = downloadFileAsBuffer(rgbUrl);
    const downloadingMaskTiffBuffer = downloadFileAsBuffer(maskUrl);
    const downloadingAnnualFluxTiffBuffer = downloadFileAsBuffer(annualFluxUrl);
    const downloadingMonthlyFluxTiffBuffer = downloadFileAsBuffer(monthlyFluxUrl);

    const savingRgbTiffToS3 = downloadingRgbTiffBuffer.then(async rgbTiffBuffer => {
      await this.saveTiffToS3(rgbTiffBuffer, `${opportunityId}/${systemDesignId}/tiff/rgb.tiff`);
    });
    const savingMaskTiffToS3 = downloadingMaskTiffBuffer.then(async maskTiffBuffer => {
      await this.saveTiffToS3(maskTiffBuffer, `${opportunityId}/${systemDesignId}/tiff/mask.tiff`);
    });
    const savingAnnualFluxTiffToS3 = downloadingAnnualFluxTiffBuffer.then(async annualFluxTiffBuffer => {
      await this.saveTiffToS3(annualFluxTiffBuffer, `${opportunityId}/${systemDesignId}/tiff/annualFlux.tiff`);
    });
    const savingMonthlyFluxTiffToS3 = downloadingMonthlyFluxTiffBuffer.then(async monthlyFluxTiffBuffer => {
      await this.saveTiffToS3(monthlyFluxTiffBuffer, `${opportunityId}/${systemDesignId}/tiff/monthlyFlux.tiff`);
    });

    const generatingSatellitePng = downloadingRgbTiffBuffer.then(async rgbTiffBuffer => {
      const rgbLayers = await getLayersFromTiffBuffer(rgbTiffBuffer);
      return PngGenerator.generateRgbPng(rgbLayers);
    });

    const savingSatellitePngToS3 = generatingSatellitePng.then(async satellitePng => {
      await this.savePngToS3(satellitePng, `${opportunityId}/${systemDesignId}/png/satellite.png`);
    });

    const gettingLayersFromMaskTiffBuffer = downloadingMaskTiffBuffer.then(maskTiffBuffer =>
      getLayersFromTiffBuffer(maskTiffBuffer),
    );

    const gettingMask = gettingLayersFromMaskTiffBuffer.then(maskLayers => {
      const {
        0: maskLayer, // the mask tiff has only one layer
        width,
      } = maskLayers;
      return chunk(maskLayer, width);
    });

    const generatingMaskPng = gettingLayersFromMaskTiffBuffer.then(maskLayers =>
      PngGenerator.generateBlackAndWhitePng(maskLayers),
    );

    const savingMaskPngToS3 = generatingMaskPng.then(async maskPng => {
      await this.savePngToS3(maskPng, `${opportunityId}/${systemDesignId}/png/mask.png`);
    });

    const generatingAnnualHeatmapPng = downloadingAnnualFluxTiffBuffer.then(async annualFluxTiffBuffer => {
      const {
        0: annualFluxLayer, // the annual flux tiff has only one layer
        width,
      } = await getLayersFromTiffBuffer(annualFluxTiffBuffer);
      const annualFlux = chunk(annualFluxLayer, width);
      return PngGenerator.generateHeatmapPng(annualFlux);
    });

    const savingAnnualHeatmapPngToS3 = generatingAnnualHeatmapPng.then(async annualHeatmapPng => {
      await this.savePngToS3(annualHeatmapPng, `${opportunityId}/${systemDesignId}/png/heatmap.annual.png`);
    });

    const generatingAnnualMaskedHeatmapPng = Promise.all([
      generatingAnnualHeatmapPng,
      generatingSatellitePng,
      gettingMask,
    ]).then(([annualHeatmapPng, satellitePng, mask]) =>
      PngGenerator.applyMaskedOverlay(annualHeatmapPng, satellitePng, mask),
    );

    const savingAnnualMaskedHeatmapPngToS3 = generatingAnnualMaskedHeatmapPng.then(async annualMaskedHeatmapPng => {
      await this.savePngToS3(
        annualMaskedHeatmapPng,
        `${opportunityId}/${systemDesignId}/png/heatmap.annual.masked.png`,
      );
    });

    const savingAllMonthlyPngsToS3 = downloadingMonthlyFluxTiffBuffer.then(async monthlyFluxTiffBuffer => {
      const monthlyFluxLayers = await getLayersFromTiffBuffer(monthlyFluxTiffBuffer);
      const { width } = monthlyFluxLayers;
      await Promise.all(
        monthlyFluxLayers.map(async (monthlyFluxLayer, monthIndex) => {
          const annualScalingFactor = 365 / DAY_COUNT_BY_MONTH_INDEX[monthIndex];
          const annualizedFluxLayer = monthlyFluxLayer.map(x => x * annualScalingFactor);
          const flux = chunk(annualizedFluxLayer, width);

          let heatmapPng = PngGenerator.generateHeatmapPng(flux);
          heatmapPng = PngGenerator.upscalePng(heatmapPng, 5);

          const savingHeatmapPngToS3 = this.savePngToS3(
            heatmapPng,
            `${opportunityId}/${systemDesignId}/png/heatmap.month${monthIndex}.png`,
          );

          const generatingMaskedHeatmapPng = Promise.all([
            generatingSatellitePng,
            gettingMask,
          ]).then(([satellitePng, mask]) => PngGenerator.applyMaskedOverlay(heatmapPng, satellitePng, mask));

          const savingMaskHeatmapPngToS3 = generatingMaskedHeatmapPng.then(async maskedHeatmapPng => {
            await this.savePngToS3(
              maskedHeatmapPng,
              `${opportunityId}/${systemDesignId}/png/heatmap.month${monthIndex}.masked.png`,
            );
          });

          await Promise.all([savingHeatmapPngToS3, savingMaskHeatmapPngToS3]);
        }),
      );
    });

    await Promise.all([
      savingSolarInfoJsonToS3,
      savingRgbTiffToS3,
      savingMaskTiffToS3,
      savingAnnualFluxTiffToS3,
      savingMonthlyFluxTiffToS3,
      savingSatellitePngToS3,
      savingMaskPngToS3,
      savingAnnualHeatmapPngToS3,
      savingAnnualMaskedHeatmapPngToS3,
      savingAllMonthlyPngsToS3,
    ]);
  }

  /**
   * Pull everything into memory necessary for drawing the solar array data
   * for the given system design into a PNG.
   *
   * @param systemDesign
   */
  public async generateArrayOverlayPng(systemDesign: SystemDesign | LeanDocument<SystemDesign>): Promise<void> {
    const {
      latitude,
      longitude,
      opportunityId,
      roofTopDesignData: { panelArray: arrays },
      _id,
    } = systemDesign;

    const systemDesignId = _id.toString();

    // fetch the annual flux tiff for this opportunity to get the dimensions for the overlay png
    const annualFluxTiffBuffer = await this.getS3FileAsBuffer(
      `${opportunityId}/${systemDesignId}/tiff/annualFlux.tiff`,
    );
    if (!annualFluxTiffBuffer) {
      throw new Error('Cannot generate array overlay PNG before GeoTIFFs have been downloaded!');
    }
    const tiffLayers = await getLayersFromTiffBuffer(annualFluxTiffBuffer);
    const { height, width } = tiffLayers;

    const arrayPng = PngGenerator.generateArrayOverlayPng(
      height,
      width,
      {
        lat: latitude,
        lng: longitude,
      },
      10, // the annual flux tiff has a resolution of 10 pixels per meter (10cm per pixel)
      arrays,
    );

    await this.savePngToS3(arrayPng, `${opportunityId}/${systemDesignId}/png/array.overlay.png`);
  }

  /**
   * Calculates the annual and monthly production numbers for a given system design.
   *
   * Relies on cached flux GeoTIFF files in the expected location in S3.
   *
   * The output is an object with annual and monthly kWh production figures,
   * for the system as a whole and for each array in particular.
   *
   * @param systemDesign
   */
  public async calculateProduction(systemDesign: SystemDesign | LeanDocument<SystemDesign>): Promise<SystemProduction> {
    const { opportunityId, _id } = systemDesign;
    const sunroofDriftCorrection = systemDesign?.sunroofDriftCorrection || { x: 0, y: 0 };
    const systemDesignId = _id.toString();

    const [annualFluxTiffBuffer, monthlyFluxTiffBuffer] = await Promise.all([
      this.getS3FileAsBuffer(`${opportunityId}/${systemDesignId}/tiff/annualFlux.tiff`),
      this.getS3FileAsBuffer(`${opportunityId}/${systemDesignId}/tiff/monthlyFlux.tiff`),
    ]);
    if (!annualFluxTiffBuffer || !monthlyFluxTiffBuffer) {
      throw new Error('Cannot calculate system production before GeoTIFFs have been downloaded!');
    }

    const [annualFluxLayers, monthlyFluxLayers] = await Promise.all([
      getLayersFromTiffBuffer(annualFluxTiffBuffer),
      getLayersFromTiffBuffer(monthlyFluxTiffBuffer),
    ]);

    return ProductionCalculator.calculateSystemProduction(
      systemDesign,
      annualFluxLayers,
      monthlyFluxLayers,
      sunroofDriftCorrection,
    );
  }

  /// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Private S3 helper functions

  /**
   * Reads an S3 object and parse is as JSON.
   * Returns null if the object does not exist.
   * Throws a SyntaxError if the object is not valid JSON.
   *
   * @param key
   * @private
   * @throws SyntaxError
   */
  private async getS3FileAsJson<T>(key: string): Promise<T | null> {
    const buffer = await this.getS3FileAsBuffer(key);
    if (!buffer) return null;
    const json = buffer.toString('utf-8');
    return JSON.parse(json);
  }

  /**
   * Reads an S3 object into a NodeJS Buffer.
   * Returns null if the object does not exist.
   *
   * @param key
   * @private
   */
  private async getS3FileAsBuffer(key: string): Promise<Buffer | null> {
    const stream = this.s3Service.getObjectAsReadable(this.GOOGLE_SUNROOF_S3_BUCKET, key);
    const chunks: Buffer[] = [];
    try {
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
    } catch (_) {
      // any error, such as NoSuchKey (file not found)
      return null;
    }
    return Buffer.concat(chunks);
  }

  /**
   * Stringify the given object into S3 with an `application/json` MIME type.
   *
   * @param obj
   * @param key
   * @private
   */
  private async saveObjectAsJsonToS3(obj: Object, key: string): Promise<void> {
    await this.s3Service.putObject(
      this.GOOGLE_SUNROOF_S3_BUCKET,
      key,
      JSON.stringify(obj, null, 2),
      'application/json; charset=utf-8',
    );
  }

  /**
   * Save the given Buffer to S3 with an `image/tiff` MIME type.
   *
   * @param tiffBuffer
   * @param key
   * @private
   */
  private async saveTiffToS3(tiffBuffer: Buffer, key: string): Promise<void> {
    await this.s3Service.putObject(this.GOOGLE_SUNROOF_S3_BUCKET, key, tiffBuffer, 'image/tiff');
  }

  /**
   * Serialize a PNG into S3 with an `image/png` MIME type.
   *
   * If debugging is enabled, also dump the image to a local folder.
   *
   * @param png
   * @param key
   * @private
   */
  private async savePngToS3(png: PNG, key: string): Promise<void> {
    if (DEBUG) {
      await fs.promises.mkdir(DEBUG_FOLDER, { recursive: true });
      png.pack().pipe(fs.createWriteStream(path.join(DEBUG_FOLDER, path.basename(key))));
    }
    await this.s3Service.putObject(this.GOOGLE_SUNROOF_S3_BUCKET, key, PNG.sync.write(png), 'image/png');
  }

  public async isExistedGeotiff(latitude, longitude, radiusMeters = 25): Promise<boolean> {
    try {
      await this.googleSunroofGateway.getSolarInfo(latitude, longitude, radiusMeters);
    } catch (error) {
      return false;
    }
    return true;
  }
}

/**
 * Return the contents of the provided URL as a NodeJS Buffer.
 *
 * @param url
 */
async function downloadFileAsBuffer(url: string): Promise<Buffer> {
  const { data } = await axios.get<Buffer>(url, { responseType: 'arraybuffer' });
  return data;
}

/**
 * Construct a GeoTiff (from Buffer data) and read its rasters (layers).
 *
 * @param tiffBuffer
 */
async function getLayersFromTiffBuffer(tiffBuffer: Buffer): Promise<TypedArrayArrayWithDimensions> {
  const tiff = await geotiff.fromBuffer(tiffBuffer);
  // We are casting here to narrow the result, because every Google
  // Sunroof tiff that we need to handle is a multi layer tiff, even
  // if there is only one layer (i.e. the return value here will
  // always be an array, even if it is of length 1).
  return (await tiff.readRasters()) as TypedArrayArrayWithDimensions;
}
