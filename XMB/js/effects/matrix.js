//////////////////////////////////////////////////////////////////////////
///*				   			MATRIX EFFECT						  *///
/// 				   		  										   ///
///			Matrix rain effect - Optimized for PS2 (32MB RAM)		   ///
///			Elegant and efficient implementation.					   ///
/// 				   		  										   ///
//////////////////////////////////////////////////////////////////////////

/**
 * Matrix Rain Effect
 * 
 * Creates the classic Matrix-style character rain effect.
 * Optimized for PS2 with minimal memory usage and efficient rendering.
 */

const MatrixEffect = (() => {
    // Configuration - Highly optimized for PS2 performance
    const COLUMN_COUNT = 20; // Further reduced columns for maximum performance
    const CHAR_COUNT = 15;   // Reduced characters per column (less memory, faster)
    const CHAR_SPACING = 22; // Vertical spacing between characters
    const COLUMN_SPACING = 28; // Horizontal spacing between columns (wider = fewer columns, better performance)
    const SPEED_MIN = 1.5;   // Faster minimum speed (less objects on screen = better performance)
    const SPEED_MAX = 3.5;   // Faster maximum speed
    const UPDATE_FREQ = 4;   // Update logic every 4 frames (less frequent = better performance)
    const RENDER_FREQ = 1;   // Render every frame (visual smoothness)
    
    // Character set - Reduced set for better performance (Katakana + numbers)
    const CHARS = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789";
    const CHARS_LENGTH = CHARS.length;
    
    // Precomputed character array for faster access
    const CHARS_ARRAY = [];
    for (let i = 0; i < CHARS_LENGTH; i++) {
        CHARS_ARRAY.push(CHARS[i]);
    }
    
    // State variables
    let screenWidth = ScrCanvas.width;
    let screenHeight = ScrCanvas.height;
    let frame = 0;
    let time = 0; // For subtle brightness variation
    
    // Column data - Reused arrays for efficiency
    const columns = [];
    
    // Brightness variation for elegant Matrix effect (precomputed)
    const brightnessVariation = [];
    for (let i = 0; i < 20; i++) {
        brightnessVariation.push(0.85 + (Math.random() * 0.3)); // 0.85 to 1.15 multiplier
    }
    
    // Colors - Precomputed color objects (reused, not recreated)
    const headColor = Color.new(255, 255, 255, 255);
    const bodyColors = []; // Precomputed body colors with different alphas
    const trailColors = []; // Precomputed trail colors
    const fadeColors = []; // Precomputed fade colors
    
    // Glow colors for elegant Matrix effect (precomputed)
    const glowColors = [];
    
    // Precompute color arrays for performance with enhanced visual effects
    function precomputeColors() {
        bodyColors.length = 0;
        trailColors.length = 0;
        fadeColors.length = 0;
        glowColors.length = 0;
        
        // Body colors (bright green with smooth fade) - Enhanced for elegance
        for (let i = 0; i < 4; i++) {
            const fade = 1.0 - (i * 0.18); // Smoother fade
            const alpha = Math.floor(220 * fade); // Slightly brighter
            bodyColors.push(Color.new(0, 255, 0, alpha));
            // Glow version for head characters
            glowColors.push(Color.new(0, 255, 100, Math.floor(alpha * 0.3))); // Cyan-green glow
        }
        
        // Trail colors (medium green, elegant fade)
        for (let i = 0; i < 5; i++) {
            const fade = 1.0 - (i * 0.14); // Smoother fade
            trailColors.push(Color.new(0, 220, 0, Math.floor(140 * fade))); // Slightly brighter
        }
        
        // Fade colors (dim green, ultra smooth fade)
        for (let i = 0; i < 8; i++) {
            const fade = Math.max(0.08, 1.0 - (i * 0.11)); // Ultra smooth fade
            fadeColors.push(Color.new(0, 160, 0, Math.floor(70 * fade))); // Slightly brighter
        }
    }
    
    // Precomputed values
    let columnWidth = 0;
    let charHeight = 0;
    
    /**
     * Initialize a column (optimized)
     */
    function initColumn(index) {
        const x = index * COLUMN_SPACING;
        const speedRange = SPEED_MAX - SPEED_MIN;
        const speed = SPEED_MIN + (Math.random() * speedRange);
        const startY = -(Math.random() * screenHeight * 2) | 0; // Start off-screen, bitwise floor
        
        return {
            x: x,
            y: startY,
            speed: speed,
            chars: [], // Will be populated with character indices
            headIndex: 0
        };
    }
    
    /**
     * Generate characters for a column (optimized)
     */
    function generateColumnChars() {
        const chars = [];
        // Use bitwise operations for faster random
        for (let i = 0; i < CHAR_COUNT; i++) {
            chars.push((Math.random() * CHARS_LENGTH) | 0); // Bitwise OR for faster floor
        }
        return chars;
    }
    
    /**
     * REQUIRED: Initialize the effect
     */
    function Init() {
        screenWidth = ScrCanvas.width;
        screenHeight = ScrCanvas.height;
        frame = 0;
        time = 0;
        
        // Precompute colors
        precomputeColors();
        
        // Calculate column width and character height
        columnWidth = COLUMN_SPACING;
        charHeight = CHAR_SPACING;
        
        // Initialize columns - optimized calculation
        const maxColumns = (screenWidth / COLUMN_SPACING) | 0; // Bitwise floor
        const actualColumnCount = COLUMN_COUNT < maxColumns ? COLUMN_COUNT : maxColumns;
        
        // Pre-allocate array size
        columns.length = 0;
        
        for (let i = 0; i < actualColumnCount; i++) {
            const col = initColumn(i);
            col.chars = generateColumnChars();
            col.headIndex = (Math.random() * CHAR_COUNT) | 0;
            col.brightness = brightnessVariation[i % brightnessVariation.length]; // Assign brightness variation
            columns.push(col);
        }
        
        console.log(`Matrix Effect initialized with ${columns.length} columns (ultra-optimized with elegant effects)`);
    }
    
    /**
     * REQUIRED: Render the effect
     * Highly optimized for PS2 - updates less frequently, renders efficiently
     */
    function Render() {
        // Update screen dimensions if changed (rare check)
        if (ScrCanvas.width !== screenWidth || ScrCanvas.height !== screenHeight) {
            screenWidth = ScrCanvas.width;
            screenHeight = ScrCanvas.height;
        }
        
        // Update logic less frequently (every UPDATE_FREQ frames)
        const shouldUpdate = (frame % UPDATE_FREQ === 0);
        
        if (shouldUpdate) {
            // Update column positions - optimized loop
            const resetY = -charHeight * CHAR_COUNT;
            const maxY = screenHeight + (CHAR_COUNT * charHeight);
            const speedRange = SPEED_MAX - SPEED_MIN;
            
            for (let i = 0, len = columns.length; i < len; i++) {
                const col = columns[i];
                col.y += col.speed;
                
                // Reset column when it goes off-screen
                if (col.y > maxY) {
                    col.y = resetY;
                    col.chars = generateColumnChars(); // New random characters
                    col.headIndex = (Math.random() * CHAR_COUNT) | 0;
                    col.speed = SPEED_MIN + (Math.random() * speedRange);
                }
                
                // Update head position (trail effect) - use bitwise for modulo
                col.headIndex = (col.headIndex + 1) % CHAR_COUNT;
            }
        }
        
        // Render only if it's a render frame (can skip some frames if needed)
        if (frame % RENDER_FREQ === 0) {
            // Use font rendering if available (more elegant)
            if (typeof FontObj !== 'undefined' && FontObj.Font) {
                renderWithFont();
            } else {
                // Fallback: Use simple rectangles (more efficient)
                renderWithRects();
            }
        }
        
        frame++;
        time++;
        if (frame > 6000) frame = 0; // Reset to prevent overflow
        if (time > 10000) time = 0; // Reset time for brightness variation
    }
    
    /**
     * Render using font (ultra-optimized with elegant visual effects)
     */
    function renderWithFont() {
        const originalScale = FontObj.Font.scale;
        const originalAlign = FontObj.Font.align;
        const originalDropshadow = FontObj.Font.dropshadow;
        FontObj.Font.scale = 0.50; // Slightly larger for better visibility
        FontObj.Font.align = Font.ALIGN_LEFT;
        FontObj.Font.dropshadow = 1.2; // Enable dropshadow for elegant glow effect
        
        const maxY = screenHeight;
        const minY = -charHeight;
        
        // Optimized rendering loop with elegant effects
        for (let i = 0, colLen = columns.length; i < colLen; i++) {
            const col = columns[i];
            let currentY = col.y;
            const charsLen = col.chars.length;
            
            // Early exit if column is completely off-screen
            if (currentY > maxY) continue;
            if (currentY < minY - (charsLen * charHeight)) continue;
            
            for (let j = 0; j < charsLen; j++) {
                if (currentY > maxY) break; // Skip if off-screen bottom
                if (currentY < minY) { // Skip if above screen
                    currentY += charHeight;
                    continue;
                }
                
                // Calculate character index using bitwise modulo
                const charIdx = (col.headIndex + j) % charsLen;
                const char = CHARS_ARRAY[col.chars[charIdx]]; // Use precomputed array
                
                // Use precomputed colors with elegant visual enhancements
                let color, glowColor;
                const brightness = col.brightness || 1.0; // Column brightness variation
                
                if (j === 0) {
                    // Head character - bright white with cyan-green glow
                    // Add subtle brightness variation for elegant effect (optimized calculation)
                    const pulse = ((time + i) % 40) / 40.0; // Simple pulse without expensive sin
                    const brightMult = brightness * (0.95 + (pulse * 0.1)); // Subtle pulse
                    color = Color.new(
                        Math.min(255, (headColor.R * brightMult) | 0),
                        Math.min(255, (headColor.G * brightMult) | 0),
                        Math.min(255, (headColor.B * brightMult) | 0),
                        headColor.A
                    );
                    glowColor = Color.new(0, 255, 150, 80); // Elegant cyan-green glow
                } else if (j <= 3) {
                    // Body - bright green with subtle glow and brightness variation
                    const baseColor = bodyColors[j - 1] || bodyColors[0];
                    color = Color.new(
                        baseColor.R,
                        Math.min(255, (baseColor.G * brightness) | 0),
                        baseColor.B,
                        baseColor.A
                    );
                    glowColor = glowColors[j - 1] || glowColors[0];
                } else if (j <= 8) {
                    // Trail - medium green, no glow for performance
                    const baseColor = trailColors[j - 4] || trailColors[0];
                    color = Color.new(
                        baseColor.R,
                        Math.min(255, (baseColor.G * brightness) | 0),
                        baseColor.B,
                        baseColor.A
                    );
                    glowColor = null; // No glow for trail (performance)
                } else {
                    // Fade - dim green, no glow
                    const fadeIdx = j - 9;
                    const baseColor = fadeColors[fadeIdx] || fadeColors[fadeColors.length - 1];
                    color = Color.new(
                        baseColor.R,
                        Math.min(255, (baseColor.G * brightness) | 0),
                        baseColor.B,
                        baseColor.A
                    );
                    glowColor = null;
                }
                
                // Render glow effect for head and body (elegant Matrix look)
                if (glowColor && j <= 3) {
                    // Subtle glow effect - render character slightly larger and dimmer behind
                    FontObj.Font.dropshadow_color = glowColor;
                    FontObj.Font.color = Color.setA(color, Math.floor(color.A * 0.4));
                    FontObj.Font.scale = 0.52; // Slightly larger for glow
                    FontObj.Font.print(col.x, currentY, char);
                    FontObj.Font.scale = 0.50; // Reset scale
                }
                
                // Render main character with elegant shadow
                FontObj.Font.dropshadow_color = Color.new(0, 0, 0, Math.floor(color.A * 0.25)); // Subtle shadow
                FontObj.Font.color = color;
                FontObj.Font.print(col.x, currentY, char);
                
                currentY += charHeight;
            }
        }
        
        FontObj.Font.scale = originalScale;
        FontObj.Font.align = originalAlign;
        FontObj.Font.dropshadow = originalDropshadow;
    }
    
    /**
     * Render using rectangles (fallback, optimized with precomputed colors)
     */
    function renderWithRects() {
        const maxY = screenHeight;
        const minY = -charHeight;
        const rectW = columnWidth - 2;
        const rectH = charHeight - 2;
        
        for (let i = 0, colLen = columns.length; i < colLen; i++) {
            const col = columns[i];
            let currentY = col.y;
            const charsLen = col.chars.length;
            
            // Early exit if column is completely off-screen
            if (currentY > maxY) continue;
            if (currentY < minY - (charsLen * charHeight)) continue;
            
            for (let j = 0; j < charsLen; j++) {
                if (currentY > maxY) break;
                if (currentY < minY) {
                    currentY += charHeight;
                    continue;
                }
                
                // Use precomputed colors
                let color;
                if (j === 0) {
                    color = headColor;
                } else if (j <= 3) {
                    color = bodyColors[j - 1] || bodyColors[0];
                } else if (j <= 8) {
                    color = trailColors[j - 4] || trailColors[0];
                } else {
                    const fadeIdx = j - 9;
                    color = fadeColors[fadeIdx] || fadeColors[fadeColors.length - 1];
                }
                
                // Draw rectangle
                Draw.rect(col.x, currentY, rectW, rectH, color);
                
                currentY += charHeight;
            }
        }
    }
    
    /**
     * REQUIRED: Update effect colors based on theme
     * Enhanced with elegant color gradients and glow effects
     * @param {object} color - Color object with R, G, B properties
     */
    function SetColor(color) {
        // Matrix effect uses green tones, but we can adapt to theme
        // Enhanced colors for more vibrant and elegant Matrix look
        const r = color.R < 50 ? color.R : 50;  // Keep red low for green effect
        const g = color.G + 110; // Slightly more green boost
        const gClamped = g > 255 ? 255 : g; // Clamp green
        const b = color.B < 50 ? color.B : 50;  // Keep blue low
        
        // Recompute color arrays with theme influence and elegant gradients
        bodyColors.length = 0;
        trailColors.length = 0;
        fadeColors.length = 0;
        glowColors.length = 0;
        
        // Body colors - Enhanced with smoother gradients
        for (let i = 0; i < 4; i++) {
            const fade = 1.0 - (i * 0.18); // Smoother fade curve
            const alpha = (220 * fade) | 0; // Slightly brighter
            bodyColors.push(Color.new(r, gClamped, b, alpha));
            // Elegant cyan-green glow for Matrix effect
            const glowG = (gClamped * 0.4) | 0;
            const glowB = 100 + (gClamped * 0.2) | 0;
            glowColors.push(Color.new(0, glowG, glowB > 255 ? 255 : glowB, (alpha * 0.3) | 0));
        }
        
        // Trail colors - Enhanced brightness
        for (let i = 0; i < 5; i++) {
            const fade = 1.0 - (i * 0.14); // Smoother fade
            trailColors.push(Color.new(r, (gClamped * 0.85) | 0, b, (140 * fade) | 0));
        }
        
        // Fade colors - Ultra smooth fade
        for (let i = 0; i < 8; i++) {
            const fade = (1.0 - (i * 0.11)) > 0.08 ? (1.0 - (i * 0.11)) : 0.08;
            fadeColors.push(Color.new(r, (gClamped * 0.65) | 0, b, (70 * fade) | 0));
        }
    }
    
    /**
     * OPTIONAL: Clean up resources
     */
    function Cleanup() {
        columns.length = 0;
    }
    
    return {
        Init,
        Render,
        SetColor,
        Cleanup
    };
})();

// Register with EffectsManager
if (typeof EffectsManager !== 'undefined') {
    // Get default enabled state
    const defaultEnabled = (typeof UserConfig !== 'undefined' && UserConfig.Effect_matrix !== undefined) 
        ? UserConfig.Effect_matrix 
        : false; // Disabled by default (can be enabled in settings)
    
    EffectsManager.Register('matrix', MatrixEffect, {
        name: 'Matrix',
        description: 'Matrix-style character rain effect',
        defaultEnabled: defaultEnabled
    });
} else {
    console.log("EffectsManager not available. Matrix effect not registered.");
}

console.log("INIT LIB: MATRIX EFFECT COMPLETE");

