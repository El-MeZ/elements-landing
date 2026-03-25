/* ============================================================
   ELEMENTS — LANDING PAGE CINEMATOGRÁFICO
   script.js — Lógica principal

   ESTRUCTURA:
   1. Cursor personalizado
   2. Barra de progreso de scroll
   3. Detección de sección activa (Intersection Observer)
   4. Parallax scrolling
   5. Sistema de partículas global
   6. Partículas por elemento (canvas individuales)
   7. Cambio dinámico de atmósfera
   8. Navegación lateral
   ============================================================ */

// ============================================================
// INICIALIZACIÓN — Esperar a que el DOM esté listo
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  initCursor();
  initScrollProgress();
  initSectionObserver();
  initParallax();
  initGlobalParticles();
  initElementParticles();
  initNavigation();
});

// ============================================================
// 1. CURSOR PERSONALIZADO
//    El cursor sigue el mouse con una pequeña interpolación
//    para el anillo exterior (cursor-trail)
// ============================================================
function initCursor() {
  const cursor      = document.getElementById('cursor');
  const cursorTrail = document.getElementById('cursor-trail');

  let mouseX = 0, mouseY = 0;
  let trailX = 0, trailY = 0;

  // Posición exacta del cursor pequeño
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursor.style.left = mouseX + 'px';
    cursor.style.top  = mouseY + 'px';
  });

  // El trail sigue con suavidad mediante requestAnimationFrame
  function animateTrail() {
    // Interpolación lineal (lerp) para suavizar el movimiento
    trailX += (mouseX - trailX) * 0.12;
    trailY += (mouseY - trailY) * 0.12;
    cursorTrail.style.left = trailX + 'px';
    cursorTrail.style.top  = trailY + 'px';
    requestAnimationFrame(animateTrail);
  }
  animateTrail();

  // Cursor cambia al hacer hover sobre elementos interactivos
  const interactives = document.querySelectorAll('a, button, .nav-dot, [data-section]');
  interactives.forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.style.width  = '16px';
      cursor.style.height = '16px';
      cursorTrail.style.width  = '50px';
      cursorTrail.style.height = '50px';
    });
    el.addEventListener('mouseleave', () => {
      cursor.style.width  = '10px';
      cursor.style.height = '10px';
      cursorTrail.style.width  = '35px';
      cursorTrail.style.height = '35px';
    });
  });
}

// ============================================================
// 2. BARRA DE PROGRESO DE SCROLL
//    Refleja cuánto ha scrolleado el usuario en el total de la página
// ============================================================
function initScrollProgress() {
  const progressBar = document.getElementById('scroll-progress');

  window.addEventListener('scroll', () => {
    // Calcula el porcentaje de scroll
    const scrolled    = window.scrollY;
    const maxScroll   = document.body.scrollHeight - window.innerHeight;
    const percentage  = (scrolled / maxScroll) * 100;
    progressBar.style.width = percentage + '%';
  }, { passive: true });
}

// ============================================================
// 3. DETECCIÓN DE SECCIÓN ACTIVA (Intersection Observer)
//    Usa el API nativo del navegador para detectar
//    qué sección ocupa más del 50% de la pantalla
// ============================================================
let currentSection = 0;
const sections = document.querySelectorAll('.section');

function initSectionObserver() {
  const options = {
    root: null,         // Viewport
    rootMargin: '0px',
    threshold: 0.4      // La sección debe estar 40% visible
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Obtener el índice de la sección
        const sectionEl  = entry.target;
        const sectionId  = sectionEl.id;
        const sectionNum = parseInt(sectionId.replace('section-', ''));

        // Activar la sección
        sectionEl.classList.add('is-active');
        currentSection = sectionNum;

        // Actualizar la navegación lateral
        updateNavDots(sectionNum);

        // Cambiar la atmósfera del canvas global
        changeAtmosphere(sectionEl.dataset.element);

      } else {
        // No remover is-active de inmediato para mantener la animación
        // (solo remover cuando salga completamente)
        if (entry.intersectionRatio < 0.05) {
          entry.target.classList.remove('is-active');
        }
      }
    });
  }, options);

  sections.forEach(section => observer.observe(section));
}

