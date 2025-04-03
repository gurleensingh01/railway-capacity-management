/**
 * Renders trains on the map and creates menu items for them.
 *
 * @param {object} map - Mapbox map instance.
 * @param {object} trainShapesToRender - { trainId: { coordinates: [lon, lat], isMoving: boolean } }
 * @param {function} getUUIDForLayer - Generates a unique layer ID.
 * @param {function} addLayerReference - Registers layer metadata.
 * @param {function} setLayerVisibility - Toggles visibility of layers.
 * @param {function} flyToTrain - Callback to center the map on a train.
 */
export function renderTrains(
    map,
    trainShapesToRender,
    getUUIDForLayer,
    addLayerReference,
    setLayerVisibility,
    flyToTrain
  ) {
    const MINIMUM_ZOOM = 5.0;
  
    const menu = document.getElementById("train_menu");
    menu.innerHTML = "";
  
    const buttonBase = "h-fit w-[64px] p-1 map_menu_item_active text-center";
    const buttonActive = buttonBase + " map_menu_item_active";
    const buttonInactive = buttonBase + " map_menu_item_inactive";
  
    for (const tripId in trainShapesToRender) {
      const { coordinates, isMoving } = trainShapesToRender[tripId];
      const layerId = getUUIDForLayer();
  
      map.addSource(layerId, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates
              },
              properties: {
                  description: tripId
              }
            }
          ]
        }
      });
  
      // Generate color based on ID
      let tripNum = Number(tripId);
      while (tripNum >= 100) tripNum -= 100;
      const color = "#" + ((1 << 24) * (tripNum / 100) | 0).toString(16).padStart(6, "0");

      map.addLayer({
        id: layerId,
        type: "circle",
        minzoom: MINIMUM_ZOOM,
        source: layerId,
        layout: {
          visibility: "visible"
        },
        paint: {
          "circle-radius": 12,
          "circle-color": color,
          "circle-stroke-color": "#5f5f5f",
          "circle-stroke-width": 2
        }
      });

      map.addLayer({
        id: layerId + "_label",
        type: "symbol",
        source: layerId,
        minzoom: MINIMUM_ZOOM,
        layout: {
          'text-field': ['get', 'description'],
          'text-variable-anchor': ['bottom', 'bottom-left', 'bottom-right', 'top-left', 'top-right', 'right', 'left'],
          'text-radial-offset': 1.0,
          'text-justify': 'auto',
          'text-size': 18,
          'text-allow-overlap': true
        },
        paint: {
          'text-color': color,
          'text-halo-color': '#5f5f5f',
          'text-halo-width': 1
        }
      });
  
      addLayerReference(layerId, { type: "train", id: tripId });
  
      map.addInteraction(layerId + "_click", {
        type: "click",
        target: { layerId },
        handler: () => {
          const info = document.getElementById("info_area");
          info.innerHTML = `
            <b>Train ID</b><br>${tripId}<br><br>
            <b>Location</b><br>Lon: ${coordinates[0]}<br>Lat: ${coordinates[1]}<br><br>
            <b>Status</b><br>${isMoving ? "Enroute to next station" : "Stopped at station"}
          `;
          setLayerVisibility("route_top", null, 0);
          setLayerVisibility("route_top", tripId, 1);
        }
      });
  
      // ===== Add Train to Menu ===== //
      const trainDiv = document.createElement("div");
      trainDiv.id = `${tripId}_menu_div`;
      trainDiv.className = "flex flex-row h-fit w-full justify-between";
  
      const locator = document.createElement("a");
      locator.href = "#";
      locator.textContent = tripId;
      locator.className = buttonActive;
      locator.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const info = document.getElementById("info_area");
        info.innerHTML = `
          <b>Train ID</b><br>${tripId}<br><br>
          <b>Location</b><br>Lon: ${coordinates[0]}<br>Lat: ${coordinates[1]}<br><br>
          <b>Status</b><br>${isMoving ? "Enroute to next station" : "Stopped at station"}
        `;
        setLayerVisibility("route_top", null, 0);
        setLayerVisibility("route_top", tripId, 1);
        flyToTrain(coordinates);
      };
  
      const toggle = document.createElement("a");
      toggle.href = "#";
      toggle.textContent = "Hide";
      toggle.className = buttonActive;
      toggle.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const visible = setLayerVisibility("train", tripId, 2);
        toggle.className = visible ? buttonActive : buttonInactive;
        toggle.textContent = visible ? "Hide" : "Show";
      };
  
      trainDiv.appendChild(locator);
      trainDiv.appendChild(toggle);
      menu.appendChild(trainDiv);
    }
  }
  
