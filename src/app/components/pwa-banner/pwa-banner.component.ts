import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PwaInstallService } from '../../services/pwa-install.service';

@Component({
  selector: 'app-pwa-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (pwa.showBanner()) {
      <aside
        class="pwa-toast-container"
        role="dialog"
        aria-labelledby="pwa-toast-title"
        aria-describedby="pwa-toast-desc"
      >
        <div class="pwa-toast-card">
          <!-- Botón de cierre superior -->
          <button
            type="button"
            class="pwa-close-btn"
            (click)="pwa.descartarPorAhora()"
            aria-label="Cerrar aviso de instalación"
          >
            ✕
          </button>

          <div class="pwa-toast-body">
            <!-- Icono lateral con el logo municipal o smartphone -->
            <div class="pwa-icon-wrapper" aria-hidden="true">
              <img
                src="Aldea-San-Antonio.png"
                alt="Logo Municipalidad"
                class="pwa-logo-img"
              />
            </div>

            <!-- Contenido textual -->
            <div class="pwa-text-content">
              <h2 id="pwa-toast-title" class="pwa-title">
                Instalar Aplicación
              </h2>

              @if (!pwa.isIos()) {
                <p id="pwa-toast-desc" class="pwa-desc">
                  Accede más rápido desde tu pantalla de inicio, sin barra del navegador.
                </p>

                <!-- Botones de Acción para Android / PC -->
                <div class="pwa-actions">
                  <button
                    type="button"
                    class="pwa-btn pwa-btn-primary"
                    (click)="pwa.instalarApp()"
                  >
                    <span>📲</span>
                    <span>Instalar Ahora</span>
                  </button>
                  <button
                    type="button"
                    class="pwa-btn pwa-btn-secondary"
                    (click)="pwa.descartarPorAhora()"
                  >
                    Ahora no
                  </button>
                </div>
              } @else {
                <!-- Instrucciones especiales para iOS (Safari) -->
                <div id="pwa-toast-desc" class="pwa-ios-instructions">
                  <p class="pwa-ios-step">
                    Para instalar en tu iPhone o iPad:
                  </p>
                  <ol class="pwa-ios-list">
                    <li>
                      Toca el botón <strong>Compartir</strong>
                      <span class="pwa-badge">⬆️</span> en la barra inferior de Safari.
                    </li>
                    <li>
                      Desliza y selecciona <strong>"Agregar al inicio"</strong>
                      <span class="pwa-badge">➕</span>.
                    </li>
                  </ol>
                </div>

                <div class="pwa-actions">
                  <button
                    type="button"
                    class="pwa-btn pwa-btn-primary"
                    (click)="pwa.descartarPorAhora()"
                  >
                    Entendido
                  </button>
                </div>
              }
            </div>
          </div>
        </div>
      </aside>
    }
  `,
  styles: [`
    .pwa-toast-container {
      position: fixed;
      bottom: 20px;
      left: 16px;
      right: 16px;
      z-index: 99999;
      display: flex;
      justify-content: center;
      animation: pwaSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      pointer-events: none;
    }

    @media (min-width: 768px) {
      .pwa-toast-container {
        left: auto;
        right: 24px;
        bottom: 24px;
        max-width: 440px;
      }
    }

    .pwa-toast-card {
      pointer-events: auto;
      position: relative;
      width: 100%;
      background: rgba(15, 23, 42, 0.96);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(51, 65, 85, 0.85);
      border-radius: 18px;
      padding: 18px;
      box-shadow:
        0 20px 25px -5px rgba(0, 0, 0, 0.5),
        0 8px 10px -6px rgba(0, 0, 0, 0.5),
        0 0 0 1px rgba(255, 255, 255, 0.05);
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    .pwa-close-btn {
      position: absolute;
      top: 12px;
      right: 12px;
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 14px;
      cursor: pointer;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .pwa-close-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #ffffff;
    }

    .pwa-toast-body {
      display: flex;
      align-items: flex-start;
      gap: 16px;
    }

    .pwa-icon-wrapper {
      flex-shrink: 0;
      width: 52px;
      height: 52px;
      background: #ffffff;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
      padding: 4px;
    }

    .pwa-logo-img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    .pwa-text-content {
      flex: 1;
      min-width: 0;
    }

    .pwa-title {
      font-size: 16px;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 4px 0;
      line-height: 1.25;
      padding-right: 20px;
    }

    .pwa-desc {
      font-size: 13px;
      color: #cbd5e1;
      margin: 0 0 14px 0;
      line-height: 1.45;
    }

    .pwa-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .pwa-btn {
      border: none;
      outline: none;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      padding: 8px 16px;
      border-radius: 10px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s ease;
    }

    .pwa-btn-primary {
      background: #0284c7;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(2, 132, 199, 0.35);
    }

    .pwa-btn-primary:hover {
      background: #0369a1;
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(2, 132, 199, 0.45);
    }

    .pwa-btn-primary:active {
      transform: translateY(0);
    }

    .pwa-btn-secondary {
      background: rgba(255, 255, 255, 0.08);
      color: #cbd5e1;
    }

    .pwa-btn-secondary:hover {
      background: rgba(255, 255, 255, 0.15);
      color: #ffffff;
    }

    /* Estilos específicos para iOS */
    .pwa-ios-instructions {
      background: rgba(30, 41, 59, 0.7);
      border: 1px solid rgba(71, 85, 105, 0.4);
      border-radius: 10px;
      padding: 10px 12px;
      margin-bottom: 12px;
      font-size: 12px;
      color: #e2e8f0;
      line-height: 1.4;
    }

    .pwa-ios-step {
      margin: 0 0 6px 0;
      font-weight: 600;
      color: #38bdf8;
    }

    .pwa-ios-list {
      margin: 0;
      padding-left: 18px;
    }

    .pwa-ios-list li {
      margin-bottom: 4px;
    }

    .pwa-badge {
      display: inline-block;
      vertical-align: middle;
      font-size: 13px;
      margin: 0 2px;
    }

    @keyframes pwaSlideUp {
      from {
        opacity: 0;
        transform: translateY(30px) scale(0.96);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
  `]
})
export class PwaBannerComponent {
  public pwa = inject(PwaInstallService);
}
