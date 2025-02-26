import { usePathname } from "next/navigation";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { fetchGTFSData } from "../_utils/fetchShapeData";
import { useTrack } from "../context/TrackContext";
import "../styles.css";

export function Map() {
    const pathname = usePathname();
    const mapContainerRef = useRef();
    const mapRef = useRef();
    const [coordinates, setCoordinates] = useState([]);
    const [shapeGroups, setShapeGroups] = useState([]);
    const [loading, setLoading] = useState(false);
    const { setSelectedTrack } = useTrack(); // Track selection context

    var isRouteOnExpandedPage = (pathname === "/map");

    const fetchLatestData = async () => {
        setLoading(true);
        const data = await fetchGTFSData();
        setCoordinates(data.coordinates);
        setShapeGroups(data.shapeGroups);
        setLoading(false);
    };

    useEffect(() => {
        if (coordinates.length === 0) return;

        mapboxgl.accessToken = "pk.eyJ1IjoiaGFveXUtZ3VvIiwiYSI6ImNtNmRhZDJqNzBxOHIybW9wdzNzdmY5a20ifQ.8wDFOeZgYyCp-7ggCDA6Fw";
        mapRef.current = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/dark-v11',
            center: coordinates[0] || [-79.38032, 43.64481],
            zoom: 5.0
        });

        mapRef.current.on('load', () => {
            // ===================== Add Railway Line ===================== //
            if (coordinates.length > 1) {
                const geojson = {
                    type: 'FeatureCollection',
                    features: [
                        {
                            type: 'Feature',
                            properties: {},
                            geometry: {
                                type: 'LineString',
                                coordinates: coordinates,
                            }
                        }
                    ]
                };

                mapRef.current.addSource('line', {
                    type: 'geojson',
                    data: geojson
                });

                mapRef.current.addLayer({
                    id: 'line-background',
                    type: 'line',
                    source: 'line',
                    paint: {
                        'line-color': 'yellow',
                        'line-width': 6,
                        'line-opacity': 0.4
                    }
                });

                mapRef.current.addLayer({
                    id: 'line-dashed',
                    type: 'line',
                    source: 'line',
                    paint: {
                        'line-color': 'yellow',
                        'line-width': 6,
                        'line-dasharray': [0, 4, 3]
                    }
                });
            }

            // ===================== Add Shape Points (Stops) ===================== //
            shapeGroups.forEach((group) => {
                mapRef.current.addSource(`shape-${group.shape_id}`, {
                    type: "geojson",
                    data: {
                        type: "FeatureCollection",
                        features: group.coordinates.map(coord => ({
                            type: "Feature",
                            geometry: { type: "Point", coordinates: coord },
                            properties: { shape_id: group.shape_id }
                        }))
                    }
                });

                mapRef.current.addLayer({
                    id: `shape-points-${group.shape_id}`,
                    type: "circle",
                    source: `shape-${group.shape_id}`,
                    paint: {
                        "circle-radius": 5,
                        "circle-color": "#00ff00",
                        "circle-stroke-width": 1,
                        "circle-stroke-color": "#fff"
                    }
                });

                // ===================== Click Event for Shape Points ===================== //
                mapRef.current.on("click", `shape-points-${group.shape_id}`, (e) => {
                    const shapeId = e.features[0].properties.shape_id;
                    console.log(`Clicked on Shape ID: ${shapeId}`);
                    setSelectedTrack(shapeId); // Send selected track to KPI component

                    // Temporarily highlight the clicked point
                    mapRef.current.setPaintProperty(
                        `shape-points-${shapeId}`,
                        "circle-color",
                        "#ff0000"
                    );

                    setTimeout(() => {
                        mapRef.current.setPaintProperty(
                            `shape-points-${shapeId}`,
                            "circle-color",
                            "#00ff00"
                        );
                    }, 500);
                });

                // Change cursor to pointer on hover
                mapRef.current.on("mouseenter", `shape-points-${group.shape_id}`, () => {
                    mapRef.current.getCanvas().style.cursor = "pointer";
                });

                mapRef.current.on("mouseleave", `shape-points-${group.shape_id}`, () => {
                    mapRef.current.getCanvas().style.cursor = "";
                });
            });
        });
    }, [coordinates, shapeGroups]);

    return (
        <div className="h-full w-full flex-auto flex flex-col justify-center text-center">
            {!isRouteOnExpandedPage &&
                <div className="w-full flex flex-row justify-between text-center">
                    <h1 className="text-xl font-bold text-left pl-1">Railway Map</h1>
                    <Link className="text-xs dark_button px-3 py-2 mb-1" href="/map">Expand Map</Link>
                </div>
            }
            <div className="h-full w-full flex flex-col justify-center">
                <button onClick={fetchLatestData} className="px-4 py-2 dark_button mb-1 font-semibold shadow" disabled={loading}>
                    {loading ? "Fetching Data..." : "Fetch Latest Data"}
                </button>
                <div id="map" ref={mapContainerRef} className="h-full w-full"></div>
            </div>
        </div>
    );
}
