import type { TabPageApi } from '@tweakpane/core'
import { AmbientLight, DirectionalLight, HemisphereLight, Mesh, PerspectiveCamera, PointLight, SpotLight } from 'three'

import { farBinding, fovBinding, nearBinding } from '../../bindings/gui-camera-bindings'
import {
  lightAngleBinding,
  lightColorBinding,
  lightDecayBinding,
  lightDirectionBinding,
  lightDistanceBinding,
  lightGroundColorBinding,
  lightIntensityBinding,
  lightPenumbraBinding,
  lightPowerBinding,
} from '../../bindings/gui-lights-bindings'
import {
  castShadowBinding,
  frustumCulledBinding,
  nameBinding,
  receiveShadowBinding,
  typeBinding,
  uuidBinding,
  visibleBinding,
} from '../../bindings/gui-object-3d-bindings'
import GUIController from '../gui'
import GUITransformController from '../transform/gui-transform'

export default class GUIObject3DController extends GUIController {
  constructor(gui: TabPageApi) {
    super(gui)
    this.gui = gui
    typeBinding(gui, GUIController.state.activeObject)
    uuidBinding(gui, GUIController.state.activeObject)
    nameBinding(gui, GUIController.state.activeObject)

    this.controllers.transform = new GUITransformController(gui)

    // Create Properties folder for object properties
    const propertiesFolder = this.addFolder(gui, {
      title: 'Properties',
      expanded: true,
    })

    // Common object properties
    visibleBinding(propertiesFolder, GUIController.state.activeObject)
    frustumCulledBinding(propertiesFolder, GUIController.state.activeObject)

    // Mesh-specific properties
    if (GUIController.state.activeObject instanceof Mesh) {
      castShadowBinding(propertiesFolder, GUIController.state.activeObject)
      receiveShadowBinding(propertiesFolder, GUIController.state.activeObject)
    }

    if (GUIController.state.activeObject instanceof PerspectiveCamera) {
      nearBinding(gui, GUIController.state.activeObject)
      farBinding(gui, GUIController.state.activeObject)
      fovBinding(gui, GUIController.state.activeObject)
    }

    if (GUIController.state.activeObject instanceof AmbientLight) {
      lightColorBinding(gui, GUIController.state.activeObject)
      lightIntensityBinding(gui, GUIController.state.activeObject)
    }

    if (GUIController.state.activeObject instanceof DirectionalLight) {
      lightColorBinding(gui, GUIController.state.activeObject)
      lightIntensityBinding(gui, GUIController.state.activeObject)
      lightDirectionBinding(gui, GUIController.state.activeObject)
    }

    if (GUIController.state.activeObject instanceof HemisphereLight) {
      lightColorBinding(gui, GUIController.state.activeObject)
      lightGroundColorBinding(gui, GUIController.state.activeObject)
      lightIntensityBinding(gui, GUIController.state.activeObject)
      lightDirectionBinding(gui, GUIController.state.activeObject)
    }

    if (GUIController.state.activeObject instanceof PointLight) {
      lightColorBinding(gui, GUIController.state.activeObject)
      lightIntensityBinding(gui, GUIController.state.activeObject)
      lightDirectionBinding(gui, GUIController.state.activeObject)
      lightDecayBinding(gui, GUIController.state.activeObject)
      lightDistanceBinding(gui, GUIController.state.activeObject)
      lightPowerBinding(gui, GUIController.state.activeObject)
    }

    if (GUIController.state.activeObject instanceof SpotLight) {
      lightColorBinding(gui, GUIController.state.activeObject)
      lightIntensityBinding(gui, GUIController.state.activeObject)
      lightDirectionBinding(gui, GUIController.state.activeObject)
      lightDecayBinding(gui, GUIController.state.activeObject)
      lightDistanceBinding(gui, GUIController.state.activeObject)
      lightPowerBinding(gui, GUIController.state.activeObject)
      lightAngleBinding(gui, GUIController.state.activeObject)
      lightPenumbraBinding(gui, GUIController.state.activeObject)
    }
  }
}
