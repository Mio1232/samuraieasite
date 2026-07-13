/* 全画面固定の流体背景（素のWebGL・外部ライブラリ不要）
   [data-fluid] が画面内のときだけ描画／端末別品質／FPS自動ダウングレード／非対応はCSSへ */
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canvas = document.querySelector('.fluid-fixed');
  if (!canvas) return;
  function fail() { canvas.style.display = 'none'; }
  if (reduced) { fail(); return; }

  var gl;
  try { gl = canvas.getContext('webgl', { antialias: true, alpha: false, powerPreference: 'high-performance' }) || canvas.getContext('experimental-webgl'); }
  catch (e) { fail(); return; }
  if (!gl) { fail(); return; }

  document.body.classList.add('gl-active');

  var isMobile = window.matchMedia('(max-width:640px), (pointer:coarse)').matches;
  var tier = {
    dpr: isMobile ? 1.25 : Math.min(window.devicePixelRatio || 1, 2),
    octaves: isMobile ? 5 : 6,
    particles: isMobile ? 1400 : 4200
  };

  /* ---- shader helpers ---- */
  function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw gl.getShaderInfoLog(s); return s; }
  function prog(vs, fs) { var p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw gl.getProgramInfoLog(p); return p; }

  /* ---- fluid program ---- */
  var fluidFS = [
    "precision highp float;",
    "uniform float uTime; uniform vec2 uRes; uniform vec2 uMouse;",
    "vec2 hash2(vec2 p){p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));return -1.0+2.0*fract(sin(p)*43758.5453123);}",
    "float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);vec2 u=f*f*(3.0-2.0*f);",
    " return mix(mix(dot(hash2(i+vec2(0.0,0.0)),f-vec2(0.0,0.0)),dot(hash2(i+vec2(1.0,0.0)),f-vec2(1.0,0.0)),u.x),",
    "            mix(dot(hash2(i+vec2(0.0,1.0)),f-vec2(0.0,1.0)),dot(hash2(i+vec2(1.0,1.0)),f-vec2(1.0,1.0)),u.x),u.y);}",
    "float fbm(vec2 p){float v=0.0,a=0.5;for(int i=0;i<OCT;i++){v+=a*noise(p);p*=2.02;a*=0.5;}return v;}",
    "void main(){",
    " vec2 p=(gl_FragCoord.xy-0.5*uRes.xy)/uRes.y;",
    " float t=uTime*0.06;",
    " vec2 q=vec2(fbm(p*1.6+vec2(0.0,t)),fbm(p*1.6+vec2(5.2,-t)));",
    " vec2 r=vec2(fbm(p*1.6+3.0*q+vec2(1.7,9.2)+t),fbm(p*1.6+3.0*q+vec2(8.3,2.8)-t));",
    " float f=fbm(p*1.6+2.0*r+uMouse*0.35);",
    " vec3 c1=vec3(0.36,0.18,0.80); vec3 c2=vec3(0.02,0.74,0.86);",
    " vec3 c3=vec3(0.10,0.86,0.55); vec3 c4=vec3(0.96,0.30,0.64);",
    " vec3 col=mix(c1,c2,smoothstep(-0.6,0.6,f));",
    " col=mix(col,c3,smoothstep(0.0,1.0,length(r)));",
    " col=mix(col,c4,smoothstep(0.4,1.25,length(q)));",
    " col*=0.5+0.95*f;",
    " vec3 bg=vec3(0.043,0.043,0.051);",
    " col=mix(bg,col,smoothstep(0.12,0.92,0.6+f));",
    " col*=smoothstep(1.4,0.15,length(p)); col=pow(col,vec3(0.85));",
    " gl_FragColor=vec4(col,1.0);",
    "}"
  ].join("\n").replace(/OCT/g, tier.octaves);
  var fluidP, partP;
  try {
    fluidP = prog("attribute vec2 aPos;void main(){gl_Position=vec4(aPos,0.0,1.0);}", fluidFS);
    partP = prog(
      "attribute vec2 aBase;attribute vec2 aMeta;attribute vec3 aCol;uniform float uTime;uniform vec2 uMouse;varying vec3 vCol;varying float vA;" +
      "void main(){float y=mod(aBase.y - uTime*aMeta.x*0.03 + 1.0,2.0)-1.0;float x=aBase.x+sin(uTime*0.2+aBase.y*9.0)*0.02;" +
      "vec2 par=uMouse*(aMeta.y*0.02);gl_Position=vec4(x+par.x,y+par.y,0.0,1.0);gl_PointSize=aMeta.y;vCol=aCol;vA=0.45+0.55*sin(uTime+aBase.x*18.0);}",
      "precision mediump float;varying vec3 vCol;varying float vA;" +
      "void main(){vec2 d=gl_PointCoord-0.5;float m=smoothstep(0.5,0.0,length(d));gl_FragColor=vec4(vCol,m*vA*0.7);}"
    );
  } catch (e) { fail(); document.body.classList.remove('gl-active'); return; }

  /* ---- geometry ---- */
  var tri = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, tri); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var fPos = gl.getAttribLocation(fluidP, 'aPos');
  var uT = gl.getUniformLocation(fluidP, 'uTime'), uR = gl.getUniformLocation(fluidP, 'uRes'), uM = gl.getUniformLocation(fluidP, 'uMouse');

  var N = tier.particles;
  var base = new Float32Array(N * 2), meta = new Float32Array(N * 2), pcol = new Float32Array(N * 3);
  var pal = [[0.55, 0.36, 1.0], [0.13, 0.85, 0.95], [0.2, 0.95, 0.6], [1.0, 0.45, 0.75]];
  for (var i = 0; i < N; i++) {
    base[i * 2] = Math.random() * 2 - 1; base[i * 2 + 1] = Math.random() * 2 - 1;
    meta[i * 2] = 0.3 + Math.random() * 1.2;                       // speed
    meta[i * 2 + 1] = (1 + Math.random() * 3) * tier.dpr;          // size(px)
    var c = pal[(Math.random() * pal.length) | 0]; pcol[i * 3] = c[0]; pcol[i * 3 + 1] = c[1]; pcol[i * 3 + 2] = c[2];
  }
  var bBase = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bBase); gl.bufferData(gl.ARRAY_BUFFER, base, gl.STATIC_DRAW);
  var bMeta = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bMeta); gl.bufferData(gl.ARRAY_BUFFER, meta, gl.STATIC_DRAW);
  var bCol = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bCol); gl.bufferData(gl.ARRAY_BUFFER, pcol, gl.STATIC_DRAW);
  var aBase = gl.getAttribLocation(partP, 'aBase'), aMeta = gl.getAttribLocation(partP, 'aMeta'), aCol = gl.getAttribLocation(partP, 'aCol');
  var puT = gl.getUniformLocation(partP, 'uTime'), puM = gl.getUniformLocation(partP, 'uMouse');

  /* ---- state ---- */
  var dpr = tier.dpr, drawParticles = true;
  function resize() { canvas.width = Math.floor(innerWidth * dpr); canvas.height = Math.floor(innerHeight * dpr); gl.viewport(0, 0, canvas.width, canvas.height); }
  resize(); addEventListener('resize', resize);

  var mx = 0, my = 0, tmx = 0, tmy = 0;
  addEventListener('pointermove', function (e) { tmx = (e.clientX / innerWidth) * 2 - 1; tmy = -((e.clientY / innerHeight) * 2 - 1); }, { passive: true });

  var visset = new Set(), tabVisible = true, anyIO = false;
  if ('IntersectionObserver' in window) {
    anyIO = true;
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) visset.add(e.target); else visset.delete(e.target); }); }, { threshold: 0.01 });
    var fl = document.querySelectorAll('[data-fluid]');
    fl.forEach(function (el) { io.observe(el); });
    fl.forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) visset.add(el); });
  }
  function fluidVisible() { return anyIO ? visset.size > 0 : true; }
  document.addEventListener('visibilitychange', function () { tabVisible = !document.hidden; });

  /* ---- FPS auto-downgrade ---- */
  var frames = 0, last = performance.now(), acc = 0, checkAt = 2200, down = 0;
  function downgrade(fps) {
    if (down === 0 && fps < 40) { down = 1; drawParticles = false; }
    else if (down === 1 && fps < 32) { down = 2; dpr = Math.max(0.75, dpr - 0.5); resize(); }
  }

  /* ---- loop ---- */
  var t0 = performance.now();
  function frame() {
    requestAnimationFrame(frame);
    if (!fluidVisible() || !tabVisible) { last = performance.now(); return; }
    var time = (performance.now() - t0) / 1000;
    mx += (tmx - mx) * 0.05; my += (tmy - my) * 0.05;

    gl.clearColor(0.043, 0.043, 0.051, 1); gl.clear(gl.COLOR_BUFFER_BIT);

    gl.disable(gl.BLEND);
    gl.useProgram(fluidP);
    gl.bindBuffer(gl.ARRAY_BUFFER, tri); gl.enableVertexAttribArray(fPos); gl.vertexAttribPointer(fPos, 2, gl.FLOAT, false, 0, 0);
    gl.uniform1f(uT, time); gl.uniform2f(uR, canvas.width, canvas.height); gl.uniform2f(uM, mx, my);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (drawParticles) {
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      gl.useProgram(partP);
      gl.bindBuffer(gl.ARRAY_BUFFER, bBase); gl.enableVertexAttribArray(aBase); gl.vertexAttribPointer(aBase, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, bMeta); gl.enableVertexAttribArray(aMeta); gl.vertexAttribPointer(aMeta, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, bCol); gl.enableVertexAttribArray(aCol); gl.vertexAttribPointer(aCol, 3, gl.FLOAT, false, 0, 0);
      gl.uniform1f(puT, time); gl.uniform2f(puM, mx, my);
      gl.drawArrays(gl.POINTS, 0, N);
      gl.disable(gl.BLEND);
    }

    frames++; var now = performance.now(); acc += now - last; last = now;
    if (acc >= 1000) { var fps = frames / (acc / 1000); frames = 0; acc = 0; if (checkAt > 0) { checkAt -= 1000; if (checkAt <= 0) downgrade(fps); } }
  }
  frame();
})();
