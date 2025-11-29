//////////////////////////////////////////////////////////////////////////
///*				   		Initialize Modules						  *///
//////////////////////////////////////////////////////////////////////////

os.sleep(200); // Wait for modules to load (reduced for faster boot).

function InitCWD() {

    // Try OS Current Working Directory first (fastest path).
    const oscwd = os.getcwd()[0];
    try {
        const oscwdDir = os.readdir(oscwd)[0];
        if (oscwdDir && oscwdDir.includes("XMB")) {
            return ((oscwd.endsWith('/')) ? oscwd : (oscwd + "/"));
        }
    } catch (e) {
        // Continue to device search
    }

    // USB mass device: try generic alias first, then indexed devices
    try {
        // Try alias without index (some setups expose only "mass:")
        const massAlias = "mass:";
        const aliasDir = os.readdir(massAlias)[0];
        if (aliasDir && aliasDir.length > 0) {
            if (aliasDir.includes("XMB")) {
                return massAlias.endsWith('/') ? massAlias : (massAlias + "/");
            } else if (aliasDir.includes("OSDXMB")) {
                const osdxmbPath = `${massAlias}/OSDXMB/`;
                const osdxmbDir = os.readdir(osdxmbPath)[0];
                if (osdxmbDir && osdxmbDir.includes("XMB")) { return osdxmbPath; }
            }
        }
    } catch (e) { /* fall through */ }

    // Optimized: Check mass0: first (most common USB device), without relying on BDM info
    try {
        const mass0Root = "mass0:";
        const dir = os.readdir(mass0Root)[0];
        if (dir && dir.length > 0) {
            if (dir.includes("XMB")) {
                return mass0Root + "/";
            } else if (dir.includes("OSDXMB")) {
                const osdxmbPath = `${mass0Root}/OSDXMB/`;
                const osdxmbDir = os.readdir(osdxmbPath)[0];
                if (osdxmbDir && osdxmbDir.includes("XMB")) { return osdxmbPath; }
            }
        }
    } catch (e) { /* fall through */ }

    const devices = System.devices();

    for (let i = 0; i < devices.length; i++) {
        const device = devices[i];
        switch (device.name) {
            case "mass":
                // Start from mass1: since mass0: already checked
                for (let j = 1; j < 10; j++) {
                    const root = `mass${j.toString()}:`;
                    try {
                        const dir = os.readdir(root)[0];
                        if (!dir || dir.length === 0) { continue; }
                        if (dir.includes("XMB")) {
                            return ((root.endsWith('/')) ? root : (root + "/"));
                        } else if (dir.includes("OSDXMB")) {
                            const osdxmbPath = `${root}OSDXMB/`;
                            const osdxmbDir = os.readdir(osdxmbPath)[0];
                            if (osdxmbDir && osdxmbDir.includes("XMB")) { return osdxmbPath; }
                        }
                    } catch (e) { continue; }
                }
                break;
            case "mmce":
                for (let j = 0; j < 2; j++) {
                    const root = `mmce${j.toString()}:/`;
                    const dir = os.readdir(root)[0];
                    if (dir.includes("XMB")) {
                        return root;
                    } else if (dir.includes("OSDXMB")) {
                        if (os.readdir(`${root}OSDXMB/`)[0].includes("XMB")) {
                            return `${root}OSDXMB/`;
                        }
                    }
                }
                break;
            case "hdd":
                System.mount("pfs0:", "hdd0:__common");
                const pfsDir = os.readdir("pfs0:/")[0];
                if (pfsDir && pfsDir.includes("OSDXMB")) { return "pfs0:/OSDXMB/"; }
                System.umount("pfs0:");
                break;
        }
    }

	// Lastly, try MC directories as last resource (optimized with error handling).
    try {
        const mc0Dir = os.readdir("mc0:/")[0];
        if (mc0Dir && mc0Dir.includes("OSDXMB")) {
            const mc0OsdxmbDir = os.readdir("mc0:/OSDXMB/")[0];
            if (mc0OsdxmbDir && mc0OsdxmbDir.includes("XMB")) {
                return "mc0:/OSDXMB/";
            }
        }
    } catch (e) {
        // Continue to mc1
    }
    
    try {
        const mc1Dir = os.readdir("mc1:/")[0];
        if (mc1Dir && mc1Dir.includes("OSDXMB")) {
            const mc1OsdxmbDir = os.readdir("mc1:/OSDXMB/")[0];
            if (mc1OsdxmbDir && mc1OsdxmbDir.includes("XMB")) {
                return "mc1:/OSDXMB/";
            }
        }
    } catch (e) {
        // Fall through to error
    }

	throw new Error("System Assets not Found.");
	return "./";
}

globalThis.CWD = InitCWD();
globalThis.PATHS = {
	XMB: `${CWD}XMB/`,
	Plugins: `${CWD}PLG/`,
	Theme: `${CWD}THM/`,
	Config: `${CWD}CFG/`,
    VMC: `${CWD}VMC/`,
    Art: `${CWD}ART/`,
	Neutrino: `${CWD}APPS/neutrino/`
};

const jsList = [
	`sce`,		// Kernel Functions.
    `cdvd`,		// CDVD Functions.
    `lang`,		// Language and Localization Strings.
	`xml`,		// XML Parser.
	`cfg`,		// Custom User Configurations.
    `system`,	// Main Constants and Generic Utilities.
    `thread`,   // Threads Handler.
    `net`,      // Network Handler.
    `date`,     // Date and Time Utilities.
    `audio`,    // Sound Handler.
    `audioutils`,
    `music_player_ui`,
    `pads`,     // Pad Action Manager.
    `viewer`,   // Image/GIF Viewer.
	`bg`,		// Background Graphics.
	`effects/manager`,	// Effects Manager (must load before individual effects).
	`effects/wave`,		// Wave Effect (Effects Module).
	`effects/matrix`,	// Matrix Rain Effect (Effects Module).
	`font`, 	// FONT Rendering System.
	`ui`		// Main XMB User Interface Module.
];

jsList.forEach((js) => { std.loadScript(`${PATHS.XMB}js/${js}.js`); });

//////////////////////////////////////////////////////////////////////////
///*				   			Execute App							  *///
//////////////////////////////////////////////////////////////////////////

function main() {

    // Update Global Variables.
    getLocalTime();

    MainMutex.lock();

	// Display UI
	BgHandler();
    UIHandler();
    DbgHandler();

    // IOP Work
    PadsHandler();
    SoundHandler();

    MainMutex.unlock();

	// Threaded Operations
    ImageCache.Process();
    Tasks.Process();

    if (gExit.To) {
        iopResNet(System.boot_path);
        Screen.clear();
        Screen.flip();
        std.reload(gExit.To);
    }
}

Screen.setParam(Screen.DEPTH_TEST_ENABLE, false);
if (gDebug) Screen.setFrameCounter(true);
Screen.setVSync(true);
Screen.display(main);
