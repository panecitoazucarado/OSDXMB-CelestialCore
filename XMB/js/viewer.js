globalThis.Viewer = (() => {
  const SAFE_MARGIN = 24;
  const ICON_SIZE = 16;
  const ROW_H = 20;
  const ROWS = 6;

  function drawControls(alpha) {
    if (!alpha || alpha < 15) return;
    const fuente = FontObj.Font;
    const colorFondo = Color.new(0, 0, 0, Math.floor(alpha * 0.75));
    const colorFondoBorde = Color.new(100, 150, 100, Math.floor(alpha * 0.3));
    const colorAcento = Color.new(200, 255, 200, alpha);
    const color = Color.new(255, 255, 255, alpha);
    fuente.scale = FontObj.SizeS;
    const panelW = 320;
    const panelH = ROWS * ROW_H + 10;
    const panelX = SAFE_MARGIN;
    const panelY = ScrCanvas.height - SAFE_MARGIN - panelH;
    Draw.rect(panelX - 2, panelY - 2, panelW + 4, panelH + 4, colorFondoBorde);
    Draw.rect(panelX, panelY, panelW, panelH, colorFondo);
    const iconX = panelX + 8;
    const textX = iconX + ICON_SIZE + 8;
    let y = panelY + 5;
    fuente.color = colorAcento;
    PadIcons.drawScaled('R1', iconX, y, ICON_SIZE, ICON_SIZE, alpha);
    fuente.print(textX, y, "Acercar");
    y += ROW_H;
    PadIcons.drawScaled('R2', iconX, y, ICON_SIZE, ICON_SIZE, alpha);
    fuente.print(textX, y, "Alejar");
    y += ROW_H;
    fuente.color = color;
    PadIcons.drawScaled('UP', iconX, y, ICON_SIZE, ICON_SIZE, alpha);
    fuente.print(textX, y, "Mover");
    y += ROW_H;
    PadIcons.drawScaled('L3', iconX, y, ICON_SIZE, ICON_SIZE, alpha);
    fuente.print(textX, y, "Mover");
    y += ROW_H;
    PadIcons.drawScaled('START', iconX, y, ICON_SIZE, ICON_SIZE, alpha);
    fuente.print(textX, y, "Mostrar/Ocultar");
    y += ROW_H;
    PadIcons.drawScaled('CIRCLE', iconX, y, ICON_SIZE, ICON_SIZE, alpha);
    fuente.print(textX, y, "Salir");
  }

  function drawHUD(zoom, panX, panY, alpha) {
    const fuente = FontObj.Font;
    const colorFondo = Color.new(0, 0, 0, Math.floor(alpha * 0.75));
    const colorAcento = Color.new(200, 255, 200, alpha);
    const color = Color.new(255, 255, 255, alpha);
    fuente.scale = FontObj.SizeS;
    const zoomText = `Zoom: ${zoom.toFixed(2)}x`;
    const zoomWidth = fuente.getTextSize(zoomText).width;
    const zoomX = ScrCanvas.width - SAFE_MARGIN - zoomWidth - 6;
    const zoomY = SAFE_MARGIN;
    Draw.rect(zoomX - 5, zoomY - 2, zoomWidth + 10, 20, colorFondo);
    fuente.color = colorAcento;
    fuente.print(zoomX, zoomY, zoomText);
    const posText = `X: ${Math.round(panX)}  Y: ${Math.round(panY)}`;
    const posWidth = fuente.getTextSize(posText).width;
    const posX = ScrCanvas.width - SAFE_MARGIN - posWidth - 6;
    const posY = zoomY + 22;
    Draw.rect(posX - 5, posY - 2, posWidth + 10, 20, colorFondo);
    fuente.color = color;
    fuente.print(posX, posY, posText);
  }

  function openStatic(path, prevState) {
    const prev = prevState;
    DashUI.AnimationQueue.push(() => { DashUI.Overlay.Alpha += 16; if (DashUI.Overlay.Alpha >= 128) { return true; } return false; });
    if (typeof SetDashPadEvents !== 'undefined') { SetDashPadEvents(9); }
    let img = new Image(path);
    img.optimize();
    img.filter = LINEAR;
    const iw = img.width, ih = img.height;
    const scaleW = ScrCanvas.width / iw;
    const scaleH = ScrCanvas.height / ih;
    const scale = (scaleW < scaleH) ? scaleW : scaleH;
    let zoom = 1.0;
    let zoomObjetivo = 1.0;
    let offsetX = 0;
    let offsetY = 0;
    let offsetXObjetivo = 0;
    let offsetYObjetivo = 0;
    let mostrarControles = true;
    let tiempoControles = 0;
    const ZOOM_MIN = 0.5;
    const ZOOM_MAX = 5.0;
    const ZOOM_VELOCIDAD = 0.05;
    const BASE_PAD_SPEED = 4.0;
    const BASE_ANALOG_SPEED = 3.5;
    const UMBRAL_ANALOGICO = 25;
    const SUAVIDAD_ZOOM = 0.12;
    const SUAVIDAD_NAVEGACION = 0.25;
    const baseWidth = Math.floor(iw * scale);
    const baseHeight = Math.floor(ih * scale);
    const baseOffsetX = Math.floor((ScrCanvas.width - baseWidth) / 2);
    const baseOffsetY = Math.floor((ScrCanvas.height - baseHeight) / 2);
    function limitarOffset() {
      const anchoActual = baseWidth * zoom;
      const altoActual = baseHeight * zoom;
      if (anchoActual > ScrCanvas.width) {
        const maxOffsetX = (anchoActual - ScrCanvas.width) / 2;
        if (offsetXObjetivo > maxOffsetX) offsetXObjetivo = maxOffsetX;
        if (offsetXObjetivo < -maxOffsetX) offsetXObjetivo = -maxOffsetX;
      } else { offsetXObjetivo = 0; }
      if (altoActual > ScrCanvas.height) {
        const maxOffsetY = (altoActual - ScrCanvas.height) / 2;
        if (offsetYObjetivo > maxOffsetY) offsetYObjetivo = maxOffsetY;
        if (offsetYObjetivo < -maxOffsetY) offsetYObjetivo = -maxOffsetY;
      } else { offsetYObjetivo = 0; }
    }
    function layerFn() {
      const dZoom = zoomObjetivo - zoom;
      if (Math.abs(dZoom) > 0.005) { zoom += dZoom * SUAVIDAD_ZOOM; } else { zoom = zoomObjetivo; }
      const dx = offsetXObjetivo - offsetX;
      const dy = offsetYObjetivo - offsetY;
      if (Math.abs(dx) > 0.3) { offsetX += dx * SUAVIDAD_NAVEGACION; } else { offsetX = offsetXObjetivo; }
      if (Math.abs(dy) > 0.3) { offsetY += dy * SUAVIDAD_NAVEGACION; } else { offsetY = offsetYObjetivo; }
      const anchoActual = baseWidth * zoom;
      const altoActual = baseHeight * zoom;
      const posX = baseOffsetX + offsetX - (anchoActual - baseWidth) / 2;
      const posY = baseOffsetY + offsetY - (altoActual - baseHeight) / 2;
      img.width = Math.floor(anchoActual);
      img.height = Math.floor(altoActual);
      img.color = Color.setA(img.color, DashUI.Overlay.Alpha);
      img.draw(Math.floor(posX), Math.floor(posY));
      const tiempoMax = 240;
      const alpha = Math.floor(220 * (1.0 - Math.min(1.0, tiempoControles / tiempoMax)));
      drawHUD(zoom, offsetX, offsetY, alpha);
      if (mostrarControles) { drawControls(alpha); }
      tiempoControles++;
    }
    UICONST.LayersFg.push(layerFn);
    const tick = os.setInterval(() => {
      pad.update();
      if (DashUI.ViewerExit || pad.justPressed(Pads.CIRCLE) || pad.justPressed(PadSettings.CancelButton)) {
        DashUI.ViewerExit = false;
        os.clearInterval(tick);
        DashUI.AnimationQueue.push(() => {
          DashUI.Overlay.Alpha -= 16;
          if (DashUI.Overlay.Alpha <= 0) {
            if (UICONST.LayersFg.length > 0) { UICONST.LayersFg.pop(); }
            if (img) { img.free(); img = null; }
            DashUI.State.Current = prev; DashUI.State.Next = prev; DashUI.State.Previous = prev;
            DashUI.Overlay.Alpha = 0;
            if (typeof SetDashPadEvents !== 'undefined') { SetDashPadEvents(prev); }
            return true;
          }
          return false;
        });
        return;
      }
      if (pad.justPressed(Pads.START)) { mostrarControles = !mostrarControles; tiempoControles = 0; }
      if (pad.pressed(Pads.R1)) { zoomObjetivo += ZOOM_VELOCIDAD; if (zoomObjetivo > ZOOM_MAX) zoomObjetivo = ZOOM_MAX; limitarOffset(); tiempoControles = 0; }
      if (pad.pressed(Pads.R2)) { zoomObjetivo -= ZOOM_VELOCIDAD; if (zoomObjetivo < ZOOM_MIN) zoomObjetivo = ZOOM_MIN; limitarOffset(); tiempoControles = 0; }
      if (pad.justPressed(Pads.L3)) { zoomObjetivo = 1.0; zoom = 1.0; offsetXObjetivo = 0; offsetYObjetivo = 0; offsetX = 0; offsetY = 0; limitarOffset(); tiempoControles = 0; }
      const speedPad = BASE_PAD_SPEED * Math.max(1.0, zoom);
      let mov = false;
      if (pad.pressed(Pads.LEFT)) { offsetXObjetivo += speedPad; mov = true; }
      if (pad.pressed(Pads.RIGHT)) { offsetXObjetivo -= speedPad; mov = true; }
      if (pad.pressed(Pads.UP)) { offsetYObjetivo += speedPad; mov = true; }
      if (pad.pressed(Pads.DOWN)) { offsetYObjetivo -= speedPad; mov = true; }
      const speedAnalog = BASE_ANALOG_SPEED * Math.max(1.0, zoom);
      if (pad.lx < -UMBRAL_ANALOGICO) { offsetXObjetivo += speedAnalog; mov = true; }
      else if (pad.lx > UMBRAL_ANALOGICO) { offsetXObjetivo -= speedAnalog; mov = true; }
      if (pad.ly < -UMBRAL_ANALOGICO) { offsetYObjetivo += speedAnalog; mov = true; }
      else if (pad.ly > UMBRAL_ANALOGICO) { offsetYObjetivo -= speedAnalog; mov = true; }
      if (mov) { limitarOffset(); tiempoControles = 0; }
    }, 0);
  }

  function openGif(path, prevState) {
    const prev = prevState;
    DashUI.AnimationQueue.push(() => { DashUI.Overlay.Alpha += 16; if (DashUI.Overlay.Alpha >= 128) { return true; } return false; });
    if (typeof SetDashPadEvents !== 'undefined') { SetDashPadEvents(9); }
    const bytes = readAllBytes(path);
    const g = parseGIF(bytes);
    const seq = composeGIF(g, 200);
    const root = getRootName(path);
    const tmpDir = `${root}:/__osdxmb_tmp/`;
    if (!std.exists(tmpDir)) { os.mkdir(tmpDir); }
    const frameFiles = [];
    for (let i = 0; i < seq.frames.length; i++) {
      const fr = seq.frames[i];
      const tmp = `${tmpDir}${getFileName(path)}_${i.toString()}.bmp`;
      writeBMP24(tmp, seq.w, seq.h, fr.rgba);
      frameFiles.push({ path: tmp, delayMs: Math.max(fr.delayMs, 50) });
    }
    let current = 0;
    let img = new Image(frameFiles[0].path);
    img.optimize();
    img.filter = LINEAR;
    const iw0 = img.width;
    const ih0 = img.height;
    const scaleW0 = ScrCanvas.width / iw0;
    const scaleH0 = ScrCanvas.height / ih0;
    const scale0 = (scaleW0 < scaleH0) ? scaleW0 : scaleH0;
    const drawW = Math.floor(iw0 * scale0);
    const drawH = Math.floor(ih0 * scale0);
    const ox = Math.floor((ScrCanvas.width - drawW) / 2);
    const oy = Math.floor((ScrCanvas.height - drawH) / 2);
    function ensureImage(index) {
      if (img) { img.free(); }
      img = new Image(frameFiles[index].path);
      img.optimize();
      img.filter = LINEAR;
      img.width = drawW;
      img.height = drawH;
    }
    let mostrarControles = true;
    let tiempoControles = 0;
    function layerFn() {
      img.color = Color.setA(img.color, DashUI.Overlay.Alpha);
      img.draw(ox, oy);
      const tiempoMax = 240;
      const alpha = Math.floor(220 * (1.0 - Math.min(1.0, tiempoControles / tiempoMax)));
      drawHUD(1.0, 0, 0, alpha);
      if (mostrarControles) { drawControls(alpha); }
      tiempoControles++;
    }
    UICONST.LayersFg.push(layerFn);
    ensureImage(0);
    let elapsed = 0;
    const tick = os.setInterval(() => {
      pad.update();
      if (DashUI.ViewerExit || pad.justPressed(Pads.CIRCLE) || pad.justPressed(PadSettings.CancelButton)) {
        DashUI.ViewerExit = false;
        DashUI.AnimationQueue.push(() => {
          DashUI.Overlay.Alpha -= 16;
          if (DashUI.Overlay.Alpha <= 0) {
            DashUI.State.Current = prev; DashUI.State.Next = prev; DashUI.State.Previous = prev;
            if (img) { img.free(); }
            UICONST.LayersFg.pop();
            os.clearInterval(tick);
            for (let i = 0; i < frameFiles.length; i++) { try { os.remove(frameFiles[i].path); } catch (e) {} }
            return true;
          }
          return false;
        });
        return;
      }
      if (pad.justPressed(Pads.START)) { mostrarControles = !mostrarControles; tiempoControles = 0; }
      elapsed += 16;
      const delay = frameFiles[current].delayMs;
      if (elapsed >= delay) { elapsed = 0; current = (current + 1) % frameFiles.length; ensureImage(current); }
    }, 0);
  }

  function Open(path) {
    const prevState = DashUI.State.Current;
    DashUI.State.Current = 9; DashUI.State.Next = 9; DashUI.State.Previous = 9;
    const ext = getFileExtension(path).toLowerCase();
    if (ext === 'gif') { openGif(path, prevState); }
    else { openStatic(path, prevState); }
  }

  return { Open };
})();
