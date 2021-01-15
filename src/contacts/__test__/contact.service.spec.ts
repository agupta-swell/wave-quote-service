import { ContactService } from '../contact.service';

describe('Contact Service', () => {
  let contactService: ContactService;

  describe('getEmailById function', () => {
    it(`should return undefined value`, async () => {
      const mockContact = {
        findById: jest.fn().mockResolvedValue(undefined),
      } as any;

      contactService = new ContactService(mockContact);

      const res = await contactService.getEmailById('1');

      expect(res).toMatchSnapshot();
      expect(res).toBeFalsy();
      expect(mockContact.findById).toHaveBeenCalledTimes(1);
    });

    test('should return email', async () => {
      const mockModel = { toObject: () => ({ email: 'mockEmail@gmail.com' }) };
      const mockContact = {
        findById: jest.fn().mockResolvedValue(mockModel),
      } as any;

      contactService = new ContactService(mockContact);

      const res = await contactService.getEmailById('1');

      expect(res).toMatchSnapshot();
      expect(res).toBeTruthy();
      expect(res).toEqual(expect.any(String));
      expect(mockContact.findById).toHaveBeenCalledTimes(1);
    });
  });

  describe('getContactById function', () => {
    it(`should return undefined value`, async () => {
      const mockContact = {
        findById: jest.fn().mockResolvedValue(undefined),
      } as any;

      contactService = new ContactService(mockContact);

      const res = await contactService.getContactById('1');

      expect(res).toMatchSnapshot();
      expect(res).toBeFalsy();
      expect(mockContact.findById).toHaveBeenCalledTimes(1);
    });

    test('should return contact model', async () => {
      const mockModel = {
        toObject: () => ({
          email: 'mockEmail@gmail.com',
          firstName: 'string',
          lastName: 'string',
          address1: 'string',
          address2: 'string',
          city: 'string',
          state: 'string',
          zip: 'string',
          cellPhone: 'string',
          contactId: 'string',
        }),
      };
      const mockContact = {
        findById: jest.fn().mockResolvedValue(mockModel),
      } as any;

      contactService = new ContactService(mockContact);

      const res = await contactService.getContactById('1');

      expect(res).toMatchSnapshot();
      expect(res).toBeTruthy();
      expect(res).toEqual(expect.any(Object));
      expect(mockContact.findById).toHaveBeenCalledTimes(1);
    });
  });
});
