# Effects System - OSDXMB

Sistema modular de efectos visuales para OSDXMB. Permite crear y gestionar efectos personalizados de forma eficiente para PS2 (32MB RAM).

## Estructura

```
XMB/js/effects/
├── manager.js      # Gestor principal de efectos
├── wave.js         # Efecto de ondas (ejemplo)
├── template.js     # Plantilla para crear nuevos efectos
└── README.md       # Esta documentación
```

## Cómo Crear un Efecto Personalizado

### 1. Copiar la Plantilla

```bash
cp XMB/js/effects/template.js XMB/js/effects/miefecto.js
```

### 2. Implementar la Interfaz Estándar

Todos los efectos deben implementar estos métodos:

- **Init()** - Inicialización (llamado una vez)
- **Render()** - Renderizado (llamado cada frame si está habilitado)
- **SetColor(color)** - Actualizar colores según el tema
- **Cleanup()** - Limpieza de recursos (opcional)

### 3. Registrar el Efecto

Al final del archivo, registra tu efecto:

```javascript
if (typeof EffectsManager !== 'undefined') {
    EffectsManager.Register('miefecto', MiEfecto, {
        name: 'Mi Efecto',
        description: 'Descripción de mi efecto',
        defaultEnabled: false
    });
}
```

### 4. Cargar el Efecto

Agrega tu efecto a `main.js` en la lista de scripts (después de `effects/manager`):

```javascript
const jsList = [
    // ... otros scripts ...
    `effects/manager`,
    `effects/wave`,
    `effects/miefecto`,  // Tu nuevo efecto
    // ... más scripts ...
];
```

## Optimización para PS2 (32MB RAM)

### ✅ Buenas Prácticas

- **Reutilizar objetos**: No crear nuevos objetos en `Render()`
- **Precomputar valores**: Calcular valores una vez en `Init()`
- **Limitar partículas**: Usar arrays pequeños y eficientes
- **Evitar allocaciones**: Reutilizar arrays/objetos existentes
- **Optimizar loops**: Usar `step` para reducir iteraciones

### ❌ Evitar

- Crear nuevos objetos en cada frame
- Arrays muy grandes (>1000 elementos)
- Cálculos complejos en cada frame
- Múltiples efectos pesados simultáneos

## Ejemplo de Efecto Simple

```javascript
const SimpleEffect = (() => {
    let time = 0;
    let currentColor = Color.new(128, 128, 128, 64);
    
    function Init() {
        console.log("SimpleEffect initialized");
    }
    
    function Render() {
        const y = ScrCanvas.height / 2 + Math.sinf(time * 0.01) * 50;
        Draw.rect(0, y, ScrCanvas.width, 10, currentColor);
        time++;
        if (time > 6284) time = 0;
    }
    
    function SetColor(color) {
        currentColor = Color.new(
            Math.min(color.R + 20, 255),
            Math.min(color.G + 20, 255),
            Math.min(color.B + 20, 255),
            64
        );
    }
    
    function Cleanup() {
        // Limpiar recursos si es necesario
    }
    
    return { Init, Render, SetColor, Cleanup };
})();

// Registrar
if (typeof EffectsManager !== 'undefined') {
    EffectsManager.Register('simple', SimpleEffect, {
        name: 'Simple Effect',
        description: 'Un efecto simple de ejemplo',
        defaultEnabled: false
    });
}
```

## API del EffectsManager

### Registrar un Efecto

```javascript
EffectsManager.Register(id, effectInstance, config)
```

- `id`: Identificador único (string)
- `effectInstance`: Instancia del efecto con métodos Init, Render, SetColor
- `config`: Objeto con `name`, `description`, `defaultEnabled`

### Habilitar/Deshabilitar

```javascript
EffectsManager.SetEnabled('waves', true);  // Habilitar
EffectsManager.SetEnabled('waves', false); // Deshabilitar
```

### Verificar Estado

```javascript
const enabled = EffectsManager.IsEnabled('waves');
```

### Obtener Todos los Efectos

```javascript
const effects = EffectsManager.GetAll();
// Retorna: [{ id, name, description, enabled }, ...]
```

## Compatibilidad

El sistema mantiene compatibilidad hacia atrás con `UserConfig.Waves`. Los efectos existentes seguirán funcionando.

## Notas Técnicas

- Los efectos se renderizan en el orden de registro
- Si un efecto falla, se deshabilita automáticamente
- Los colores se actualizan cuando cambia el tema
- El sistema gestiona automáticamente la memoria

