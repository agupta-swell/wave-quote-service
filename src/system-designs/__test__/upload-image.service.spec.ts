import { UploadImageService } from '../sub-services';

describe('Upload Image Service', () => {
  let uploadImageService: UploadImageService;

  describe('uploadToAWSS3 function', () => {
    test('should work correctly', async () => {
      uploadImageService = new UploadImageService();
      const data = '123123';

      const spy = jest.spyOn(uploadImageService, 'uploadToAWSS3');
      const res = await uploadImageService.uploadToAWSS3(data);

      expect(spy).toHaveBeenCalled();
      expect(res).toEqual(expect.any(String));
    });
  });

  describe('deleteFileS3 function', () => {
    test('should work correctly', async () => {
      uploadImageService = new UploadImageService();

      const spy = jest.spyOn(uploadImageService, 'deleteFileS3');
      const res = await uploadImageService.deleteFileS3('http://');

      expect(spy).toHaveBeenCalled();
      expect(res).toBeUndefined();
    });
  });
});
