import { usePathname } from "next/navigation";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { fetchShapeData } from "../_utils/fetchShapeData";
import "../styles.css";

export function Map() {
    const pathname = usePathname();
    const mapContainerRef = useRef();
    const mapRef = useRef();
    const [coordinates, setCoordinates] = useState([]);
    const [loading, setLoading] = useState(false); // Loading state for button fetch

    var isRouteOnExpandedPage = (pathname === "/map");

    // Function to manually fetch and update data
    const fetchLatestData = async () => {
        setLoading(true); // Show loading state
        const data = await fetchShapeData();
        setCoordinates(data);
        setLoading(false); // Hide loading state
    };

    useEffect(() => {
        if (coordinates.length === 0) return; // Wait until data is fetched

        mapboxgl.accessToken = "pk.eyJ1IjoiaGFveXUtZ3VvIiwiYSI6ImNtNmRhZDJqNzBxOHIybW9wdzNzdmY5a20ifQ.8wDFOeZgYyCp-7ggCDA6Fw";
        mapRef.current = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/dark-v11',
            center: coordinates[0] || [-79.38032, 43.64481], // Default if empty
            zoom: 5.0
        });

        const geojson = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: coordinates, // Use the latest fetched coordinates
                    }
                }
            ]
        };

        mapRef.current.on('load', () => {
            mapRef.current.addSource('line', {
                type: 'geojson',
                data: geojson
            });

            mapRef.current.addLayer({
                type: 'line',
                source: 'line',
                id: 'line-background',
                paint: {
                    'line-color': 'yellow',
                    'line-width': 6,
                    'line-opacity': 0.4
                }
            });

            mapRef.current.addLayer({
                type: 'line',
                source: 'line',
                id: 'line-dashed',
                paint: {
                    'line-color': 'yellow',
                    'line-width': 6,
                    'line-dasharray': [0, 4, 3]
                }
            });

            const dashArraySequence = [
                [0, 4, 3],
                [0.5, 4, 2.5],
                [1, 4, 2],
                [1.5, 4, 1.5],
                [2, 4, 1],
                [2.5, 4, 0.5],
                [3, 4, 0],
                [0, 0.5, 3, 3.5],
                [0, 1, 3, 3],
                [0, 1.5, 3, 2.5],
                [0, 2, 3, 2],
                [0, 2.5, 3, 1.5],
                [0, 3, 3, 1],
                [0, 3.5, 3, 0.5]
            ];

            let step = 0;

            function animateDashArray(timestamp) {
                const newStep = parseInt((timestamp / 50) % dashArraySequence.length);

                if (newStep !== step) {
                    mapRef.current.setPaintProperty(
                        'line-dashed',
                        'line-dasharray',
                        dashArraySequence[step]
                    );
                    step = newStep;
                }

                requestAnimationFrame(animateDashArray);
            }

            animateDashArray(0);
        });
    }, [coordinates]); // Runs only when coordinates change

    return (
        <>
            <div className="h-full w-full flex-auto flex flex-col justify-center text-center">
                { !isRouteOnExpandedPage &&
                    <div className="w-full flex flex-row justify-between text-center">
                        <h1 className="text-xl font-bold text-left pl-1">Railway Map</h1>
                        <Link className="text-xs dark_button px-3 py-2 mb-1" href="/map" as="/map">Expand Map</Link>
                    </div>
                }
                <div className="h-full w-full flex flex-col justify-center">
                    <button
                        onClick={fetchLatestData}
                        className="px-4 py-2 dark_button mb-1 font-semibold shadow"
                        disabled={loading}
                    >
                        {loading ? "Fetching Data..." : "Fetch Latest Data"}
                    </button>
                    <div id="map" ref={mapContainerRef} className="h-full w-full"></div>
                </div>
            </div>
        </>
    );
}
