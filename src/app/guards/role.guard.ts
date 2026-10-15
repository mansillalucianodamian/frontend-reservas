import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard funcional para control de acceso basado en roles (FNT-01).
 * Protege rutas administrativas (/admin, /recepcionista) verificando
 * sesión activa y membresía en route.data['roles'].
 */
export const roleGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const allowedRoles = route.data?.['roles'] as string[] | undefined;
  const user = authService.getUser();
  const token = authService.getToken();
  const hasValidSession = authService.isLoggedIn() && !!token && !!user;

  if (!hasValidSession) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  if (allowedRoles && Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const userRole = user?.rol;
    if (!userRole || !allowedRoles.includes(userRole)) {
      console.warn(`[ROLE GUARD]: Acceso denegado a '${state.url}'. Rol requerido: ${allowedRoles.join(', ')} | Rol actual: ${userRole}`);
      router.navigate(['/login']);
      return false;
    }
  }

  return true;
};
