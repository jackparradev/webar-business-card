document.addEventListener("DOMContentLoaded", function () {

    const target = document.querySelector('#card-anchor');
    const scanLine = document.querySelector('#scan-line');
    const panelLeft = document.querySelector('#panel-left');
    const panelRight = document.querySelector('#panel-right');
    const panelBottom = document.querySelector('#panel-bottom');

    let isAnimating = false;
    let isDeployed = false;
    let stabilizationTimer = null;
    let lostTimer = null;

    function resetPanels() {
        isAnimating = false;
        isDeployed = false;

        // Ocultar y resetear scanline
        scanLine.setAttribute('visible', 'false');
        scanLine.removeAttribute('animation');
        scanLine.setAttribute('position', '0 0.275 0.02');

        // Ocultar y resetear paneles
        [panelLeft, panelRight, panelBottom].forEach(panel => {
            panel.setAttribute('visible', 'false');
            panel.removeAttribute('animation');
        });
        panelLeft.setAttribute('position', '0 0 0');
        panelRight.setAttribute('position', '0 0 0');
        panelBottom.setAttribute('position', '0 0 0');
    }

    function deployScanLine() {
        return new Promise(resolve => {
            scanLine.setAttribute('visible', 'true');
            scanLine.setAttribute('animation',
                'property: position; from: 0 0.275 0.02; to: 0 -0.275 0.02; dur: 500; easing: linear');

            setTimeout(() => {
                scanLine.setAttribute('visible', 'false');
                resolve();
            }, 520); // 20ms extra para que termine limpio
        });
    }

    function deployPanels() {
        if (isAnimating || isDeployed) return;
        isAnimating = true;

        console.log("Iniciando secuencia: ScanLine → Paneles");

        // 1. Primero la scanline, luego encadenamos los paneles
        deployScanLine().then(() => {
            console.log("ScanLine lista. Desplegando paneles...");

            // Panel izquierdo
            panelLeft.setAttribute('visible', 'true');
            panelLeft.setAttribute('animation',
                'property: position; from: 0 0 0; to: -1.05 0 0.05; dur: 500; easing: easeOutCubic');

            // Panel derecho — 200ms después
            setTimeout(() => {
                panelRight.setAttribute('visible', 'true');
                panelRight.setAttribute('animation',
                    'property: position; from: 0 0 0; to: 1.05 0 0.05; dur: 400; easing: easeOutCubic');
            }, 200);

            // Panel inferior — 400ms después
            setTimeout(() => {
                panelBottom.setAttribute('visible', 'true');
                panelBottom.setAttribute('animation',
                    'property: position; from: 0 0 0; to: 0 -0.45 0.05; dur: 400; easing: easeOutCubic');

                setTimeout(() => {
                    isDeployed = true;
                    isAnimating = false;
                    console.log("Secuencia completa.");
                }, 400);
            }, 400);
        });
    }

    target.addEventListener("targetFound", () => {
        if (lostTimer) {
            clearTimeout(lostTimer);
            lostTimer = null;
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

        lostTimer = setTimeout(() => {
            lostTimer = null;
            console.log("Pérdida real. Reseteando...");
            resetPanels();
        }, 800);
    });
});