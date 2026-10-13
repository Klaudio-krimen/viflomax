// Ola cristalina — frame source WebGL para HyperFrames (VFX-023, ADR 0003).
//
// Solo se dibuja la LUZ del agua sobre negro puro: en la web el video se mezcla con
// `mix-blend-mode: screen`, así que el negro desaparece y quedan los brillos.
// Determinista: todo depende de `t` (segundos). Sin Math.random, Date.now ni rAF.
//
// Encuadre por composición: lo leen los atributos data-ola-* del #root.

(function () {
  const root = document.getElementById('root')
  const host = document.getElementById('scene')
  const canvas = document.getElementById('scene')
  const W = Number(root.dataset.width)
  const H = Number(root.dataset.height)
  const DUR = Number(root.dataset.duration)
  const FPS = Number(root.dataset.fps || 30)
  canvas.width = W
  canvas.height = H

  // Espacio de trabajo: y en [0,1], x en [0, aspecto]. Origen = labio del vaso.
  const aspecto = W / H
  const origen = [aspecto * Number(root.dataset.olaOx), Number(root.dataset.olaOy)]
  const dirRaw = [Number(root.dataset.olaDx), Number(root.dataset.olaDy)]
  const n = Math.hypot(dirRaw[0], dirRaw[1])
  const dir = [dirRaw[0] / n, dirRaw[1] / n]
  const perp = [-dir[1], dir[0]]

  // Hasta dónde tiene que viajar el frente para salir de cuadro, y cuánto se abre la lámina.
  let sFar = 0
  let qMax = 0
  for (const [cx, cy] of [[0, 0], [aspecto, 0], [0, 1], [aspecto, 1]]) {
    const dx = cx - origen[0]
    const dy = cy - origen[1]
    sFar = Math.max(sFar, dx * dir[0] + dy * dir[1])
    qMax = Math.max(qMax, Math.abs(dx * perp[0] + dy * perp[1]))
  }
  const abanico = (qMax + 0.15) / sFar

  const gl = canvas.getContext('webgl', {
    preserveDrawingBuffer: true,
    antialias: false,
    alpha: false,
    premultipliedAlpha: false,
  })

  const vert = `
    attribute vec2 aPos;
    void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
  `

  const frag = `
    precision highp float;
    uniform vec2  uRes;
    uniform float uT;
    uniform float uDur;
    uniform float uFrame;     // duración de un frame (s), para el obturador
    uniform vec2  uOrigen;
    uniform vec2  uDir;
    uniform vec2  uPerp;
    uniform float uSFar;
    uniform float uAbanico;
    uniform float uAspecto;

    const vec3 AZUL      = vec3(0.184, 0.624, 0.839);  // #2f9fd6 viflomax-azul
    const vec3 AZUL_CLARO = vec3(0.639, 0.851, 0.941); // #a3d9f0 viflomax-azul-300
    const vec3 BLANCO    = vec3(1.0);

    float hash11(float p) { p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
    float hash21(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }

    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash21(i), hash21(i + vec2(1, 0)), u.x),
                 mix(hash21(i + vec2(0, 1)), hash21(i + vec2(1, 1)), u.x), u.y);
    }
    float fbm(vec2 p) {
      float v = 0.0, a = 0.5;
      for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + 17.1; a *= 0.5; }
      return v;
    }

    // Cáusticas: la red de luz del fondo de una piscina (iteración clásica de "water caustics").
    float causticas(vec2 uv, float t) {
      vec2 p = mod(uv * 6.28318, 6.28318) - 250.0;
      vec2 i = p;
      float c = 1.0;
      float inten = 0.005;
      for (int n = 0; n < 5; n++) {
        float tt = t * (1.0 - (3.5 / float(n + 1)));
        i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
        c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / inten), p.y / (cos(i.y + tt) / inten)));
      }
      c /= 5.0;
      c = 1.17 - pow(c, 1.4);
      return clamp(pow(abs(c), 8.0), 0.0, 1.5);
    }

    float easeOut(float x, float k) { x = clamp(x, 0.0, 1.0); return 1.0 - pow(1.0 - x, k); }

    // Frente y cola de la lámina, medidos a lo largo del flujo.
    float frenteDe(float t) { return (uSFar + 0.45) * easeOut((t - 0.22) / 1.55, 1.75) - 0.02; }
    float colaDe(float t)   { return (uSFar + 0.45) * easeOut((t - 0.95) / 1.15, 1.5) - 0.02; }

    float segmento(vec2 p, vec2 a, vec2 b) {
      vec2 pa = p - a, ba = b - a;
      float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
      return length(pa - ba * h);
    }

    // Borde del vaso: solo la elipse del labio, en línea de luz, que se inclina y sale de cuadro.
    // (Paredes y reflejo se probaron y se quitaron: cruzaban la lámina y ensuciaban la lectura.)
    vec3 vaso(vec2 p, float t) {
      float vis = smoothstep(0.0, 0.15, t) * (1.0 - smoothstep(0.75, 1.25, t));
      if (vis <= 0.0) return vec3(0.0);
      float inclina = mix(-0.15, -0.95, easeOut(t / 0.7, 2.2));
      vec2 sale = (uDir * -1.0) * 0.45 * smoothstep(0.6, 1.25, t);
      vec2 c = uOrigen - uDir * 0.06 + sale;
      vec2 d = p - c;
      float cs = cos(inclina), sn = sin(inclina);
      vec2 r = vec2(cs * d.x + sn * d.y, -sn * d.x + cs * d.y);
      float rx = 0.30, ry = 0.085;
      float k = length(r / vec2(rx, ry));
      float sd = (k - 1.0) * min(rx, ry);
      float labio = exp(-pow(sd / 0.003, 2.0)) * 1.3 + 0.35 * exp(-abs(sd) / 0.014);
      return AZUL_CLARO * labio * 0.75 * vis;
    }

    // Gotas: partículas que se desprenden del frente, con estela por desenfoque de movimiento.
    vec3 gotas(vec2 p, float t) {
      vec3 col = vec3(0.0);
      for (int i = 0; i < 36; i++) {
        float fi = float(i);
        float ts = 0.4 + hash11(fi * 3.17) * 1.15;
        float dt = t - ts;
        if (dt < 0.0) continue;
        float fs = frenteDe(ts);
        float hw = 0.1 + uAbanico * max(fs, 0.0);
        vec2 p0 = uOrigen + uDir * (fs + 0.02) + uPerp * (hash11(fi * 7.31) - 0.5) * 1.6 * hw;
        vec2 v = uDir * (1.25 + 1.1 * hash11(fi * 1.93))
               + uPerp * (hash11(fi * 5.77) - 0.5) * 0.7
               + vec2(0.0, 0.35 * hash11(fi * 9.41));
        vec2 g = vec2(0.0, -1.6);
        vec2 pos = p0 + v * dt + 0.5 * g * dt * dt;
        vec2 vel = v + g * dt;
        float r = 0.005 + 0.011 * hash11(fi * 2.71);
        float d = segmento(p, pos, pos - vel * 0.012);
        float vida = smoothstep(0.0, 0.05, dt) * (1.0 - smoothstep(0.55, 1.0, dt));
        float cuerpo = smoothstep(r, r * 0.25, d);
        vec2 brilloPos = pos + vec2(-0.35, 0.35) * r;
        float brillo = smoothstep(r * 0.35, 0.0, length(p - brilloPos));
        float halo = exp(-d / (r * 1.6)) * 0.25;
        col += (AZUL_CLARO * (cuerpo * 0.7 + halo) + BLANCO * brillo * 1.3) * vida;
      }
      return col;
    }

    vec3 escena(vec2 px, float t) {
      vec2 p = px / uRes.y;
      vec2 rel = p - uOrigen;
      float s = dot(rel, uDir);
      float q = dot(rel, uPerp);

      float fr = frenteDe(t);
      float co = colaDe(t);

      // Lámina: se abre en abanico desde el labio y se mece lateralmente.
      float hw = 0.06 + uAbanico * max(s, 0.0);
      float vaiven = 0.05 * sin(s * 2.3 - t * 2.1) * smoothstep(0.0, 0.5, s);
      float lado = sign(q - vaiven);
      float hwN = hw * (1.0 + 0.32 * (fbm(vec2(s * 2.6 - t * 1.3, lado * 7.0 + 3.0)) - 0.5));
      float dq = abs(q - vaiven);
      float lateral = 1.0 - smoothstep(hwN * 0.62, hwN, dq);
      float filoLateral = exp(-pow((dq - hwN * 0.9) / 0.006, 2.0)) * smoothstep(0.05, 0.3, s);

      // Bordes irregulares: el agua nunca avanza en línea recta.
      float fe = fr + 0.06 * (fbm(vec2(q * 3.2, t * 0.9)) - 0.5) + 0.018 * sin(q * 11.0 + t * 7.0);
      float te = co + 0.08 * (fbm(vec2(q * 2.6 + 9.0, t * 0.7)) - 0.5);

      float dentro = (1.0 - smoothstep(fe - 0.012, fe, s)) * smoothstep(te - 0.12, te + 0.02, s) * lateral;
      float detras = (1.0 - smoothstep(te - 0.12, te + 0.02, s)) * step(0.0, s) * lateral; // ya pasó

      // Coordenadas que viajan con el agua.
      vec2 flujo = vec2(q * 2.4, s * 1.6 - t * 2.6);

      vec3 col = vec3(0.0);

      // Cuerpo: tinte azul muy bajo, más denso cerca del frente.
      float cercaFrente = exp(-max(fe - s, 0.0) * 3.0);
      col += AZUL * 0.16 * dentro * (0.5 + 0.8 * cercaFrente);

      // Cáusticas dentro de la lámina.
      float c = causticas(flujo * 0.85 + 0.12 * vec2(fbm(flujo * 1.3), fbm(flujo * 1.3 + 5.0)), t * 1.4);
      c = pow(c, 1.35);
      col += mix(AZUL_CLARO, BLANCO, 0.45) * c * 1.35 * dentro;

      // Estrías de flujo: hilos de luz paralelos a la dirección del agua.
      float qOnda = q + 0.018 * sin(s * 9.0 - t * 5.0);
      float estria = pow(noise(vec2(qOnda * 48.0, s * 7.0 - t * 6.0)), 10.0);
      col += AZUL_CLARO * estria * 0.45 * dentro;
      float enTramo = (1.0 - smoothstep(fe - 0.04, fe, s)) * smoothstep(te - 0.12, te + 0.02, s);
      col += AZUL_CLARO * filoLateral * 0.55 * enTramo;

      // Frente: filo de luz tipo Fresnel con dispersión cromática (cristal).
      vec3 filo;
      filo.r = 0.75 * exp(-pow((s - (fe + 0.0018)) / 0.0075, 2.0));
      filo.g = exp(-pow((s - fe) / 0.0075, 2.0));
      filo.b = exp(-pow((s - (fe - 0.0018)) / 0.0075, 2.0));
      float halo = exp(-abs(s - fe) / 0.05) * 0.3;
      float frenteVivo = lateral * smoothstep(0.0, 0.08, fr) * (1.0 - smoothstep(uSFar + 0.1, uSFar + 0.4, fr));
      col += (filo * 1.25 + AZUL_CLARO * halo) * frenteVivo;

      // Espuma: motas blancas en el borde de ataque que se deshacen.
      float banda = 1.0 - smoothstep(0.0, 0.07, fe - s);
      float espuma = smoothstep(0.58, 0.78, fbm(vec2(q * 22.0, s * 22.0 - t * 5.0)));
      col += BLANCO * espuma * banda * dentro * 0.9;

      // Brillo húmedo: lo que la ola dejó atrás sigue destellando y se apaga.
      float humedo = pow(causticas(flujo * 0.7 + 3.0, t * 0.9), 1.2) * exp(-max(te - s, 0.0) * 2.5) * 0.55;
      col += AZUL_CLARO * humedo * detras * (1.0 - smoothstep(1.5, uDur - 0.3, t));

      col += vaso(p, t);
      col += gotas(p, t);
      return col;
    }

    void main() {
      // 2x2 supersampling espacial + obturador de medio frame (desenfoque de movimiento).
      vec3 acc = vec3(0.0);
      for (int i = 0; i < 4; i++) {
        float fi = float(i);
        vec2 off = vec2(mod(fi, 2.0), floor(fi / 2.0)) * 0.5 - 0.25;
        float tt = uT - fi * 0.125 * uFrame;
        acc += escena(gl_FragCoord.xy + off, tt);
      }
      vec3 col = acc * 0.25;

      // Envolvente final: los últimos frames son negro puro.
      col *= 1.0 - smoothstep(uDur - 0.5, uDur - 0.15, uT);

      col = 1.0 - exp(-col * 1.6);                          // tonemap suave, sin clipping duro
      col += (hash21(gl_FragCoord.xy + uT) - 0.5) / 255.0;  // dither contra banding al codificar
      if (uT >= uDur - 0.14) col = vec3(0.0);               // últimos 4 frames: negro exacto
      gl_FragColor = vec4(max(col, 0.0), 1.0);
    }
  `

  function shader(tipo, src) {
    const sh = gl.createShader(tipo)
    gl.shaderSource(sh, src)
    gl.compileShader(sh)
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh))
    return sh
  }

  const prog = gl.createProgram()
  gl.attachShader(prog, shader(gl.VERTEX_SHADER, vert))
  gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, frag))
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog))
  gl.useProgram(prog)

  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW)
  const aPos = gl.getAttribLocation(prog, 'aPos')
  gl.enableVertexAttribArray(aPos)
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

  const u = (nombre) => gl.getUniformLocation(prog, nombre)
  gl.viewport(0, 0, W, H)
  gl.uniform2f(u('uRes'), W, H)
  gl.uniform1f(u('uDur'), DUR)
  gl.uniform1f(u('uFrame'), 1 / FPS)
  gl.uniform2f(u('uOrigen'), origen[0], origen[1])
  gl.uniform2f(u('uDir'), dir[0], dir[1])
  gl.uniform2f(u('uPerp'), perp[0], perp[1])
  gl.uniform1f(u('uSFar'), sFar)
  gl.uniform1f(u('uAbanico'), abanico)
  gl.uniform1f(u('uAspecto'), aspecto)
  const uT = u('uT')

  function dibujar(t) {
    gl.uniform1f(uT, t)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
    gl.finish()
  }

  dibujar(0)

  // Vista previa fuera de HyperFrames (abrir el HTML directo): ?t=1.2 congela un instante.
  const tFijo = new URLSearchParams(location.search).get('t')
  if (tFijo !== null) dibujar(Number(tFijo))

  if (window.__hyperframes && window.__hyperframes.registerFrameSource) {
    window.__hyperframes.registerFrameSource({
      element: host,
      ready: Promise.resolve(),
      render: (t) => dibujar(Math.min(Math.max(t, 0), DUR)),
    })
  }
})()
