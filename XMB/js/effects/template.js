//////////////////////////////////////////////////////////////////////////
///*				   			CUSTOM EFFECT TEMPLATE				  *///
/// 				   		  										   ///
///			Template for creating custom visual effects.				   ///
///			Copy this file and modify it to create your own effect.	   ///
/// 				   		  										   ///
//////////////////////////////////////////////////////////////////////////

/**
 * Custom Effect Template
 * 
 * INSTRUCTIONS:
 * 1. Copy this file and rename it (e.g., "myeffect.js")
 * 2. Replace "MyEffect" with your effect name
 * 3. Implement the required methods: Init(), Render(), SetColor()
 * 4. Register your effect at the bottom of the file
 * 
 * IMPORTANT FOR PS2 (32MB RAM):
 * - Keep memory usage minimal
 * - Reuse objects/arrays when possible
 * - Avoid creating new objects in Render() loop
 * - Use precomputed values when possible
 * - Limit particle/object counts
 */

const MyEffect = (() => {
    // Private variables - keep memory usage minimal
    let screenWidth = ScrCanvas.width;
    let screenHeight = ScrCanvas.height;
    let time = 0;
    let frame = 0;
    
    // Effect-specific constants
    const STEP = 4; // Adjust based on performance needs
    
    // Precomputed values (calculate once, reuse)
    const precomputedValues = [];
    
    /**
     * Initialize precomputed values
     * Called once during Init()
     */
    function precompute() {
        // Example: precompute sine values
        for (let i = 0; i < 100; i++) {
            precomputedValues[i] = Math.sinf(i * 0.1);
        }
    }
    
    /**
     * REQUIRED: Initialize the effect
     * Called once when effect is registered
     */
    function Init() {
        screenWidth = ScrCanvas.width;
        screenHeight = ScrCanvas.height;
        time = 0;
        frame = 0;
        
        precompute();
        
        // Initialize any other resources here
        console.log("MyEffect initialized");
    }
    
    /**
     * REQUIRED: Render the effect
     * Called every frame when effect is enabled
     * IMPORTANT: Keep this function as efficient as possible!
     */
    function Render() {
        // Update screen dimensions if changed
        if (ScrCanvas.width !== screenWidth || ScrCanvas.height !== screenHeight) {
            screenWidth = ScrCanvas.width;
            screenHeight = ScrCanvas.height;
            // Recompute if needed
        }
        
        // Example rendering code
        // Replace this with your effect logic
        for (let x = 0; x < screenWidth; x += STEP) {
            const y = screenHeight / 2 + Math.sinf(time * 0.01 + x * 0.01) * 50;
            const rectW = (x + STEP > screenWidth) ? screenWidth - x : STEP;
            
            // Use a color (you can use currentColor from SetColor)
            const effectColor = Color.new(128, 128, 128, 64);
            Draw.rect(x, y, rectW, screenHeight - y, effectColor);
        }
        
        // Update time (keep it bounded to prevent overflow)
        time++;
        if (time > 6284) time = 0;
        
        frame++;
        if (frame > 2) frame = 0;
    }
    
    /**
     * REQUIRED: Update effect colors based on theme
     * @param {object} color - Color object with R, G, B properties
     */
    function SetColor(color) {
        // Update effect colors based on theme color
        // Store color values for use in Render()
        // Example:
        // currentColor = Color.new(
        //     Math.min(color.R + 20, 255),
        //     Math.min(color.G + 20, 255),
        //     Math.min(color.B + 20, 255),
        //     64
        // );
    }
    
    /**
     * OPTIONAL: Clean up resources
     * Called when effect is unregistered
     */
    function Cleanup() {
        // Free any resources, clear arrays, etc.
        precomputedValues.length = 0;
    }
    
    // Return the effect interface
    return {
        Init,
        Render,
        SetColor,
        Cleanup
    };
})();

// Register the effect with EffectsManager
if (typeof EffectsManager !== 'undefined') {
    EffectsManager.Register('myeffect', MyEffect, {
        name: 'My Custom Effect',
        description: 'Description of my custom effect',
        defaultEnabled: false // Set to true if you want it enabled by default
    });
} else {
    console.log("EffectsManager not available. Effect not registered.");
}

console.log("INIT LIB: MY EFFECT COMPLETE");

