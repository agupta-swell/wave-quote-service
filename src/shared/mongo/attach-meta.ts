/* eslint-disable @typescript-eslint/ban-types */
export type WithMeta<Document, TMeta> = Document & {
  $meta: TMeta;
};

export type WithMetaOfType<Document, OfType, Meta> = {
  [K in keyof Document]: Document[K] extends OfType
    ? WithMeta<Document[K], Meta>
    : Document[K] extends object
    ? WithMetaOfType<Document[K], OfType, Meta>
    : Document[K];
};

export function attachMeta<Document, Meta>(document: Document, meta: Meta): WithMeta<Document, Meta> {
  Object.defineProperty(document, '$meta', {
    value: meta,
  });

  return (document as unknown) as WithMeta<Document, Meta>;
}
