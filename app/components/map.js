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
    const [shapes, setShapes] = useState({});
    const [stops, setStops] = useState({});
    const [loading, setLoading] = useState(false);
    const { setSelectedTrack } = useTrack(); // Track selection context

    var isRouteOnExpandedPage = (pathname === "/map");

    const fetchLatestData = async () => {
        setLoading(true);
        const data = await fetchGTFSData();
        setShapes(data.shapes);
        setStops(data.stops);
        setLoading(false);
    };

    useEffect(() => {
        if (shapes.length === 0) return;

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
            for (const [shape, coords] of Object.entries(shapes)) {
                const shapeName = "shape_" + shape;
                renderableRoutes.push(shapeName);
                map.addSource(shapeName, {
                    "type": "geojson",
                    "data": {
                        "type": "Feature",
                        "properties": {},
                        "geometry": {
                            "type": "LineString",
                            "coordinates": coords
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
            for (const [stop, coords] of Object.entries(stops)) {
                const stopName = "stop_" + stop;
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
                                    'coordinates': coords
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
    }, [shapes]);

    return (
        <div className="h-full w-full flex-auto flex flex-col justify-center text-center">
            {!isRouteOnExpandedPage &&
                <div className="w-full flex flex-row justify-between text-center">
                    <h1 className="int_label">Railway Map</h1>
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
                    <div id="map" ref={mapContainerRef} className="h-full w-80 flex-auto"></div>
                    <div className="map_menu">
                        <div>
                            <h2 className="map_menu_title">Routes</h2>
                            <ul id="routes_menu" className="list-disc"></ul>
                        </div>
                        <div>
                            <h2 className="map_menu_title">Stops</h2>
                            <ul id="stops_menu" className="list-disc"></ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
