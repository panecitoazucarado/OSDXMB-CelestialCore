if (typeof globalThis.MusicPlayerUI === 'undefined') { globalThis.MusicPlayerUI = (() => {
  let stream = null;
  let tempPath = null;
  let originalPath = null;
  let prevState = 1;
  let layerIndex = -1;
  let layerFn = null;
  let resources = null;
  function loadResources() {
    const uiBase = `${PATHS.XMB}UI/Music_Interface/UI/player_ui/`;
    const padsBase = `${PATHS.Theme}Original/pads/`;
    const res = {};
    try {
      // Optimized: Load only essential resources first, defer others
      res.box = new Image(`${PATHS.XMB}dash/dash_option_box.png`);
      res.cross = new Image(`${padsBase}cross.png`);
      res.circle = new Image(`${padsBase}circle.png`);
      res.square = new Image(`${padsBase}square.png`);
      res.triangle = new Image(`${padsBase}triangle.png`);
      res.play = new Image(`${uiBase}Play.png`);
      res.pause = new Image(`${uiBase}Pause.png`);
      res.nocover = new Image(`${uiBase}No_Cover.png`);
      
      // Optimize essential images immediately
      [res.box, res.cross, res.circle, res.square, res.triangle, res.play, res.pause, res.nocover].forEach(i => {
        if (i) {
          i.optimize();
          i.filter = LINEAR;
        }
      });
      
      // Set sizes for pad icons
      res.cross.width = 14; res.cross.height = 14;
      res.circle.width = 14; res.circle.height = 14;
      res.square.width = 14; res.square.height = 14;
      res.triangle.width = 14; res.triangle.height = 14;
      
      // Load optional resources lazily (only if needed, reduce memory usage)
      // These can be loaded on-demand if features are used
      res.stop = null;
      res.next = null;
      res.prev = null;
      res.ff = null;
      res.rw = null;
      res.shuffle = null;
      res.repeat = null;
    } catch (e) {
      xlog(`Error loading resources: ${e}`);
    }
    return res;
  }
  function freeResources() {
    if (resources) {
      Object.values(resources).forEach(i => {
        if (i) {
          try { i.free(); } catch (e) {}
        }
      });
      resources = null;
    }
  }
  // Cache for UI state to avoid recalculations
  let lastAlpha = -1;
  let cachedColor = null;
  
  function drawUI() {
    const alpha = DashUI.Overlay.Alpha;
    const col = BgElements.BgColor.Color;
    
    // Optimized: Only update color cache when it changes
    if (!cachedColor || cachedColor.R !== col.R || cachedColor.G !== col.G || cachedColor.B !== col.B) {
      cachedColor = { R: col.R, G: col.G, B: col.B };
    }
    
    const coverW = 180, coverH = 180;
    const coverX = 40, coverY = 60;
    
    // Draw cover (only if resources loaded)
    if (resources && resources.nocover) {
      resources.nocover.width = coverW;
      resources.nocover.height = coverH;
      resources.nocover.color = Color.setA(Color.new(cachedColor.R, cachedColor.G, cachedColor.B, 128), alpha);
      resources.nocover.draw(coverX, coverY);
    }
    
    // Optimized: Only draw essential controls (play/pause)
    const isPlaying = stream && stream.playing();
    const playPauseIco = isPlaying ? resources.pause : resources.play;
    const playPauseTxt = isPlaying ? "Pausa" : "Reproducir";
    
    if (playPauseIco && resources.box) {
      let x = coverX + coverW + 24;
      const y = ScrCanvas.height - 118;
      const w = 30 + FontObj.Font.getTextSize(playPauseTxt).width;
      resources.box.width = w;
      resources.box.color = Color.setA(resources.box.color, alpha);
      resources.box.draw(x, y);
      const ix = x + 7;
      const iy = y + 11;
      playPauseIco.color = Color.setA(playPauseIco.color, alpha);
      playPauseIco.draw(ix, iy);
      TxtPrint({ Text:[playPauseTxt], Position:{ X:x+27, Y:y+8+34 }, Alpha: alpha });
    }
    
    // Draw prompts (essential only)
    const prompts = [ { ico: resources.circle, txt: "Salir" } ];
    let xr = ScrCanvas.width - 100;
    const yp = ScrCanvas.height - 42;
    for (let i = prompts.length - 1; i >= 0; i--) {
      if (prompts[i].ico && resources.box) {
        const w = 30 + FontObj.Font.getTextSize(prompts[i].txt).width;
        resources.box.width = w;
        resources.box.color = Color.setA(resources.box.color, alpha);
        resources.box.draw(xr, yp);
        const ix = xr + 7;
        const iy = yp + 11;
        prompts[i].ico.color = Color.setA(prompts[i].ico.color, alpha);
        prompts[i].ico.draw(ix, iy);
        TxtPrint({ Text:[prompts[i].txt], Position:{ X:xr+27, Y:yp+8+34 }, Alpha: alpha });
        xr -= (w + 12);
      }
    }
    
    lastAlpha = alpha;
  }
  function open(path, orig, pitch) {
    prevState = DashUI.State.Current;
    DashUI.State.Current = 9;
    DashUI.State.Next = 9;
    DashUI.State.Previous = 9;
    DashUI.AnimationQueue.push(() => { DashUI.Overlay.Alpha += 16; if (DashUI.Overlay.Alpha >= 128) { return true; } return false; });
    try {
      // Optimized: Clean up previous audio more efficiently
      if (CurrentBGM) {
        try {
          CurrentBGM.pause();
          CurrentBGM.free();
        } catch(e) {}
        CurrentBGM = false;
      }
      if (typeof BackgroundBGMInfo !== 'undefined' && BackgroundBGMInfo.tempPath) {
        AudioUtils.cleanupTemp(BackgroundBGMInfo.tempPath, BackgroundBGMInfo.originalPath || orig);
        BackgroundBGMInfo.tempPath = null;
        BackgroundBGMInfo.originalPath = null;
      }
    } catch(e) { xlog(`Error cleaning previous audio: ${e}`); }
    try {
      // Optimized: Create stream first, then load resources to reduce blocking
      stream = Sound.Stream(path);
      stream.pitch = pitch || 1.0;
      CurrentBGM = stream;
      
      // Start playback immediately for better responsiveness
      stream.play();
      
      tempPath = path;
      originalPath = orig;
      
      // Load resources after stream starts (non-blocking)
      resources = loadResources();
      layerFn = drawUI;
      UICONST.LayersFg.push(layerFn);
      layerIndex = UICONST.LayersFg.length - 1;
    } catch (e) {
      xlog(`Error opening stream: ${e}`);
      closePlayer();
      return;
    }
    // Optimized: Use throttled interval (16ms = ~60fps) instead of every frame for better performance on PS2
    let frameCounter = 0;
    const tick = os.setInterval(() => {
      try {
        frameCounter++;
        // Throttle checks to every 2 frames (~30fps) instead of every frame for better performance
        if (frameCounter % 2 !== 0) { return; }
        
        // Check if stream is still valid
        if (!stream) {
          closePlayer();
          os.clearInterval(tick);
          return;
        }
        
        // Check cancel button or stream end
        if (pad.justPressed(PadSettings.CancelButton) || !stream.playing()) {
          DashUI.AnimationQueue.push(() => {
            DashUI.Overlay.Alpha -= 16;
            if (DashUI.Overlay.Alpha <= 0) {
              closePlayer();
              os.clearInterval(tick);
              return true;
            }
            return false;
          });
        }
        // Check square button for play/pause (only check when pressed, not every frame)
        if (pad.justPressed(Pads.SQUARE)) {
          if (stream.playing()) {
            stream.pause();
          } else {
            stream.play();
          }
        }
      } catch (e) {
        xlog(`Error in tick: ${e}`);
        closePlayer();
        os.clearInterval(tick);
      }
    }, 16); // 16ms interval instead of 0ms for better performance
  }
  function closePlayer() {
    try {
      if (stream) {
        stream.pause();
        stream.free();
        stream = null;
      }
      CurrentBGM = false;
      AudioUtils.cleanupTemp(tempPath, originalPath);
      tempPath = null;
      originalPath = null;
      UICONST.LayersFg = UICONST.LayersFg.filter(fn => fn !== layerFn);
      layerIndex = -1;
      layerFn = null;
      freeResources();
      DashUI.State.Current = prevState;
      DashUI.State.Next = prevState;
      DashUI.State.Previous = prevState;
    } catch (e) {
      xlog(`Error closing player: ${e}`);
    }
  }
  return { open, close: closePlayer };
})(); }