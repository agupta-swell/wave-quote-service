import { JwtStrategy } from '../jwt.strategy';

describe('Jwt Strategy', () => {
  let jwtStrategy: JwtStrategy;

  describe('validate function', () => {
    it('should validate successfully', async () => {
      jwtStrategy = new JwtStrategy();
      const payload = { userName: 'thanghq@dgroup.co', roles: ['ADMIN'], userId: '123' };
      const res = await jwtStrategy.validate(payload);

      expect(res.userName).toBe('thanghq@dgroup.co');
    });
  });
});