// ============================================================
// 4. PARALLAX SCROLLING
//    Mueve las capas de fondo a velocidades diferentes
//    para crear profundidad visual
// ============================================================
function initParallax() {
  const parallaxElements = document.querySelectorAll('[data-parallax]');

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;

    parallaxElements.forEach(el => {
      const speed    = parseFloat(el.dataset.parallax); // 0 = estático, 1 = velocidad completa
      const section  = el.closest('.section');
      const sectionTop = section.offsetTop;
      const offset   = (scrollY - sectionTop) * speed;

      // Desplaza el fondo proporcionalmente al scroll
      el.style.transform = `translateY(${offset}px)`;
    });
  }, { passive: true });
}

// ============================================================
// 5. SISTEMA DE PARTÍCULAS GLOBAL
//    Canvas fijo que genera partículas sutiles en toda la página
//    Las partículas cambian de color según el elemento activo
// ============================================================
function initGlobalParticles() {
  const canvas = document.getElementById('particles-canvas');
  const ctx    = canvas.getContext('2d');

  // Ajustar el canvas al tamaño de la ventana
  function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Estado de las partículas
  let targetHue = 30;     // Matiz objetivo (cambia con el elemento)
  let currentHue = 30;    // Matiz actual (interpolado suavemente)
  let targetSat = 70;
  let currentSat = 70;

  // Clase de partícula individual
  class Particle {
    constructor() {
      this.reset();
    }

    reset() {
      this.x     = Math.random() * canvas.width;
      this.y     = Math.random() * canvas.height;
      this.vx    = (Math.random() - 0.5) * 0.3;
      this.vy    = (Math.random() - 0.5) * 0.3 - 0.1; // Leve ascenso
      this.size  = Math.random() * 2 + 0.5;
      this.alpha = Math.random() * 0.4 + 0.1;
      this.life  = Math.random() * 200 + 100;
      this.age   = 0;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.age++;

      // Desvanecer al final de la vida
      if (this.age > this.life * 0.7) {
        this.alpha -= 0.005;
      }

      // Reiniciar cuando muere o sale de pantalla
      if (this.age >= this.life || this.alpha <= 0 ||
          this.y < -10 || this.x < -10 || this.x > canvas.width + 10) {
        this.reset();
        this.y = canvas.height + 10; // Reinicia desde abajo
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${currentHue}, ${currentSat}%, 80%, ${this.alpha})`;
      ctx.fill();
    }
  }

  // Crear 80 partículas globales
  const particles = Array.from({ length: 80 }, () => new Particle());

  // Exponer función para cambiar el color según el elemento
  window.setParticleAtmosphere = function(hue, sat) {
    targetHue = hue;
    targetSat = sat;
  };

  // Loop de animación principal
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Interpolación suave del color (lerp)
    currentHue += (targetHue - currentHue) * 0.02;
    currentSat += (targetSat - currentSat) * 0.02;

    particles.forEach(p => {
      p.update();
      p.draw();
    });

    requestAnimationFrame(animate);
  }
  animate();
}

// ============================================================
// 6. PARTÍCULAS POR ELEMENTO
//    Cada elemento tiene su propio canvas con partículas únicas
//    que refuerzan su atmósfera visual
// ============================================================
function initElementParticles() {
  // Configuración de partículas para cada elemento
  const elementConfigs = {
    'fire-canvas':  { type: 'sparks',   color: '#FF6B00', count: 100 },
    'water-canvas': { type: 'drops',    color: '#00B4D8', count: 100 },
    'earth-canvas': { type: 'dust',     color: '#8BAE4A', count: 100 },
    'air-canvas':   { type: 'floating', color: '#C8E6FF', count: 100 }
  };

  Object.entries(elementConfigs).forEach(([canvasId, config]) => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Ajustar el canvas al tamaño de la sección padre
    function resizeElementCanvas() {
      const parent = canvas.parentElement;
      canvas.width  = parent.offsetWidth;
      canvas.height = parent.offsetHeight;
    }
    resizeElementCanvas();
    window.addEventListener('resize', resizeElementCanvas);

    // Crear partículas según el tipo de elemento
    const particles = createElementParticles(config, canvas);

    // Loop de animación por elemento
    function animateElement() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.update(canvas);
        p.draw(ctx, config.color);
      });
      requestAnimationFrame(animateElement);
    }
    animateElement();
  });
}

// Fábrica de partículas por tipo de elemento
function createElementParticles(config, canvas) {
  const particles = [];

  for (let i = 0; i < config.count; i++) {
    // Propiedades base comunes
    const p = {
      x:     Math.random() * canvas.width,
      y:     Math.random() * canvas.height,
      size:  Math.random() * 3 + 1,
      alpha: Math.random() * 0.5 + 0.1,
      vx:    0,
      vy:    0,
      type:  config.type
    };

    // Propiedades específicas por tipo
    switch (config.type) {
      case 'sparks':
        // Las chispas suben y se mueven lateralmente con rapidez
        p.vx   = (Math.random() - 0.5) * 2;
        p.vy   = -(Math.random() * 3 + 1); // Siempre hacia arriba
        p.life = Math.random() * 60 + 30;
        p.age  = Math.random() * 60; // Distribuidas en distintas edades
        p.size = Math.random() * 2 + 0.5;
        break;

      case 'drops':
        // Las gotas caen hacia abajo lentamente
        p.vx    = (Math.random() - 0.5) * 0.5;
        p.vy    = Math.random() * 1.5 + 0.5;
        p.size  = Math.random() * 3 + 1;
        p.life  = Math.random() * 120 + 80;
        p.age   = Math.random() * 120;
        p.isCircle = Math.random() > 0.5;
        break;

      case 'dust':
        // El polvo flota lentamente en todas direcciones
        p.vx   = (Math.random() - 0.5) * 0.6;
        p.vy   = (Math.random() - 0.5) * 0.4;
        p.life = Math.random() * 200 + 100;
        p.age  = Math.random() * 200;
        p.size = Math.random() * 4 + 1;
        break;

      case 'floating':
        // El aire flota hacia arriba con movimiento sinusoidal
        p.vx     = (Math.random() - 0.5) * 0.8;
        p.vy     = -(Math.random() * 0.8 + 0.2);
        p.life   = Math.random() * 150 + 100;
        p.age    = Math.random() * 150;
        p.sineOffset  = Math.random() * Math.PI * 2;
        p.sineSpeed   = Math.random() * 0.02 + 0.01;
        p.sineAmp     = Math.random() * 30 + 10;
        p.startX = p.x;
        break;
    }

    particles.push(p);
  }

  // Métodos de actualización y dibujo
  particles.forEach(p => {
    p.update = function(canvas) {
      this.age++;

      switch (this.type) {
        case 'sparks':
          this.x += this.vx;
          this.y += this.vy;
          this.vy += 0.05; // Gravedad ligera
          this.vx *= 0.99;
          if (this.age >= this.life || this.y < -10) {
            // Reiniciar chispa desde la parte inferior central
            this.x = canvas.width * 0.3 + Math.random() * canvas.width * 0.4;
            this.y = canvas.height * 0.8 + Math.random() * canvas.height * 0.2;
            this.vx = (Math.random() - 0.5) * 2;
            this.vy = -(Math.random() * 3 + 1);
            this.age = 0;
            this.alpha = Math.random() * 0.5 + 0.2;
          }
          break;

        case 'drops':
          this.x += this.vx;
          this.y += this.vy;
          if (this.age >= this.life || this.y > canvas.height + 10) {
            this.x = Math.random() * canvas.width;
            this.y = -10;
            this.age = 0;
            this.alpha = Math.random() * 0.5 + 0.1;
          }
          break;

        case 'dust':
          this.x += this.vx;
          this.y += this.vy;
          // Rebotar en los bordes
          if (this.x < 0 || this.x > canvas.width)  this.vx *= -1;
          if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
          if (this.age >= this.life) {
            this.age = 0;
            this.alpha = Math.random() * 0.4 + 0.1;
          }
          break;

        case 'floating':
          // Movimiento sinusoidal en X
          this.x = this.startX + Math.sin(this.age * this.sineSpeed + this.sineOffset) * this.sineAmp;
          this.y += this.vy;
          if (this.y < -10) {
            this.startX = Math.random() * canvas.width;
            this.x = this.startX;
            this.y = canvas.height + 10;
            this.age = 0;
            this.alpha = Math.random() * 0.4 + 0.1;
          }
          break;
      }
    };

    p.draw = function(ctx, color) {
      // Calcular alpha con fade al inicio/final de vida
      let drawAlpha = this.alpha;
      const lifeProgress = this.age / (this.life || 100);
      if (lifeProgress < 0.2) drawAlpha *= lifeProgress / 0.2;  // Fade in
      if (lifeProgress > 0.8) drawAlpha *= (1 - lifeProgress) / 0.2; // Fade out

      ctx.globalAlpha = Math.max(0, drawAlpha);

      switch (this.type) {
        case 'sparks':
          // Chispas como líneas cortas brillantes
          ctx.beginPath();
          ctx.moveTo(this.x, this.y);
          ctx.lineTo(this.x - this.vx * 3, this.y - this.vy * 3);
          ctx.strokeStyle = color;
          ctx.lineWidth = this.size * 0.5;
          ctx.stroke();
          // Punto brillante en el extremo
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size * 0.6, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();
          break;

        case 'drops':
          ctx.beginPath();
          if (this.isCircle) {
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          } else {
            // Gota alargada
            ctx.ellipse(this.x, this.y, this.size * 0.5, this.size * 1.5, 0, 0, Math.PI * 2);
          }
          ctx.fillStyle = color;
          ctx.fill();
          break;

        case 'dust':
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
          break;

        case 'floating':
          // Partículas de aire como círculos muy suaves
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
          gradient.addColorStop(0, color);
          gradient.addColorStop(1, 'transparent');
          ctx.fillStyle = gradient;
          ctx.fill();
          break;
      }

      ctx.globalAlpha = 1; // Restaurar alpha global
    };
  });

  return particles;
}

// ============================================================
// 7. CAMBIO DINÁMICO DE ATMÓSFERA
//    Cuando el usuario llega a un elemento, se actualiza
//    el color de las partículas globales y el cursor trail
// ============================================================

// Paleta de atmósferas por elemento
const atmospheres = {
  intro:  { hue: 35,  sat: 60,  trailColor: 'rgba(200,150,80,0.4)' },
  impact: { hue: 270, sat: 50,  trailColor: 'rgba(180,120,255,0.4)' },
  fire:   { hue: 25,  sat: 90,  trailColor: 'rgba(255,100,0,0.5)'  },
  water:  { hue: 210, sat: 90,  trailColor: 'rgba(0,180,255,0.4)'  },
  earth:  { hue: 100, sat: 70,  trailColor: 'rgba(120,180,60,0.4)' },
  air:    { hue: 195, sat: 40,  trailColor: 'rgba(180,220,255,0.4)' },
  close:  { hue: 45,  sat: 50,  trailColor: 'rgba(200,180,120,0.4)' }
};

function changeAtmosphere(elementType) {
  const atmos  = atmospheres[elementType] || atmospheres.intro;
  const cursor = document.getElementById('cursor-trail');

  // Cambiar partículas globales
  if (window.setParticleAtmosphere) {
    window.setParticleAtmosphere(atmos.hue, atmos.sat);
  }

  // Cambiar color del cursor trail
  if (cursor) {
    cursor.style.borderColor = atmos.trailColor;
  }
}

// ============================================================
// 8. NAVEGACIÓN LATERAL
//    Los puntos laterales permiten navegar entre secciones
//    y se actualizan al hacer scroll
// ============================================================
function initNavigation() {
  const navDots = document.querySelectorAll('.nav-dot');

  navDots.forEach(dot => {
    dot.addEventListener('click', () => {
      const sectionIndex = parseInt(dot.dataset.section);
      const targetSection = document.getElementById('section-' + sectionIndex);

      if (targetSection) {
        // Scroll suave hacia la sección objetivo
        targetSection.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

function updateNavDots(activeSectionIndex) {
  const navDots = document.querySelectorAll('.nav-dot');
  navDots.forEach((dot, index) => {
    dot.classList.toggle('active', index === activeSectionIndex);
  });
}



// ============================================================
// ANIMACIÓN DE NÚMEROS DE ELEMENTO AL ENTRAR
//    Los números grandes se animan cuando la sección se activa
// ============================================================
const sectionObserverForNumbers = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const numEl = entry.target.querySelector('.element-number');
      if (numEl) {
        numEl.style.animation = 'none';
        numEl.style.transition = 'opacity 1.5s ease, transform 1.5s ease, font-size 1s ease';
        numEl.style.opacity = '1';
      }
    }
  });
}, { threshold: 0.3 });

document.querySelectorAll('.section').forEach(s => sectionObserverForNumbers.observe(s));



// ============================================================
// EFECTO DE GLITCH SUTIL EN EL TÍTULO AL HACER HOVER
//    Solo en desktop
// ============================================================
const titleMain = document.querySelector('.title-main');
if (titleMain && window.innerWidth > 768) {
  let glitchTimeout;

  titleMain.addEventListener('mouseenter', () => {
    clearTimeout(glitchTimeout);
    titleMain.style.textShadow = `
      2px 0 #FF4500,
      -2px 0 #0066FF,
      0 0 40px rgba(200,150,80,0.3)
    `;
    glitchTimeout = setTimeout(() => {
      titleMain.style.textShadow = '0 0 80px rgba(200,150,80,0.2)';
    }, 150);
  });

  titleMain.addEventListener('mouseleave', () => {
    titleMain.style.textShadow = '0 0 80px rgba(200,150,80,0.2)';
  });
}

// ============================================================
// ANIMACIÓN DE ENTRADA PARA SECCIÓN DE CIERRE
//    Las líneas finales se revelan en secuencia
// ============================================================
const closeSectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const finalLines = entry.target.querySelectorAll('.close-final span');
      finalLines.forEach((line, i) => {
        setTimeout(() => {
          line.style.opacity     = '1';
          line.style.transform   = 'translateY(0)';
          line.style.transition  = 'opacity 0.8s ease, transform 0.8s ease';
          line.style.color       = 'rgba(255,255,255,0.4)';
        }, i * 300 + 800); // Retraso escalonado
      });

      // El logo final aparece al último
      const closeLogo = entry.target.querySelector('.close-logo');
      if (closeLogo) {
        setTimeout(() => {
          closeLogo.style.transition = 'opacity 2s ease, color 2s ease';
          closeLogo.style.color      = 'rgba(255,255,255,0.12)';
        }, 1800);
      }
    }
  });
}, { threshold: 0.4 });

const closeSection = document.querySelector('.section-close');
if (closeSection) closeSectionObserver.observe(closeSection);

// Preparar estado inicial de animaciones del cierre
document.querySelectorAll('.close-final span').forEach(el => {
  el.style.opacity   = '0';
  el.style.transform = 'translateY(15px)';
});
