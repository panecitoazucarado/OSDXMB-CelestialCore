//////////////////////////////////////////////////////////////////////////
///*				   			   LANG								  *///
/// 				   		  										   ///
///		 This handles all 7 Languages' related strings and objects.	   ///
/// 				   		  										   ///
//////////////////////////////////////////////////////////////////////////

const langPath = `${PATHS.XMB}lang/`;
const XMBLANG = {};		// Common Language Strings Object
const CATNAME = []; 	// Category Names, one for each category on the 7 different languages.

function XMBLangInit() {
	try {
		const files = os.readdir(langPath)[0];
		if (!files) { return; }
		for (const file of files) {
			if (file.endsWith(".json"))	{
				const filePath = langPath + file;
				try {
					let fileData = std.loadFile(filePath);
					if (!fileData || fileData.length === 0) { continue; }
					
					// Optimized: single trim and BOM removal
					fileData = fileData.trim();
					if (fileData.length > 0 && fileData.charCodeAt(0) === 0xFEFF) {
						fileData = fileData.substring(1);
					}
					if (!fileData || fileData.length === 0) { continue; }
					
					const data = JSON.parse(fileData);
					Object.assign(XMBLANG, data); // Merge into XMBLANG
				} catch (e) {
					// Silently skip problematic language files
					continue;
				}
			}
		}
	} catch (e) {
		// Continue even if language directory read fails
	}
}

function CatNameInit() {
	if (!(`CATEGORY` in XMBLANG)) { return; }
	CATNAME.push(XMBLANG.CATEGORY.USER);
	CATNAME.push(XMBLANG.CATEGORY.SETTINGS);
	CATNAME.push(XMBLANG.CATEGORY.PHOTO);
	CATNAME.push(XMBLANG.CATEGORY.MUSIC);
	CATNAME.push(XMBLANG.CATEGORY.VIDEO);
	CATNAME.push(XMBLANG.CATEGORY.GAME);
	if ("APPS" in XMBLANG.CATEGORY) { CATNAME.push(XMBLANG.CATEGORY.APPS); }
	CATNAME.push(XMBLANG.CATEGORY.NETWORK);
}

//////////////////////////////////////////////////////////////////////////
///*				   			 Init Work							  *///
//////////////////////////////////////////////////////////////////////////

XMBLangInit();
CatNameInit();
console.log("INIT LIB: LANG COMPLETE");