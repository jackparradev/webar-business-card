(function () {

  const ASPECT = 1.8;        // Proporción horizontal de la tarjeta
  const MAX_WIDTH_PX = 420;  // Máximo ancho del frame
  const PERCENT = 0.85;      // Porcentaje de pantalla usada

  function updateScanFrame() {

    const frame = document.querySelector('.scan-frame');
    if (!frame) return;

    const isLandscape = window.innerWidth > window.innerHeight;

    let reference;

    if (isLandscape) {
      reference = Math.min(window.innerWidth * PERCENT, MAX_WIDTH_PX);
    } else {
      reference = Math.min(window.innerHeight * PERCENT, MAX_WIDTH_PX);
    }

    const width = Math.round(reference);
    const height = Math.round(width / ASPECT);

    frame.style.width = width + 'px';
    frame.style.height = height + 'px';
  }

  window.addEventListener('resize', updateScanFrame);
  window.addEventListener('orientationchange', updateScanFrame);

  document.addEventListener('DOMContentLoaded', () => {
    updateScanFrame();
    setTimeout(updateScanFrame, 300);
    setTimeout(updateScanFrame, 800);
  });

})();