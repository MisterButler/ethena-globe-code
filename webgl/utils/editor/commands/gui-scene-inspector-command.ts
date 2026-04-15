import type { Light, Mesh } from 'three'
import { Object3D, Vector3 } from 'three'

import GUIController from '../gui/gui'
import events, { GUIEditorEvent } from '../gui/gui-events'
import store from '../gui/gui-store'
import { type GUIType } from '../gui/gui-types'
import { safeSetInnerHTML } from '@/webgl/utils/common/security-utils'

export default class SceneInspectorCommand {
  htmlRoot!: HTMLDivElement
  treeContainer!: HTMLDivElement
  elements: HTMLDivElement[] = []
  activeObject = new Object3D()
  openSymbol = '+'
  closeSymbol = '-'
  searchBinding: any
  searchState = { search: '' }
  private lastSearchValue = ''
  allNodes: { node: Object3D; element: HTMLDivElement; depth: number }[] = []

  constructor(
    public gui: GUIType,
    parent: HTMLElement,
  ) {
    this.initGui()
    this.initDom(parent)
    this.buildTree(GUIController.state.scene)

    // Restore state after tree is built
    setTimeout(() => {
      this.restoreState()
    }, 50)
  }

  initGui() {
    // Restore search term from store
    const savedSearchTerm = store.get('scene-inspector-search')

    if (savedSearchTerm && typeof savedSearchTerm === 'string') {
      this.searchState.search = savedSearchTerm
    }

    // Create official Tweakpane search binding
    this.searchBinding = this.gui.addBinding(this.searchState, 'search', {
      label: 'Search Objects',
    })

    // Use a more reliable approach for real-time updates
    // Listen for both change events and set up a polling mechanism
    this.searchBinding.on('change', () => {
      this.filterTree()
      this.saveSearchTerm()
    })

    // Also set up periodic checking for real-time updates
    setInterval(() => {
      const currentValue = this.searchState.search

      if (currentValue !== this.lastSearchValue) {
        this.lastSearchValue = currentValue
        this.filterTree()
        this.saveSearchTerm()
      }
    }, 100)
  }

  initDom(htmlParent?: HTMLElement | undefined) {
    this.htmlRoot = document.createElement('div')
    this.htmlRoot.classList.add('scene-inspector-root')

    // Create tree container (no search input container needed)
    this.treeContainer = document.createElement('div')
    this.treeContainer.style.height = '290px'
    this.treeContainer.style.overflow = 'scroll'
    this.htmlRoot.appendChild(this.treeContainer)

    if (htmlParent) {
      htmlParent.append(this.htmlRoot)
    } else {
      document.body.append(this.htmlRoot)
    }
  }

