import { Routes } from '@angular/router';
import { RegistroComponent } from './registro/registro.component';
import { LoginComponent } from './login/login.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { MisReservasComponent } from './misreservas/misreservas.component';
import { ReservasComponent } from './reservas/reservas.component';
import { CarritoComponent } from './carrito/carrito.component';
import { RecepcionistaComponent } from './recepcionista/recepcionista.component';
import { SuperAdminComponent } from './superadmin/superadmin.component';
import { InicioComponent } from './inicio/inicio.component';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: 'registro', component: RegistroComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'inicio', component: InicioComponent },
  { path: 'reservas', component: ReservasComponent },       // calendario + reservar
  { path: 'mis-reservas', component: MisReservasComponent }, // listado del usuario
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password/:reset_token', component: ResetPasswordComponent },
  { path: 'carrito', component: CarritoComponent },
  { 
    path: 'recepcionista', 
    component: RecepcionistaComponent,
    canActivate: [roleGuard],
    data: { roles: ['recepcionista', 'super_admin'] }
  },
  { 
    path: 'admin', 
    component: SuperAdminComponent,
    canActivate: [roleGuard],
    data: { roles: ['super_admin'] }
  },
  { path: '**', redirectTo: '/login' }
];
