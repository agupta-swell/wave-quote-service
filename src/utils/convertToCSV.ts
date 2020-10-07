export async function fromStream(data: any): Promise<string[]> {
  const rawCSV = (await data.toBuffer()).toString() as string;
  return rawCSV.split(/\r?\n|\r/);
}
