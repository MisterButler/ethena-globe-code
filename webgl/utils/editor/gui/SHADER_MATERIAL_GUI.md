# Automatic Shader Material GUI System

This system automatically generates GUI controls for shader material uniforms, eliminating the need to manually create binding classes for each shader material.

## Features

✅ **Automatic uniform detection** - Analyzes `material.uniforms` and creates appropriate controls  
✅ **Type-smart controls** - Different GUI controls based on uniform types (number, Vector3, Color, etc.)  
✅ **Intelligent range inference** - Predictable ranges with smart defaults for common patterns  
✅ **Organized folder structure** - Separates Three.js properties from custom shader uniforms  
✅ **Click-to-inspect workflow** - Works seamlessly with material modifier systems  
✅ **Multiple API levels** - Simple functions to advanced class-based controllers  
✅ **Proper cleanup** - Automatically disposes resources when done

## Usage Examples

### 1. Simple Function (Recommended for most cases)

```typescript
/* #if DEBUG */
const disposer = createShaderMaterialGUI(gui, material, 'My Shader')
// When done: disposer();
/* #endif */
```

### 2. Advanced Configuration

```typescript
/* #if DEBUG */
const disposer = createAdvancedShaderMaterialGUI(gui, material, {
  title: 'My Advanced Shader',
  uniforms: {
    shadowOpacity: {
      min: 0,
      max: 1,
      label: 'Shadow Opacity',
      folder: 'Lighting',
    },
    edgeThreshold: { min: 0, max: 0.05, step: 0.001, folder: 'Shape' },
    color: { type: 'color', folder: 'Appearance' },
  },
  customBindings: (gui, material) => {
    gui.addBinding({ reload: () => (material.needsUpdate = true) }, 'reload')
  },
})
/* #endif */
```

### 3. Class-based Controller

```typescript
/* #if DEBUG */
export class MyShaderGUI extends ShaderMaterialGUIController {
  constructor(gui: GUIType, material: ShaderMaterial) {
    super(gui, material, 'My Shader')
    // Uniforms are automatically bound!
    // Add custom controls if needed
  }
}
/* #endif */
```

## Automatic Type Detection

The system automatically detects uniform types and creates appropriate controls:

| Uniform Type | GUI Control                  | Notes                                    |
| ------------ | ---------------------------- | ---------------------------------------- |
| `number`     | Slider                       | Range inferred from uniform name         |
| `boolean`    | Checkbox                     | Simple on/off toggle                     |
| `Vector2`    | X/Y inputs                   | Grouped in folder                        |
| `Vector3`    | X/Y/Z inputs or Color picker | Color picker if name contains "color"    |
| `Vector4`    | X/Y/Z/W inputs               | Grouped in folder                        |
| `Color`      | Color picker                 | Three.js Color object                    |
| `Texture`    | Read-only info               | Shows texture name                       |
| `Matrix3/4`  | Read-only                    | Matrices are typically not user-editable |

## Smart Range Inference

The system uses uniform names to infer appropriate ranges with predictable defaults:

| Name Pattern        | Range               | Examples                          |
| ------------------- | ------------------- | --------------------------------- |
| `*threshold*`       | 0 to 1 (fine steps) | `edgeThreshold`, `noiseThreshold` |
| `*scale*`, `*size*` | 0 to 10             | `pointScale`, `particleSize`      |
| `*distance*`        | 0 to 100            | `maxDistance`, `fadeDistance`     |
| **Default**         | 0 to 1              | Most numeric uniforms             |
| **Large values**    | 0 to value×2        | When current value > 1            |

## Organized Folder Structure

When using the integrated material GUI (click-to-inspect workflow), uniforms are organized into:

- **Properties** folder - Standard Three.js material properties (opacity, blending, etc.)
- **Uniforms** folder - Your custom shader uniforms with automatic controls

## Integration with Click-to-Inspect Workflow

The system works seamlessly with material modifier workflows:

1. Material modifiers run `onBeforeCompile` and add uniforms
2. You click on a mesh to inspect it
3. GUI automatically detects and binds all existing uniforms
4. No manual setup or infinite recursion issues

## Performance Notes

- GUI controls are only created in DEBUG builds (`/* #if DEBUG */`)
- Uniform binding happens once at GUI creation time (no continuous polling)
- Disposers properly clean up event listeners and GUI elements
- Works with your existing click-to-inspect workflow without performance overhead
- No impact on production builds when DEBUG conditionals are stripped

## Migration from Manual Classes

**Before:**

```typescript
export class GUISphereParticleMaterial extends GUIController {
  constructor(gui: GUIType, target: ShaderMaterial) {
    super(gui)
    this.gui = this.addFolder(gui, { title: 'SphereParticleMaterial' })

    this.gui.addBinding(target.uniforms.shadowOpacity, 'value', {
      min: 0,
      max: 1,
      label: 'Shadow Opacity',
    })
    this.gui.addBinding(target.uniforms.edgeThreshold, 'value', {
      min: 0,
      max: 0.05,
      label: 'Edge Threshold',
    })
    // ... more uniforms
  }
}
```

**After:**

```typescript
export class GUISphereParticleMaterial extends ShaderMaterialGUIController {
  constructor(gui: GUIType, target: ShaderMaterial) {
    super(gui, target, 'SphereParticleMaterial')
    // That's it! All uniforms automatically bound with smart ranges
  }
}
```

The new system reduces boilerplate by ~80% while providing better range inference and automatic updates!
