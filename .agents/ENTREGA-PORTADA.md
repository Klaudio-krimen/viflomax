# Entrega de portada aprobada

Carpeta única: **D:\CLAUDEKODE\viflomax**. Rama actual: **main**.
Los agentes trabajan aquí, sin crear ramas ni worktrees, y cierran sus servidores locales al terminar.
El humano hace commit y push; los agentes no publican.

## Estado verificado el 2026-10-13

- La portada aprobada y sus ocho archivos de aplicación ya están en el commit `d55bf17` (Cambios graficosIV), incluido en el `main` local.
- `main` local está cuatro commits por delante de `origin/main`. La consulta directa a GitHub confirma que `main` remoto sigue en `f626a0a`.
- El commit `d55bf17` fue publicado en `claude/VFX-000-protocolo-agentes`; GitHub registra su despliegue Vercel como **Preview**, con estado success. El último despliegue registrado como **Production** corresponde a `f626a0a`.
- El servidor de desarrollo de Viflomax fue cerrado y el puerto 3001 quedó sin listener.
- Lint, 53 tests en 10 suites y build pasaron en esta carpeta para el código de la portada. Home: 5.42 kB / 101 kB First Load JS. Revisión de Claude APROBADA. No se ha verificado un despliegue nuevo en producción.

## Publicar la portada ya commiteada

Desde esta carpeta, el paso pendiente para enviar los cuatro commits locales de `main` es:

```powershell
git push origin main
```

No hace falta volver a commitear los ocho archivos de aplicación: ya están en `d55bf17`.
Después del push, verificar que Vercel genere un despliegue Production del nuevo commit y termine en Ready.
El agente no ejecutó este comando.

## Guardar las instrucciones de trabajo actualizadas

Estos archivos de coordinación siguen sin commit. El bloque lista archivos exactos y conserva los demás cambios del árbol compartido:

```powershell
git add AGENTS.md CLAUDE.md .agents/PROTOCOLO.md .agents/decisiones/0001-protocolo-coordinacion.md .agents/decisiones/0004-trabajo-directo-en-main.md .agents/plantillas/tarea.md .agents/tareas/VFX-021-portada-aprobada.md .agents/ENTREGA-PORTADA.md
git commit -m "docs(agentes): centralizar entrega en main y cerrar servidores al terminar"
git push origin main
```

Se puede ejecutar este bloque antes del push anterior: su último comando también publica la portada ya commiteada.
Los cambios de `.gitignore` y de la composición de video son trabajo separado y no se incluyen en este bloque.

## Alcance de la portada

Hero aprobado sin ola, animación pausada palabra por palabra, imagen comercial existente y galería completa de nueve productos.
Contrato público, nombres, precios, datos de contacto, formulario, admin y chofer conservados.
No hay nuevas dependencias. Los assets de video existentes no se integran en esta entrega.

QA previo: 320 a 1440 px, nueve imágenes, filtros y selección de productos. La última corrección de carpeta verificó HTTP 200 con hero nuevo y nueve artículos en el puerto habitual.
No se afirma QA en teléfono físico, LCP/INP medidos, autenticación de producción ni envío de pedidos reales.
No agregar secretos, archivos de entorno, node_modules, .next ni archivos PWA generados al commit.
