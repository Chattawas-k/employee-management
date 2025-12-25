import { decodeJwtToken, getEmployeeIdFromToken, JwtPayload } from './jwt.util';

describe('JWT Utils', () => {
  describe('decodeJwtToken', () => {
    it('should decode a valid JWT token', () => {
      // Create a mock JWT token (header.payload.signature)
      const payload = { sub: 'user123', exp: Math.floor(Date.now() / 1000) + 3600, EmployeeId: 'emp-123' };
      const base64Payload = btoa(JSON.stringify(payload));
      const token = `header.${base64Payload}.signature`;

      const result = decodeJwtToken(token);
      expect(result).toBeTruthy();
      expect(result?.sub).toBe('user123');
      expect(result?.EmployeeId).toBe('emp-123');
    });

    it('should return null for invalid token format', () => {
      const result = decodeJwtToken('invalid-token');
      expect(result).toBeNull();
    });

    it('should return null for empty token', () => {
      const result = decodeJwtToken('');
      expect(result).toBeNull();
    });
  });

  describe('getEmployeeIdFromToken', () => {
    it('should extract employee ID from valid token', () => {
      const payload = { EmployeeId: 'emp-456', exp: Math.floor(Date.now() / 1000) + 3600 };
      const base64Payload = btoa(JSON.stringify(payload));
      const token = `header.${base64Payload}.signature`;

      const result = getEmployeeIdFromToken(token);
      expect(result).toBe('emp-456');
    });

    it('should return null for token without EmployeeId', () => {
      const payload = { sub: 'user123', exp: Math.floor(Date.now() / 1000) + 3600 };
      const base64Payload = btoa(JSON.stringify(payload));
      const token = `header.${base64Payload}.signature`;

      const result = getEmployeeIdFromToken(token);
      expect(result).toBeNull();
    });

    it('should return null for null token', () => {
      const result = getEmployeeIdFromToken(null);
      expect(result).toBeNull();
    });
  });
});

