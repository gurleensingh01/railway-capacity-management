/**
 * Renders trains on the map and creates menu items for them.
 *
 * @param {object} map - Mapbox map instance.
 * @param {object} trainShapesToRender - { trainId: { coordinates: [lon, lat], isMoving: boolean } }
 * @param {function} getUUIDForLayer - Generates a unique layer ID.
 * @param {function} addLayerReference - Registers layer metadata.
 * @param {function} setLayerVisibility - Toggles visibility of layers.
 * @Param {function} resetInfoMenu - the info menu reset function
 * @param {dictionary} trainRemainingCoordinates - train remaining distances
 * @param {function} flyToTrain - Callback to center the map on a train.
 */
export function renderTrains(
    map,
    trainShapesToRender,
    getUUIDForLayer,
    addLayerReference,
    setLayerVisibility,
    resetInfoMenu,
    trainRemainingCoordinates,
    flyToTrain
  ) {
    const MINIMUM_ZOOM = 5.0;
  
    const menu = document.getElementById("train_menu");
    const buttonBase = "h-fit w-[72px] p-1 map_menu_item_active text-center";
    const buttonActive = buttonBase + " map_menu_item_active";
    const buttonInactive = buttonBase + " map_menu_item_inactive";
    menu.innerHTML = (Object.keys(trainShapesToRender).length === 0) ? "There are currently no trains running in your region." : "";
    for (const tripId in trainShapesToRender) {
      const { coordinates, isMoving, headsign } = trainShapesToRender[tripId];
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
                  description: "#" + tripId
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
          'text-allow-overlap': true,
          visibility: "visible"
        },
        paint: {
          'text-color': color,
          'text-halo-color': '#5f5f5f',
          'text-halo-width': 1
        }
      });
  
      addLayerReference(layerId, { type: "train", id: tripId });
      addLayerReference(layerId + "_label", { type: "train_label", id: tripId });
      let trainDistances = Object.keys(trainRemainingCoordinates[tripId]);
      if (tripId === "270") {
        console.log(String(JSON.stringify(trainDistances)));
      }
      let trainDistanceMin = parseFloat(trainDistances[0]);
      let trainDistanceMax = parseFloat(trainDistances[trainDistances.length - 1]);
      let trainDistanceRemaining = trainDistanceMax - trainDistanceMin;
      let unit = "meters";
      if (trainDistanceRemaining >= 1000) {
        trainDistanceRemaining = trainDistanceRemaining / 1000;
        unit = "kilometers";
      }
      if (trainDistanceRemaining < 0) {
        trainDistanceRemaining = "Distance is not available for this train.";
        unit = "";
      } else {
        trainDistanceRemaining = Math.round(trainDistanceRemaining * 2) / 2;
      }
      let trainInfoContent = `<b>Train ID</b>${tripId}<br><br>
            <b>Headsign</b>${headsign || "N/A"}<br><br>
            <b>Location</b>Lat: ${coordinates[1]}<br>Long: ${coordinates[0]}<br><br>
            <b>Status</b>${isMoving ? "Enroute to next station" : "Stopped at station"}<br><br>
            <b>Distance Remaining</b>${trainDistanceRemaining}  ${unit}
      `;

      map.addInteraction(layerId + "_click", {
        type: "click",
        target: { layerId },
        handler: () => {
          const info = document.getElementById("info_area");
          info.innerHTML = trainInfoContent;
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
      locator.className = buttonActive + " flex flex-row";
      locator.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const info = document.getElementById("info_area");
        info.innerHTML = trainInfoContent;
        setLayerVisibility("route_top", null, 0);
        setLayerVisibility("route_top", tripId, 1);
        flyToTrain(coordinates);
      };

      let coloredDiv = document.createElement("div");
      coloredDiv.className = "size-[16px] rounded-full ml-1 mt-1 shrink-0";
      coloredDiv.style.backgroundColor = color;

      let locatorP = document.createElement("p");
      locatorP.innerHTML = tripId;
      locatorP.className = "w-full h-fit justify-center text-center";

      const toggle = document.createElement("a");
      toggle.href = "#";
      toggle.textContent = "Hide";
      toggle.className = buttonActive;
      toggle.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const visible = setLayerVisibility("train", tripId, 2);
        setLayerVisibility("train_label", tripId, visible);
        toggle.className = visible ? buttonActive : buttonInactive;
        toggle.textContent = visible ? "Hide" : "Show";
        resetInfoMenu(map);
      };
  
      locator.appendChild(coloredDiv);
      locator.appendChild(locatorP);
      trainDiv.appendChild(locator);
      trainDiv.appendChild(toggle);
      menu.appendChild(trainDiv);
    }
  }
  
