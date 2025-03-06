import { usePathname } from "next/navigation";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { fetchGTFSData } from "./utils/fetchShapeData";
import { useTrack } from "./context/TrackContext";
import "../styles.css";

export function Map() {
    const pathname = usePathname();
    const mapContainerRef = useRef();
    const mapRef = useRef();
    const [trains, setTrains] = useState([]);
    const [stops, setStops] = useState([]);
    const [stopTimes, setStopTimes] = useState([]);
    const [loading, setLoading] = useState(false);
    const { setSelectedTrack } = useTrack(); // Track selection context
    const routePrefix = "route_"; // for route names
    const stopPrefix = "stop_"; // for stop names
    const trainPrefix = "train_"; // for train names
    var isRouteOnExpandedPage = (pathname === "/map");
    var today = new Date();
    var day = today.getDay();

    const fetchLatestData = async () => {
        setLoading(true);
        const data = await fetchGTFSData();
        setTrains(data.trains);
        setStops(data.stops);
        setStopTimes(data.stopTimes);
        setLoading(false);
    };

    useEffect(() => {
        if (trains.length === 0) return;
        if (stops.length === 0) return;
        if (stopTimes.length === 0) return;

        mapboxgl.accessToken = "pk.eyJ1IjoiaGFveXUtZ3VvIiwiYSI6ImNtNmRhZDJqNzBxOHIybW9wdzNzdmY5a20ifQ.8wDFOeZgYyCp-7ggCDA6Fw";
        const map = new mapboxgl.Map({
            "container": "map",
            "style": 'mapbox://styles/mapbox/dark-v11',
            "center": [-79.38032, 43.64481], // TODO: find center
            "zoom": 5.0
        });

        const stopProperties = document.getElementById('stopProperties');
        const setStopPropertiesText = (feature) => {
            stopProperties.innerHTML = `${feature}`;
            stopProperties.style.display = 'block';
        };
        const routeProperties = document.getElementById('routeProperties');
        const setRoutePropertiesText = (feature) => {
            routeProperties.innerHTML = `${feature}`;
            routeProperties.style.display = 'block';
        };
        let selectedStop = null;
        let selectedRoute = null;

        let renderableStops = [];
        let renderableRoutes = [];

        map.on("load", () => {
            // ===================== Add Railway Lines ===================== //
            for (var trainId in trains) {
                const trainAllCoordinates = trains[trainId]["allCoordinates"];
                const trainStartDate = trains[trainId]["startDate"];
                const trainEndDate = trains[trainId]["endDate"];
                const trainDaysOfOperation = trains[trainId]["daysOfOperation"];

                // ===== Check renderability ===== //
                // start/end dates
                if (trainStartDate && trainStartDate > today) {
                    console.log("[INFO]: Skipping train " + trainId + " because the start date is not met");
                    continue;
                }
                if (trainEndDate && trainEndDate < today) {
                    console.log("[INFO]: Skipping train " + trainId + " because the end date has been met");
                    continue;
                }

                // days of operation
                if (trainDaysOfOperation && !trainDaysOfOperation[day]) {
                    console.log("[INFO]: Skipping train " + trainId + " because it does not run today");
                    continue;
                }


                // ===== This route can be rendered after this point ===== //
                
                const shapeName = routePrefix + trainId;
                renderableRoutes.push(shapeName);
                map.addSource(shapeName, {
                    "type": "geojson",
                    "data": {
                        "type": "Feature",
                        "properties": {},
                        "geometry": {
                            "type": "LineString",
                            "coordinates": trainAllCoordinates
                        }
                    }
                });
                map.addLayer({
                    "id": shapeName,
                    "type": "line",
                    "source": shapeName,
                    "layout": {
                        'visibility': 'visible',
                        "line-join": "round",
                        "line-cap": "round"
                    },
                    "paint": {
                        "line-color": "#00f000",
                        "line-width": 4
                    }
                });
                map.addInteraction(shapeName + '_click', {
                    type: 'click',
                    target: { layerId: shapeName },
                    handler: ({ feature }) => {
                        // clear existing selected route
                        if (selectedRoute) map.setFeatureState(selectedRoute, { selected: false });
                        // set selected route
                        selectedRoute = feature;
                        map.setFeatureState(feature, { selected: true });
                        setRoutePropertiesText(shapeName);
                    }
                });
                
                // ===== Estimate train location ===== //
                // using stop times (iterate):
                // *** L1
                for (var tripId in stopTimes) {
                    if (tripId !== trainId) continue;
                //  - check departure time of this stop compared to current time:
                    const stopData = stopTimes[tripId];
                    // *** L2
                    for (let i = 0; i < Object.keys(stopData).length; i++) {
                //      - if current time is less than or equal to the departure time
                        const departTime = stopData[i]["departureTime"];
                        const currentHours = today.getHours();
                        const currentMinutes = today.getMinutes();
                        const currentCombined = (currentHours * 60) + currentMinutes;
                        const departHours = departTime.getHours();
                        const departMinutes = departTime.getMinutes();
                        const departCombined = (departHours * 60) + departMinutes;
                        if (currentCombined <= departCombined) {
                //          - then we know the train is here, or enroute to here
                //          - check arrival time
                            const arriveTime = stopData[i]["arrivalTime"];
                            const arriveHours = arriveTime.getHours();
                            const arriveMinutes = arriveTime.getMinutes();
                            const arriveCombined = (arriveHours * 60) + arriveMinutes;
                            let trainCoordinates = [0, 0];
                //          - if current time is more than arrival time
                            if (currentCombined >= arriveCombined || i === 0) {
                //              - then the train is at this stop
                //              // set trainCoordinates
                                const stopId = stopData[i]["stopId"];
                                // *** L3
                                for (var id in stops) {
                                    if (id !== stopId) continue;
                                    const stopIdCoordinates = stops[id]["coordinates"];
                                    trainCoordinates = stopIdCoordinates;
                                    break; // L3
                                }
                //              // TODO: highlight this section of track to become red
                //          - else
                            } else {
                //              - then the train is enroute to this stop
                //              // calculate average train velocity
                //              // (this stop's distance - last stop's distance) / (this stop's arrival time - last stop's departure time)
                                const currentDistance = parseFloat(stopData[i]["distance"]);
                                const lastDistance = parseFloat(stopData[i - 1]["distance"]);
                                const lastArriveTime = stopData[i - 1]["arrivalTime"];
                                const lastHours = lastArriveTime.getHours();
                                const lastMinutes = lastArriveTime.getMinutes();
                                const lastCombined = (lastHours * 60) + lastMinutes;
                //              // velocity (meters/minute) * time = approximate train location
                                const approxVelocity = (currentDistance - lastDistance) / (arriveCombined - lastCombined);
                                const approxDistance = (approxVelocity * (currentCombined - lastCombined)) + lastDistance;
                //              // find closest renderable location
                                const trainDistanceCoordinates = trains[trainId]["distanceCoordinates"];
                                const keys = Object.keys(trainDistanceCoordinates);
                                // *** L4
                                for (let j = 0; j < keys.length; j++) {
                                    const distance = Object.keys(keys[i])[0];
                                    if (distance <= approxDistance) {
                                        trainCoordinates = trainDistanceCoordinates[distance];
                                    } else {
                                        break; // L4
                                    }
                                }
                //              // TODO: highlight this section of track to become red
                            }
                            // draw train dot at this approximate location
                            if (trainCoordinates[0] === 0 && trainCoordinates[1] === 0) {
                                console.log("[ERROR]: Could not locate train: " + trainId);
                            } else {
                                const trainName = trainPrefix + trainId;
                                map.addSource(trainName, {
                                    'type': 'geojson',
                                    'data': {
                                        'type': 'FeatureCollection',
                                        'features': [
                                            {
                                                'type': 'Feature',
                                                'geometry': {
                                                    'type': 'Point',
                                                    'coordinates': trainCoordinates
                                                }
                                            }
                                        ]
                                    }
                                });

                                map.addLayer({
                                    'id': trainName,
                                    'type': 'circle',
                                    'source': trainName,
                                    'layout': {
                                        'visibility': 'visible'
                                    },
                                    'paint': {
                                        'circle-radius': 6,
                                        'circle-color': '#f0f000'
                                    }
                                });
                            }
                            break; // L2
                //      - else (current time > departure time)
                        } else {
                //          - the train left this stop, continue loop
                            continue; // L2
                        }
                    }
                    // already found the track, break loop
                    break; // L1
                }
            }

            // ===================== Add Railway Stops ===================== //
            for (var stopId in stops) {
                const stopCoordinates = stops[stopId]["coordinates"];
                const stopName = stopPrefix + stopId;
                renderableStops.push(stopName);
                map.addSource(stopName, {
                    'type': 'geojson',
                    'data': {
                        'type': 'FeatureCollection',
                        'features': [
                            {
                                'type': 'Feature',
                                'geometry': {
                                    'type': 'Point',
                                    'coordinates': stopCoordinates
                                }
                            }
                        ]
                    }
                });

                map.addLayer({
                    'id': stopName,
                    'type': 'circle',
                    'source': stopName,
                    'layout': {
                        'visibility': 'none'
                    },
                    'paint': {
                        'circle-radius': 4,
                        'circle-color': '#f0f0f0'
                    }
                });

                
                map.addInteraction(stopName + '_click', {
                    type: 'click',
                    target: { layerId: stopName },
                    handler: ({ feature }) => {
                        // clear existing selected stop
                        if (selectedStop) map.setFeatureState(selectedStop, { selected: false });
                        // set selected stop
                        selectedStop = feature;
                        map.setFeatureState(feature, { selected: true });
                        setStopPropertiesText(stopName);
                    }
                });
            }
            map.addInteraction('map-click', {
                type: 'click',
                handler: () => {
                    // clear selected stop
                    if (selectedStop) {
                        map.setFeatureState(selectedStop, { selected: false });
                        selectedStop = null;
                    }
                    // clear selected route
                    if (selectedRoute) {
                        map.setFeatureState(selectedRoute, { selected: false });
                        selectedRoute = null;
                    }
                }
            });
        });
        map.on('idle', () => {
            for (const id of renderableRoutes) {
                if (document.getElementById(id)) continue;

                const menu = document.getElementById('routes_menu');
                const listItem = document.createElement('li');
                const link = document.createElement('a');
                link.id = id;
                link.href = '#';
                link.textContent = id;
                link.className = 'map_menu_item_active';

                link.onclick = function (e) {
                    const clickedLayer = this.textContent;
                    e.preventDefault();
                    e.stopPropagation();

                    const visibility = map.getLayoutProperty(clickedLayer, 'visibility');
                    if (visibility === 'visible') {
                        // set clickedLayer visibility to none
                        map.setLayoutProperty(clickedLayer, 'visibility', 'none');
                        this.className = 'map_menu_item_inactive';
                    } else {
                        this.className = 'map_menu_item_active';
                        // set clickedLayer visibility to visible
                        map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
                    }
                };

                // add the item to the routes list
                listItem.appendChild(link);
                menu.appendChild(listItem);
            }
            for (const id of renderableStops) {
                if (document.getElementById(id)) continue;

                const menu = document.getElementById('stops_menu');
                const listItem = document.createElement('li');
                const link = document.createElement('a');
                link.id = id;
                link.href = '#';
                link.textContent = id;
                link.className = 'map_menu_item_inactive';

                link.onclick = function (e) {
                    const clickedLayer = this.textContent;
                    e.preventDefault();
                    e.stopPropagation();

                    const visibility = map.getLayoutProperty(clickedLayer, 'visibility');
                    if (visibility === 'visible') {
                        // set clickedLayer visibility to none
                        map.setLayoutProperty(clickedLayer, 'visibility', 'none');
                        this.className = 'map_menu_item_inactive';
                    } else {
                        this.className = 'map_menu_item_active';
                        // set clickedLayer visibility to visible
                        map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
                    }
                };

                // add the item to the routes list
                listItem.appendChild(link);
                menu.appendChild(listItem);
            }
        });
    }, [trains, stops]);

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
                <div id="stopProperties"><p>Select a stop</p></div>
                <div id="routeProperties"><p>Select a route</p></div>
                <div className="map_section">
                    <div id="map" ref={mapContainerRef} className="w-80 flex-auto"></div>
                    <div className="map_menu">
                        <div>
                            <h2 className="map_menu_title">Routes</h2>
                            <ul id="routes_menu" className="list-disc"></ul>
                        </div>
                        <div>
                            <h2 className="map_menu_title">Stops</h2>
                            <ul id="stops_menu" className="list-disc"></ul>
                        </div>
                        <div>
                            <h2 className="map_menu_title">On Route</h2>
                            <ul id="trains_menu" className="list-disc"></ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
