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

        map.on("load", () => {
            // ===================== Add Railway Lines ===================== //
            for (const [shape, coords] of Object.entries(shapes)) {
                const lineName = "line_" + shape;
                map.addSource(lineName, {
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
                    "id": lineName,
                    "type": "line",
                    "source": lineName,
                    "layout": {
                        "line-join": "round",
                        "line-cap": "round"
                    },
                    "paint": {
                        "line-color": "#00f000",
                        "line-width": 4
                    }
                });
            }

            // ===================== Add Railway Stops ===================== //
            for (const [stop, coords] of Object.entries(stops)) {
                map.addSource(stop, {
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
                    'id': stop,
                    'type': 'circle',
                    'source': stop,
                    'paint': {
                        'circle-radius': 4,
                        'circle-color': '#f0f0f0'
                    }
                });
            }
        });
    }, [shapes]);

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
