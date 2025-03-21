import Link from "next/link";
import mapboxgl from "mapbox-gl";
import React, { useEffect, useRef, useState } from "react";
import { fetchGTFSData } from "./utils/fetchShapeData";
import { fetchWeatherData } from "./utils/fetchWeather";
import { usePathname } from "next/navigation";
import { useTrack } from "./context/TrackContext";

import "mapbox-gl/dist/mapbox-gl.css";
import "../styles.css";

export function Map() {
    const ROUTE_PREFIX = "route_";
    const STOP_PREFIX = "stop_";
    const TRAIN_PREFIX = "train_";
    const OVERLAY_PREFIX = "overlay_";
    const WEATHER_LOADING_PLACEHOLDER = "Loading weather...";
    const MINIMUM_ZOOM_FOR_STOP_VISIBILITY = 7.0;
    const MINIMUM_ZOOM_FOR_TRAIN_VISIBILITY = 4.5;
    const DAYS = {
        0: "Sunday",
        1: "Monday",
        2: "Tuesday",
        3: "Wednesday",
        4: "Thursday",
        5: "Friday",
        6: "Saturday"
    }
    
    const MONTHS = {
        0: "Jan",
        1: "Feb",
        2: "Mar",
        3: "Apr",
        4: "May",
        5: "Jun",
        6: "Jul",
        7: "Aug",
        8: "Sep",
        9: "Oct",
        10: "Nov",
        11: "Dec"
    }

    // color gradient
    // {
    //      #ofTrains: "colorHex"
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
    //}
    
    // use this for debug (or ~10 trains/track)
    const LINE_COLOR_GRADIENT = {
        0: "#00ff00",
        2: "#66ff00",
        4: "#ddff00",
        6: "#ff2200",
        8: "#000000"
    }

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
    
    // sorting function/algorithm for train capacity highlights
    function sortAndMerge(unsortedIn) {
        var sorted = [];
        // for each in unsorted:
        for (const current of unsortedIn) {
            var matched = true;
            // search sortedCoordinates for matching number of trains on this track
            if (sorted.length > 0) {
                for (let i = 0; i < sorted.length; i++) {
                    if (sorted[i]["trains"] == current["trains"]) {
                        // if found:
                        //      test to see if the coordinates start with last current coordinate
                        const currentCoordinateLength = current["coordinates"].length;
                        const a = current["coordinates"][currentCoordinateLength - 1][0];
                        const b = current["coordinates"][currentCoordinateLength - 1][1];
                        const c = sorted[i]["coordinates"][0][0];
                        const d = sorted[i]["coordinates"][0][1];
                        
                        const outCoordinateLength = sorted[i]["coordinates"].length;
                        const e = current["coordinates"][0][0];
                        const f = current["coordinates"][0][1];
                        const g = sorted[i]["coordinates"][outCoordinateLength - 1][0];
                        const h = sorted[i]["coordinates"][outCoordinateLength - 1][1];
                        //      if it starts with the last current coordinate:
                        if (a == c && b == d) {
                            //          append this unsorted coordinate to the start of the sorted coordinate
                            sorted[i]["coordinates"] = [...current["coordinates"], ...sorted[i]["coordinates"]];
                            break;
                        }
                        //      if it ends with the first current coordinate:
                        if (e == g && f == h) {
                            //          append this unsorted coordinate to the end of the sorted coordinate
                            sorted[i]["coordinates"] = [...sorted[i]["coordinates"], ...current["coordinates"]];
                            break;
                        }
                    }
                    if (i + 1 >= sorted.length) {
                        //      else no matches
                        //          add to sortedCoordinates with this number of trains as there is no match.
                        matched = false;
                    }
                }
            }
            if (!matched || sorted.length === 0) {
                //  not found:
                //      add to sorted coordinates
                sorted.push(
                    {
                        "trains": current["trains"],
                        "coordinates": current["coordinates"]
                    }
                );
            }
        }

        // sort output based on # of trains
        // so that the most # of trains is last
        // IMPORTANT: ORDER MATTERS FOR CORRECT LAYER RENDERING
        var out = [];
        for (const item of sorted) {
            if (out.length == 0) {
                // just add to list
                out.push(item);
            } else {
                // we need to sort this item based on number of trains
                for (let i = 0; i < out.length; i++) {
                    if (out[i]["trains"] < item["trains"] && i + 1 < out.length) {
                        continue;
                    } else {
                        // append here
                        out.splice(i, 0, item);
                        break;
                    }
                }
            }
        }

        return out;
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
    // TODO: auto-refresh would be nice
    // TODO: mask map https://stackoverflow.com/questions/40772764/mask-mapbox-gl-map-with-arbitrary-polygon

    const fetchLatestData = async () => {
        setLoading(true);

        const data = await fetchGTFSData();

        setTrains(data.trains);
        setStops(data.stops);
        setStopTimes(data.stopTimes);

        // default zoom level
        if (lastZoom === 0.0) setLastZoom(MINIMUM_ZOOM_FOR_STOP_VISIBILITY);
        // TODO: automatically find center
        if (!lastCenter) setLastCenter([-79.38032, 43.64481]);

        setLoading(false);
    };


    useEffect(() => {
        // resets
        document.getElementById("train_menu").textContent = "";
        
        if (trains.length === 0) return;
        if (stops.length === 0) return;
        if (stopTimes.length === 0) return;

        // var today = new Date("2025-03-06");
        // today.setHours(17);
        // today.setMinutes(50);
        var today = new Date();
        var day = today.getDay();
        var renderedStops = [];
        // cached weather for stops
        // {
        //      stopId: weatherData
        // }
        var stopsWeatherCache = {};

        mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;;
        const map = new mapboxgl.Map({
            "container": "map",
            "style": "mapbox://styles/mapbox/light-v9",
            "center": lastCenter,
            "zoom": lastZoom
        });

        // reenable if required
        map["doubleClickZoom"].disable();
        map["dragRotate"].disable();
        map["keyboard"].disable();
        map["touchZoomRotate"].disable();
        
        map.getCanvas().style.cursor = 'pointer';

        map.addInteraction("map_click", {
            type: "click",
            handler: ({feature}) => {
                document.getElementById("info_area").text = "Click on a stop or train <br/>to view its information.";
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
        
        // {
        //      "trainId": {
        //          "coordinates": [[coord, coord]],
        //          "isMoving": boolean
        // }
        var trainShapesToRender = {};
        
        // {
        //      "stopId": [[coord, coord]]
        // }
        var stopShapesToRender = {};


        // ==================== on map load ==================== //
        map.on("load", () => {
            var totalTrains = 0;
            var totalTrainsAtStops = 0;
            var totalTrainsMoving = 0;

            // ===================== Add Railway Lines ===================== //

            // test if this railway line is valid
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
                        trainShapesToRender[tripId] = {};
                        trainShapesToRender[tripId]["coordinates"] = trainCoordinates;
                        trainShapesToRender[tripId]["isMoving"] = trainIsMoving;
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

                const shapeName = ROUTE_PREFIX + tripId;
                // this is now redundant, since traffic is always above the shape
                // kept in code in case we want it later
                // - draw this train's shape
                // map.addSource(shapeName, {
                //     "type": "geojson",
                //     "data": {
                //         "type": "Feature",
                //         "properties": {},
                //         "geometry": {
                //             "type": "LineString",
                //             "coordinates": trainAllCoordinates
                //         },
                //         "id": shapeName
                //     }
                // });
                // map.addLayer({
                //     "id": shapeName,
                //     "type": "line",
                //     "slot": "bottom",
                //     "source": shapeName,
                //     "layout": {
                //         "visibility": "visible",
                //         "line-join": "round",
                //         "line-cap": "round"
                //     },
                //     "paint": {
                //         "line-opacity": 1.0,
                //         "line-color": "#808080",
                //         "line-width": 2
                //     }
                // });

                // delete existing element if exists
                const existingElement = document.getElementById(shapeName);
                if (existingElement) {
                    existingElement.parentElement.remove();
                }
                // add element for train toggle
                const menu = document.getElementById("train_menu");
                const listItem = document.createElement("li");
                const link = document.createElement("a");
                link.id = shapeName;
                link.href = "#";
                link.textContent = tripId;
                link.className = "map_menu_item_active";

                link.onclick = function (e) {
                    // const shapeLayer = ROUTE_PREFIX + this.textContent;
                    const trainLayer = TRAIN_PREFIX + this.textContent;
                    e.preventDefault();
                    e.stopPropagation();

                    // routes are not rendered anymore
                    // const shapeVisibility = map.getLayoutProperty(shapeLayer, "visibility");
                    const trainVisibility = map.getLayoutProperty(trainLayer, "visibility");
                    // if (shapeVisibility === "visible" && trainVisibility === "visible") {
                    if (trainVisibility === "visible") {
                        // map.setLayoutProperty(shapeLayer, "visibility", "none");
                        map.setLayoutProperty(trainLayer, "visibility", "none");
                        this.className = "map_menu_item_inactive";
                    } else {
                        // map.setLayoutProperty(shapeLayer, "visibility", "visible");
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
                    if (!(renderedStops.includes(stopId))) {
                        renderedStops.push(stopId);
                        stopShapesToRender[stopId] = stopCoordinates;
                    }
                }
            }


            // ==================== Add layers to map ==================== //

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
            var unsortedMultiTrain = [];
            var unsortedUniqueTrain = [];

            // add all overlays to unsortedMultiTrain
            for (const entry in overlaidPointSections) {
                unsortedMultiTrain.push(
                    {
                        "trains": overlaidPointSections[entry]["trains"],
                        "coordinates": [overlaidPointSections[entry]["from"], overlaidPointSections[entry]["to"]]
                    }
                );
            }
            
            // add all unique to unsortedUniqueTrain
            for (const item of uniquePointSections) {
                const coordStrings = item.split(",");
                const coord0 = parseFloat(coordStrings[0]);
                const coord1 = parseFloat(coordStrings[1]);
                const coord2 = parseFloat(coordStrings[2]);
                const coord3 = parseFloat(coordStrings[3]);
                unsortedUniqueTrain.push(
                    {
                        "trains": 1,
                        "coordinates": [[coord0, coord1], [coord2, coord3]],
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
            var sortedUniqueCoordinates = sortAndMerge(unsortedUniqueTrain);
            var sortedCoordinates = sortAndMerge(unsortedMultiTrain);

            function renderHighlight(sortedCoordinatesIn) {
                for (const obj of sortedCoordinatesIn) {
                    const numberOfTrains = obj["trains"];
                    const coordinates = obj["coordinates"];
                    const shapeName = OVERLAY_PREFIX + numberOfTrains + "_" + String(coordinates.toString());
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
                    
                    map.addLayer({
                        "id": shapeName,
                        "type": "line",
                        "source": shapeName,
                        "layout": {
                            "visibility": "visible",
                            "line-join": "round",
                            "line-cap": "round"
                        },

                        "paint": {
                            "line-opacity": 1.0,
                            "line-color": getTrainHightlightColor(numberOfTrains),
                            "line-width": 5
                        }
                    });
                }
            }
            
            function renderTrains() {
                for (const tripId in trainShapesToRender) {
                    const trainName = TRAIN_PREFIX + tripId;
                    const trainCoordinates = trainShapesToRender[tripId]["coordinates"];
                    const trainIsMoving = trainShapesToRender[tripId]["isMoving"];
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
                            "minzoom": MINIMUM_ZOOM_FOR_TRAIN_VISIBILITY,
                            "source": trainName,
                            "layout": {
                                "visibility": "visible"
                            },
                            "paint": {
                                "circle-radius": 9,
                                "circle-color": "#" + ((1 << 24) * (tripIdNumber / 100) | 0).toString(16).padStart(6, "0"),
                                "circle-stroke-color": "#5f5f5f",
                                "circle-stroke-width": 2
                            }
                        });
                        map.addInteraction(trainName + "_click", {
                            type: "click",
                            target: { layerId: trainName },
                            handler: async ({ feature }) => {
                                console.log("[DEBUG]: Mouse entered train: " + trainName.replace(TRAIN_PREFIX, ""));
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
            }
            
            function renderStops() {
                for (const stopId in stopShapesToRender) {
                    const stopName = STOP_PREFIX + stopId;
                    const stopCoordinates = stopShapesToRender[stopId];
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
                                "circle-radius": 5,
                                "circle-color": "#606060"
                            }
                        });
                        
                        map.addInteraction(stopName + "_click", {
                            type: "click",
                            target: { layerId: stopName },
                            handler: async ({ feature }) => {
                                console.log("[DEBUG]: Mouse entered stop: " + stopId);
                                const infoArea = document.getElementById("info_area");
                                var innerHtml = "";
                                innerHtml = "<b>Stop ID</b><br>" + stopId;
                                innerHtml += "<br><br>"
                                innerHtml += "<b>Current Weather</b><br>";
                                innerHtml += WEATHER_LOADING_PLACEHOLDER;
                                infoArea.innerHTML = innerHtml;

                                var weather = null;
                                if (stopsWeatherCache[stopName]) {
                                    weather = stopsWeatherCache[stopName];
                                } else {
                                    weather = await fetchWeatherData(stopCoordinates[1], stopCoordinates[0]);
                                    stopsWeatherCache[stopName] = weather
                                }
                                if (weather !== null) {
                                    var weatherString = weather["now"]["desc"] + "<br>";
                                    weatherString += weather["now"]["temp"] + "°C";
                                    weatherString += "<br><br>";
                                    weatherString += "<b>Forecast</b><br>";
                                    for (let i = 0; i < 14; i++) {
                                        const ref = weather[`${i}`];
                                        const d = new Date(ref["date"]);
                                        const theDay = d.getDay();
                                        const theMonth = d.getMonth();
                                        const theDate = d.getDate();
                                        weatherString += "&#8226; " + DAYS[theDay] + ", " + MONTHS[theMonth] + " " + theDate + "<br>";
                                        weatherString += "&nbsp;&nbsp;&nbsp;&nbsp;" + ref["desc"] + "<br>";
                                        weatherString += "&nbsp;&nbsp;&nbsp;&nbsp;" + ref["avgtemp"] + "°C (" + ref["maxtemp"] + "°C | " + ref["mintemp"] + "°C)<br><br>";
                                    }
                                    innerHtml = innerHtml.replace(WEATHER_LOADING_PLACEHOLDER, weatherString);
                                } else {
                                    innerHtml = innerHtml.replace(WEATHER_LOADING_PLACEHOLDER, "Could not get weather data.");
                                }
                                infoArea.innerHTML = innerHtml;
                            }
                        });
                    }
                }
            }

            // ====================== Render layers ====================== //
            // ===== THIS IS ORDER-SENSITIVE. DO NOT REARRANGE THIS. ===== //
            // ===== THIS IS ORDER-SENSITIVE. DO NOT REARRANGE THIS. ===== //
            // ===== THIS IS ORDER-SENSITIVE. DO NOT REARRANGE THIS. ===== //
            // ========================== START ========================== //
            renderHighlight(sortedUniqueCoordinates);
            renderHighlight(sortedCoordinates);
            renderTrains();
            renderStops();
            // =========================== END =========================== //

            console.log("[INFO]: Total trains: " + totalTrains);
            console.log("[INFO]: Total trains at stops: " + totalTrainsAtStops);
            console.log("[INFO]: Total trains moving: " + totalTrainsMoving);
        });

        // ==================== on map idle loop ==================== //
        map.on("idle", () => {
        });
    }, [trains, stops, stopTimes]);

    return (
        <div className="size-full flex flex-row gap-4">
            <div className="size-full flex flex-col w-7/8">
                <div className="w-full flex flex-row gap-1 mb-1">
                    {!isRouteOnExpandedPage &&
                        <h3 className="int_label whitespace-nowrap text-left">Railway Map</h3>
                    }
                    <div className="size-full flex flex-row justify-between ml-1">
                        <div className="text-left">
                            {!isRouteOnExpandedPage &&
                                <Link className="dark_button_mini" href="/map">Expand Map</Link>
                            }
                        </div>
                        <div className="text-right">
                            <Link className="dark_button_mini" onClick={fetchLatestData} disabled={loading} href="">
                                {loading ? "Fetching Data..." : "Fetch Latest Data"}
                            </Link>
                        </div>
                    </div>
                </div>
                <div id="map" ref={mapContainerRef} className="size-full"></div>
            </div>
            <div className="h-full min-w-[208px] w-1/8 flex flex-col gap-4">
                <div className="flex flex-col w-full max-h-1/2 h-1/2 map_menu text-left p-4 pt-0 overflow-hidden">
                    <h2 className="map_menu_title">Info</h2>
                    <p id="info_area" className="overflow-scroll">
                        Click on a stop or train <br/>
                        to view its information.
                    </p>
                </div>
                <div className="flex flex-col w-full max-h-1/2 h-1/2 map_menu text-left p-4 pt-0 overflow-hidden">
                    <h2 className="map_menu_title">Train</h2>
                    <ul id="train_menu" className="overflow-scroll pl-4 list-disc"></ul>
                </div>
            </div>
        </div>
    );
}
