import { usePathname } from "next/navigation";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { fetchGTFSData } from "./utils/fetchShapeData";
import { useTrack } from "./context/TrackContext";
import "../styles.css";
import { fetchWeatherData } from "./utils/fetchWeather";

export function Map() {
    // for route names
    const ROUTE_PREFIX = "route_";
    // for stop names
    const STOP_PREFIX = "stop_";
    // for train names
    const TRAIN_PREFIX = "train_";
    // for track overlays
    const OVERLAY_PREFIX = "overlay_";
    // minimum zoom level for stops
    const MINIMUM_ZOOM_FOR_STOP_VISIBILITY = 6.5;
    // color gradient
    // number -> # of trains
    // hex -> the color to use for this capacity
    // const lineColorGradient = {
    //    0: "#00ff00",
    //    10: "#22cc00",
    //    20: "#449900",
    //    30: "#667700",
    //    40: "#885500",
    //    50: "#aa3300",
    //    60: "#cc1100",
    //    70: "#ee0000",
    //    80: "#000000"
    //}
    const lineColorGradient = {
        0: "#00ff00",
        3: "#ffff00",
        5: "#ff0000",
        7: "#c00000"
    }

    const pathname = usePathname();
    const mapContainerRef = useRef();
    const mapRef = useRef();
    const [trains, setTrains] = useState([]);
    const [stops, setStops] = useState([]);
    const [stopTimes, setStopTimes] = useState([]);
    const [lastZoom, setLastZoom] = useState(0.0);
    const [lastCenter, setLastCenter] = useState(null);
    const [loading, setLoading] = useState(false);
    const { setSelectedTrack } = useTrack(); // Track selection context
    var isRouteOnExpandedPage = (pathname === "/map");
    var today = new Date("2025-03-06");
    today.setHours(17);
    today.setMinutes(50);
    // TODO: auto-refresh would be nice
    // TODO: mask map https://stackoverflow.com/questions/40772764/mask-mapbox-gl-map-with-arbitrary-polygon
    // var today = new Date();
    var day = today.getDay();

    const fetchLatestData = async () => {
        setLoading(true);

        const data = await fetchGTFSData();

        setTrains(data.trains);
        setStops(data.stops);
        setStopTimes(data.stopTimes);

        // default zoom level
        if (lastZoom === 0.0) setLastZoom(6.5);
        // TODO: automatically find center
        if (!lastCenter) setLastCenter([-79.38032, 43.64481]);

        setLoading(false);
    };


    useEffect(() => {
        if (trains.length === 0) return;
        if (stops.length === 0) return;
        if (stopTimes.length === 0) return;

        let renderedStops = [];

        // TODO: this should be .env file
        mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;;
        const map = new mapboxgl.Map({
            "container": "map",
            "style": "mapbox://styles/mapbox/light-v9",
            "center": lastCenter,
            "zoom": lastZoom
        });

        // disables
        map["doubleClickZoom"].disable();
        map["dragRotate"].disable();
        map["keyboard"].disable();
        map["touchZoomRotate"].disable();

        map.addInteraction("map-click", {
            type: "click",
            handler: ({feature}) => {
                document.getElementById("info_area").text = "Select a stop or train";
                // update current zoom / center
                setLastZoom(map.getZoom());
                setLastCenter(map.getCenter());
            }
        });

        // update current center
        map.on("moveend", () => { setLastCenter(map.getCenter()); });
        // update current zoom
        map.on("zoomend", () => { setLastZoom(map.getZoom()); });

        // Unique train coordinates that don't overlay onto other tracks
        // [
        //      "coordLonA, coordLatA, coordLonB, coordLatB",
        //      "coordLonC, coordLatC, coordLonD, coordLatD",
        //      "coordLonA, coordLatA, coordLonE, coordLatE",
        //      ...
        // ]
        //
        var uniquePointSections = [];

        // Overlaid train coordinates that overlay on other tracks
        // {
        //      "coordLonA, coordLatA, coordLonB, coordLatB": {
        //          "trains": 3,
        //          "from": [coordLonA, coordLatA],
        //          "to":   [coordLonB, coordLatB]
        //      }
        // }
        var overlaidPointSections = {};


        // ==================== on map load ==================== //
        map.on("load", () => {
            var totalTrains = 0;
            var totalTrainsAtStops = 0;
            var totalTrainsMoving = 0;

            // ===================== Add Railway Lines ===================== //

            // *** L0
            for (var tripId in stopTimes) {
                const trainStartDate = trains[tripId]["startDate"];
                const trainEndDate = trains[tripId]["endDate"];
                const trainDaysOfOperation = trains[tripId]["daysOfOperation"];

                // ===== Check renderability ===== //
                // start/end dates
                if (trainStartDate && trainStartDate > today) {
                    console.log("[INFO]: Skipping train " + tripId + " because the start date is not met");
                    continue; // L0
                }
                if (!trainStartDate) {
                    console.log("[INFO]: Skipping train " + tripId + " because the start date is not set");
                    continue; // L0
                }
                if (trainEndDate && trainEndDate < today) {
                    console.log("[INFO]: Skipping train " + tripId + " because the end date has been met");
                    continue; // L0
                }
                if (!trainEndDate) {
                    console.log("[INFO]: Skipping train " + tripId + " because the end date is not set");
                    continue; // L0
                }
                // days of operation
                if (trainDaysOfOperation && !trainDaysOfOperation[day]) {
                    console.log("[INFO]: Skipping train " + tripId + " because it does not run today");
                    continue; // L0
                }
                if (!trainDaysOfOperation) {
                    console.log("[INFO]: Skipping train " + tripId + " because the days of operation is not set");
                    continue; // L0
                }

                // ===== Estimate train location ===== //

                // - check departure time of this stop compared to current time:
                const stopData = stopTimes[tripId];
                const stopDataLength = Object.keys(stopData).length;
                const currentTimeMinutes = (today.getHours() * 60) + today.getMinutes();
                
                const lastDepartTime = stopData[stopDataLength - 1]["departureTime"];
                const lastDepartTimeMinutes = (lastDepartTime.getHours() * 60) + lastDepartTime.getMinutes();
                if (currentTimeMinutes > lastDepartTimeMinutes) {
                    console.log("[INFO]: Skipping train " + tripId + " because the trip is completed");
                    continue; // L0
                }

                // *** L1
                for (let i = 0; i < stopDataLength; i++) {
                    // - if current time is less than or equal to the departure time
                    const departTime = stopData[i]["departureTime"];
                    const departTimeMinutes = (departTime.getHours() * 60) + departTime.getMinutes();
                    if (currentTimeMinutes > departTimeMinutes) continue; // L1
                    // - then we know the train is here, or enroute to here
                    // - check arrival time
                    const arriveTime = stopData[i]["arrivalTime"];
                    const arriveTimeMinutes = (arriveTime.getHours() * 60) + arriveTime.getMinutes();
                    let trainCoordinates = [0, 0];
                    let trainIsMoving = false;
                    // - if current time is more than arrival time
                    if (currentTimeMinutes >= arriveTimeMinutes || i === 0) {
                        totalTrainsAtStops += 1;
                        // - then the train is at this stop
                        // set trainCoordinates
                        const stopId = stopData[i]["stopId"];
                        // *** L2
                        for (var id in stops) {
                            const stopIdCoordinates = stops[id]["coordinates"];
                            trainCoordinates = stopIdCoordinates;
                            if (id === stopId) {
                                break; // L2
                            }
                        }
                    } else {
                        totalTrainsMoving += 1;
                        trainIsMoving = true;
                        // - then the train is enroute to this stop
                        // calculate average train velocity
                        // (this stop"s distance - last stop"s distance) / (this stop"s arrival time - last stop"s departure time)
                        const currentDistance = parseFloat(stopData[i]["distance"]);
                        const lastDistance = parseFloat(stopData[i - 1]["distance"]);
                        const lastArriveTime = stopData[i - 1]["arrivalTime"];
                        const lastArriveTimeMinutes = (lastArriveTime.getHours() * 60) + lastArriveTime.getMinutes();
                        // velocity (meters/minute) * time = approximate train location
                        const approxVelocity = (currentDistance - lastDistance) / (arriveTimeMinutes - lastArriveTimeMinutes);
                        const approxDistance = (approxVelocity * (currentTimeMinutes - lastArriveTimeMinutes)) + lastDistance;
                        // find closest renderable location
                        const trainDistanceCoordinates = trains[tripId]["distanceCoordinates"];
                        const keys = Object.keys(trainDistanceCoordinates);
                        // *** L3
                        for (const key in keys) {
                            const distance = Object.keys(trainDistanceCoordinates[key])[0];
                            if (distance <= approxDistance) {
                                trainCoordinates = trainDistanceCoordinates[key][distance];
                            } else {
                                break; // L3
                            }
                        }
                    }
                    // draw train dot at this approximate location
                    if (trainCoordinates[0] !== 0 && trainCoordinates[1] !== 0) {
                        const trainName = TRAIN_PREFIX + tripId;
                        map.addSource(trainName, {
                            "type": "geojson",
                            "data": {
                                "type": "FeatureCollection",
                                "features": [
                                    {
                                        "type": "Feature",
                                        "geometry": {
                                            "type": "Point",
                                            "coordinates": trainCoordinates
                                        }
                                    }
                                ]
                            }
                        });

                        // train dot color generator
                        var tripIdNumber = Number(tripId);
                        while (tripIdNumber >= 100) {
                            tripIdNumber -= 100;
                        }
                        if (!map.getLayer(trainName)) {
                            map.addLayer({
                                "id": trainName,
                                "type": "circle",
                                "source": trainName,
                                "layout": {
                                    "visibility": "visible"
                                },
                                "paint": {
                                    "circle-radius": 8,
                                    "circle-color": "#" + ((1 << 24) * (tripIdNumber / 100) | 0).toString(16).padStart(6, "0"),
                                    "circle-stroke-color": "#5f5f5f",
                                    "circle-stroke-width": 2
                                }
                            });
                            map.addInteraction(trainName + "_click", {
                                type: "click",
                                target: { layerId: trainName },
                                handler: async ({ feature }) => {
                                    console.log("[DEBUG]: Clicked train: " + trainName.replace(TRAIN_PREFIX, ""));
                                    const infoArea = document.getElementById("info_area");
                                    var innerHtml = "";
                                    innerHtml += "<b>Train ID</b><br>" + trainName.replace(TRAIN_PREFIX, "");
                                    innerHtml += "<br><br>"
                                    innerHtml += "<b>Location</b><br>" + "Lon: " + trainCoordinates[0] + "<br>" + "Lat: " + trainCoordinates[1];
                                    innerHtml += "<br><br>"
                                    innerHtml += "<b>Status</b><br>" + (trainIsMoving ? "Enroute to next station" : "Stopped at station");
                                    infoArea.innerHTML = innerHtml;
                                }
                            });
                        }
                    }
                    break; // L1
                }

                // ===== This route can be rendered after this point ===== //
                totalTrains += 1;
                const trainAllCoordinates = trains[tripId]["allCoordinates"];

                // Function to process coordinates and update tracking
                function processCoordinatePair(a0, a1, b0, b1) {
                    const forwardKey = `${a0},${a1},${b0},${b1}`;
                    const reverseKey = `${b0},${b1},${a0},${a1}`;
                    if (uniquePointSections.includes(forwardKey)) {
                        if (!overlaidPointSections[forwardKey]) {
                            overlaidPointSections[forwardKey] = {};
                            overlaidPointSections[forwardKey]["from"] = [a0, a1];
                            overlaidPointSections[forwardKey]["to"] = [b0, b1];
                            overlaidPointSections[forwardKey]["trains"] = 2;
                        } else {
                            overlaidPointSections[forwardKey]["trains"] = overlaidPointSections[forwardKey]["trains"] + 1;
                        }
                        // filter from unique points
                        uniquePointSections.filter(key => key == forwardKey);
                    } else if (uniquePointSections.includes(reverseKey)) {
                        if (!overlaidPointSections[reverseKey]) {
                            overlaidPointSections[reverseKey] = {};
                            overlaidPointSections[reverseKey]["from"] = [b0, b1];
                            overlaidPointSections[reverseKey]["to"] = [a0, a1];
                            overlaidPointSections[reverseKey]["trains"] = 2;
                        } else {
                            overlaidPointSections[reverseKey]["trains"] = overlaidPointSections[reverseKey]["trains"] + 1;
                        }
                        // filter from unique points
                        uniquePointSections.filter(key => key == reverseKey);
                    } else {
                        // add unique point
                        uniquePointSections.push(forwardKey);
                    }
                }

                // Forward traversal
                let lastCoordinate = null;
                for (const coordinate of trainAllCoordinates) {
                    if (lastCoordinate) {
                        processCoordinatePair(lastCoordinate[0], lastCoordinate[1], coordinate[0], coordinate[1]);
                    }
                    lastCoordinate = coordinate;
                }

                // draw this train's shape
                const shapeName = ROUTE_PREFIX + tripId;
                map.addSource(shapeName, {
                    "type": "geojson",
                    "data": {
                        "type": "Feature",
                        "properties": {},
                        "geometry": {
                            "type": "LineString",
                            "coordinates": trainAllCoordinates
                        },
                        "id": shapeName
                    }
                });
                map.addLayer({
                    "id": shapeName,
                    "type": "line",
                    "source": shapeName,
                    "layout": {
                        "visibility": "visible",
                        "line-join": "round",
                        // "line-cap": "round"
                    },
                    "paint": {
                        "line-opacity": 1.0,
                        "line-color": "#808080",
                        "line-width": 2
                    }
                });

                const existingElement = document.getElementById(shapeName);
                if (existingElement) {
                    // delete the existing element
                    existingElement.parentElement.remove();
                }
                const menu = document.getElementById("train_menu");
                const listItem = document.createElement("li");
                const link = document.createElement("a");
                link.id = shapeName;
                link.href = "#";
                link.textContent = tripId;
                link.className = "map_menu_item_active";

                link.onclick = function (e) {
                    const shapeLayer = ROUTE_PREFIX + this.textContent;
                    const trainLayer = TRAIN_PREFIX + this.textContent;
                    e.preventDefault();
                    e.stopPropagation();

                    const shapeVisibility = map.getLayoutProperty(shapeLayer, "visibility");
                    const trainVisibility = map.getLayoutProperty(trainLayer, "visibility");
                    if (shapeVisibility === "visible" && trainVisibility === "visible") {
                        map.setLayoutProperty(shapeLayer, "visibility", "none");
                        map.setLayoutProperty(trainLayer, "visibility", "none");
                        this.className = "map_menu_item_inactive";
                    } else {
                        map.setLayoutProperty(shapeLayer, "visibility", "visible");
                        map.setLayoutProperty(trainLayer, "visibility", "visible");
                        this.className = "map_menu_item_active";
                    }
                };

                // add the item to the routes list
                listItem.appendChild(link);
                menu.appendChild(listItem);

                // ===================== Add Railway Stops ===================== //
                const numberOfStops = Object.keys(stopTimes[tripId]);
                for (var index in numberOfStops) {
                    const stopId = stopTimes[tripId][index]["stopId"];
                    if (!stops[stopId]) continue;
                    const stopCoordinates = stops[stopId]["coordinates"];
                    const stopName = STOP_PREFIX + stopId;
                    if (!(renderedStops.includes(stopName))) {
                        renderedStops.push(stopName);
                        map.addSource(stopName, {
                            "type": "geojson",
                            "data": {
                                "type": "FeatureCollection",
                                "features": [
                                    {
                                        "type": "Feature",
                                        "id": stopName, 
                                        "geometry": {
                                            "type": "Point",
                                            "coordinates": stopCoordinates
                                        },
                                        "properties": {
                                            "name": stopName
                                        }
                                    }
                                ]
                            }
                        });
                        if (!map.getLayer(stopName)) {
                            map.addLayer({
                                "id": stopName,
                                "type": "circle",
                                "source": stopName,
                                "minzoom": MINIMUM_ZOOM_FOR_STOP_VISIBILITY,
                                "layout": {
                                    "visibility": "visible"
                                },
                                "paint": {
                                    "circle-radius": 6,
                                    "circle-color": "#404040"
                                }
                            });
                            
                            map.addInteraction(stopName + "_click", {
                                type: "click",
                                target: { layerId: stopName },
                                handler: async ({ feature }) => {
                                    console.log("[DEBUG]: Clicked stop: " + stopId);
                                    const infoArea = document.getElementById("info_area");
                                    var innerHtml = "";
                                    innerHtml = "Loading stop info...";
                                    infoArea.innerHTML = innerHtml;

                                    const weather = await fetchWeatherData(stopCoordinates[1], stopCoordinates[0]);
                                    innerHtml = "<b>Stop ID</b><br>" + stopId;
                                    innerHtml += "<br><br>"
                                    innerHtml += "<b>Current Weather</b><br>" + weather.temperature + "°C, " + weather.description;
                                    infoArea.innerHTML = innerHtml;
                                }
                            });
                        }
                    }
                }
            }

            // TODO: sort all coordinates to reduce the amount of lines to draw.
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
            var unsorted = [];
            
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
            var sortedCoordinates = [];
            for (const entry in overlaidPointSections) {
                unsorted.push(
                    {
                        "trains": overlaidPointSections[entry]["trains"],
                        "coordinates": [overlaidPointSections[entry]["from"], overlaidPointSections[entry]["to"]]
                    }
                );
            }

            // for each in unsorted:
            for (const current of unsorted) {
                var matched = true;
                // search sortedCoordinates for matching number of trains on this track
                if (sortedCoordinates.length > 0) {
                    for (let i = 0; i < sortedCoordinates.length; i++) {
                        if (sortedCoordinates[i]["trains"] == current["trains"]) {
                            // if found:
                            //      test to see if the coordinates start with last current coordinate
                            const a = current["coordinates"][current["coordinates"].length - 1][0];
                            const b = current["coordinates"][current["coordinates"].length - 1][1];
                            const c = sortedCoordinates[i]["coordinates"][0][0];
                            const d = sortedCoordinates[i]["coordinates"][0][1];
                            
                            const e = current["coordinates"][0][0];
                            const f = current["coordinates"][0][1];
                            const g = sortedCoordinates[i]["coordinates"][sortedCoordinates[i]["coordinates"].length - 1][0];
                            const h = sortedCoordinates[i]["coordinates"][sortedCoordinates[i]["coordinates"].length - 1][1];
                            //      if it starts with the last current coordinate:
                            if (a == c && b == d) {
                                //          append this unsorted coordinate to the start of the sorted coordinate
                                sortedCoordinates[i]["coordinates"] = [...current["coordinates"], ...sortedCoordinates[i]["coordinates"]];
                                break;
                            }
                            //      if it ends with the first current coordinate:
                            if (e == g && f == h) {
                                //          append this unsorted coordinate to the end of the sorted coordinate
                                sortedCoordinates[i]["coordinates"] = [...sortedCoordinates[i]["coordinates"], ...current["coordinates"]];
                                break;
                            }
                        }
                        if (i + 1 >= sortedCoordinates.length) {
                            //      else no matches
                            //          add to sortedCoordinates with this number of trains as there is no match.
                            matched = false;
                        }
                    }
                }
                if (!matched || sortedCoordinates.length === 0) {
                    //  not found:
                    //      add to sorted coordinates
                    sortedCoordinates.push(
                        {
                            "trains": current["trains"],
                            "coordinates": current["coordinates"]
                        }
                    );
                }
            }

            console.log("Overlays: " + sortedCoordinates.length);
            for (const obj of sortedCoordinates) {
                const numberOfTrains = obj["trains"];
                const coordinates = obj["coordinates"];
                const shapeName = OVERLAY_PREFIX + String(coordinates.toString());
                map.addSource(shapeName, {
                    "type": "geojson",
                    "data": {
                        "type": "Feature",
                        "properties": {},
                        "geometry": {
                            "type": "LineString",
                            "coordinates": coordinates,
                        },
                        "id": shapeName
                    }
                });
                var color = "";
                for (const capacity in lineColorGradient) {
                    if (numberOfTrains > capacity) {
                        color = lineColorGradient[capacity];
                    }
                }
                map.addLayer({
                    "id": shapeName,
                    "type": "line",
                    "source": shapeName,
                    "layout": {
                        "visibility": "visible",
                        "line-join": "round",
                        // "line-cap": "round"
                    },
                    // TODO: use numberOfTrains to generate colour
                    "paint": {
                        "line-opacity": 0.5,
                        "line-color": color,
                        "line-width": 5
                    }
                });
            }

            console.log("[INFO]: Total trains: " + totalTrains);
            console.log("[INFO]: Total trains at stops: " + totalTrainsAtStops);
            console.log("[INFO]: Total trains moving: " + totalTrainsMoving);
        });

        // ==================== on map idle loop ==================== //
        map.on("idle", () => {
        });
    }, [trains, stops, stopTimes]);

    return (
        <div className="h-full w-full flex-auto flex flex-col justify-center text-center">
            {!isRouteOnExpandedPage &&
                <div className="w-full flex flex-row justify-between text-center">
                    <h3 className="int_label">Railway Map</h3>
                    <Link className="dark_button_mini pl-2 pr-2 pt-1 pb-1 mb-1" href="/map">Expand Map</Link>
                </div>
            }
            <div className="h-full w-full flex flex-col justify-center">
                <button onClick={fetchLatestData} className="px-4 py-2 dark_button mb-1 font-semibold shadow" disabled={loading}>
                    {loading ? "Fetching Data..." : "Fetch Latest Data"}
                </button>
                <div className="map_section">
                    <div id="map" ref={mapContainerRef} className="w-5/7 flex-auto"></div>
                    <div className="map_menu_section">
                        <div className="map_menu">
                            <h2 className="map_menu_title">Info</h2>
                            <p id="info_area">Select a stop or train</p>
                        </div>
                        <div className="map_menu">
                            <h2 className="map_menu_title">Train</h2>
                            <ul id="train_menu" className="pl-4 list-disc"></ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
