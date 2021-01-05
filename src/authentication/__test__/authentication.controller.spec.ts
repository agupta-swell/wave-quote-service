import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { AuthencationModule } from 'src/authentication/authentication.module';
import { UserModule } from 'src/users/user.module';
import { USER } from 'src/users/user.schema';
import { AuthenticationController } from '../authentication.controller';
import { AuthenticationService } from '../authentication.service';
import { AuthenticationDto } from '../res/authentication.dto';

describe('Authentication Controller', () => {
  let authenticationController: AuthenticationController;
  let authenticationService: AuthenticationService;

  const mockRepository = {
    find() {
      return {};
    },
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AuthencationModule, UserModule],
    })
      .overrideProvider(getModelToken(USER))
      .useValue(mockRepository)
      .compile();

    authenticationService = moduleRef.get<AuthenticationService>(AuthenticationService);
    authenticationController = moduleRef.get<AuthenticationController>(AuthenticationController);
  });

  describe('login function', () => {
    it('should return access token and type', async () => {
      const result = new AuthenticationDto({
        accessToken: 'accessToken',
        type: 'Bearer',
      });

      jest.spyOn(authenticationService, 'login').mockImplementation(async () => result);

      const res = await authenticationController.login({ email: 'thanghq@dgroup.co', password: '1' });

      expect(res).toBe(result);
      expect(res).toBeInstanceOf(AuthenticationDto);
      expect(authenticationService.login).toHaveBeenCalledTimes(1);
    });
  });

  describe('get function', () => {
    it('should return current user information', () => {
      const result = {
        userId: '',
        userName: '',
        role: '',
      };

      expect(authenticationController.getCurrentUser(result)).toBe(result);
    });
  });
});
