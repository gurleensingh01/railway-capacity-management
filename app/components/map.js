import { usePathname } from "next/navigation";
import Link from "next/link";
import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import "../styles.css";

export function Map() {
    const pathname = usePathname();
    const mapContainerRef = useRef();
    const mapRef = useRef();
    var isRouteOnExpandedPage = (pathname === "/map");

    useEffect(() => {
        mapboxgl.accessToken = "pk.eyJ1IjoiaGFveXUtZ3VvIiwiYSI6ImNtNmRhZDJqNzBxOHIybW9wdzNzdmY5a20ifQ.8wDFOeZgYyCp-7ggCDA6Fw";
        mapRef.current = new mapboxgl.Map({
            container: 'map', // container ID
            // Choose from Mapbox's core styles, or make your own style with Mapbox Studio
            style: 'mapbox://styles/mapbox/dark-v11', // style URL
            center: [-73.9709, 40.6712], // starting position [lng, lat]
            zoom: 15.773 // starting zoom
        });

        const geojson = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        coordinates: [
                            [-73.97003, 40.67264],
                            [-73.96985, 40.67235],
                            [-73.96974, 40.67191],
                            [-73.96972, 40.67175],
                            [-73.96975, 40.67154],
                            [-73.96987, 40.67134],
                            [-73.97015, 40.67117],
                            [-73.97045, 40.67098],
                            [-73.97064, 40.67078],
                            [-73.97091, 40.67038],
                            [-73.97107, 40.67011],
                            [-73.97121, 40.66994],
                            [-73.97149, 40.66969],
                            [-73.97169, 40.66985],
                            [-73.97175, 40.66994],
                            [-73.97191, 40.66998],
                            [-73.97206, 40.66998],
                            [-73.97228, 40.67008]
                        ],
                    type: 'LineString'
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
    }, []);

    return (
        <>
            <div className="h-full w-full flex-auto flex flex-col justify-center text-center">
                { !isRouteOnExpandedPage &&
                    <div className="w-full flex flex-row justify-between text-center">
                        <h1 className="text-xl font-bold text-left pl-1">Railway Map</h1>
                        <Link className="text-xs dark_button px-3 py-2 mb-1" href="/map" as="/map">Expand Map</Link>
                    </div>
                }
                <div className="content_background h-full w-full flex flex-col justify-center">
                    <div id="map" ref={mapContainerRef} className="h-full w-full"></div>
                </div>
            </div>
        </>
    );
}
