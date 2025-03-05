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
    const [loading, setLoading] = useState(false);
    const { setSelectedTrack } = useTrack(); // Track selection context
    const routePrefix = "route_";
    const stopPrefix = "stop_";
    var isRouteOnExpandedPage = (pathname === "/map");
    var d = new Date();
    var yyyy = String(d.getFullYear());
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    var yyyymmdd = Number(yyyy + mm + dd);
    var day = d.getDay();

    const fetchLatestData = async () => {
        setLoading(true);
        const data = await fetchGTFSData();
        setTrains(data.trains);
        setStops(data.stops);
        setLoading(false);
    };

    useEffect(() => {
        if (trains.length === 0) return;

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
            for (let i = 0; i < trains.length; i++) {
                const train = trains[i];
                const trainId = train["id"];
                const trainCoordinates = train["coordinates"];
                const trainStartDate = train["startDate"];
                const trainEndDate = train["endDate"];
                const trainDaysOfOperation = train["daysOfOperation"];

                // check train start/end dates
                if (trainStartDate && trainEndDate) {
                    if (trainStartDate > yyyymmdd || trainEndDate < yyyymmdd) {
                        console.log("Skipping train " + trainId + ": outside start/end date");
                        continue;
                    }
                } else {
                    console.log("Train " + trainId + ": no start/end date - showing anyways");
                }

                // check train days of operation
                if (trainDaysOfOperation) {
                    if (!trainDaysOfOperation[day]) {
                        console.log("Skipping train " + trainId + ": does not run on day " + day);
                        continue
                    }
                } else {
                    console.log("Train " + trainId + ": no days of operation - showing anyways");
                }

                const shapeName = routePrefix + trainId;
                renderableRoutes.push(shapeName);
                map.addSource(shapeName, {
                    "type": "geojson",
                    "data": {
                        "type": "Feature",
                        "properties": {},
                        "geometry": {
                            "type": "LineString",
                            "coordinates": trainCoordinates
                        }
                    }
                });
                map.addLayer({
                    "id": shapeName,
                    "type": "line",
                    "source": shapeName,
                    "layout": {
                        'visibility': 'none',
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
            }

            // ===================== Add Railway Stops ===================== //
            for (let i = 0; i < stops.length; i++) {
                const stop = stops[i];
                const stopId = stop["id"];
                const stopCoordinates = stop["coordinates"];
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
                        // get all coordinates of this train
                        //const coordinates = trainShapes[clickedLayer.replace(routePrefix, "")];
                        //console.log("###### Looking for " + coordinates);
                        //let matchedTrains = [];
                        // TODO: instead of working on coordinates, use trains and skip the train when added
                        //for (let i = 0; i < coordinates.length; i++) {
                        //    const routeCoordinate = coordinates[i];
                        //    for (var trainCoordinate in trainCoords) {
                        //        if (trainCoordinate == routeCoordinate) {
                        //            const trains = trainCoords[trainCoordinate];
                        //            for (let j = 0; j < trains.length; j++) {
                        //                const train = trains[j];
                        //                if (!(matchedTrains.includes(train))) {
                        //                    matchedTrains.unshift(train);
                        //                    const trainMenu = document.getElementById('trains_menu');
                        //                    const trainListItem = document.createElement('li');
                        //                    const trainItem = document.createElement('p');
                        //                    trainItem.textContent = train;
                        //                    trainListItem.appendChild(trainItem);
                        //                    trainMenu.appendChild(trainListItem);
                        //                }
                        //            }
                        //        }
                        //    }
                        //}
                        console.log("Done matching");
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
