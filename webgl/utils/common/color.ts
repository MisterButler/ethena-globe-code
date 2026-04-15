import { Color } from 'three'

const color = new Color()
const colorLerp0 = new Color()
const colorLerp1 = new Color()

export function hexStringToHexadecimal(hex: string) {
  return color.setStyle(hex).getHex()
}

export function lerpColor(color0: number, color1: number, alpha: number) {
  colorLerp1.setHex(color1)
  return colorLerp0.setHex(color0).lerp(colorLerp1, alpha)
}

export function lerpColorStyle(color0: string, color1: string, alpha: number) {
  colorLerp1.setStyle(color1)
  return colorLerp0.setStyle(color0).lerp(colorLerp1, alpha).getStyle()
}

export function darkenColor(color0: string, alpha: number) {
  return lerpColorStyle(color0, '#000000', alpha)
}
