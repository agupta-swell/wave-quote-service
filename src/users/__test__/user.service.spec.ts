import { UserService } from '../user.service';

describe('User Service', () => {
  let userService: UserService;

  describe('getUserById function', () => {
    test('should return undefined value', async () => {
      const mockUser = {
        findById: jest.fn().mockResolvedValue(null),
      } as any;

      userService = new UserService(mockUser);

      const res = await userService.getUserById('userId');

      expect(res).toMatchSnapshot();
      expect(res).toBeUndefined();
      expect(mockUser.findById).toHaveBeenCalledTimes(1);
    });

    test('should return user model', async () => {
      const mockModel = { toObject: jest.fn().mockReturnValueOnce({}) };
      const mockUser = {
        findById: jest.fn().mockResolvedValue(mockModel),
      } as any;

      userService = new UserService(mockUser);

      const res = await userService.getUserById('userId');

      expect(res).toMatchSnapshot();
      expect(res).not.toBeUndefined();
      expect(res).toMatchObject({});
      expect(mockUser.findById).toHaveBeenCalledTimes(1);
    });
  });

  describe('findByEmail function', () => {
    test('should return empty array', async () => {
      const mockUser = {
        find: jest.fn().mockResolvedValue([]),
      } as any;

      userService = new UserService(mockUser);

      const res = await userService.findByEmail('email');

      expect(res).toMatchSnapshot();
      expect(res).toBeNull();
      expect(mockUser.find).toHaveBeenCalledTimes(1);
    });

    test('should return utility program name model array', async () => {
      const mockModel = {
        toObject: jest.fn().mockReturnValueOnce({}),
      };
      const mockUser = {
        find: jest.fn().mockResolvedValue([mockModel]),
      } as any;

      userService = new UserService(mockUser);

      const res = await userService.findByEmail('email');

      expect(res).toMatchSnapshot();
      expect(res).toMatchObject(mockModel);
      expect(mockUser.find).toHaveBeenCalledTimes(1);
    });
  });
});
