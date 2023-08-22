export class GoogleSunroofDownloadTiffException extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'GoogleSunroofDownloadTiffException';
    }
}