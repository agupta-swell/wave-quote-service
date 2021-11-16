import { randomBytes } from 'crypto';
import { IMultipartBuilder } from './interfaces/IMultipartBuilder';
import { IMultipartMeta } from './interfaces/IMultipartMeta';

export class MultipartStreamBuilder<T extends IMultipartMeta> implements IMultipartBuilder {
  private readonly _stream: NodeJS.ReadableStream;

  private readonly _streamMetadata: T;

  private readonly _payload: Record<string, unknown>;

  private readonly _boundary: string;

  private readonly _closingBoundary: string;

  constructor(stream: NodeJS.ReadableStream, payload: Record<string, unknown>, streamMetadata: T) {
    this._stream = stream;

    this._payload = payload;

    this._streamMetadata = streamMetadata;

    const id = randomBytes(8).toString('hex');

    this._boundary = `----${id}`;

    this._closingBoundary = `------${id}--`;
  }

  getType(): string {
    return `multipart/form-data; boundary=${this._boundary}`;
  }

  pipe(writable: NodeJS.WritableStream): void {
    const multipartJson = [
      `--${this._boundary}`,
      'Content-Type: application/json',
      'Content-Disposition: form-data',
      '',
      JSON.stringify(this._payload),
    ].join('\r\n');

    writable.write(multipartJson);

    const multipartFileHead = [
      '',
      `--${this._boundary}`,
      `Content-Type: ${this._streamMetadata.mime}`,
      this.getMetaAsContentDisposition(),
      '',
      '',
    ].join('\r\n');

    writable.write(multipartFileHead);

    this._stream
      .on('data', chunk => {
        writable.write(chunk);
      })
      .on('error', err => {
        throw err;
      })
      .on('end', () => {
        writable.write('\r\n');
        writable.write(this._closingBoundary);
        writable.write('\r\n');
        writable.end();
      });
  }

  private getMetaAsContentDisposition(): string {
    const {mime: _, ...meta} = this._streamMetadata;
    const metaAsStringArr = Object.entries(meta).map(([key, value]) => `${key}="${value}"`);

    return ['Content-Disposition: file', ...metaAsStringArr].join(';');
  }
}
