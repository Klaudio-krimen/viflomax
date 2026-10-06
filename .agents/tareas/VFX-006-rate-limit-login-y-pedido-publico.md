---
id: VFX-006
titulo: Limitar la tasa de intentos de login y de pedidos públicos con el Firewall de Vercel
estado: lista
prioridad: p1
asignado: humano
revisor: claude
area: infra
depende_de: []
blueprint:
rama:
archivos: []
bloqueo:
creado: 2026-10-05
actualizado: 2026-10-05
---

## Contexto

- `POST /api/auth/callback/credentials`: sin límite de intentos → fuerza bruta contra contraseñas
  de admin y choferes.
- `POST /api/pedidos/publico`: sin autenticación ni límite; cada request crea un `Cliente` y un
  `Pedido`. Un bot llena la base y la cola del admin en minutos.

Un rate limit en memoria no sirve en serverless, y Upstash sería una dependencia nueva. Las reglas
de rate limit del Firewall de Vercel no requieren código ni dependencias.

## Criterios de aceptación

- [ ] CUANDO una IP hace más de 10 `POST` a `/api/auth/callback/credentials` en 1 minuto EL SISTEMA
      DEBERÁ responder 429.
- [ ] CUANDO una IP hace más de 5 `POST` a `/api/pedidos/publico` en 10 minutos EL SISTEMA DEBERÁ
      responder 429.
- [ ] Las reglas quedan en `.agents/decisiones/0003-rate-limit-waf.md` (umbrales y por qué).

## Fuera de alcance

- Captcha o BotID en el formulario: evaluar después con métricas.

## Notas de implementación

Lo configura el humano en Vercel → Proyecto → Firewall → Rate Limiting, o claude vía el MCP de
Vercel si el humano lo autoriza explícitamente. Claude redacta el ADR.

## Bitácora

### 2026-10-05 · claude · → lista
- Hallazgo S5 de la auditoría.

## Revisión
