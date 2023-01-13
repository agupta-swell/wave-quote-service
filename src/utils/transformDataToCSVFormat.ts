/* eslint-disable no-plusplus */
/* eslint-disable no-restricted-syntax */
export const transformDataToCSVFormat = (csvFields: string[], csvData: any): string => {
  let csv = '';

  if (!csvFields.length) return csv;

  // add header to csv
  for (let i = 0; i < csvFields.length; i++) {
    csv += csvFields[i] + (i === csvFields.length - 1 ? '\r\n' : ',');
  }

  // get total rows
  let totalRows = 0;
  for (const key of Object.keys(csvData)) {
    if (csvData[key]?.length > totalRows) totalRows = csvData[key]?.length;
  }

  if (totalRows === 0) return csv;

  // add rows data to csv
  for (let rowIdx = 0; rowIdx < totalRows; rowIdx++) {
    for (let i = 0; i < csvFields.length; i++) {
      csv += (csvData[csvFields[i]]?.[rowIdx] ?? 'N/A') + (i === csvFields.length - 1 ? '\r\n' : ',');
    }
  }

  return csv;
};
