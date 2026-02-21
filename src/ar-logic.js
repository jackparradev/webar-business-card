document.addEventListener("DOMContentLoaded", function () {

    const target        = document.querySelector('#card-anchor');
    const panelProfile  = document.querySelector('#panel-profile');
    const panelLogo     = document.querySelector('#panel-logo');
    const panelLinks    = document.querySelector('#panel-links');
    const scanOverlay   = document.getElementById('scan-overlay');
    const lostIndicator = document.getElementById('lost-indicator');
    const toast         = document.getElementById('tap-toast');

    let deployed           = false;
    let animating          = false;
    let stabilizationTimer = null;
    let lostTimer          = null;

    /* ══════════════════════════════════════
       LINKS — edita con tus datos reales
    ══════════════════════════════════════ */
    const LINKS = {
        github:   'https://github.com/jackparradev',
        linkedin: 'https://www.linkedin.com/in/jackparradev/',
        phone:    'https://wa.me/51950886127'
    };

    const LABELS = {
        github:   'GitHub',
        linkedin: 'LinkedIn',
        phone:    'WhatsApp'
    };

    /* ══════════════════════════════════════
       TOAST
    ══════════════════════════════════════ */
    function showToast(msg) {
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(function () { toast.classList.remove('show'); }, 2200);
    }

    /* ══════════════════════════════════════
       ACCIÓN
    ══════════════════════════════════════ */
    function handleAction(action) {
        if (!action || !LINKS[action]) return;
        showToast('Abriendo ' + (LABELS[action] || action) + '…');
        setTimeout(function () {
            window.open(LINKS[action], '_blank');
        }, 350);
    }

    /* ══════════════════════════════════════
       CLICKS — doble método para mobile
    ══════════════════════════════════════ */
    function registerClicks() {

        // Método 1: raycaster A-Frame
        document.querySelectorAll('.clickable').forEach(function (el) {
            el.addEventListener('click', function (evt) {
                handleAction(el.getAttribute('data-action'));
                evt.stopPropagation();
            });
        });

        // Método 2: touch directo sobre canvas con proyección 3D→pantalla
        const canvas = document.querySelector('canvas');
        if (!canvas) return;

        canvas.addEventListener('touchend', function (evt) {
            evt.preventDefault();
            var t = evt.changedTouches[0];
            checkTouch(t.clientX, t.clientY);
        }, { passive: false });

        canvas.addEventListener('mouseup', function (evt) {
            checkTouch(evt.clientX, evt.clientY);
        });
    }

    function checkTouch(touchX, touchY) {
        if (!deployed) return;
        var scene  = document.querySelector('a-scene');
        var camera = document.querySelector('a-camera');
        if (!scene || !camera) return;
        var cam = camera.getObject3D('camera');
        if (!cam) return;

        var W    = window.innerWidth;
        var H    = window.innerHeight;
        var ndcX =  (touchX / W) * 2 - 1;
        var ndcY = -(touchY / H) * 2 + 1;

        var closest  = null;
        var closestD = 9999;

        document.querySelectorAll('.clickable').forEach(function (el) {
            if (!el.object3D) return;
            var pos = new THREE.Vector3();
            el.object3D.getWorldPosition(pos);
            pos.project(cam);
            var dx = pos.x - ndcX;
            var dy = pos.y - ndcY;
            var d  = Math.sqrt(dx * dx + dy * dy);
            if (d < 0.25 && d < closestD) {
                closestD = d;
                closest  = el;
            }
        });

        if (closest) handleAction(closest.getAttribute('data-action'));
    }

    /* ══════════════════════════════════════
       HELPER: anima panel a posición final
    ══════════════════════════════════════ */
    function animatePanel(panel, toX, toY, toZ, delay, dur) {
        dur = dur || 650;
        setTimeout(function () {
            panel.removeAttribute('animation');
            panel.object3D.position.set(0, 0, -0.15);
            panel.setAttribute('visible', true);
            requestAnimationFrame(function () {
                panel.setAttribute('animation',
                    'property: position; ' +
                    'from: 0 0 -0.15; ' +
                    'to: ' + toX + ' ' + toY + ' ' + toZ + '; ' +
                    'dur: ' + dur + '; ' +
                    'easing: easeOutExpo'
                );
            });
        }, delay);
    }

    /* ══════════════════════════════════════
       RESET
    ══════════════════════════════════════ */
    function resetPanels() {
        deployed  = false;
        animating = false;
        [panelProfile, panelLogo, panelLinks].forEach(function (panel) {
            panel.removeAttribute('animation');
            panel.setAttribute('visible', false);
            panel.object3D.position.set(0, 0, -0.15);
        });
    }

    /* ══════════════════════════════════════
       DESPLIEGUE

       Tarjeta: 1.0 ancho × 0.67 alto
       Ratio imagen .mind: 640×429

       PERFIL  izquierda → X: -0.82
               (mitad tarjeta 0.50 + gap 0.05 + mitad panel 0.275 = 0.825)

       LOGO    derecha   → X: +0.82

       LINKS   abajo     → Y: -0.58
               (mitad tarjeta 0.335 + gap 0.06 + mitad panel 0.18 = 0.575)
    ══════════════════════════════════════ */
    function deployPanels() {
        if (deployed || animating) return;
        animating = true;

        if (scanOverlay)   scanOverlay.classList.add('hidden');
        if (lostIndicator) lostIndicator.classList.remove('show');

        // PERFIL — izquierda (primer en aparecer)
        animatePanel(panelProfile, -0.82,  0,     0.05,   0,  700);

        // LOGO — derecha
        animatePanel(panelLogo,     0.82,  0,     0.05, 180,  700);

        // LINKS — abajo (último, da sensación de despliegue secuencial)
        animatePanel(panelLinks,    0,    -0.62,  0.05, 360,  650);

        setTimeout(function () {
            animating = false;
            deployed  = true;
        }, 1100);
    }

    /* ══════════════════════════════════════
       TRACKING
    ══════════════════════════════════════ */
    var scene = document.querySelector('a-scene');

    function init() { registerClicks(); }

    if (scene.hasLoaded) { init(); }
    else { scene.addEventListener('loaded', init); }

    target.addEventListener("targetFound", function () {
        if (lostTimer) {
            clearTimeout(lostTimer);
            lostTimer = null;
            if (lostIndicator) lostIndicator.classList.remove('show');
        }
        if (deployed) return;
        if (stabilizationTimer) clearTimeout(stabilizationTimer);
        stabilizationTimer = setTimeout(function () {
            stabilizationTimer = null;
            deployPanels();
        }, 350);
    });

    target.addEventListener("targetLost", function () {
        if (stabilizationTimer) {
            clearTimeout(stabilizationTimer);
            stabilizationTimer = null;
        }
        if (lostIndicator) lostIndicator.classList.add('show');
        lostTimer = setTimeout(function () {
            lostTimer = null;
            resetPanels();
            if (scanOverlay) scanOverlay.classList.remove('hidden');
        }, 1200);
    });

});