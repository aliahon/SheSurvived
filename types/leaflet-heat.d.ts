declare module "leaflet.heat" {
  import * as L from "leaflet"

  namespace HeatLayer {
    interface HeatLayerOptions {
      minOpacity?: number
      maxZoom?: number
      radius?: number
      blur?: number
      max?: number
      gradient?: Record<string, string>
    }
  }

  class HeatLayer extends L.Layer {
    constructor(latlngs: L.LatLngExpression[], options?: HeatLayer.HeatLayerOptions)
    setLatLngs(latlngs: L.LatLngExpression[]): this
    addLatLng(latlng: L.LatLngExpression): this
    setOptions(options: HeatLayer.HeatLayerOptions): this
    redraw(): this
  }

  namespace L {
    function heatLayer(latlngs: L.LatLngExpression[], options?: HeatLayer.HeatLayerOptions): HeatLayer
  }
}
