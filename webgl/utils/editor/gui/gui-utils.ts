import type { BindingApi } from '@tweakpane/core'
import type { BufferGeometry } from 'three'

export function save(data: object) {
  console.log(JSON.stringify(data))
}

export function getGeometryAttributes(geometry: BufferGeometry) {
  const lines = []
  if (geometry.index !== null) {
    lines.push(`index: ${geometry.index.count}`)
  }

  for (const name in geometry.attributes) {
    const attribute = geometry.attributes[name]
    lines.push(`${name}: ${attribute.count} (${attribute.itemSize})`)
  }
  return lines.join('\n')
}

export function getGeometryBounds(geometry: BufferGeometry) {
  if (geometry.boundingBox === null) geometry.computeBoundingBox()

  const boundingBox = geometry.boundingBox
  let result = ''

  if (boundingBox) {
    const x = Math.floor((boundingBox.max.x - boundingBox.min.x) * 1000) / 1000
    const y = Math.floor((boundingBox.max.y - boundingBox.min.y) * 1000) / 1000
    const z = Math.floor((boundingBox.max.z - boundingBox.min.z) * 1000) / 1000
    result = `x: ${x}\ny: ${y}\nz: ${z}`
  }
  return result
}

export function clearBindings(bindings: BindingApi[]) {
  bindings.forEach(binding => {
    binding.dispose()
  })
}

export function generateBindingOptions(arr: string[] | number[]) {
  const options: { [key: string]: string | number } = {}
  arr.forEach(item => {
    options[item] = item
  })
  return options
}
