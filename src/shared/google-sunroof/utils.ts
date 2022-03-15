import type { PNG } from "pngjs";

import type { Color } from "./types";

import * as fs from "fs";
import * as path from "path";

import { Pixel, PixelPolygon } from "./types";
import { magenta } from "./constants";

export const getPixelColor = (png: PNG, pixel: Pixel): Color => {
    const [x, y] = pixel;
    const pixelIndex = y * png.width + x;
    const pixelOffset = pixelIndex * 4;
    return [
        png.data[pixelOffset],
        png.data[pixelOffset + 1],
        png.data[pixelOffset + 2],
        png.data[pixelOffset + 3],
    ];
};

export const gray = (x: number): Color => [x, x, x];

export const lerp = (a: number, b: number, percent: number): number => {
    const range = b - a;
    return Math.round(a + percent * range);
};

export const lerpColor = (a: Color, b: Color, percent: number): Color => {
    return [
        lerp(a[0], b[0], percent),
        lerp(a[1], b[1], percent),
        lerp(a[2], b[2], percent),
        lerp(a[3] ?? 255, b[3] ?? 255, percent),
    ];
};

export const setPixelColor = (
    png: PNG,
    pixel: Pixel,
    color: Color = magenta
): void => {
    const [x, y] = pixel;
    const [red, green, blue, alpha = 255] = color;
    const pixelIndex = y * png.width + x;
    const pixelOffset = pixelIndex * 4;
    png.data[pixelOffset] = red;
    png.data[pixelOffset + 1] = green;
    png.data[pixelOffset + 2] = blue;
    png.data[pixelOffset + 3] = alpha;
};

export const writePngToFile = async (
    png: PNG,
    filename: string
): Promise<void> => {
    await fs.promises.mkdir(path.dirname(filename), { recursive: true });
    png.pack().pipe(fs.createWriteStream(filename));
};

const between = (p: Number, a: Number, b: Number) => {
    return (p >= a && p <= b) || (p <= a && p >= b);
};

const isPixelInPolygon = (pixelToTest: Pixel, polygon: PixelPolygon) => {
    let isInside = false;
    for (let i = polygon.length - 1, j = 0; j < polygon.length; i = j, j++) {
        const A = polygon[i];
        const B = polygon[j];

        // corner cases
        if (
            (pixelToTest[0] == A[0] && pixelToTest[1] == A[1]) ||
            (pixelToTest[0] == B[0] && pixelToTest[1] == B[1])
        )
            return true;
        if (
            A[1] == B[1] &&
            pixelToTest[1] == A[1] &&
            between(pixelToTest[0], A[0], B[0])
        )
            return true;

        if (between(pixelToTest[1], A[1], B[1])) {
            // if pixelToTest inside the vertical range
            // filter out "ray pass vertex" problem by treating the line a little lower
            if (
                (pixelToTest[1] == A[1] && B[1] >= A[1]) ||
                (pixelToTest[1] == B[1] && A[1] >= B[1])
            ) {
                continue;
            }
            // pixelToTest lays on left side of AB if c > 0
            const c =
                (A[0] - pixelToTest[0]) * (B[1] - pixelToTest[1]) -
                (B[0] - pixelToTest[0]) * (A[1] - pixelToTest[1]);
            if (c == 0) {
                return true;
            }
            if (A[1] < B[1] == c > 0) {
                isInside = !isInside;
            }
        }
    }

    return isInside;
};

export const getPanelPixels = (polygon: PixelPolygon) => {
    let panelPixels = new Array(2);
    let counter = 0;

    // get bounding box coordinates
    let minX = polygon[0][0];
    let maxX = polygon[0][0];
    let minY = polygon[0][1];
    let maxY = polygon[0][1];

    for (let i = 1; i < polygon.length; i++) {
        minX = Math.min(polygon[i][0], minX);
        maxX = Math.max(polygon[i][0], maxX);
        minY = Math.min(polygon[i][1], minY);
        maxY = Math.max(polygon[i][1], maxY);
    }

    for (let xp = minX; xp <= maxX; xp++) {
        for (let yp = minY; yp <= maxY; yp++) {
            if (isPixelInPolygon([xp, yp], polygon)) {
                panelPixels[counter] = [xp, yp];
                counter++;
            }
        }
    }

    console.log(`${counter} pixels added`);

    return panelPixels;
};
