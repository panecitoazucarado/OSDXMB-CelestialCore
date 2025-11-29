//////////////////////////////////////////////////////////////////////////
///*				   			   PADS								  *///
/// 				   		  										   ///
///		This handles all the events that occur when a button is		   ///
///							pressed or hold.						   ///
/// 				   		  										   ///
//////////////////////////////////////////////////////////////////////////

let PADEVENTS = {};		// Object with Pad Events for each button.
const PadSettings = {};
PadSettings.Mode = 0;
PadSettings.Port = 0;

const pad = Pads.get(PadSettings.Port);
function checkStates(BUTTON) { return (pad.justPressed(BUTTON) || pad.pressed(BUTTON)); }
const PadIcons = (() => {
    const base = `${PATHS.Theme}Original/pads/`;
    const cache = {};
    function nameOf(key) {
        if (typeof key === 'number') {
            switch (key) {
                case Pads.CIRCLE: return 'circle.png';
                case Pads.CROSS: return 'cross.png';
                case Pads.SQUARE: return 'square.png';
                case Pads.TRIANGLE: return 'triangle.png';
                case Pads.UP: return 'up.png';
                case Pads.DOWN: return 'down.png';
                case Pads.LEFT: return 'left.png';
                case Pads.RIGHT: return 'right.png';
                case Pads.START: return 'start.png';
                case Pads.SELECT: return 'select.png';
                case Pads.R1: return 'R1.png';
                case Pads.R2: return 'R2.png';
                case Pads.L1: return 'L1.png';
                case Pads.L2: return 'L2.png';
                case Pads.L3: return 'L3.png';
                case Pads.R3: return 'R3.png';
                default: return null;
            }
        }
        const map = {
            CIRCLE: 'circle.png', CROSS: 'cross.png', SQUARE: 'square.png', TRIANGLE: 'triangle.png',
            UP: 'up.png', DOWN: 'down.png', LEFT: 'left.png', RIGHT: 'right.png',
            START: 'start.png', SELECT: 'select.png', R1: 'R1.png', R2: 'R2.png', L1: 'L1.png', L2: 'L2.png', L3: 'L3.png', R3: 'R3.png'
        };
        return map[key] || null;
    }
    function get(key) {
        const fn = nameOf(key);
        if (!fn) return null;
        if (!cache[fn]) { const img = new Image(`${base}${fn}`); img.optimize(); cache[fn] = img; }
        return cache[fn];
    }
    function draw(key, x, y, alpha) { const img = get(key); if (!img) return; if (alpha !== undefined) { img.color = Color.setA(img.color, alpha); } img.draw(x, y); }
    function drawScaled(key, x, y, w, h, alpha) { const img = get(key); if (!img) return; if (alpha !== undefined) { img.color = Color.setA(img.color, alpha); } const ow = img.width, oh = img.height; img.width = w; img.height = h; img.draw(x, y); img.width = ow; img.height = oh; }
    return { get, draw, drawScaled };
})();
globalThis.PadIcons = PadIcons;
function PadsHandler() {

	PadSettings.ConfirmButton = (UserConfig.ConfirmBtn === 0) ? Pads.CROSS : Pads.CIRCLE;
	PadSettings.CancelButton = (UserConfig.ConfirmBtn === 0) ? Pads.CIRCLE : Pads.CROSS;
    pad.update();
    if (PadSettings.Mode === 0) { return; } // If Mode is 0, no events are set.

		 if ((PADEVENTS.ACCEPT) 	&& (pad.justPressed(PadSettings.ConfirmButton))) 	{ PADEVENTS.ACCEPT(); }
    else if ((PADEVENTS.CANCEL) 	&& (pad.justPressed(PadSettings.CancelButton))) 	{ PADEVENTS.CANCEL(); }
	else if ((PADEVENTS.SQUARE)		&& (pad.justPressed(Pads.SQUARE)))					{ PADEVENTS.SQUARE(); }
    else if ((PADEVENTS.TRIANGLE) 	&& (pad.justPressed(Pads.TRIANGLE))) 				{ PADEVENTS.TRIANGLE(); }
    else if ((PADEVENTS.CIRCLE) 		&& (pad.justPressed(Pads.CIRCLE))) 				{ PADEVENTS.CIRCLE(); }
    else if ((PADEVENTS.LEFT) 		&& (checkStates(Pads.LEFT))) 						{ PADEVENTS.LEFT(); }
    else if ((PADEVENTS.RIGHT) 		&& (checkStates(Pads.RIGHT))) 						{ PADEVENTS.RIGHT(); }
    else if ((PADEVENTS.UP) 		&& (checkStates(Pads.UP))) 							{ PADEVENTS.UP(); }
    else if ((PADEVENTS.DOWN) 		&& (checkStates(Pads.DOWN))) 						{ PADEVENTS.DOWN(); }
    else if ((PADEVENTS.L1) 		&& (checkStates(Pads.L1))) 						    { PADEVENTS.L1(); }
    else if ((PADEVENTS.R1) 		&& (checkStates(Pads.R1))) 						    { PADEVENTS.R1(); }
    else if ((PADEVENTS.L2) 		&& (checkStates(Pads.L2))) 						    { PADEVENTS.L2(); }
    else if ((PADEVENTS.R2) 		&& (checkStates(Pads.R2))) 						    { PADEVENTS.R2(); }

		 if ((pad.lx < -64) && (PADEVENTS.LEFT)) 	{ PADEVENTS.LEFT(); }
	else if ((pad.lx >  64) && (PADEVENTS.RIGHT)) 	{ PADEVENTS.RIGHT(); }
	else if ((pad.ly < -64) && (PADEVENTS.UP)) 		{ PADEVENTS.UP(); }
	else if ((pad.ly >  64) && (PADEVENTS.DOWN)) 	{ PADEVENTS.DOWN(); }
}
function ClearPadEvents() {
    // Reset the Object.

    PADEVENTS = {
        ACCEPT: false,
        CANCEL: false,
		SQUARE: false,
        TRIANGLE: false,
        CIRCLE: false,
        LEFT: false,
        RIGHT: false,
        UP: false,
        DOWN: false,
        L1: false,
        R1: false,
        L2: false,
        R2: false,
        START: false,
    }
}
function SetDashPadEvents(MODE) {
    PadSettings.Mode = MODE;
    ClearPadEvents(); // Any time a Mode changes, clean the existing events.
    switch(MODE) {
        case 1:	SetPadEvents_Main(); break;			// Mode 1: Pad Events for main dashboard.
        case 2: SetPadEvents_Sub();	break;			// Mode 2: Pad Events for Sub Menus.
        case 3: SetPadEvents_Context(); break;		// Mode 3: Pad Events for Context Menus.
        case 4: SetPadEvents_Message(); break;		// Mode 4: Pad Events for Overlay Messages.
        case 9: SetPadEvents_Viewer(); break;
    }
}
function SetPadEvents_Main() {
    PADEVENTS.ACCEPT = () => {
        const current = DashUI.Items.Current;
        if (current >= DashUI.ItemCollection.length) { return; }
		ExecuteItem(DashUI.ItemCollection.Current[current]);
	};

	PADEVENTS.TRIANGLE  = () => { OpenOptionBox(DashUI.ItemCollection.Current[DashUI.Items.Current]) };

	PADEVENTS.LEFT  	= () => UIAnimationCategoryMove_Start(-1);
	PADEVENTS.RIGHT 	= () => UIAnimationCategoryMove_Start(1);
	PADEVENTS.UP 		= () => UIAnimationCategoryItemsMove_Start(-1);
	PADEVENTS.DOWN 		= () => UIAnimationCategoryItemsMove_Start(1);

    const obj = DashUI.Items;

    PADEVENTS.L2 = () => {
        if (obj.Current === 0) return;
        obj.Current = 1;
        obj.Next = obj.Current;
        UIAnimationCategoryItemsMove_Start(-1);
    };
    PADEVENTS.R2 = () => {
        const total = (DashUI.ItemCollection.Current.length - 1);
        if (obj.Current === total) return;
        obj.Current = total - 1;
        obj.Next = obj.Current;
        UIAnimationCategoryItemsMove_Start(1);
    };

    PADEVENTS.L1 = () => {
        if (obj.Current === 0) return;
        let delta = (obj.Current - 5 < 0) ? obj.Current : 5;
        obj.Current = (obj.Current - delta) + 1;
        obj.Next = obj.Current;
        UIAnimationCategoryItemsMove_Start(-1);
    };

    PADEVENTS.R1 = () => {
        const total = (DashUI.ItemCollection.Current.length - 1);
        if (obj.Current === total) return;
        let delta = (obj.Current + 5 > total) ? total - obj.Current : 5;
        obj.Current = (obj.Current + delta) - 1;
        obj.Next = obj.Current;
        UIAnimationCategoryItemsMove_Start(1);
    };
}
function SetPadEvents_Sub() {
	PADEVENTS.ACCEPT 	= () => {
        const current = DashUI.SubMenu.Items.Current;
		const Items = DashUI.SubMenu.ItemCollection[DashUI.SubMenu.Level].Items;
        if (current >= Items.length) return;
        ExecuteItem(Items[current]);
	};

	PADEVENTS.TRIANGLE  = () => { OpenOptionBox(DashUI.SubMenu.ItemCollection[DashUI.SubMenu.Level].Items[DashUI.SubMenu.Items.Current]) };

	PADEVENTS.SQUARE    = () => { toggleBackgroundBgm(); };

	PADEVENTS.CANCEL 	= () => DashUIBackFromSubMenu();
	PADEVENTS.LEFT  	= () => DashUIBackFromSubMenu();
	PADEVENTS.UP 		= () => UIAnimationSubMenuItemsMove_Start(-1);
    PADEVENTS.DOWN      = () => UIAnimationSubMenuItemsMove_Start(1);

    const obj = DashUI.SubMenu.Items;

    PADEVENTS.L2 = () => {
        if (obj.Current === 0) return;
        obj.Current = 1;
        obj.Next = obj.Current;
        UIAnimationSubMenuItemsMove_Start(-1);
    };
    PADEVENTS.R2 = () => {
        const sub = DashUI.SubMenu;
        const total = (sub.ItemCollection[sub.Level].Items.length - 1);
        if (obj.Current === total) return;
        obj.Current = total - 1;
        obj.Next = obj.Current;
        UIAnimationSubMenuItemsMove_Start(1);
    };

    PADEVENTS.L1 = () => {
        if (obj.Current === 0) return;
        let delta = (obj.Current - 5 < 0) ? obj.Current : 5;
        obj.Current = (obj.Current - delta) + 1;
        obj.Next = obj.Current;
        UIAnimationSubMenuItemsMove_Start(-1);
    };

    PADEVENTS.R1 = () => {
        const sub = DashUI.SubMenu;
        const total = (sub.ItemCollection[sub.Level].Items.length - 1);
        if (obj.Current === total) return;
        let delta = (obj.Current + 5 > total) ? total - obj.Current : 5;
        obj.Current = (obj.Current + delta) - 1;
        obj.Next = obj.Current;
        UIAnimationSubMenuItemsMove_Start(1);
    };
}
function SetPadEvents_Context() {
	PADEVENTS.ACCEPT	= () => DashUISelectContextItem();
	PADEVENTS.CANCEL 	= () => DashUIBackFromContextMenu();
	PADEVENTS.UP 		= () => UIAnimationContextMenuItemsMove_Start(-1);
	PADEVENTS.DOWN 		= () => UIAnimationContextMenuItemsMove_Start(1);
}
function SetPadEvents_Message() {
	if (DashUI.Dialog.Data[DashUI.Dialog.Level].ENTER_BTN) { PADEVENTS.ACCEPT 	= () => { if ('Confirm' in DashUI.Dialog.Data[DashUI.Dialog.Level]) { DashUI.Dialog.Data[DashUI.Dialog.Level].Confirm(); } }; }
	if (DashUI.Dialog.Data[DashUI.Dialog.Level].BACK_BTN)  { PADEVENTS.CANCEL 	= () => UIAnimationDialogFade_Start(false); }
}
function SetPadEvents_Parental() {
    PADEVENTS.LEFT 		= () => UIAnimationDialogMove_Start(-1, 4);
    PADEVENTS.RIGHT 	= () => UIAnimationDialogMove_Start(1, 4);
    PADEVENTS.UP 		= () => UIAnimationParentalDialogChange_Start(1);
    PADEVENTS.DOWN 		= () => UIAnimationParentalDialogChange_Start(-1);
}
function SetPadEvents_Confirmation() {
    PADEVENTS.LEFT 		= () => UIAnimationDialogMove_Start(-1, 2);
    PADEVENTS.RIGHT 	= () => UIAnimationDialogMove_Start(1, 2);
}
function SetPadEvents_Information() {
    PADEVENTS.LEFT 		= () => UIAnimationDialogInfoMove_Start(-1);
    PADEVENTS.RIGHT 	= () => UIAnimationDialogInfoMove_Start(1);
    PADEVENTS.UP 		= () => {
		const data = DashUI.Dialog.Data[DashUI.Dialog.Level];
		let next = -1;
		for (let i = data.Selected - 1; i > -1; i--) {
			if (data.Info[i].Selectable) { next = i; break; }
		}
		if (next !== -1) { UIAnimationDialogMove_Start(next - data.Selected, data.Info.length); }
	}
    PADEVENTS.DOWN 		= () => {
		const data = DashUI.Dialog.Data[DashUI.Dialog.Level];
		let next = -1;
		for (let i = data.Selected + 1; i < data.Info.length; i++) {
			if (data.Info[i].Selectable) { next = i; break; }
		}
		if (next !== -1) { UIAnimationDialogMove_Start(next - data.Selected, data.Info.length); }
	}
}
function SetPadEvents_Viewer() {
    PADEVENTS.CANCEL = () => { DashUI.ViewerExit = true; };
    PADEVENTS.CIRCLE = () => { DashUI.ViewerExit = true; };
}

//////////////////////////////////////////////////////////////////////////
///*				   			 Init Work							  *///
//////////////////////////////////////////////////////////////////////////

SetDashPadEvents(0);
console.log("INIT LIB: PADS COMPLETE");
