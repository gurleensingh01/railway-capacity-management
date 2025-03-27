/**
 * Renders capacity overlays on shared track segments.
 *
 * @param {object} map - Mapbox GL instance.
 * @param {Array} sortedTrackOverlaySegments - Segments from sortAndMerge.
 * @param {function} getTrainHighlightColor - Color based on number of trains.
 * @param {function} getUUIDForLayer - Generates unique layer ID.
 * @param {function} addLayerReference - Stores metadata { type, id } by UUID.
 * @param {function} onOverlayClick - Callback when overlay is clicked.
 */
export function renderTrackOverlays(
    map,
    sortedTrackOverlaySegments,
    getTrainHighlightColor,
    getUUIDForLayer,
    addLayerReference,
    onOverlayClick
  ) {
    for (const segment of sortedTrackOverlaySegments) {
      const { trains, trainIds, coordinates } = segment;
      const layerId = getUUIDForLayer();
  
      map.addSource(layerId, {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates
          }
        }
      });
  
      map.addLayer({
        id: layerId,
        type: "line",
        source: layerId,
        layout: {
          visibility: "visible",
          "line-join": "round",
          "line-cap": "round"
        },
        paint: {
          "line-opacity": 1.0,
          "line-color": getTrainHighlightColor(trains),
          "line-width": 7.5
        }
      });
  
      addLayerReference(layerId, { type: "overlay", id: trainIds });
  
      map.addInteraction(layerId + "_click", {
        type: "click",
        target: { layerId },
        handler: () => onOverlayClick(layerId, trains, trainIds)
      });
    }
  }
  