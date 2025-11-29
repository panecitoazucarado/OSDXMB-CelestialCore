//////////////////////////////////////////////////////////////////////////
///*				   			  AUDIO								  *///
/// 				   		  										   ///
///		  This handles all audio related functions and systems.		   ///
/// 				   		  										   ///
//////////////////////////////////////////////////////////////////////////

const Sounds = {
    // BOOT ya no se usa aquí, se obtiene dinámicamente desde GetBootSoundPath()
    CURSOR: Sound.Sfx(`${PATHS.Theme}Original/sound/cursor.adp`),
    CANCEL: Sound.Sfx(`${PATHS.Theme}Original/sound/cancel.adp`)
};

let CurrentBGM = false; // Current BGM Playing.
let CurrentBGMPath = null;
let BackgroundBGMInfo = { tempPath: null, originalPath: null };

/**
 * Obtiene la ruta del sonido de arranque (boot sound) basado en el tema actual.
 * Lee directamente desde el archivo de configuración para obtener el tema actualizado.
 * Solo carga el sonido del tema actual. Si el tema no tiene sonido, retorna null (no suena nada).
 * Solo usa Original si el tema ES "Original".
 * @returns {string|null} Ruta completa al archivo de sonido de arranque, o null si no existe
 */
function GetBootSoundPath() {
    let currentTheme = "Original";
    let themeFound = false;
    
    // Prioridad 1: Leer directamente desde el archivo de configuración (más confiable, siempre actualizado)
    if (typeof CfgMan !== 'undefined' && CfgMan) {
        try {
            const config = CfgMan.Get("main.cfg");
            // Verificar que config existe, tiene la propiedad Theme, y no está vacío
            if (config && typeof config === 'object' && 'Theme' in config && config.Theme && config.Theme !== "" && config.Theme.trim() !== "") {
                currentTheme = config.Theme.trim();
                themeFound = true;
            }
        } catch (e) {
            // Si falla, intentar con UserConfig
        }
    }
    
    // Prioridad 2: Si CfgMan no funcionó, usar UserConfig.Theme
    if (!themeFound && typeof UserConfig !== 'undefined' && UserConfig && UserConfig.Theme) {
        currentTheme = UserConfig.Theme;
    }
    
    // Construir la ruta base del tema actual
    const themePath = `${PATHS.Theme}${currentTheme}/sound/`;
    
    // Intentar diferentes variantes del nombre del archivo (mayúsculas primero, ya que es más común)
    const possiblePaths = [
        `${themePath}snd_boot.WAV`,
        `${themePath}snd_boot.wav`,
        `${themePath}snd_boot.Wav`
    ];
    
    // Verificar si el archivo existe en el tema actual
    for (let i = 0; i < possiblePaths.length; i++) {
        try {
            if (std.exists(possiblePaths[i])) {
                return possiblePaths[i];
            }
        } catch (e) {
            // Continuar con la siguiente ruta si hay error
            continue;
        }
    }
    
    // Si el tema actual no tiene sonido, retornar null (no suena nada)
    // Esto permite que cada tema tenga su propio sonido o ninguno, sin usar Original como fallback
    return null;
}

function SoundHandler() {
    // This function is called every frame to handle audio.
    if (CurrentBGM && !CurrentBGM.playing()) {
        CurrentBGM.free();
        CurrentBGM = false;
    }
 }

function playSfx(sound) {
    if (!sound) return;
    sound.play();
}
function playBgm(sound) {
    if (!sound) return;
    if (CWD.substring(0, 4) === "mmce") { return; } // Do not play Sounds from MMCE.
    const bgm = Sound.Stream(sound);
    bgm.play();
    CurrentBGM = bgm; // Set the current BGM to the one playing.
    CurrentBGMPath = sound;
}

const PlayBootSfx   = () => {
    const soundPath = GetBootSoundPath();
    if (!soundPath) { return; }
    Tasks.Push(() => playBgm(soundPath));
};
const PlayCursorSfx = () => playSfx(false);
const PlayCancelSfx = () => playSfx(false);

//////////////////////////////////////////////////////////////////////////
///*				   			 Init Work							  *///
//////////////////////////////////////////////////////////////////////////

Sound.setVolume(100);
console.log("INIT LIB: AUDIO COMPLETE");

function toggleBackgroundBgm() {
    const item = DashUI && DashUI.SubMenu ? DashUI.SubMenu.HighlightedItem : false;
    if (!item) return;
    const name = item.Name;
    if (!extensionMatches(name, [ 'mp3', 'wav', 'ogg' ])) return;
    const root = getRootName(item.FullPath);
    if (root.substring(0, 4) === "mmce") { return; }
    let switching = false;
    if (CurrentBGM && CurrentBGM.playing()) {
        switching = (CurrentBGMPath && CurrentBGMPath !== item.FullPath);
        try { CurrentBGM.pause(); } catch(e) {}
        try { CurrentBGM.free(); } catch(e) {}
        if (BackgroundBGMInfo.tempPath) { AudioUtils.cleanupTemp(BackgroundBGMInfo.tempPath, BackgroundBGMInfo.originalPath || item.FullPath); }
        CurrentBGM = false;
        CurrentBGMPath = null;
        BackgroundBGMInfo.tempPath = null;
        BackgroundBGMInfo.originalPath = null;
        if (!switching) { return; }
    }
    const prep = AudioUtils.prepareForPlayback(item.FullPath);
    if (prep.unsupported) { AudioUtils.cleanupTemp(prep.path, item.FullPath); return; }
    const stream = Sound.Stream(prep.path);
    try { stream.pitch = prep.pitch; } catch(e) {}
    CurrentBGM = stream;
    CurrentBGMPath = item.FullPath;
    stream.play();
    BackgroundBGMInfo.tempPath = prep.path;
    BackgroundBGMInfo.originalPath = item.FullPath;
}
