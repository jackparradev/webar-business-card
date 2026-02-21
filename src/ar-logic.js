document.addEventListener("DOMContentLoaded", function () {

    const target = document.querySelector('#card-anchor');
    const panelLeft = document.querySelector('#panel-left');
    const panelRight = document.querySelector('#panel-right');
    const panelBottom = document.querySelector('#panel-bottom');

    let isAnimating = false;
    let isDeployed = false;
    let stabilizationTimer = null;
    let lostTimer = null;  // <-- nuevo: timer para tolerar micro-pérdidas

    function resetPanels() {
        isAnimating = false;
        isDeployed = false;

        [panelLeft, panelRight, panelBottom].forEach(panel => {
            panel.setAttribute('visible', 'false');
            panel.removeAttribute('animation');
        });

        panelLeft.setAttribute('position', '0 0 0');
        panelRight.setAttribute('position', '0 0 0');
        panelBottom.setAttribute('position', '0 0 0');
    }

    function deployPanels() {
        if (isAnimating || isDeployed) return;
        isAnimating = true;

        console.log("Desplegando paneles...");

        panelLeft.setAttribute('visible', 'true');
        panelLeft.setAttribute('animation',
            'property: position; from: 0 0 0; to: -1.05 0 0.05; dur: 500; easing: easeOutCubic');

        setTimeout(() => {
            panelRight.setAttribute('visible', 'true');
            panelRight.setAttribute('animation',
                'property: position; from: 0 0 0; to: 1.05 0 0.05; dur: 400; easing: easeOutCubic');
        }, 200);

        setTimeout(() => {
            panelBottom.setAttribute('visible', 'true');
            panelBottom.setAttribute('animation',
                'property: position; from: 0 0 0; to: 0 -0.45 0.05; dur: 400; easing: easeOutCubic');

            // Marcamos como desplegado cuando termina la última animación
            setTimeout(() => { isDeployed = true; isAnimating = false; }, 400);
        }, 400);
    }

    target.addEventListener("targetFound", () => {

        // Si había un timer de pérdida pendiente, lo cancelamos (fue micro-pérdida)
        if (lostTimer) {
            clearTimeout(lostTimer);
            lostTimer = null;
            console.log("Micro-pérdida ignorada, target recuperado.");
            return; // Ya estaba desplegado, no hacemos nada más
        }

        if (stabilizationTimer) clearTimeout(stabilizationTimer);
        stabilizationTimer = setTimeout(deployPanels, 300);
    });

    target.addEventListener("targetLost", () => {

        // Cancelamos deploy si aún no había arrancado
        if (stabilizationTimer) {
            clearTimeout(stabilizationTimer);
            stabilizationTimer = null;
        }

        // Esperamos 800ms antes de resetear — toleramos micro-pérdidas
        lostTimer = setTimeout(() => {
            lostTimer = null;
            console.log("Pérdida real confirmada. Reseteando...");
            resetPanels();
        }, 800);
    });
});