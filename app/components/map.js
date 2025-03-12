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
    // minimum zoom level for stops
    const MINIMUM_ZOOM_FOR_STOP_VISIBILITY = 6.0;

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
    var today = new Date();
    var today = new Date("2025-03-06");
    // TODO: use real time
    today.setHours(16);
    today.setMinutes(36);
    var day = today.getDay();

    const fetchLatestData = async () => {
        setLoading(true);

        const data = await fetchGTFSData();

        // Convert stops object to an array
        const stopCoordinates = Object.keys(data.stops).map(stopId => ({
            id: stopId,
            lat: parseFloat(data.stops[stopId].coordinates[1]),
            lon: parseFloat(data.stops[stopId].coordinates[0])
        }));

        let weatherData = {};

        // Fetch weather data sequentially for each stop
        for (let stop of stopCoordinates) {
            const weather = await fetchWeatherData(stop.lat, stop.lon);
            weatherData[`${stop.lat},${stop.lon}`] = weather;
        }

        // Attach weather data to stops
        const stopsWithWeather = stopCoordinates.map(stop => {
            const weatherKey = `${stop.lat},${stop.lon}`;
            return { ...data.stops[stop.id], id: stop.id, weather: weatherData[weatherKey] || null };
        });

        setTrains(data.trains);
        setStops(stopsWithWeather);
        setStopTimes(data.stopTimes);

        // default zoom level
        if (lastZoom === 0.0) setLastZoom(6.0);
        // TODO: automatically find center
        if (!lastCenter) setLastCenter([-79.38032, 43.64481]);

        setLoading(false);
    };


    useEffect(() => {
        if (trains.length === 0) return;
        if (stops.length === 0) return;
        if (stopTimes.length === 0) return;

        // current rendered stops
        let renderedStops = [];

        // routes that can be rendered
        let renderableRoutes = [];

        // current rendered routes
        let renderedRoutes = [];

        // TODO: this should be .env file
        mapboxgl.accessToken = "pk.eyJ1IjoiaGFveXUtZ3VvIiwiYSI6ImNtNmRhZDJqNzBxOHIybW9wdzNzdmY5a20ifQ.8wDFOeZgYyCp-7ggCDA6Fw";
        const map = new mapboxgl.Map({
            "container": "map",
            "style": 'mapbox://styles/mapbox/light-v11',
            "center": lastCenter,
            "zoom": lastZoom
        });


        let selectedStop = null;
        let selectedRoute = null;
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
                // update current zoom / center
                setLastZoom(map.getZoom());
                setLastCenter(map.getCenter());
            }
        });
        
        map.on('moveend', () => {
            // update current center
            setLastCenter(map.getCenter());
        });

        map.on('zoomend', () => {
            // update current zoom
            setLastZoom(map.getZoom());
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


        // ==================== on map load ==================== //
        map.on("load", () => {
            // ===================== Add Weather Overlay ===================== //
            stops.forEach((stop) => {
                if (!stop.weather) return; // Skip stops without weather data
            
                const weatherLayerId = `weather_${stop.id}`;
            
                map.addSource(weatherLayerId, {
                    type: "geojson",
                    data: {
                        type: "Feature",
                        geometry: {
                            type: "Point",
                            coordinates: stop.coordinates
                        },
                        properties: {
                            icon: stop.weather.icon
                        }
                    }
                });
            
                map.addLayer({
                    id: weatherLayerId,
                    type: "symbol",
                    source: weatherLayerId,
                    layout: {
                        "icon-image": ["get", "icon"],
                        "icon-size": 0.5
                    }
                });
            
                // Add popup for weather
                const popup = new mapboxgl.Popup({ offset: 25, closeButton: true })
                    .setHTML(
                        `<b>${stop.name}</b><br>
                        Temp: ${stop.weather.temperature}°C<br>
                        ${stop.weather.description}<br>
                        Wind: ${stop.weather.windSpeed} km/h`
                    );
            
                new mapboxgl.Marker()
                    .setLngLat(stop.coordinates)
                    .setPopup(popup)
                    .addTo(map);
            });
            
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
                if (trainEndDate && trainEndDate < today) {
                    console.log("[INFO]: Skipping train " + tripId + " because the end date has been met");
                    continue; // L0
                }

                // days of operation
                if (trainDaysOfOperation && !trainDaysOfOperation[day]) {
                    console.log("[INFO]: Skipping train " + tripId + " because it does not run today");
                    continue; // L0
                }


                // ===== This route can be rendered after this point ===== //

                const trainAllCoordinates = trains[tripId]["allCoordinates"];
                const shapeName = ROUTE_PREFIX + tripId;
                renderableRoutes.push(shapeName);
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
                        'visibility': 'visible',
                        "line-join": "round",
                        "line-cap": "round"
                    },
                    "paint": {
                        "line-color": "#00c000",
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
                            'type': 'geojson',
                            'data': {
                                'type': 'FeatureCollection',
                                'features': [
                                    {
                                        'type': 'Feature',
                                        'id': stopName, 
                                        'geometry': {
                                            'type': 'Point',
                                            'coordinates': stopCoordinates
                                        },
                                        'properties': {
                                            'name': stopName
                                        }
                                    }
                                ]
                            }
                        });
                        map.addLayer({
                            'id': stopName,
                            'type': 'circle',
                            'source': stopName,
                            'minzoom': MINIMUM_ZOOM_FOR_STOP_VISIBILITY,
                            'layout': {
                                'visibility': 'visible'
                            },
                            'paint': {
                                'circle-radius': 6,
                                'circle-color': '#404040'
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
                }
                
                // ===== Estimate train location ===== //

                // - check departure time of this stop compared to current time:
                const stopData = stopTimes[tripId];
                // *** L1
                for (let i = 0; i < Object.keys(stopData).length; i++) {
                    // - if current time is less than or equal to the departure time
                    const departTime = stopData[i]["departureTime"];
                    const currentTimeMinutes = (today.getHours() * 60) + today.getMinutes();
                    const departTimeMinutes = (departTime.getHours() * 60) + departTime.getMinutes();
                    if (currentTimeMinutes <= departTimeMinutes) {
                        // - then we know the train is here, or enroute to here
                        // - check arrival time
                        const arriveTime = stopData[i]["arrivalTime"];
                        const arriveTimeMinutes = (arriveTime.getHours() * 60) + arriveTime.getMinutes();
                        let trainCoordinates = [0, 0];
                        // - if current time is more than arrival time
                        if (currentTimeMinutes >= arriveTimeMinutes || i === 0) {
                            // - then the train is at this stop
                            // set trainCoordinates
                            const stopId = stopData[i]["stopId"];
                            // *** L2
                            for (var id in stops) {
                                if (id !== stopId) continue;
                                const stopIdCoordinates = stops[id]["coordinates"];
                                trainCoordinates = stopIdCoordinates;
                                break; // L2
                            }
                            // TODO: highlight this section of track to become red
                        } else {
                            // - then the train is enroute to this stop
                            // calculate average train velocity
                            // (this stop's distance - last stop's distance) / (this stop's arrival time - last stop's departure time)
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
                                console.log(String(trainDistanceCoordinates[key]));
                                const distance = Object.keys(trainDistanceCoordinates[key])[0];
                                if (distance <= approxDistance) {
                                    trainCoordinates = trainDistanceCoordinates[key][distance];
                                } else {
                                    break; // L3
                                }
                            }
                            // TODO: highlight this section of track to become red
                        }
                        // draw train dot at this approximate location
                        if (trainCoordinates[0] === 0 && trainCoordinates[1] === 0) {
                            console.log("[ERROR]: Could not locate train: " + tripId);
                        } else {
                            const trainName = TRAIN_PREFIX + tripId;
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

                            // train dot color generator
                            var tripIdNumber = Number(tripId);
                            while (tripIdNumber > 100) {
                                tripIdNumber -= 100;
                            }
                            map.addLayer({
                                'id': trainName,
                                'type': 'circle',
                                'source': trainName,
                                'layout': {
                                    'visibility': 'visible'
                                },
                                'paint': {
                                    'circle-radius': 8,
                                    'circle-color': "#" + ((1 << 24) * (tripIdNumber / 100) | 0).toString(16).padStart(6, "0"),
                                    'circle-stroke-color': '#404040',
                                    'circle-stroke-width': 2
                                }
                            });
                        }
                        break; // L1
                    } else {
                        // - else (current time > departure time)
                        // - the train left this stop, continue loop
                        continue; // L1
                    }
                }
            }
        });

        // ==================== on map idle loop ==================== //
        map.on('idle', () => {
            if (renderableRoutes.length !== renderedStops.length) {
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
                    renderedRoutes.push(id);
                }
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
                    </div>
                </div>
            </div>
        </div>
    );
}
