document.addEventListener("DOMContentLoaded", function () {

    // ── Referencias DOM ──────────────────────────────────────────────────────
    const target      = document.querySelector('#card-anchor');
    const scanLine    = document.querySelector('#scan-line');
    const panelLeft   = document.querySelector('#panel-left');
    const panelRight  = document.querySelector('#panel-right');
    const panelBottom = document.querySelector('#panel-bottom');

    // UI HTML
    const scanOverlay    = document.getElementById('scan-overlay');
    const tapToast       = document.getElementById('tap-toast');
    const lostIndicator  = document.getElementById('lost-indicator');

    // ── Estado ───────────────────────────────────────────────────────────────
    let isAnimating        = false;
    let isDeployed         = false;
    let stabilizationTimer = null;
    let lostTimer          = null;
    let toastTimer         = null;

    // ── Acciones por ícono ───────────────────────────────────────────────────
    const ACTIONS = {
        github:   { label: 'Abriendo GitHub...',   fn: () => window.open('https://github.com/tu-usuario', '_blank') },
        linkedin: { label: 'Abriendo LinkedIn...', fn: () => window.open('https://linkedin.com/in/tu-perfil', '_blank') },
        phone:    { label: 'Llamando...',           fn: () => window.open('tel:+51999999999', '_blank') },
        email:    { label: 'Abriendo correo...',    fn: () => window.open('mailto:tu@email.com', '_blank') },
    };

    // ── Toast helper ─────────────────────────────────────────────────────────
    function showToast(msg) {
        tapToast.textContent = msg;
        tapToast.classList.add('show');
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(() => tapToast.classList.remove('show'), 2000);
    }

    // ── Reset completo ───────────────────────────────────────────────────────
    function resetPanels() {
        isAnimating = false;
        isDeployed  = false;

        scanLine.setAttribute('visible', 'false');
        scanLine.removeAttribute('animation');
        scanLine.setAttribute('position', '0 0.275 0.02');

        [panelLeft, panelRight, panelBottom].forEach(panel => {
            panel.setAttribute('visible', 'false');
            panel.removeAttribute('animation');
        });

        panelLeft.setAttribute('position',   '0 0 0');
        panelRight.setAttribute('position',  '0 0 0');
        panelBottom.setAttribute('position', '0 0 0');
    }

    // ── ScanLine como Promise ────────────────────────────────────────────────
    function deployScanLine() {
        return new Promise(resolve => {
            scanLine.setAttribute('visible', 'true');
            scanLine.setAttribute('animation',
                'property: position; from: 0 0.275 0.02; to: 0 -0.275 0.02; dur: 500; easing: linear');

            setTimeout(() => {
                scanLine.setAttribute('visible', 'false');
                resolve();
            }, 520);
        });
    }

    // ── Secuencia principal ──────────────────────────────────────────────────
    function deployPanels() {
        if (isAnimating || isDeployed) return;
        isAnimating = true;

        // Ocultar overlay de instrucción
        scanOverlay.classList.add('hidden');
        lostIndicator.classList.remove('show');

        console.log("Iniciando secuencia: ScanLine → Paneles");

        deployScanLine().then(() => {

            // Panel izquierdo — sale hacia la izquierda
            panelLeft.setAttribute('visible', 'true');
            panelLeft.setAttribute('animation',
                'property: position; from: 0 0 0; to: -1.05 0 0.05; dur: 500; easing: easeOutCubic');

            // Panel derecho — sale hacia la derecha (200ms después)
            setTimeout(() => {
                panelRight.setAttribute('visible', 'true');
                panelRight.setAttribute('animation',
                    'property: position; from: 0 0 0; to: 1.05 0 0.05; dur: 400; easing: easeOutCubic');
            }, 200);

            // Panel inferior — sale hacia abajo (400ms después)
            setTimeout(() => {
                panelBottom.setAttribute('visible', 'true');
                panelBottom.setAttribute('animation',
                    'property: position; from: 0 0 0; to: 0 -0.45 0.05; dur: 400; easing: easeOutCubic');

                setTimeout(() => {
                    isDeployed  = true;
                    isAnimating = false;
                    console.log("Secuencia completa.");
                }, 400);
            }, 400);
        });
    }

    // ── Tracking events ──────────────────────────────────────────────────────
    target.addEventListener("targetFound", () => {

        // Micro-pérdida: cancelamos reset, los paneles siguen donde están
        if (lostTimer) {
            clearTimeout(lostTimer);
            lostTimer = null;
            lostIndicator.classList.remove('show');
            console.log("Micro-pérdida ignorada.");
            return;
        }

        if (stabilizationTimer) clearTimeout(stabilizationTimer);
        stabilizationTimer = setTimeout(deployPanels, 300);
    });

    target.addEventListener("targetLost", () => {
        if (stabilizationTimer) {
            clearTimeout(stabilizationTimer);
            stabilizationTimer = null;
        }

        // Mostramos indicador visual de pérdida
        lostIndicator.classList.add('show');

        // Esperamos 800ms antes de resetear (tolerancia micro-pérdidas)
        lostTimer = setTimeout(() => {
            lostTimer = null;
            console.log("Pérdida real confirmada. Reseteando...");
            resetPanels();
            // Volvemos a mostrar el overlay de instrucción
            scanOverlay.classList.remove('hidden');
        }, 800);
    });

    // ── Interactividad táctil ────────────────────────────────────────────────
    document.querySelectorAll('.clickable').forEach(item => {
        item.addEventListener('click', function () {
            if (!isDeployed) return; // Ignorar taps durante animación

            const action = this.getAttribute('data-action');
            console.log("Tap en:", action || this.id);

            // Feedback visual: rebote suave
            this.setAttribute('animation__tap',
                'property: scale; from: 0.85 0.85 0.85; to: 1 1 1; dur: 300; easing: easeOutElastic');

            if (action && ACTIONS[action]) {
                showToast(ACTIONS[action].label);
                // Pequeño delay para que el usuario vea el toast antes de salir
                setTimeout(() => ACTIONS[action].fn(), 400);
            }
        });
    });

});