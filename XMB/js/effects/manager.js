//////////////////////////////////////////////////////////////////////////
///*				   			EFFECTS MANAGER						  *///
/// 				   		  										   ///
///			Manages all visual effects for the XMB interface.			   ///
///			Allows users to add custom effects easily.				   ///
/// 				   		  										   ///
//////////////////////////////////////////////////////////////////////////

/**
 * Effects Manager
 * 
 * This module manages all visual effects in the XMB system.
 * Each effect must implement a standard interface:
 * - Init(): Initialize the effect
 * - Render(): Render the effect (called every frame if enabled)
 * - SetColor(color): Update effect colors based on theme
 * - Cleanup(): Clean up resources (optional)
 * 
 * Effects are registered with a unique ID and can be enabled/disabled
 * through the configuration system.
 */

const EffectsManager = (() => {
    const effects = {}; // Registered effects: { id: { instance, enabled, config } }
    const effectsList = []; // Ordered list of effect IDs
    
    /**
     * Register a new effect
     * @param {string} id - Unique identifier for the effect (e.g., "waves", "particles")
     * @param {object} effectInstance - Effect instance with Init, Render, SetColor methods
     * @param {object} config - Configuration object with name, description, defaultEnabled
     */
    function Register(id, effectInstance, config = {}) {
        if (effects[id]) {
            console.log(`Effect ${id} already registered, skipping.`);
            return false;
        }
        
        if (!effectInstance || typeof effectInstance.Render !== 'function') {
            console.log(`Effect ${id} missing required Render() method.`);
            return false;
        }
        
        // Initialize effect if Init method exists
        if (typeof effectInstance.Init === 'function') {
            try {
                effectInstance.Init();
            } catch (e) {
                console.log(`Error initializing effect ${id}: ${e}`);
                return false;
            }
        }
        
        // Get enabled state from config or UserConfig
        // Try multiple config key formats for compatibility
        const configKey = `Effect_${id}`;
        const configKeyLower = `effect_${id}`;
        let enabled = config.defaultEnabled !== undefined ? config.defaultEnabled : true;
        
        if (typeof UserConfig !== 'undefined') {
            // Try different key formats
            if (UserConfig[configKey] !== undefined) {
                enabled = UserConfig[configKey];
            } else if (UserConfig[configKeyLower] !== undefined) {
                enabled = UserConfig[configKeyLower];
            }
        }
        
        effects[id] = {
            instance: effectInstance,
            enabled: enabled,
            config: {
                name: config.name || id,
                description: config.description || "",
                defaultEnabled: config.defaultEnabled !== undefined ? config.defaultEnabled : true
            }
        };
        
        effectsList.push(id);
        console.log(`Effect registered: ${id}`);
        return true;
    }
    
    /**
     * Unregister an effect
     * @param {string} id - Effect ID to unregister
     */
    function Unregister(id) {
        if (!effects[id]) return false;
        
        // Cleanup if method exists
        if (typeof effects[id].instance.Cleanup === 'function') {
            try {
                effects[id].instance.Cleanup();
            } catch (e) {
                console.log(`Error cleaning up effect ${id}: ${e}`);
            }
        }
        
        delete effects[id];
        const index = effectsList.indexOf(id);
        if (index > -1) effectsList.splice(index, 1);
        
        console.log(`Effect unregistered: ${id}`);
        return true;
    }
    
    /**
     * Enable or disable an effect
     * @param {string} id - Effect ID
     * @param {boolean} enabled - Enable state
     */
    function SetEnabled(id, enabled) {
        if (!effects[id]) return false;
        
        effects[id].enabled = enabled;
        
        // Update UserConfig if available
        if (typeof UserConfig !== 'undefined') {
            const configKey = `Effect_${id}`;
            UserConfig[configKey] = enabled;
            
            // Save to config file
            if (typeof CfgMan !== 'undefined' && CfgMan) {
                const configKeyLower = configKey.toLowerCase();
                CfgMan.PropertySet("main.cfg", configKeyLower, enabled.toString());
            }
        }
        
        return true;
    }
    
    /**
     * Get enabled state of an effect
     * @param {string} id - Effect ID
     * @returns {boolean} Enabled state
     */
    function IsEnabled(id) {
        return effects[id] ? effects[id].enabled : false;
    }
    
    /**
     * Render all enabled effects
     * Called from BgHandler() every frame
     */
    function Render() {
        for (let i = 0; i < effectsList.length; i++) {
            const id = effectsList[i];
            const effect = effects[id];
            
            if (effect && effect.enabled && effect.instance) {
                try {
                    effect.instance.Render();
                } catch (e) {
                    console.log(`Error rendering effect ${id}: ${e}`);
                    // Disable effect on error to prevent repeated errors
                    effect.enabled = false;
                }
            }
        }
    }
    
    /**
     * Update colors for all effects
     * @param {object} color - Color object with R, G, B properties
     */
    function SetColor(color) {
        for (let i = 0; i < effectsList.length; i++) {
            const id = effectsList[i];
            const effect = effects[id];
            
            if (effect && effect.instance && typeof effect.instance.SetColor === 'function') {
                try {
                    effect.instance.SetColor(color);
                } catch (e) {
                    console.log(`Error setting color for effect ${id}: ${e}`);
                }
            }
        }
    }
    
    /**
     * Get all registered effects
     * @returns {array} Array of effect objects with id, name, description, enabled
     */
    function GetAll() {
        const result = [];
        for (let i = 0; i < effectsList.length; i++) {
            const id = effectsList[i];
            const effect = effects[id];
            if (effect) {
                result.push({
                    id: id,
                    name: effect.config.name,
                    description: effect.config.description,
                    enabled: effect.enabled
                });
            }
        }
        return result;
    }
    
    /**
     * Get effect by ID
     * @param {string} id - Effect ID
     * @returns {object|null} Effect object or null
     */
    function Get(id) {
        return effects[id] ? effects[id] : null;
    }
    
    return {
        Register,
        Unregister,
        SetEnabled,
        IsEnabled,
        Render,
        SetColor,
        GetAll,
        Get
    };
})();

// Make EffectsManager globally available
globalThis.EffectsManager = EffectsManager;

console.log("INIT LIB: EFFECTS MANAGER COMPLETE");

