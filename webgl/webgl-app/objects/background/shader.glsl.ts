import GUIController from '@/webgl/utils/editor/gui/gui'
import { GUIType } from '@/webgl/utils/editor/gui/gui-types'
import { mapLinear } from '@/webgl/utils/shaders/math.glsl'
import { Color, ShaderMaterial, Vector2 } from 'three'
import { Colors } from '../../types/types-webgl'

const shader = {
  uniforms: {
    time: { value: 0.0 },
    imageSize: { value: new Vector2() },
    imageScale: { value: 3 },
    resolution: { value: new Vector2() },
    pixelRatio: { value: 1.0 },
    heightMap: { value: null },
    linesMap: { value: null },
    asciiTexture: { value: null },
    showGrid: { value: false },
    showHeightMap: { value: false },
    gridSize: { value: new Vector2(7, 1) }, // matches asciiGenerator grid
    charCount: { value: 6.0 }, // 7 characters total
    cellSize: { value: new Vector2(25, 25) }, // should match generator.cellSize
    backgroundColor: { value: new Color(Colors.Background) },
    brightnessColorMin: { value: new Color(0x0c1527) },
    brightnessColorMax: { value: new Color(0x1a253d) },
    wipeProgress: { value: -0.05 }, // 0.0 = fully covered, 1.0 = fully revealed
    wipeEnabled: { value: true },
    wipeEdgeSharpness: { value: 0.1 }, // Controls the softness of the wipe edge
    // ASCII Animation controls
    animationSpeed: { value: 0.5 }, // Speed of character changes
    animationIntensity: { value: 0.8 }, // How much characters can change
    flickerSpeed: { value: 1.0 }, // Speed of subtle flickering
    flickerIntensity: { value: 0.1 }, // Intensity of flickering
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,

  fragmentShader: /* glsl */ `
    uniform sampler2D heightMap;
    uniform sampler2D linesMap;
    uniform sampler2D asciiTexture;
    uniform vec2 cellSize;
    uniform vec2 gridSize;      // ASCII atlas grid layout
    uniform vec2 resolution;
    uniform vec2 imageSize;
    uniform float imageScale;
    uniform float pixelRatio;
    uniform bool useAbsoluteCoords;
    uniform vec2 gridOffset;
    uniform float time;
    uniform float charCount;
    uniform bool showGrid;     
    uniform bool showHeightMap;   
    uniform bool wipeEnabled;
    uniform float wipeProgress;
    uniform float wipeEdgeSharpness;
    uniform vec3 backgroundColor;   
    uniform vec3 brightnessColorMin;   
    uniform vec3 brightnessColorMax;
    uniform float animationSpeed;
    uniform float animationIntensity;
    uniform float flickerSpeed;
    uniform float flickerIntensity;   
    varying vec2 vUv;

    #include <common>
    ${mapLinear}


    float getTransitionValue(float value, float linePhase) {
      // Use a continuous sine wave for opacity to avoid flashing at wrap
      float phase = linePhase + mod(value + (time * 0.25), 1.0);
      float opacity = 0.5 + 0.5 * sin(phase * 2.0 * 3.14159265);
      // Optionally clamp to [0,1] for safety
      opacity = clamp(opacity, 0.0, 1.0);
      return 1.0 - opacity;
    }

    float calculateWipeMask(vec2 coords) {
      if (!wipeEnabled) return 1.0;
      
      // Normalize coordinates to [0,1] based on screen resolution
      vec2 normalizedCoords = coords / resolution;
      
      // Create diagonal ramp from top-right to bottom-left (135 degrees)
      // Top-right corner (1,1) should be revealed first (distance = 0)
      // Bottom-left corner (0,0) should be revealed last (distance = max)
      // The diagonal line goes from (1,1) to (0,0), so the perpendicular distance
      // from this line determines the reveal order
      
      // For a 135-degree diagonal (top-right to bottom-left):
      // Project the point onto the diagonal direction
      float diagonal = normalizedCoords.x + normalizedCoords.y;
      
      // Invert so top-right (diagonal = 2) becomes 0, bottom-left (diagonal = 0) becomes 1
      diagonal = 1.0 - (diagonal * 0.5);
      
      // Apply wipe progress - when progress is 0, everything is hidden
      // when progress is 1, everything is revealed
      float wipeThreshold = wipeProgress;
      
      // Create smooth edge with controllable sharpness
      float wipeMask = 1.0 - smoothstep(wipeThreshold - wipeEdgeSharpness, wipeThreshold + wipeEdgeSharpness, diagonal);
      
      return wipeMask;
    }


    vec3 sampleASCII(vec2 coords) {

      // Screen-space grid coordinates - scale cellSize by pixel ratio to maintain consistent visual size
      vec2 adjustedCellSize = cellSize * pixelRatio;
      vec2 gridPos = gl_FragCoord.xy / adjustedCellSize;
      vec2 cellId = floor(gridPos);
      vec2 cellUV = fract(gridPos);

      // Instead of sampling quantized texture:
      vec2 heightmapUV = (cellId + 0.5) * adjustedCellSize / (imageSize * imageScale);

      // Instead of sampling quantized texture:
      vec4 linesData = texture2D(linesMap, heightmapUV);
      float lineAnimation = getTransitionValue(linesData.r, linesData.g) * linesData.a;

      float height = texture2D(heightMap, heightmapUV).r; 
  
      // Add time-based animation to character selection
      vec2 worldPos = cellId * 0.01; // Scale down for smoother variation
      float timeOffset = sin(worldPos.x * 2.0 + time * animationSpeed) * cos(worldPos.y * 1.5 + time * animationSpeed * 0.6);
      float animatedHeight = height + timeOffset * animationIntensity;
      
      // Add subtle random flickering
      float flicker = sin(time * flickerSpeed + worldPos.x * 10.0 + worldPos.y * 7.0) * flickerIntensity;
      animatedHeight += flicker;
      
      // Clamp to valid range before character selection
      animatedHeight = clamp(animatedHeight, 0.0, 1.0);
      
      float charIndex = ceil(animatedHeight * charCount);
      charIndex = clamp(charIndex, 0.0, charCount - 1.0);

      // Atlas index (assuming 7x1 layout)
      float charRow = 0.0;
      float charCol = charIndex;

      vec2 selectedChar = vec2(charCol, charRow);
      vec2 textureUV = (selectedChar + cellUV) / gridSize;
      textureUV.y = 1.0 - textureUV.y;

      vec4 asciiSample = texture2D(asciiTexture, textureUV);
      float asciiMask = asciiSample.r;

      float brightness =  mix(1.5, 40.0, lineAnimation);

      vec3 outgoingColor = mix(backgroundColor, mix(brightnessColorMin, brightnessColorMax * brightness, height), asciiMask);

      return outgoingColor;
      // return vec3(randomBrightness);
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / resolution;
      vec3 color = sampleASCII(uv);

      // Calculate wipe mask
      float wipeMask = calculateWipeMask(gl_FragCoord.xy);

      // Overlay heightmap as transparent color
      if(showHeightMap) {
        vec2 adjustedCellSize = cellSize * pixelRatio;
        float height = texture2D(heightMap, (floor(gl_FragCoord.xy / adjustedCellSize) + 0.5) * adjustedCellSize / imageSize).r;
        vec3 heightColor = vec3(1.0, 0.0, 0.0); // red overlay
        float overlayAlpha = 0.3;
        color = mix(color, heightColor * height, overlayAlpha);
      }
   
      // Overlay grid if enabled
      if (showGrid) {
        vec2 adjustedCellSize = cellSize * pixelRatio;
        vec2 gridPos = gl_FragCoord.xy / adjustedCellSize;
        vec2 cellUV = fract(gridPos);

        float lineWidth = 1.0; // pixels
        vec2 edgeDist = min(cellUV, 1.0 - cellUV);
        float gridMask = step(min(lineWidth / adjustedCellSize.x, lineWidth / adjustedCellSize.y), min(edgeDist.x, edgeDist.y));
        
        vec3 gridColor = vec3(0.05);
        color = mix(color, gridColor, 1.0 - gridMask);
      }

      // Apply wipe transition - blend with background color based on wipe mask
      color = mix(backgroundColor, color, wipeMask);

      gl_FragColor = vec4(color, 1.0);
    }
    `,
}

export default shader

/* #if DEBUG */
export class GUIBackgroundShader extends GUIController {
  constructor(gui: GUIType, target: ShaderMaterial) {
    super(gui)

    this.gui = this.addFolder(gui, { title: 'Background Shader' })

    this.gui.addBinding(target.uniforms.showGrid, 'value', {
      label: 'showGrid',
    })
    this.gui.addBinding(target.uniforms.showHeightMap, 'value', {
      label: 'showHeightMap',
    })
    this.gui.addBinding(target.uniforms.imageScale, 'value', {
      label: 'imageScale',
      min: 0,
      max: 10,
    })

    // Wipe transition controls
    this.gui.addBinding(target.uniforms.wipeEnabled, 'value', {
      label: 'wipeEnabled',
    })
    this.gui.addBinding(target.uniforms.wipeProgress, 'value', {
      label: 'wipeProgress',
      min: 0,
      max: 1,
      step: 0.01,
    })
    this.gui.addBinding(target.uniforms.wipeEdgeSharpness, 'value', {
      label: 'wipeEdgeSharpness',
      min: 0.001,
      max: 0.1,
      step: 0.001,
    })

    // ASCII Animation controls
    this.gui.addBinding(target.uniforms.animationSpeed, 'value', {
      label: 'animationSpeed',
      min: 0,
      max: 2,
      step: 0.1,
    })
    this.gui.addBinding(target.uniforms.animationIntensity, 'value', {
      label: 'animationIntensity',
      min: 0,
      max: 0.5,
      step: 0.01,
    })
    this.gui.addBinding(target.uniforms.flickerSpeed, 'value', {
      label: 'flickerSpeed',
      min: 0,
      max: 20,
      step: 0.5,
    })
    this.gui.addBinding(target.uniforms.flickerIntensity, 'value', {
      label: 'flickerIntensity',
      min: 0,
      max: 0.2,
      step: 0.005,
    })

    this.api = {
      backgroundColor: `#${target.uniforms.backgroundColor.value.getHexString()}`,
      brightnessColorMin: `#${target.uniforms.brightnessColorMin.value.getHexString()}`,
      brightnessColorMax: `#${target.uniforms.brightnessColorMax.value.getHexString()}`,
    }

    // Color control
    this.gui.addBinding(this.api, 'backgroundColor').on('change', () => {
      target.uniforms.backgroundColor.value.setStyle(this.api.backgroundColor)
    })
    this.gui.addBinding(this.api, 'brightnessColorMin').on('change', () => {
      target.uniforms.brightnessColorMin.value.setStyle(this.api.brightnessColorMin)
    })
    this.gui.addBinding(this.api, 'brightnessColorMax').on('change', () => {
      target.uniforms.brightnessColorMax.value.setStyle(this.api.brightnessColorMax)
    })
  }
}
/* #endif */
