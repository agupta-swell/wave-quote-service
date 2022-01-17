export const createBucketInjectKey = (bucketName: string, connectionName?: string): string => {
  const basename = `__gridfs_bucket__`;

  if (connectionName) return `${basename}/${connectionName}/${bucketName}`;

  return `${basename}/${bucketName}`;
};
