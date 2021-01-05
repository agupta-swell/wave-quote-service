import { UnauthorizedException } from '@nestjs/common';
import { ApplicationException } from 'src/app/app.exception';
import { AuthenticationService } from '../authentication.service';

describe('Authentication Service', () => {
  let authenticationService: AuthenticationService;

  beforeAll(() => {
    authenticationService = new AuthenticationService(null, null);
  });

  describe('login function', () => {
    it(`should not find email in system`, async () => {
      const mockUserService = {
        findByEmail: () => null,
      } as any;

      authenticationService = new AuthenticationService(mockUserService, null);

      try {
        await authenticationService.login('thanghq@dgroup.co', '1');
      } catch (error) {
        expect(error).toBeInstanceOf(ApplicationException);
      }
    });

    it('should compare password failure', async () => {
      const mockUserService = {
        findByEmail: () => ({
          services: {
            password: {
              bcrypt: '1',
            },
          },
        }),
      } as any;

      authenticationService = new AuthenticationService(mockUserService, null);

      try {
        await authenticationService.login('thanghq@dgroup.co', '1');
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
      }
    });

    // it('should login successfully', async () => {
    //   const mockUserService = {
    //     findByEmail: () => ({
    //       services: {
    //         password: {
    //           bcrypt: '$2b$10$1NbpS1adHeyMz15VlBH4H.bJbfmNqWKwIDjxYbzS42Md95evE4iwG',
    //         },
    //       },
    //     }),
    //   } as any;

    //   authenticationService = new AuthenticationService(mockUserService, null);

    //   const res = await authenticationService.login('thanghq@dgroup.co', '1');
    // });
  });
});
