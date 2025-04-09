import Link from "next/link";
import mapboxgl from "mapbox-gl";
import React, { useEffect, useRef, useState } from "react";
import { fetchGTFSData } from "./utils/fetchShapeData";
import { fetchWeatherData } from "./utils/fetchWeather";
import { usePathname } from "next/navigation";
import { regionCheck, REGIONS } from "./utils/regions";
import "mapbox-gl/dist/mapbox-gl.css";
import "../styles.css";
import { renderRoutes } from "./utils/renderRoutes";
import { renderStops } from "./utils/renderStops";
import { sortAndMerge } from "./utils/sortAndMerge";
import { renderTrains } from "./utils/renderTrains";
import { renderTrackOverlays } from "./utils/renderTrackOverlays";
import { renderWeatherPanel } from "./utils/renderWeatherPanel";
import { addRailwayLines } from "./utils/railwaylines";

import { useRouter } from "next/navigation";  // Import router to handle navigation
import "../styles.css";
import { signOut } from "firebase/auth";
import { auth } from "./utils/firebase";


export function Map({ region }) {
    const WEATHER_LOADING_PLACEHOLDER = "Loading weather...";
    const WEATHER_FAILED_TEXT = "Could not get weather data.";
    const TRAIN_MENU_DEFAULT_INNERHTML = "<p>Trains will appear here once they are populated.</p>";
    const INFO_PANEL_DEFAULT_INNERHTML = "<p>Click on a route, stop or train to view its information.</p>";
    const MINIMUM_ZOOM_FOR_STOP_VISIBILITY = 8.0;
    const FLY_TO_ZOOM = 12.0;
    const MAXIMUM_TIME_IN_MINUTES_BEFORE_FIRST_STOP = 120;

    // color gradient
    // {
    //      #ofTrainsOrMore: "colorHex"
    // }

    // use this for prod (or ~80 trains/track):
    // const LINE_COLOR_GRADIENT = {
    //    0: "#00ff00",
    //    10: "#22cc00",
    //    20: "#449900",
    //    30: "#667700",
    //    40: "#885500",
    //    50: "#aa3300",
    //    60: "#cc1100",
    //    70: "#ee0000",
    //    80: "#000000"
    // }
    // const MAX_CAPACITY = 80;
    
    // use this for debug (or ~8 trains/track)
    const LINE_COLOR_GRADIENT = {
        0: "#00ff00",
        2: "#aaff00",
        4: "#ffcc00",
        6: "#ff2200",
        8: "#000000"
    }
    const MAX_CAPACITY = 8;

    // function to get the color for the # of trains
    function getTrainHightlightColor(trainsIn) {
        // always at the very least use the first color
        var color = LINE_COLOR_GRADIENT[Object.keys(LINE_COLOR_GRADIENT)[0]];
        for (const capacity in LINE_COLOR_GRADIENT) {
            if (trainsIn >= capacity) {
                color = LINE_COLOR_GRADIENT[capacity];
            }
        }
        return color;
    }

    const pathname = usePathname();
    const mapContainerRef = useRef();
    const [isTrainsSectionExpanded, setIsTrainsSectionExpanded] = useState(false);
    const [trains, setTrains] = useState({});
    const [stops, setStops] = useState({});
    const [stopTimes, setStopTimes] = useState({});
    const [lastZoom, setLastZoom] = useState(null);
    const [lastCenter, setLastCenter] = useState(null);
    const [loading, setLoading] = useState(false);

    // cached weather for stops
    // {
    //      stopId: weatherData
    // }
    var stopsWeatherCache = {};

    // {
    //      "uuid": {
    //          "type": [overlay/route_bottom/route_top/stop/train]
    //          "id": 123
    //      },
    //      ...
    // }
    var layerReference = {};

    function getUUIDForLayer() {
        while (true) {
            var out = self.crypto.randomUUID();
            if (!(out in layerReference)) return out;
        }
    }

    function toggleSidebar() {
        setIsTrainsSectionExpanded(!isTrainsSectionExpanded);
    }

    async function fetchLatestData() {
        if (!regionCheck(region)) return;

        setLoading(true);
        console.clear();
        let data = await fetchGTFSData();
        setTrains(data.trains);
        setStops(data.stops);
        setStopTimes(data.stopTimes);

        if (lastZoom === null) setLastZoom(REGIONS[region]["zoom"]);
        if (lastCenter === null) setLastCenter(REGIONS[region]["center"]);
    };

    function resetTrainMenu() {
        document.getElementById("train_menu").innerHTML = TRAIN_MENU_DEFAULT_INNERHTML;
    }

    function dataIsValid(dataIn) {
        if (dataIn === null) return false;
        if (dataIn === undefined) return false;
        if (Object.keys(dataIn) === undefined) return false;
        if (Object.keys(dataIn).length === 0) return false;
        return true;
    }

    function resetInfoMenu(mapIn) {
        let info = document.getElementById("info_area");
        info.innerHTML = INFO_PANEL_DEFAULT_INNERHTML;

        // add legend
        let legendTitle = document.createElement("h2");
        legendTitle.className="map_menu_title mt-4";
        legendTitle.innerHTML="Legend"
        info.appendChild(legendTitle);
        for (const k in LINE_COLOR_GRADIENT) {
            let div = document.createElement("div");
            div.className = "w-full h-fit flex flex-row content-center mb-2";
            let coloredDiv = document.createElement("div");
            coloredDiv.className = "size-[24px] rounded-full mr-2";
            coloredDiv.style.backgroundColor = LINE_COLOR_GRADIENT[k];
            let coloredDesc = document.createElement("p");
            coloredDesc.innerText = String(k) + " trains or more";
            div.appendChild(coloredDiv);
            div.appendChild(coloredDesc);
            info.appendChild(div);
        }
        
        // add hidden trains
        let hiddenTitle = document.createElement("h2");
        hiddenTitle.className="map_menu_title mt-4";
        hiddenTitle.innerHTML="Hidden Trains"
        let hiddenList = document.createElement("ul");
        hiddenList.className = "list-disc pl-4";
        let hasEntries = false;
        if (mapIn !== null) {
            for (const uuid in layerReference) {
                let type = layerReference[uuid]["type"];
                if (type !== "train") continue;
                let currentVisibility = (mapIn.getLayoutProperty(uuid, "visibility") === "visible");
                if (currentVisibility) continue;
                let entry = document.createElement("li");
                entry.innerHTML = layerReference[uuid]["id"];
                hiddenList.appendChild(entry);
                hasEntries = true;
            }
        }
        if (hasEntries) {
            info.appendChild(hiddenTitle);
            info.appendChild(hiddenList);
        }
    }

    useEffect(() => {
        // resets
        resetTrainMenu();
        resetInfoMenu(null);
        stopsWeatherCache = {};
        layerReference = {};

        console.log("[INFO]: Load map for region: " + region);
        if (!regionCheck(region)) return;

        if (!dataIsValid(trains) || !dataIsValid(stops) || !dataIsValid(stopTimes)) return;

        mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        let map = new mapboxgl.Map({
            "container": "map",
            "style": "mapbox://styles/mapbox/light-v9",
            "center": lastCenter,
            "maxBounds": REGIONS[region]["mapBounds"],
            "zoom": lastZoom
        });

        function setLayerVisibility(layerTypeIn, layerIdIn, isVisible) {
            // isVisible - 0 = false, 1 = true, else = toggle
            for (const uuid in layerReference) {
                let type = layerReference[uuid]["type"];
                if (layerTypeIn === type) {
                    let id = layerReference[uuid]["id"];
                    if (layerIdIn !== null && layerIdIn !== id) continue;
                    let currentVisibility = (map.getLayoutProperty(uuid, "visibility") === "visible");
                    let nextVisibility = (isVisible === 0 ? false : (isVisible === 1 ? true : !currentVisibility));
                    console.log("[INFO]: Change visibility for layer " + type + ":" + id + " to " + nextVisibility);
                    map.setLayoutProperty(uuid, "visibility", (nextVisibility ? "visible" : "none"));
                    if (layerIdIn !== null && layerIdIn === id) return nextVisibility;
                }
            }
        }

        // reenable if required
        // map["doubleClickZoom"].disable();
        map["dragRotate"].disable(); // very laggy
        // map["keyboard"].disable();
        // map["touchZoomRotate"].disable();

        // map.getCanvas().style.cursor = 'pointer';

        map.addInteraction("map_click", {
            type: "click",
            handler: ({ feature }) => {
                console.log("[INFO]: Clicked map");
                resetInfoMenu(map);
                // update current zoom / center
                setLastZoom(map.getZoom());
                setLastCenter(map.getCenter());
                setLayerVisibility("route_top", null, 0);
            }
        });

        map.addControl(new mapboxgl.FullscreenControl());

        // update current center
        map.on("moveend", () => { setLastCenter(map.getCenter()); });
        // update current zoom
        map.on("zoomend", () => { setLastZoom(map.getZoom()); });


        // ==================== on map load ==================== //
        map.on("load", () => {

            // render the rain layers
            const openweathermapKey = process.env.NEXT_PUBLIC_OPENWEATHERMAP_KEY;
            // 1/4
            // top-left quarter
            // "https://tile.openweathermap.org/map/precipitation/1/0/0.png?appid=" + openweathermapKey
            
            // ======= if we ever need more than just north america ======= //
            // 2/4
            // bottom-left quarter
            // "https://tile.openweathermap.org/map/precipitation/1/0/1.png?appid=" + openweathermapKey
            // 3/4
            // top-right quarter
            // "https://tile.openweathermap.org/map/precipitation/1/1/0.png?appid=" + openweathermapKey
            // 4/4
            // bottom-right quarter
            // "https://tile.openweathermap.org/map/precipitation/1/1/1.png?appid=" + openweathermapKey

            // check with this to ensure correct rendering
            // https://openweathermap.org/weathermap?basemap=map&cities=false&layer=radar&lat=30&lon=-20&zoom=3
            // check this for more styles
            // https://openweathermap.org/api/weathermaps

            map.addSource("rain-top-left", {
                "type": "image",
                "url": "https://tile.openweathermap.org/map/precipitation/1/0/0.png?appid=" + openweathermapKey,
                "coordinates": [
                    // lon - lat
                    // top left
                    [-179, 85],
                    // top right
                    [0.0, 85],
                    // bottom right
                    [0.0, 0.0],
                    // bottom left
                    [-179, 0.0]
                ]
            });
            map.addLayer({
                "id": "rain-top-left",
                "type": "raster",
                "source": "rain-top-left",
                "layout": {
                    visibility: "visible"
                },
                "paint": {
                    "raster-contrast": 0.333,
                    "raster-fade-duration": 0,
                    "raster-opacity": 0.667,
                    "raster-resampling": "linear",
                    "raster-saturation": 0.333
                }
            });

            // map action buttons
            const mapActions = document.getElementById("mapActions");

            // add button to reset the map
            if (document.getElementById("recenterMapButton")) document.getElementById("recenterMapButton").remove();
            const recenterMap = document.createElement("a");
            recenterMap.id = "recenterMapButton";
            recenterMap.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                setLastZoom(REGIONS[region]["zoom"]);
                setLastCenter(REGIONS[region]["center"]);
                map.flyTo({
                    "center": REGIONS[region]["center"],
                    "zoom": REGIONS[region]["zoom"],
                    "bearing": 0,
                    "pitch": 0.0,
                    "duration": 5000,
                    "essential": false
                });
            };
            recenterMap.className = "dark_button_mini";
            recenterMap.href = "";
            recenterMap.textContent = "Re-center Map";
            mapActions.prepend(recenterMap);

            // add button to toggle the weather
            if (document.getElementById("toggleMapWeatherButton")) document.getElementById("toggleMapWeatherButton").remove();
            const toggleWeather = document.createElement("a");
            toggleWeather.id = "toggleMapWeatherButton";
            toggleWeather.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                var currentVisibility = (map.getLayoutProperty("rain-top-left", "visibility") === "visible");
                map.setLayoutProperty("rain-top-left", "visibility", (currentVisibility ? "none" : "visible"));
            };
            toggleWeather.className = "dark_button_mini";
            toggleWeather.href = "";
            toggleWeather.textContent = "Toggle Weather";
            mapActions.prepend(toggleWeather);

            // =================== Add the railway lines =================== //
            var today = new Date();
            //var today = new Date("2025-04-10");
            //today.setHours(15);
            //today.setMinutes(49);

            let {
                routeShapesToRender,
                trainShapesToRender,
                stopShapesToRender,
                trainRemainingCoordinates,
                trackOverlaysToRender,
                stopTrainSchedule,
                totalRoutes,
                totalStops,
                totalTrains
              } = addRailwayLines({
                trains,
                stops,
                stopTimes,
                region,
                today,
                REGIONS,
                MAXIMUM_TIME_IN_MINUTES_BEFORE_FIRST_STOP
              });

            // ==================== Add layers to map ==================== //
            var layerCounter = 0;
            var routeLayers = 0;
            var overlayLayers = 0;
            var trainLayers = 0;
            var stopLayers = 0;

            // [
            //      {
            //          "trains": 1,
            //          "coordinates": [
            //              [[a,b], [c,d]],
            //              [[c,d], [e,f]],
            //              [[e,f], [g,h]]
            //              ...
            //          ]
            //      },
            //      {
            //          "trains": 1,
            //          "coordinates": [
            //              [[u,v], [w,x]]
            //          ]
            //      },
            //      {
            //          "trains": 2,
            //          "coordinates": [
            //              [[y,z], [s,t]]
            //          ]
            //      }
            //      ...
            // ]
            var unsortedTrackOverlaySegments = [];

            // add all overlays to unsortedTrackOverlaySegments
            for (const entry in trackOverlaysToRender) {
                let ref = trackOverlaysToRender[entry];
                unsortedTrackOverlaySegments.push(
                    {
                        "trains": ref["trains"].length,
                        "trainIds": ref["trains"],
                        "coordinates": [ref["from"], ref["to"]]
                    }
                );
            }
            
            // [
            //      {
            //          {
            //              "trains": 1
            //              "coordinates": [
            //                  [[a,b], [c,d]]
            //              ]
            //          }
            //          ...
            //      }
            // ]
            var sortedTrackOverlaySegments = sortAndMerge(unsortedTrackOverlaySegments);

            // ====================== Render layers ====================== //
            // ===== THIS IS ORDER-SENSITIVE. DO NOT REARRANGE THIS. ===== //
            // ===== THIS IS ORDER-SENSITIVE. DO NOT REARRANGE THIS. ===== //
            // ===== THIS IS ORDER-SENSITIVE. DO NOT REARRANGE THIS. ===== //
            // ========================== START ========================== //
            renderRoutes(map, routeShapesToRender, true, getUUIDForLayer, (uuid, ref) => layerReference[uuid] = ref);

            renderTrackOverlays(
                map,
                sortedTrackOverlaySegments,
                getTrainHightlightColor,
                getUUIDForLayer,
                (uuid, ref) => layerReference[uuid] = ref,
                (layerId, numberOfTrains, trainIds) => {
                  console.log("[INFO]: Clicked overlay: " + layerId);
                  const infoArea = document.getElementById("info_area");
                  const div = document.createElement("div");
                  div.className = "flex flex-col text-left";
              
                  const infoText = document.createElement("p");
                  infoText.innerHTML =
                    `<b>Scheduled Track Capacity</b><br>${numberOfTrains}/${MAX_CAPACITY}<br><br>` +
                    `<b>Trains Headed for this Track</b><br>`;
              
                  const trainList = document.createElement("ul");
                  trainList.className = "flex flex-col list-disc pl-4";
              
                  for (const id of trainIds) {
                    const li = document.createElement("li");
                    li.innerText = id;
                    trainList.appendChild(li);
                  }
              
                  div.appendChild(infoText);
                  div.appendChild(trainList);
                  infoArea.innerHTML = "";
                  infoArea.appendChild(div);
                }
              );              
            renderRoutes(map, trainRemainingCoordinates, false, getUUIDForLayer, (uuid, ref) => layerReference[uuid] = ref);

            renderTrains(
                map,
                trainShapesToRender,
                getUUIDForLayer,
                (uuid, ref) => layerReference[uuid] = ref,
                setLayerVisibility,
                resetInfoMenu,
                trainRemainingCoordinates,
                (coordinates) => {
                  map.flyTo({
                    center: coordinates,
                    zoom: FLY_TO_ZOOM,
                    bearing: 0,
                    pitch: 0,
                    duration: 5000,
                    essential: false
                  });
                }
              );
              
            renderStops(
                map,
                stopShapesToRender,
                getUUIDForLayer,
                (uuid, ref) => layerReference[uuid] = ref,
                MINIMUM_ZOOM_FOR_STOP_VISIBILITY,
                async (stopId, stopCoordinates, shapeName) => {
                  console.log("[INFO]: Clicked stop: " + stopId);
                  
                  let infoArea = document.getElementById("info_area");
                  infoArea.innerHTML = "";
              
                  let stopInfoDiv = document.createElement("div");
                  stopInfoDiv.id = stopId + "_menu_div";
              
                  let stopInfoP = document.createElement("p");
                  stopInfoP.id = stopId + "_menu_p_constant";
                  let constantInfoStringBuilder = "<b>Stop ID</b><br>" + stopId + "<br><br>";
              
                  let schedule = stopTrainSchedule[stopId];
                  let hasTrains = false;
                  constantInfoStringBuilder += "<b>Scheduled Trains</b>";
              
                  if (schedule) {
                    for (const scheduledTrain of schedule) {
                      for (const tripId in scheduledTrain) {
                        let time = scheduledTrain[tripId];
                        let hours = String(time.getHours()).padStart(2, "0");
                        let minutes = String(time.getMinutes()).padStart(2, "0");
                        constantInfoStringBuilder += `<br>${hours}:${minutes} - ${tripId}`;
                        hasTrains = true;
                      }
                    }
                  }
              
                  if (!hasTrains) constantInfoStringBuilder += "<br>No trains scheduled";
                  constantInfoStringBuilder += "<br><br><b>Current Weather</b><br>";
                  stopInfoP.innerHTML = constantInfoStringBuilder;
              
                  let stopInfoWeather = document.createElement("div");
                  stopInfoWeather.innerHTML = WEATHER_LOADING_PLACEHOLDER;
              
                  stopInfoDiv.appendChild(stopInfoP);
                  stopInfoDiv.appendChild(stopInfoWeather);
                  infoArea.appendChild(stopInfoDiv);
              
                  let weather = null;
                  if (stopsWeatherCache[shapeName]) {
                    weather = stopsWeatherCache[shapeName];
                  } else {
                    weather = await fetchWeatherData(stopCoordinates[1], stopCoordinates[0]);
                    stopsWeatherCache[shapeName] = weather;
                  }
              
                  if (weather !== null) {
                    renderWeatherPanel(stopInfoWeather, weather);
                  } else {
                    stopInfoWeather.innerHTML = WEATHER_FAILED_TEXT;
                  }                  
                }
              );
              
            // =========================== END =========================== //


            // log counters
            console.log("[INFO]: Total layers: " + layerCounter);
            console.log("[INFO]: ----> Route layers: " + routeLayers);
            console.log("[INFO]: ----> Overlay layers: " + overlayLayers);
            console.log("[INFO]: ----> Train layers: " + trainLayers);
            console.log("[INFO]: ----> Stop layers: " + stopLayers);

            console.log("[INFO]: Total routes: " + totalRoutes);
            console.log("[INFO]: Total stops : " + totalStops);
            console.log("[INFO]: Total trains: " + totalTrains);

            document.getElementById("mapUpdatedTime").innerHTML = "(Updated at: " + today.toLocaleString() + ")";
            setLoading(false);
        });

        // ==================== on map idle loop ==================== //
        map.on("idle", () => {
        });
    }, [trains, stops, stopTimes]);

    return (
        <div className="size-full flex flex-row gap-4">
            <div className="map_menu_section">
                <div className="map_menu">
                    <h2 className="map_menu_title">Info</h2>
                    <div id="info_area" className="map_menu_content">{INFO_PANEL_DEFAULT_INNERHTML}</div>
                </div>
                <div className="map_menu" style={{
                    height: isTrainsSectionExpanded ? "57.5%" : "72px",
                }}>
                    <div className="w-full h-fit flex flex-row justify-between pb-4">
                        <h2 className="map_menu_title text-left">Trains</h2>
                        <div className="flex flex-col justify-center content-center">
                            <button className="light_button_mini text-right" onClick={toggleSidebar}>{isTrainsSectionExpanded ? "Collapse" : "Expand"}</button>
                        </div>
                    </div>
                    <div id="train_menu" className="map_menu_content">{TRAIN_MENU_DEFAULT_INNERHTML}</div>
                </div>
            </div>
            <div className="map_section">
                <div className="map_buttons_section">
                    <div className="flex flex-row gap-2">
                        <h3 className="int_label whitespace-nowrap text-left">Railway Map</h3>
                        <p id="mapUpdatedTime" className="whitespace-nowrap overflow-scroll"></p>
                    </div>
                    <div id="mapActions" className="flex flex-row justify-between gap-2 mr-0 ml-auto">
                        <Link className="dark_button_mini" onClick={fetchLatestData} disabled={loading} href="">
                            {loading ? "Fetching Data..." : "Fetch Latest Data"}
                        </Link>
                    </div>
                </div>
                <div id="map" ref={mapContainerRef} className="size-full"></div>
            </div>
        </div>
    );
}
