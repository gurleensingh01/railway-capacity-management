/**
 * Renders stop points (stations) on the map.
 *
 * @param {object} map - Mapbox GL JS map instance.
 * @param {object} stopShapesToRender - { stopId: [lon, lat] }
 * @param {function} getUUIDForLayer - Generates a unique layer ID.
 * @param {function} addLayerReference - Registers layer metadata.
 * @param {number} MINIMUM_ZOOM_FOR_STOP_VISIBILITY - Minimum zoom to show stops.
 * @param {function} onStopClick - Handler when a stop is clicked.
 */
export function renderStops(
    map,
    stopShapesToRender,
    getUUIDForLayer,
    addLayerReference,
    MINIMUM_ZOOM_FOR_STOP_VISIBILITY,
    onStopClick
  ) {
    for (const stopId in stopShapesToRender) {
      const stopCoordinates = stopShapesToRender[stopId];
      const shapeName = getUUIDForLayer();
  
      map.addSource(shapeName, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              id: shapeName,
              geometry: {
                type: "Point",
                coordinates: stopCoordinates
              },
              properties: {
                name: shapeName,
                description: stopId
              }
            }
          ]
        }
      });

      map.addLayer({
        id: shapeName,
        type: "circle",
        source: shapeName,
        minzoom: MINIMUM_ZOOM_FOR_STOP_VISIBILITY,
        layout: {
          visibility: "visible"
        },
        paint: {
          "circle-radius": 6,
          "circle-color": "#808080",
          "circle-stroke-color": "#000000",
          "circle-stroke-width": 2
        }
      });

      map.addLayer({
        id: shapeName + "_label",
        type: "symbol",
        source: shapeName,
        minzoom: MINIMUM_ZOOM_FOR_STOP_VISIBILITY,
        layout: {
          'text-field': ['get', 'description'],
          'text-anchor': 'top',
          'text-radial-offset': 0.75,
          'text-justify': 'auto',
          'text-size': 14
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 1
        }
      });
  
      // Track the layer in reference map
      addLayerReference(shapeName, {
        type: "stop",
        id: stopId
      });
  
      // Add interaction handler
      map.addInteraction(shapeName + "_click", {
        type: "click",
        target: { layerId: shapeName },
        handler: (event) => onStopClick(stopId, stopCoordinates, shapeName)
      });
    }
  }
  
