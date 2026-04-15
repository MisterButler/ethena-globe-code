export const grayscale = /* glsl */ `
  vec3 greyscale(vec3 color, float str) {
      float g = dot(color, vec3(0.299, 0.587, 0.114));
      return mix(color, vec3(g), str);
  }

  vec3 greyscale(vec3 color) {
      return greyscale(color, 1.0);
  } 
`
