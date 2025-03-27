/**
 * Renders route layers on the map.
 *
 * @param {object} map - The Mapbox GL map instance.
 * @param {object} source - Route source data.
 * @param {boolean} isBottom - If true, render base gray lines; otherwise render blue overlays.
 * @param {function} getUUIDForLayer - Function to generate unique layer IDs.
 * @param {function} addLayerReference - Function to register layer metadata.
 */
export function renderRoutes(map, source, isBottom, getUUIDForLayer, addLayerReference) {
    const isVisible = isBottom ? "visible" : "none";
    let sourceToUse = source;
  
    // If rendering the top (active) lines, convert { trainId: { distance: coords } } to { trainId: [coords] }
    if (!isBottom) {
      const converted = {};
      for (const trainId in source) {
        if (!converted[trainId]) converted[trainId] = [];
        for (const distance in source[trainId]) {
          converted[trainId].push(source[trainId][distance]);
        }
      }
      sourceToUse = converted;
    }
  
    for (const tripId in sourceToUse) {
      const layerId = getUUIDForLayer();
      const coordinates = sourceToUse[tripId];
  
      map.addSource(layerId, {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: coordinates
          }
        }
      });
  
      map.addLayer({
        id: layerId,
        type: "line",
        slot: "bottom",
        source: layerId,
        layout: {
          visibility: isVisible,
          "line-join": "round",
          "line-cap": "round"
        },
        paint: {
          "line-opacity": 1.0,
          "line-color": isBottom ? "#808080" : "#00afff",
          "line-width": isBottom ? 1.5 : 3.0,
          "line-gap-width": isBottom ? 0 : 8,
          "line-blur": isBottom ? 0 : 2
        }
      });
  
      addLayerReference(layerId, {
        type: isBottom ? "route_bottom" : "route_top",
        id: tripId
      });
    }
  }
  