  buildTree(root: Object3D) {
    this.allNodes = []
    this.addChild(root, this.treeContainer, 0)
  }
  handleSearchChange(_searchValue: string) {
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      this.filterTree()
    }, 10)
  }

  filterTree() {
    const searchTerm = this.searchState.search.toLowerCase()
    let hasMatches = false

    // Show/hide nodes based on search term
    this.allNodes.forEach(({ depth: _depth, element, node }) => {
      const nodeName = this.getNodeName(node).toLowerCase()
      const nodeType = node.type.toLowerCase()
      const nodeUuid = node.uuid.toLowerCase()

      const matches =
        !searchTerm || nodeName.includes(searchTerm) || nodeType.includes(searchTerm) || nodeUuid.includes(searchTerm)

      if (matches || searchTerm === '') {
        element.style.display = 'block'

        if (matches && searchTerm) {
          hasMatches = true
        }

        // Update text with highlighting
        this.updateNodeText(node, element)

        // If searching and this node matches, expand its parent chain
        if (searchTerm && matches) {
          this.expandParentChain(node)
        }
      } else {
        element.style.display = 'none'
      }
    })

    // If searching, expand all visible nodes for better visibility
    if (searchTerm && hasMatches) {
      this.allNodes.forEach(({ element }) => {
        if (element.style.display !== 'none') {
          const button = element.querySelector('.gui-webgl-scene-object-arrow') as HTMLDivElement

          if (button && button.textContent === this.openSymbol) {
            button.textContent = this.closeSymbol
            element.style.height = ''
            element.style.overflow = ''
          }
        }
      })
    }

    // If no search term, reset all collapsed states
    if (!this.searchState.search) {
      this.allNodes.forEach(({ depth, element }) => {
        const button = element.querySelector('.gui-webgl-scene-object-arrow') as HTMLDivElement

        if (button && depth > 1) {
          button.textContent = button.textContent === this.closeSymbol ? this.openSymbol : button.textContent

          if (button.textContent === this.openSymbol) {
            element.style.height = '20px'
            element.style.overflow = 'hidden'
          }
        }
      })
    }
  }

  expandParentChain(node: Object3D) {
    let current = node.parent

    while (current) {
      const nodeData = this.allNodes.find(({ node: n }) => n === current)

      if (nodeData) {
        nodeData.element.style.display = 'block' // Make sure parent is visible

        const button = nodeData.element.querySelector('.gui-webgl-scene-object-arrow') as HTMLDivElement

        if (button && button.textContent === this.openSymbol) {
          button.textContent = this.closeSymbol
          nodeData.element.style.height = ''
          nodeData.element.style.overflow = ''
        }
      }

      current = current.parent
    }
  }

  deleteTree() {
    this.elements.forEach(el => {
      el.remove()
    })

    this.elements = []
    this.allNodes = []
  }

  addChild(node: Object3D, parentDiv: HTMLElement, depth: number) {
    // Hide helpers from the outliner
    if (node.name === 'Helpers' || node.name === 'GUIViewportCommand' || node.userData.isHelper === true) {
      return
    }

    const element = document.createElement('div')
    element.classList.add('gui-webgl-scene-object-parent')

    const container = document.createElement('div')
    container.classList.add('gui-webgl-scene-object-node')
    element.append(container)

    const button = document.createElement('div')
    button.textContent = node.children.length > 0 ? this.closeSymbol : ''

    if (depth > 1) {
      button.textContent = node.children.length > 0 ? this.openSymbol : button.textContent
    }

    button.classList.add('gui-webgl-scene-object-arrow')

    const toggleTree = () => {
      if (button.textContent === '-') {
        element.style.height = ''
        element.style.overflow = ''
      } else {
        element.style.height = '20px'
        element.style.overflow = 'hidden'
      }
    }

    button.addEventListener('click', event => {
      event.stopPropagation()

      if (node.children.length === 0) {
        return
      }

      const isOpen = button.textContent === this.openSymbol
      button.textContent = isOpen ? this.closeSymbol : this.openSymbol
      toggleTree()
    })

    container.append(button)
    toggleTree()

    const label = document.createElement('div')
    label.textContent = `  ${this.getNodeName(node)}`
    label.id = `${node.uuid}`
    label.classList.add('gui-webgl-scene-object-label', node.type)
    const baseType = this.getNodeBaseType(node)

    if (baseType !== '') {
      label.classList.add(baseType)
    }

    container.append(label)

    parentDiv.append(element)
    this.elements.push(element)

    // Store node data for search functionality
    this.allNodes.push({ depth, element, node })

    label.addEventListener('click', event => {
      this.handleClick(node, element, event)
    })

    label.addEventListener('dblclick', event => {
      this.handleDoubleClick(node, element, event)
    })

    node.children.forEach(object3d => {
      this.addChild(object3d, element, depth + 1)
    })
  }

  getNodeName(node: Object3D) {
    return node.name ? `${node.type} (${node.name})` : node.type
  }

  // isNodeAnEntity(node: Object3D) {
  //   // @ts-expect-error isScript has been added to some objects
  //   return node.isEntity === true;
  // }

  handleClick(node: Object3D, element: HTMLElement, event: Event) {
    event.stopPropagation()

    const activeElement = document.querySelectorAll('.active')[0]

    if (activeElement) {
      activeElement.classList.remove('active')

      const child = activeElement.firstElementChild as HTMLDivElement
      child.style.height = 'auto'
      child.style.backgroundColor = ''

      if (activeElement.id === node.uuid) {
        // If clicking the same object, deselect it
        this.activeObject = new Object3D()
        store.set('scene-inspector-selected-object', '')
        return
      }
    }

    this.activeObject = node
    element.classList.add('active')
    const child = element.firstElementChild as HTMLDivElement
    child.style.height = 'auto'
    child.style.backgroundColor = 'rgba(255, 255, 255, 0.5)'
    child.style.borderRadius = 'var(--tp-base-border-radius)'

    // Save selected object UUID to store
    this.saveSelectedObject(node.uuid)

    events.dispatchEvent({
      object: node,
      type: GUIEditorEvent.ObjectSelected,
    })
  }

  handleDoubleClick(node: Object3D, _el: HTMLElement, event: Event) {
    event.stopPropagation()

    if (!GUIController.state.camera) {
      return
    }

    let distanceFromNode = 10

    if (node.type === 'Mesh' || node.type === 'SkinnedMesh') {
      const mesh = node as Mesh
      mesh.geometry.computeBoundingSphere()

      distanceFromNode = mesh.geometry.boundingSphere ? mesh.geometry.boundingSphere.radius : distanceFromNode
    }

    distanceFromNode *= node.getWorldScale(new Vector3()).length()

    if (distanceFromNode < GUIController.state.camera.near) {
      distanceFromNode = GUIController.state.camera.near * 1.1
    }

    const cameraTargetPosition = new Vector3()
    cameraTargetPosition.applyMatrix4(node.matrixWorld)

    node.getWorldPosition(cameraTargetPosition)

    const cameraOffset = cameraTargetPosition.clone()

    cameraOffset.add(new Vector3(distanceFromNode, distanceFromNode, distanceFromNode))

    GUIController.state.camera.position.copy(cameraOffset)
    GUIController.state.camera.lookAt(cameraTargetPosition)

    if (GUIController.state.controls) {
      GUIController.state.controls.target.copy(cameraTargetPosition)
    }
  }

  getNodeBaseType(node: Object3D) {
    if ((node as Light).isLight) {
      return 'Light'
    }

    switch (node.type) {
      case 'Group':
        return 'Object3D'
      default:
        return ''
    }
  }

  logActiveObject = () => {
    // Debug method - can be called from console
    console.log(this.activeObject)
  }

  dispose() {
    // Clean up search binding
    if (this.searchBinding) {
      this.searchBinding.dispose()
    }

    // Clean up tree
    this.deleteTree()

    // Remove the root element
    if (this.htmlRoot && this.htmlRoot.parentNode) {
      this.htmlRoot.parentNode.removeChild(this.htmlRoot)
    }
  }

  highlightSearchTerm(text: string, searchTerm: string): string {
    if (!searchTerm) return text

    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')

    return text.replace(regex, '<mark style="background-color: yellow; color: black; padding: 0 2px;">$1</mark>')
  }

  updateNodeText(node: Object3D, element: HTMLDivElement) {
    const label = element.querySelector('.gui-webgl-scene-object-label') as HTMLDivElement

    if (label) {
      const originalText = this.getNodeName(node)
      const searchTerm = this.searchState.search.toLowerCase()

      if (searchTerm) {
        safeSetInnerHTML(label, `  ${this.highlightSearchTerm(originalText, searchTerm)}`)
      } else {
        label.textContent = `  ${originalText}`
      }
    }
  }

  focusSearch() {
    // Focus the Tweakpane input by finding it in the DOM
    const input = this.searchBinding?.controller_?.view?.element?.querySelector('input')

    if (input) {
      input.focus()
      input.select()
    }
  }

  clearSearch() {
    // Clear the search binding value
    this.searchState.search = ''
    this.searchBinding?.refresh()
    this.filterTree()
    this.saveSearchTerm()
  }

  saveSearchTerm() {
    store.set('scene-inspector-search', this.searchState.search)
  }

  saveSelectedObject(uuid: string) {
    store.set('scene-inspector-selected-object', uuid)
  }

  restoreState() {
    // Restore selected object if it exists in the scene
    const savedObjectUUID = store.get('scene-inspector-selected-object')

    if (savedObjectUUID && typeof savedObjectUUID === 'string') {
      this.selectObjectByUUID(savedObjectUUID)
    }
  }

  selectObjectByUUID(uuid: string) {
    // Find the object in the scene by UUID
    const foundNode = this.allNodes.find(({ node }) => node.uuid === uuid)

    if (foundNode) {
      // Expand parent chain to make sure the object is visible
      this.expandParentChain(foundNode.node)

      // Apply search filter first in case there's a search term
      this.filterTree()

      // Update the active object and GUI state first
      this.activeObject = foundNode.node
      GUIController.state.activeObject = foundNode.node

      // Apply visual selection styling
      const activeElement = document.querySelectorAll('.active')[0]

      if (activeElement) {
        activeElement.classList.remove('active')
        const child = activeElement.firstElementChild as HTMLDivElement
        child.style.height = 'auto'
        child.style.backgroundColor = ''
      }

      foundNode.element.classList.add('active')
      const child = foundNode.element.firstElementChild as HTMLDivElement
      child.style.height = 'auto'
      child.style.backgroundColor = 'rgba(255, 255, 255, 0.5)'
      child.style.borderRadius = 'var(--tp-base-border-radius)'

      // Dispatch the ObjectSelected event to update GUI panels
      events.dispatchEvent({
        object: foundNode.node,
        type: GUIEditorEvent.ObjectSelected,
      })
    }
  }
}
