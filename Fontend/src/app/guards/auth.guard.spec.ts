import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { RouterTestingModule } from '@angular/router/testing';

describe('authGuard', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('AuthService', ['getToken', 'isAuthenticated']);
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpyObj }
      ]
    });

    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should allow access when token is valid and not expired', () => {
    // Mock a valid token (not expired)
    const validPayload = {
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      sub: 'user123'
    };
    const base64Payload = btoa(JSON.stringify(validPayload));
    const validToken = `header.${base64Payload}.signature`;

    authServiceSpy.getToken.and.returnValue(validToken);
    authServiceSpy.isAuthenticated.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() => 
      authGuard({} as any, { url: '/test' } as any)
    );

    expect(result).toBeTrue();
  });

  it('should deny access when token is expired', () => {
    // Mock an expired token
    const expiredPayload = {
      exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      sub: 'user123'
    };
    const base64Payload = btoa(JSON.stringify(expiredPayload));
    const expiredToken = `header.${base64Payload}.signature`;

    authServiceSpy.getToken.and.returnValue(expiredToken);

    const result = TestBed.runInInjectionContext(() => 
      authGuard({} as any, { url: '/test' } as any)
    );

    expect(result).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: '/test' } });
  });

  it('should deny access when no token exists', () => {
    authServiceSpy.getToken.and.returnValue(null);

    const result = TestBed.runInInjectionContext(() => 
      authGuard({} as any, { url: '/test' } as any)
    );

    expect(result).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: '/test' } });
  });
});

