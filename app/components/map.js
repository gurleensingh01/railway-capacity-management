import Link from "next/link";
import mapboxgl from "mapbox-gl";
import * as turf from "@turf/turf";
import React, { useEffect, useRef, useState } from "react";
import { fetchGTFSData } from "./utils/fetchShapeData";
import { fetchWeatherData } from "./utils/fetchWeather";
import { usePathname } from "next/navigation";
import { useTrack } from "./context/TrackContext";

import "mapbox-gl/dist/mapbox-gl.css";
import "../styles.css";

export function Map({ region }) {
    const WEATHER_LOADING_PLACEHOLDER = "Loading weather...";
    const WEATHER_FAILED_TEXT = "Could not get weather data.";
    const INFO_PANEL_DEFAULT_INNERHTML = "Click on a route, stop <br/>or train to view its <br/>information.";
    const MINIMUM_ZOOM_FOR_STOP_VISIBILITY = 8.0;
    const MINIMUM_ZOOM_FOR_TRAIN_VISIBILITY = 5.0;
    const FLY_TO_ZOOM = 12.0;
    const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const MAXIMUM_TIME_IN_MINUTES_BEFORE_FIRST_STOP = 120;

    // https://maps.co/gis/
    // https://www.latlong.net/
    const REGIONS = {
        "Alberta": {
            "center": [-114.640730675, 54.186885590834],
            "mapBounds": [-121.6026345158, 47.452382810016, -108.6827126408, 61.011836282047],
            "zoom": 6.0,
            "bounds": [
                [-120.04522932891, 60.045707540494],
                [-109.98175276641, 60.001793791265],
                [-109.98175276641, 48.926188895396],
                [-114.12342703308, 48.948080972704],
                [-114.83823540355, 49.563404461929],
                [-114.70639946605, 49.918395397434],
                [-115.01401665355, 50.564803964376],
                [-115.6951689973, 50.88472562641],
                [-116.77182915355, 51.777072925056],
                [-116.94761040355, 51.709046799086],
                [-117.47495415355, 52.115668791014],
                [-117.8484893098, 52.236938071871],
                [-117.8045439973, 52.331030154307],
                [-117.9803252473, 52.465100997535],
                [-118.09018852855, 52.317600660243],
                [-118.88120415355, 53.142540896441],
                [-119.27671196605, 53.168892363524],
                [-119.9578643098, 53.509991356166],
                [-120.04522932891, 60.045707540494]
            ]
        },
        "British Columbia": {
            "center": [-124.19726803433, 53.989939178708],
            "mapBounds": [-144.2868289278, 46.351642089026, -111.712714, 60.951777],
            "zoom": 6.0,
            "bounds": [
                [-119.93094032392, 60.05858764831],
                [-120.01883094892, 53.767284025597],
                [-119.22781532392, 53.139255186466],
                [-118.48074501142, 52.795186211252],
                [-118.12918251142, 52.287378938457],
                [-117.33816688642, 52.098809266831],
                [-116.01980751142, 51.061142965949],
                [-115.49246376142, 50.617124087221],
                [-115.00906532392, 50.505458692424],
                [-114.78933876142, 49.99968614728],
                [-114.65750282392, 49.488536360024],
                [-114.08621376142, 48.971993275661],
                [-123.13894813642, 48.971993275661],
                [-122.83133094892, 48.798611187828],
                [-123.09500282392, 48.304094578418],
                [-123.22683876142, 48.099064439576],
                [-124.89676063642, 48.420886316591],
                [-129.11551063642, 50.421535960495],
                [-131.40066688642, 54.437205606521],
                [-130.08230751142, 55.146606853373],
                [-130.12625282392, 55.991373895957],
                [-130.78543251142, 56.285202977093],
                [-131.92801063642, 56.625171969795],
                [-132.36746376142, 57.081707159031],
                [-133.51004188642, 58.372108934919],
                [-135.17996376142, 59.371605486965],
                [-135.17996376142, 59.572506360374],
                [-135.48758094892, 59.750083874535],
                [-136.27859657392, 59.639208145647],
                [-136.45437782392, 59.192022291664],
                [-137.37722938642, 58.943545345351],
                [-137.64090126142, 59.169507737903],
                [-139.17898719892, 60.014691026452],
                [-119.93094032392, 60.05858764831]
            ]
        },
        "Manitoba": {
            "center": [-97.459692261564, 54.943038985553],
            "mapBounds": [-104.29551738088, 47.437077932288, -85.926376755885, 61.00086710281],
            "zoom": 6.0,
            "bounds": [
                [-101.99803881265, 60.053063072229],
                [-101.99803881265, 55.935985043441],
                [-101.33885912515, 49.022396392955],
                [-95.098624750155, 49.022396392955],
                [-95.186515375155, 52.841613542701],
                [-88.726554437655, 57.051798626789],
                [-90.967765375155, 57.455897507154],
                [-92.110343500155, 57.384907736538],
                [-93.033195062655, 58.915153356172],
                [-94.395499750155, 58.983154115828],
                [-94.527335687655, 60.031118380904],
                [-101.99803881265, 60.053063072229]
            ],
        },
        "Ontario": {
            "center": [-84.421392102932, 49.554949932766],
            "mapBounds": [-104.060463, 35.532226, -66.131268, 58.950008],
            "zoom": 4.75,
            "bounds": [
                [-88.852797535494, 56.919157397015],
                [-95.224867847994, 52.853829263575],
                [-95.180922535494, 49.351560511087],
                [-94.741469410494, 49.265605510096],
                [-94.697524097994, 48.804643947776],
                [-93.994399097994, 48.572560144328],
                [-93.511000660494, 48.485252865572],
                [-92.895766285494, 48.659716925711],
                [-92.324477222994, 48.280950297654],
                [-91.928969410494, 48.339406142038],
                [-91.445570972994, 48.046457069158],
                [-90.874281910494, 48.222427483641],
                [-90.039320972994, 48.017070025938],
                [-89.336195972994, 47.958245659367],
                [-88.369399097994, 48.280950297654],
                [-84.897719410494, 46.917953519456],
                [-84.634047535494, 46.465811844747],
                [-84.194594410494, 46.496072401829],
                [-83.974867847994, 46.009883326018],
                [-83.403578785494, 45.979353378919],
                [-83.535414722994, 45.642412201277],
                [-82.568617847994, 45.303432368924],
                [-82.129164722994, 43.73691724709],
                [-82.392836597994, 42.809049503837],
                [-82.920180347994, 42.258555032155],
                [-83.183852222994, 41.899768768783],
                [-82.436781910494, 41.637559839221],
                [-81.294203785494, 42.226021939857],
                [-78.965102222994, 42.712256078852],
                [-79.184828785494, 43.38663290895],
                [-78.525649097994, 43.641587142577],
                [-76.899672535494, 43.673380679114],
                [-74.482680347994, 45.148676573414],
                [-74.526625660494, 45.488583215575],
                [-74.922133472994, 45.642412201277],
                [-75.932875660494, 45.396083622609],
                [-76.679945972994, 45.51938271211],
                [-77.163344410494, 45.826450987095],
                [-77.734633472994, 46.283895025396],
                [-78.657485035494, 46.31425658019],
                [-79.492445972994, 47.157548529877],
                [-79.536391285494, 51.670465192888],
                [-80.107680347994, 52.346704572414],
                [-81.953383472994, 55.126722286141],
                [-88.852797535494, 56.919157397015]
            ],
        },
        "Quebec": {
            "center": [-71.559202900364, 51.883013636605],
            "mapBounds": [-83.679777010964, 39.088074734636, -51.248136385964, 63.661251403365],
            "zoom": 6.0,
            "bounds": [
                [-64.634989557155, 60.483892108194],
                [-64.722880182155, 59.517191344758],
                [-64.371317682155, 58.887200144951],
                [-63.843973932155, 58.819010143774],
                [-63.975809869655, 58.499010786691],
                [-64.327372369655, 58.129692384368],
                [-63.668192682155, 57.662600643554],
                [-63.931864557155, 56.297802959156],
                [-63.448466119655, 55.209759258626],
                [-63.843973932155, 54.705112904779],
                [-65.294169244655, 54.857172574284],
                [-66.744364557155, 55.259875756221],
                [-67.051981744655, 54.781214199612],
                [-67.974833307155, 54.21981050963],
                [-67.051981744655, 53.441780258495],
                [-67.095927057155, 52.941528840142],
                [-66.436747369655, 52.941528840142],
                [-65.997294244655, 52.112754182478],
                [-64.415262994655, 51.624333769178],
                [-64.195536432155, 52.729147763043],
                [-63.316630182155, 52.862007623401],
                [-63.931864557155, 52.408626313345],
                [-63.448466119655, 52.004674511341],
                [-57.340067682155, 51.923443080336],
                [-57.076395807155, 51.213257683885],
                [-59.801005182155, 49.872874805459],
                [-64.327372369655, 50.098920541466],
                [-66.480692682155, 49.816197332425],
                [-63.536356744655, 49.102114302253],
                [-63.887919244655, 48.143556554098],
                [-66.744364557155, 47.996730940397],
                [-67.315653619655, 47.878968768276],
                [-67.805979619475, 48.0017645802],
                [-68.421213994475, 47.898747392704],
                [-68.377268681975, 47.48462400894],
                [-69.058421025725, 47.276328565794],
                [-69.256174931975, 47.380579154571],
                [-69.981272588225, 46.76704019532],
                [-70.310862431975, 45.978724370573],
                [-70.772288213225, 45.287338931613],
                [-71.101878056975, 45.27187792422],
                [-71.409495244475, 45.209991764302],
                [-71.563303838225, 44.946223539354],
                [-74.771311650725, 44.992859350142],
                [-74.375803838225, 45.209991764302],
                [-74.375803838225, 45.534142101801],
                [-75.056956181975, 45.657139280657],
                [-75.584299931975, 45.51874849879],
                [-76.353342900725, 45.51874849879],
                [-76.902659306975, 45.887032428259],
                [-77.386057744475, 45.993991622913],
                [-77.847483525725, 46.207291072811],
                [-78.792307744475, 46.374304685736],
                [-79.605296025725, 47.410327246394],
                [-79.539378056975, 51.819555633485],
                [-79.039093193625, 52.177196534625],
                [-80.005890068625, 54.689611587986],
                [-78.028351006125, 55.668195889809],
                [-77.193390068625, 57.554064431109],
                [-79.258819756125, 58.713954012789],
                [-78.335968193625, 59.968674274115],
                [-78.555694756125, 62.504632577123],
                [-75.479522881125, 62.807411575127],
                [-74.292999443625, 62.484337138891],
                [-71.128936943625, 61.91043293457],
                [-69.854522881125, 61.050227679768],
                [-68.843780693625, 61.177599394221],
                [-68.975616631125, 59.725861225947],
                [-67.657257256125, 58.645422819778],
                [-66.251007256125, 59.525875648821],
                [-64.634989557155, 60.483892108194]
            ],
        },
        "Saskatchewan": {
            "center": [-105.89804558466, 54.619051900282],
            "mapBounds": [-111.82191689034, 47.756885678843, -98.901995015341, 61.440749880093],
            "zoom": 6.0,
            "bounds": [
                [-109.99720563921, 60.069383463226],
                [-109.99720563921, 48.986192078002],
                [-101.25208845171, 48.986192078002],
                [-101.95521345171, 56.00347199593],
                [-101.95521345171, 60.047449621535],
                [-109.99720563921, 60.069383463226]
            ],
        },
        "Canada": {
            "center": [-96.911615596645, 58.727691678169],
            "mapBounds": [-178.330078125, 1.5818302639606, -0.791015625, 84.818373372456],
            "zoom": 2.67
        }
    }

    function polyMask(mask) {
        const bounds = REGIONS[region]["mapBounds"];
        var bboxPoly = turf.bboxPolygon(bounds);
        return turf.difference(turf.featureCollection([bboxPoly, mask]));
    }


    function regionCheck(regionIn) {
        if (regionIn === undefined) return false;
        if (regionIn === null) return false;
        if (regionIn === "Unknown") return false;
        return (regionIn in REGIONS);
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
    // }
    // const MAX_CAPACITY = 80;
    
    // use this for debug (or ~8 trains/track)
    const LINE_COLOR_GRADIENT = {
        0: "#00ff00",
        2: "#aaff00",
        4: "#ffcc00",
        6: "#ff2200",
        8: "#000000"
    }
    const MAX_CAPACITY = 8;

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
            // search sortedTrackOverlaySegments for matching number of trains on this track
            if (sorted.length > 0) {
                for (let i = 0; i < sorted.length; i++) {
                    var is_same = (sorted[i]["trainIds"].length == current["trainIds"].length) && sorted[i]["trainIds"].every(function(element, index) {
                        return element === current["trainIds"][index]; 
                    });
                    if (sorted[i]["trains"] === current["trains"] && is_same) {
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
                            sorted[i]["trainIds"] = current["trainIds"];
                            break;
                        }
                        //      if it ends with the first current coordinate:
                        if (e == g && f == h) {
                            //          append this unsorted coordinate to the end of the sorted coordinate
                            sorted[i]["coordinates"] = [...sorted[i]["coordinates"], ...current["coordinates"]];
                            sorted[i]["trainIds"] = current["trainIds"];
                            break;
                        }
                    }
                    if (i + 1 >= sorted.length) {
                        //      else no matches
                        //          add to sortedTrackOverlaySegments with this number of trains as there is no match.
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
                        "trainIds": current["trainIds"],
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
    const [lastZoom, setLastZoom] = useState(null);
    const [lastCenter, setLastCenter] = useState(null);
    const [loading, setLoading] = useState(false);
    const { setSelectedTrack } = useTrack(); // Track selection context
    var isRouteOnExpandedPage = (pathname === "/map");
    // TODO: auto-refresh would be nice

    const fetchLatestData = async () => {
        if (!regionCheck(region)) return;

        setLoading(true);

        const data = await fetchGTFSData();

        setTrains(data.trains);
        setStops(data.stops);
        setStopTimes(data.stopTimes);

        if (lastZoom === null) setLastZoom(REGIONS[region]["zoom"]);
        if (lastCenter === null) setLastCenter(REGIONS[region]["center"]);
    };

    function resetTrainMenu() {
        document.getElementById("train_menu").textContent = "";
    }

    function resetInfoMenu() {
        document.getElementById("info_area").innerHTML = INFO_PANEL_DEFAULT_INNERHTML;
    }

    useEffect(() => {
        resetTrainMenu();
        resetInfoMenu();
        console.log("[INFO]: Load map for region: " + region);
        if (!regionCheck(region)) return;

        if (trains.length === 0) return;
        if (stops.length === 0) return;
        if (stopTimes.length === 0) return;

        // remember: day starts at 0
        // month and year as normal
        // var today = new Date("2025-03-25");
        // today.setHours(15);
        // today.setMinutes(0);
        var today = new Date();
        var day = today.getDay();
        console.log("[INFO]: The system time is " + String(today));

        const canUseFullMap = (region === "Canada");
        const bounds = REGIONS[region]["bounds"];
        function isPointInBounds(point) { return turf.booleanPointInPolygon(turf.point(point), turf.polygon([bounds])); }

        // cached weather for stops
        // {
        //      stopId: weatherData
        // }
        var stopsWeatherCache = {};

        // {
        //      "trainId": [allCoordinates],
        //      "trainId": [allCoordinates],
        //      ...
        // }
        var routeShapesToRender = {};

        // Overlaid train coordinates that overlay on other tracks
        // {
        //      "coordLonA, coordLatA, coordLonB, coordLatB": {
        //          "trains": ["trainId", "trainId", ...],
        //          "from": [coordLonA, coordLatA],
        //          "to":   [coordLonB, coordLatB]
        //      }
        // }
        var trackOverlaysToRender = {};
        
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

        // {
        //      "uuid": {
        //          "type": [overlay/route_bottom/route_top/stop/train]
        //          "id": 123
        //      },
        //      ...
        // }
        var layerReference = {};

        // {
        //      "stopId": [
        //          { "tripId": time }
        //          ...
        //      ]
        //      ...
        // }
        var stopTrainSchedule = {};

        // remaining coordinates left on this train's trip
        // {
        //      tripId: {
        //          "distance": distanceCoordinates
        //      }
        // }
        var trainRemainingCoordinates = {};

        var totalRoutes = 0;
        var totalStops = 0;
        var totalTrains = 0;

        function getUUIDForLayer() {
            while (true) {
                var out = self.crypto.randomUUID();
                if (!(out in layerReference)) return out;
            }
        }

        mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;;
        const map = new mapboxgl.Map({
            "container": "map",
            "style": "mapbox://styles/mapbox/light-v9",
            "center": lastCenter,
            "maxBounds": REGIONS[region]["mapBounds"],
            "zoom": lastZoom
        });

        function setLayerVisibility(layerTypeIn, layerIdIn, isVisible) {
            // isVisible - 0 = false, 1 = true, else = toggle
            for (const uuid in layerReference) {
                const type = layerReference[uuid]["type"];
                if (layerTypeIn === type) {
                    const id = layerReference[uuid]["id"];
                    if (layerIdIn !== null && layerIdIn !== id) continue;
                    const currentVisibility = (map.getLayoutProperty(uuid, "visibility") === "visible");
                    const nextVisibility = (isVisible === 0 ? false : (isVisible === 1 ? true : !currentVisibility));
                    console.log("[INFO]: Change visibility for layer " + type + ":" + id + " to " + nextVisibility);
                    map.setLayoutProperty(uuid, "visibility", (nextVisibility ? "visible" : "none"));
                    if (layerIdIn !== null && layerIdIn === id) return nextVisibility;
                }
            }
        }

        // reenable if required
        // map["doubleClickZoom"].disable();
        map["dragRotate"].disable(); // very laggy
        // map["keyboard"].disable();
        // map["touchZoomRotate"].disable();
        
        // map.getCanvas().style.cursor = 'pointer';

        map.addInteraction("map_click", {
            type: "click",
            handler: ({ feature }) => {
                console.log("[INFO]: Clicked map");
                resetInfoMenu();
                // update current zoom / center
                setLastZoom(map.getZoom());
                setLastCenter(map.getCenter());
                setLayerVisibility("route_top", null, 0);
            }
        });
        
        map.addControl(new mapboxgl.FullscreenControl());

        // update current center
        map.on("moveend", () => { setLastCenter(map.getCenter()); });
        // update current zoom
        map.on("zoomend", () => { setLastZoom(map.getZoom()); });


        // ==================== on map load ==================== //
        map.on("load", () => {

            // add button to reset the map
            if (document.getElementById("recenterMapButton")) document.getElementById("recenterMapButton").remove();
            const mapActions = document.getElementById("mapActions");
            const recenterMap = document.createElement("a");
            recenterMap.id = "recenterMapButton";
            recenterMap.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                setLastZoom(REGIONS[region]["zoom"]);
                setLastCenter(REGIONS[region]["center"]);
                map.flyTo({
                    "center": REGIONS[region]["center"],
                    "zoom": REGIONS[region]["zoom"],
                    "bearing": 0,
                    "pitch": 0.0,
                    "duration": 5000,
                    "essential": false
                });
            };
            recenterMap.className = "dark_button_mini";
            recenterMap.href = "";
            recenterMap.textContent = "Recenter Map";
            mapActions.prepend(recenterMap);

            // keep track of the stops that we have already added to the map
            var addedStops = [];

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
                
                const firstArriveTime = stopData[0]["arrivalTime"];
                const firstArriveTimeMinutes = (firstArriveTime.getHours() * 60) + firstArriveTime.getMinutes();
                if (firstArriveTimeMinutes - currentTimeMinutes > MAXIMUM_TIME_IN_MINUTES_BEFORE_FIRST_STOP) {
                    console.log("[INFO]: Skipping train " + tripId + " because the start time is outside the maximum allowed");
                    continue; // L0
                }
                
                const lastDepartTime = stopData[stopDataLength - 1]["departureTime"];
                const lastDepartTimeMinutes = (lastDepartTime.getHours() * 60) + lastDepartTime.getMinutes();
                if (currentTimeMinutes > lastDepartTimeMinutes) {
                    console.log("[INFO]: Skipping train " + tripId + " because the trip is completed");
                    continue; // L0
                }

                // ===== This route can be rendered after this point ===== //
                totalRoutes++;

                const allCoordinates = trains[tripId]["allCoordinates"];

                if (canUseFullMap) {
                    routeShapesToRender[tripId] = allCoordinates;
                } else {
                    routeShapesToRender[tripId] = [];
                    for (const coord of allCoordinates) {
                        if (isPointInBounds(coord)) routeShapesToRender[tripId].push(coord);
                    }
                }
                const trainDistanceCoordinates = trains[tripId]["distanceCoordinates"];

                if (canUseFullMap) {
                    trainRemainingCoordinates[tripId] = trains[tripId]["distanceCoordinates"];
                } else {
                    for (const distance in trains[tripId]["distanceCoordinates"]) {
                        const coordinate = trains[tripId]["distanceCoordinates"][distance];
                        if (isPointInBounds(coordinate)) {
                            if (!trainRemainingCoordinates[tripId]) trainRemainingCoordinates[tripId] = {};
                            trainRemainingCoordinates[tripId][distance] = coordinate; 
                        }
                    }
                }

                // *** L1
                var hasNoDistances = false;
                for (const distance in trainDistanceCoordinates) {
                    if (distance.includes("-")) {
                        console.log("[WARN]: Train " + tripId + " has no distances set - last-known stops will be used to determine its location");
                        hasNoDistances = true;
                        break; // L1
                    }
                }

                // add all of this train's stops into the stop schedule
                for (const data in stopData) {
                    const arrivalTime = stopData[data]["arrivalTime"];
                    const arrivalTimeMinutes = (arrivalTime.getHours() * 60) + arrivalTime.getMinutes();
                    if (arrivalTimeMinutes >= currentTimeMinutes) {
                        const stopId = stopData[data]["stopId"];
                        if (!stopTrainSchedule[stopId]) {
                            stopTrainSchedule[stopId] = [];
                            var obj = {};
                            obj[tripId] = arrivalTime;
                            stopTrainSchedule[stopId].push(obj);
                        } else {
                            // compare existing times with this train's arrival time
                            // prepend / append this train
                            // delete train stations up to this stop
                            for (let i = 0; i < stopTrainSchedule[stopId].length; i++) {
                                var added = false;
                                const existingTrip = stopTrainSchedule[stopId][i];
                                for (const theTrip in existingTrip) {
                                    const existingTime = existingTrip[theTrip];
                                    const existingTimeMinutes = (existingTime.getHours() * 60) + existingTime.getMinutes();
                                    if (existingTimeMinutes >= arrivalTimeMinutes) {
                                        // insert before this one
                                        var obj = {};
                                        obj[tripId] = arrivalTime;
                                        stopTrainSchedule[stopId].splice(i, 0, obj);
                                        added = true;
                                    } else if (i + 1 >= stopTrainSchedule[stopId].length) {
                                        var obj = {};
                                        obj[tripId] = arrivalTime;
                                        // this is last item in array, insert here
                                        stopTrainSchedule[stopId].push(obj);
                                        added = true;
                                    }
                                }
                                if (added) break;
                            }
                        }
                    }
                }

                let trainCoordinates = [0, 0];
                let trainIsMoving = false;
                // *** L1
                for (let i = 0; i < stopDataLength; i++) {
                    // - if current time is less than or equal to the departure time
                    const departTime = stopData[i]["departureTime"];
                    const departTimeMinutes = (departTime.getHours() * 60) + departTime.getMinutes();
                    const stopId = stopData[i]["stopId"];
                    const stopCoordinates = stops[stopId]["coordinates"];
                    if (currentTimeMinutes >= departTimeMinutes) {
                        if (hasNoDistances) {
                            // test next stop
                            if (i + 1 < stopDataLength) {
                                const nextDepartTime = stopData[i + 1]["departureTime"];
                                const nextDepartTimeMinutes = (nextDepartTime.getHours() * 60) + nextDepartTime.getMinutes();
                                if (currentTimeMinutes >= nextDepartTimeMinutes) continue; // L1
                            }
                            trainIsMoving = true;
                            // delete distances up to the last-known stop
                            // first we need to find the closest drawable train coordinate to this stop's coordinates
                            var bestCoord = [0, 0];
                            var bestResult = 2 ** 32 - 1;
                            // d = sqrt( (x2 - x1)^2 - (y2 - y1)^2 )
                            // *** L2
                            for (const testCoord of allCoordinates) {
                                const left = Math.abs(Math.abs(testCoord[0]) - Math.abs(stopCoordinates[0]));
                                const right = Math.abs(Math.abs(testCoord[1]) - Math.abs(stopCoordinates[1]));
                                const result = Math.sqrt(left ** 2 + right ** 2);
                                if (result <= bestResult) {
                                    bestCoord = testCoord;
                                    bestResult = result;
                                }
                            }
                            trainCoordinates = bestCoord;
                            // delete trainRemainingCoordinates up to this distance
                            // *** L3
                            for (const distance in trainRemainingCoordinates[tripId]) {
                                const flag = trainRemainingCoordinates[tripId][distance][0] != bestCoord[0];
                                const flag1 = trainRemainingCoordinates[tripId][distance][1] != bestCoord[1];
                                if (flag && flag1) {
                                    delete trainRemainingCoordinates[tripId][distance];
                                } else {
                                    break; // L3
                                }
                            }
                        } else if (currentTimeMinutes > departTimeMinutes) {
                            // train has left this station
                            continue; // L1
                        }
                    }
                    if (!hasNoDistances) {
                        // - then we know the train is here, or enroute to here
                        // - check arrival time
                        const arriveTime = stopData[i]["arrivalTime"];
                        const arriveTimeMinutes = (arriveTime.getHours() * 60) + arriveTime.getMinutes();
                        // - if current time is more than arrival time
                        if (!hasNoDistances && (currentTimeMinutes >= arriveTimeMinutes || i === 0)) {
                            console.log("[INFO]: Train " + tripId + " is at a stop");
                            // - then the train is at this stop
                            // set trainCoordinates
                            trainCoordinates = stopCoordinates;

                            // delete coordinates up to this distance in trainRemainingCoordinates
                            for (const distance in trainRemainingCoordinates[tripId]) {
                                if (parseFloat(distance) < parseFloat(stopData[i]["distance"])) {
                                    delete trainRemainingCoordinates[tripId][distance];
                                }
                            }
                        } else {
                            trainIsMoving = true;
                            console.log("[INFO]: Train " + tripId + " is moving");
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
                            // *** L3
                            var lastDist = 0.0;
                            for (const dist in trainDistanceCoordinates) {
                                const d = parseFloat(dist);
                                const flag = (d >= approxDistance);
                                if (d <= approxDistance) {
                                    trainCoordinates = trainDistanceCoordinates[dist];
                                    lastDist = dist;
                                }
                                if (flag) {
                                    // delete trainRemainingCoordinates up to this distance
                                    // *** L4
                                    for (const distance in trainRemainingCoordinates[tripId]) {
                                        if (parseFloat(distance) < lastDist) {
                                            delete trainRemainingCoordinates[tripId][distance];
                                        } else {
                                            break; // L4
                                        }
                                    }
                                    break; // L3
                                }
                            }
                        }
                    }
                    // draw train dot at this approximate location
                    if (trainCoordinates[0] !== 0 && trainCoordinates[1] !== 0) {
                        if (canUseFullMap || isPointInBounds(trainCoordinates)) {
                            trainShapesToRender[tripId] = {};
                            trainShapesToRender[tripId]["coordinates"] = trainCoordinates;
                            trainShapesToRender[tripId]["isMoving"] = trainIsMoving;
                        }
                    } else {
                        console.log("[ERROR]: Failed to add train: " + tripId);
                    }
                    break; // L1
                }

                totalTrains += 1;

                // Function to process coordinates and update tracking
                function processCoordinatePair(a0, a1, b0, b1) {
                    const forwardKey = `${a0},${a1},${b0},${b1}`;
                    const reverseKey = `${b0},${b1},${a0},${a1}`;
                    if (forwardKey in trackOverlaysToRender) {
                        if (!trackOverlaysToRender[forwardKey]["trains"].includes(tripId)) {
                            trackOverlaysToRender[forwardKey]["trains"].push(tripId);
                        }
                    } else if (reverseKey in trackOverlaysToRender) {
                        if (!trackOverlaysToRender[reverseKey]["trains"].includes(tripId)) {
                            trackOverlaysToRender[reverseKey]["trains"].push(tripId);
                        }
                    } else {
                        // add unique point
                        trackOverlaysToRender[forwardKey] = {};
                        trackOverlaysToRender[forwardKey]["trains"] = [tripId];
                        trackOverlaysToRender[forwardKey]["from"] = [a0, a1];
                        trackOverlaysToRender[forwardKey]["to"] = [b0, b1];
                    }
                }

                let lastCoordinate = null;
                for (const distance in trainRemainingCoordinates[tripId]) {
                    const coordinate = trainRemainingCoordinates[tripId][distance];
                    if (lastCoordinate) {
                        processCoordinatePair(lastCoordinate[0], lastCoordinate[1], coordinate[0], coordinate[1]);
                    }
                    lastCoordinate = coordinate;
                }

                if (canUseFullMap || (trainShapesToRender[tripId] && isPointInBounds(trainShapesToRender[tripId]["coordinates"]))) {
                    // delete existing elements if they exist
                    const trainDivId = tripId + "_menu_div";
                    if (document.getElementById(trainDivId)) document.getElementById(trainDivId).remove();

                    // add elements for train
                    const menu = document.getElementById("train_menu");

                    // element div
                    const trainLink = document.createElement("div");
                    trainLink.id = trainDivId;
                    trainLink.className = "space-full flex flex-row justify-between";

                    // locator element
                    const locatorLink = document.createElement("a");
                    locatorLink.id = tripId;
                    locatorLink.href = "#";
                    locatorLink.textContent = tripId;
                    locatorLink.className = "map_menu_item_active";
                    
                    locatorLink.onclick = function (e) {
                        e.preventDefault();
                        e.stopPropagation();

                        const shape = trainShapesToRender[this.id];
                        const coordinates = shape["coordinates"];
                        const moving = shape["isMoving"];

                        // update info area
                        const infoArea = document.getElementById("info_area");
                        var innerHtml = "";
                        innerHtml += "<b>Train ID</b><br>" + this.id;
                        innerHtml += "<br><br>"
                        innerHtml += "<b>Location</b><br>" + "Lon: " + coordinates[0] + "<br>Lat: " + coordinates[1];
                        innerHtml += "<br><br>"
                        innerHtml += "<b>Status</b><br>" + (moving ? "Enroute to next station" : "Stopped at station");
                        infoArea.innerHTML = innerHtml;

                        setLayerVisibility("route_top", null, 0);
                        setLayerVisibility("route_top", this.id, 1);

                        // center map onto train
                        map.flyTo({
                            "center": coordinates,
                            "zoom": FLY_TO_ZOOM,
                            "bearing": 0,
                            "pitch": 0.0,
                            "duration": 5000,
                            "essential": false
                        });
                    };

                    // toggle element
                    const toggleLink = document.createElement("a");
                    toggleLink.id = tripId;
                    toggleLink.href = "#";
                    toggleLink.textContent = "Hide";
                    toggleLink.className = "map_menu_item_active";

                    toggleLink.onclick = function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        const result = setLayerVisibility("train", this.id, 2);
                        if (result) {
                            this.className = "map_menu_item_active";
                            toggleLink.textContent = "Hide";
                        } else {
                            this.className = "map_menu_item_inactive";
                            toggleLink.textContent = "Show";    
                        }
                    };

                    // add the element to the routes list
                    trainLink.appendChild(locatorLink);
                    trainLink.appendChild(toggleLink);
                    menu.appendChild(trainLink);
                }

                // ===================== Add Railway Stops ===================== //
                for (var index in stopData) {
                    const stopId = stopData[index]["stopId"];
                    if (!stops[stopId]) continue;
                    const stopCoordinates = stops[stopId]["coordinates"];
                    if (!(addedStops.includes(stopId))) {
                        if (canUseFullMap || isPointInBounds(stopCoordinates)) {
                            totalStops++;
                            addedStops.push(stopId);
                            stopShapesToRender[stopId] = stopCoordinates;
                        }
                    }
                }
            }


            // ==================== Add layers to map ==================== //
            var layerCounter = 0;
            var routeLayers = 0;
            var overlayLayers = 0;
            var trainLayers = 0;
            var stopLayers = 0;

            function renderRoutes(isBottom, source) {
                const isVisible = (isBottom ? "visible" : "none");
                var sourceToUse = source;
                // source is trainRemainingCoordinates
                // convert { trainId: { distance : coordinates } }
                // to
                // { trainId: [[coord,coord], [coord, coord], ...]
                if (!isBottom) {
                    var out = {};
                    for (const trainId in source) {
                        if (!out[trainId]) out[trainId] = [];
                        for (const distance in source[trainId]) {
                            out[trainId].push(source[trainId][distance]);
                        }
                    }
                    sourceToUse = out;
                }
                for (const tripId in sourceToUse) {
                    layerCounter++;
                    routeLayers++;
                    // - draw this train's shape
                    const shapeName = getUUIDForLayer();
                    layerReference[shapeName] = {};
                    layerReference[shapeName]["type"] = "route" + (isBottom ? "_bottom" : "_top");
                    layerReference[shapeName]["id"] = tripId;
                    map.addSource(shapeName, {
                        "type": "geojson",
                        "data": {
                            "type": "Feature",
                            "properties": {},
                            "geometry": {
                                "type": "LineString",
                                "coordinates": sourceToUse[tripId]
                            },
                            "id": shapeName
                        }
                    });
                    map.addLayer({
                        "id": shapeName,
                        "type": "line",
                        "slot": "bottom",
                        "source": shapeName,
                        "layout": {
                            "visibility": isVisible,
                            "line-join": "round",
                            "line-cap": "round"
                        },
                        "paint": {
                            "line-opacity": 1.0,
                            "line-color": isBottom ? "#808080" : "#00afff",
                            "line-width": isBottom ? 1.5 : 3.0,
                            "line-gap-width": isBottom ? 0 : 8,
                            "line-blur": isBottom ? 0 : 2,
                        },
                    });
                }
            }


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
            var unsortedTrackOverlaySegments = [];

            // add all overlays to unsortedTrackOverlaySegments
            for (const entry in trackOverlaysToRender) {
                const ref = trackOverlaysToRender[entry];
                unsortedTrackOverlaySegments.push(
                    {
                        "trains": ref["trains"].length,
                        "trainIds": ref["trains"],
                        "coordinates": [ref["from"], ref["to"]]
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
            var sortedTrackOverlaySegments = sortAndMerge(unsortedTrackOverlaySegments);

            function renderTrackOverlays(sortedTrackOverlaySegmentsIn) {
                for (const obj of sortedTrackOverlaySegmentsIn) {
                    layerCounter++;
                    overlayLayers++;
                    const numberOfTrains = obj["trains"];
                    const trainIds = obj["trainIds"];
                    const coordinates = obj["coordinates"];
                    const shapeName = getUUIDForLayer();
                    layerReference[shapeName] = {};
                    layerReference[shapeName]["type"] = "overlay";
                    layerReference[shapeName]["id"] = trainIds;
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
                            "line-width": 7.5
                        }
                    });

                    map.addInteraction(shapeName + "_click", {
                        type: "click",
                        target: { layerId: shapeName },
                        handler: async ({ feature }) => {
                            console.log("[INFO]: Clicked overlay: " + shapeName);
                            const infoArea = document.getElementById("info_area");
                            const capacityDiv = document.createElement("div");
                            capacityDiv.className = "flex flex-col text-left";
                            const capacityText = document.createElement("p");
                            var capacityTextInnerHTML = "";
                            capacityTextInnerHTML += "<b>Scheduled Track Capacity</b><br>" + numberOfTrains + "/" + MAX_CAPACITY;
                            capacityTextInnerHTML += "<br><br>";
                            capacityTextInnerHTML += "<b>Trains Headed for this Track</b><br>";
                            const trainList = document.createElement("ul");
                            trainList.className = "flex flex-col list-disc pl-4";
                            for (const id of trainIds) {
                                const trainListItem = document.createElement("li");
                                trainListItem.innerHTML = id;
                                trainList.appendChild(trainListItem);
                            }
                            infoArea.innerHTML = "";
                            capacityText.innerHTML = capacityTextInnerHTML;
                            capacityDiv.appendChild(capacityText);
                            capacityDiv.appendChild(trainList);
                            infoArea.appendChild(capacityDiv);
                        }
                    });
                }
            }
            
            function renderTrains() {
                for (const tripId in trainShapesToRender) {
                    const trainCoordinates = trainShapesToRender[tripId]["coordinates"];
                    const trainIsMoving = trainShapesToRender[tripId]["isMoving"];
                    const shapeName = getUUIDForLayer();
                    layerReference[shapeName] = {};
                    layerReference[shapeName]["type"] = "train";
                    layerReference[shapeName]["id"] = tripId;
                    map.addSource(shapeName, {
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
                    if (!map.getLayer(shapeName)) {
                        layerCounter++;
                        trainLayers++;
                        map.addLayer({
                            "id": shapeName,
                            "type": "circle",
                            "minzoom": MINIMUM_ZOOM_FOR_TRAIN_VISIBILITY,
                            "source": shapeName,
                            "layout": {
                                "visibility": "visible"
                            },
                            "paint": {
                                "circle-radius": 12,
                                "circle-color": "#" + ((1 << 24) * (tripIdNumber / 100) | 0).toString(16).padStart(6, "0"),
                                "circle-stroke-color": "#5f5f5f",
                                "circle-stroke-width": 2
                            }
                        });
                        map.addInteraction(shapeName + "_click", {
                            type: "click",
                            target: { layerId: shapeName },
                            handler: async ({ feature }) => {
                                console.log("[INFO]: Clicked train: " + tripId);
                                const infoArea = document.getElementById("info_area");
                                var innerHtml = "";
                                innerHtml += "<b>Train ID</b><br>" + tripId;
                                innerHtml += "<br><br>"
                                innerHtml += "<b>Location</b><br>" + "Lon: " + trainCoordinates[0] + "<br>" + "Lat: " + trainCoordinates[1];
                                innerHtml += "<br><br>"
                                innerHtml += "<b>Status</b><br>" + (trainIsMoving ? "Enroute to next station" : "Stopped at station");
                                infoArea.innerHTML = innerHtml;
                                setLayerVisibility("route_top", null, 0);
                                setLayerVisibility("route_top", tripId, 1);
                            }
                        });
                    }
                }
            }
            
            function renderStops() {
                for (const stopId in stopShapesToRender) {
                    layerCounter++;
                    stopLayers++;
                    const stopCoordinates = stopShapesToRender[stopId];
                    const shapeName = getUUIDForLayer();
                    layerReference[shapeName] = {};
                    layerReference[shapeName]["type"] = "stop";
                    layerReference[shapeName]["id"] = stopId;
                    map.addSource(shapeName, {
                        "type": "geojson",
                        "data": {
                            "type": "FeatureCollection",
                            "features": [
                                {
                                    "type": "Feature",
                                    "id": shapeName, 
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": stopCoordinates
                                    },
                                    "properties": {
                                        "name": shapeName
                                    }
                                }
                            ]
                        }
                    });
                    if (!map.getLayer(shapeName)) {
                        map.addLayer({
                            "id": shapeName,
                            "type": "circle",
                            "source": shapeName,
                            "minzoom": MINIMUM_ZOOM_FOR_STOP_VISIBILITY,
                            "layout": {
                                "visibility": "visible"
                            },
                            "paint": {
                                "circle-radius": 6,
                                "circle-color": "#808080",
                                "circle-stroke-color": "#000000",
                                "circle-stroke-width": 2
                            }
                        });
                        
                        map.addInteraction(shapeName + "_click", {
                            type: "click",
                            target: { layerId: shapeName },
                            handler: async ({ feature }) => {
                                console.log("[INFO]: Clicked stop: " + stopId);
                                
                                // clear the info area
                                const infoArea = document.getElementById("info_area");
                                infoArea.innerHTML = "";

                                // new element for weather
                                const stopInfoDiv = document.createElement("div");
                                stopInfoDiv.id = stopId + "_menu_div";

                                // new element for stop info
                                const stopInfoConstant = document.createElement("p");
                                stopInfoConstant.id = stopId + "_menu_p_constant";
                                var constantInfoStringBuilder = "";
                                constantInfoStringBuilder = "<b>Stop ID</b><br>" + stopId;
                                constantInfoStringBuilder += "<br><br>";

                                // train schedule
                                const schedule = stopTrainSchedule[stopId];
                                var hasTrains = false;
                                constantInfoStringBuilder += "<b>Scheduled Trains</b>";
                                if (schedule) {
                                    for (const scheduledTrain of schedule) {
                                        for (const tripId in scheduledTrain) {
                                            const scheduleHours = scheduledTrain[tripId].getHours();
                                            const scheduleMinutes = scheduledTrain[tripId].getMinutes();
                                            const hours = String(scheduleHours).padStart(2, "0");
                                            const minutes = String(scheduleMinutes).padStart(2, "0");
                                            constantInfoStringBuilder += "<br>" + hours + ":" + minutes + " - " + tripId;
                                            hasTrains = true;
                                        }
                                    }
                                }
                                if (!hasTrains) constantInfoStringBuilder += "<br>No trains scheduled";
                                constantInfoStringBuilder += "<br><br>";

                                // weather placholder
                                constantInfoStringBuilder += "<b>Current Weather</b><br>";
                                stopInfoConstant.innerHTML = constantInfoStringBuilder;

                                // new element for stop weather info
                                const stopInfoWeather = document.createElement("div");
                                stopInfoWeather.innerHTML = WEATHER_LOADING_PLACEHOLDER;
                                
                                // update the div with current display before attempting to load weather
                                stopInfoDiv.appendChild(stopInfoConstant);
                                stopInfoDiv.appendChild(stopInfoWeather);
                                infoArea.appendChild(stopInfoDiv);
                                
                                // now we load the weather
                                var weather = null;
                                if (stopsWeatherCache[shapeName]) {
                                    weather = stopsWeatherCache[shapeName];
                                } else {
                                    weather = await fetchWeatherData(stopCoordinates[1], stopCoordinates[0]);
                                    stopsWeatherCache[shapeName] = weather
                                }
                                if (weather !== null) {
                                    // div for current conditions
                                    const nowDiv = document.createElement("div");
                                    nowDiv.className = "w-full flex flex-row gap-2 justify-left text-left place-content-center mb-[8px]";

                                    // icon
                                    const nowIconImg = document.createElement("img");
                                    nowIconImg.src = weather["now"]["icon"];
                                    nowIconImg.width = 32;
                                    nowIconImg.height = 32;
                                    nowIconImg.className = "size-fit flex flex-row justify-left text-left place-content-center"

                                    // text
                                    const nowTextDiv = document.createElement("div");
                                    nowTextDiv.className = "w-full flex flex-col justify-right text-right place-content-center whitespace-wrap overflow-hidden mt-[-10px]";
                                    const nowTempP = document.createElement("p");
                                    nowTempP.innerHTML = "<b>" + weather["now"]["temp"] + "</b>" + "<sup>°C</sup>";
                                    nowTempP.className = "w-full text-right text-[24px]";
                                    const nowDescP = document.createElement("p");
                                    nowDescP.textContent = weather["now"]["desc"];
                                    nowDescP.className = "w-full text-right text-[12px] mt-[-8px]";

                                    // forecast conditions
                                    // title
                                    const forecastP = document.createElement("p");
                                    forecastP.innerHTML = "<b>Forecast</b><br>";

                                    // div
                                    const forecastDiv = document.createElement("div");
                                    forecastDiv.className = "w-full flex flex-col gap-6";

                                    // forecast conditions
                                    for (let i = 0; i < 14; i++) {
                                        const ref = weather[`${i}`];
                                        const d = new Date(ref["date"]);
                                        const theDay = d.getDay();
                                        const theMonth = d.getMonth();
                                        const theDate = d.getDate();

                                        // this entire forecast's div
                                        const forecastDay = document.createElement("div");
                                        forecastDay.className = "w-full flex flex-col justify-left text-left";

                                        // date title
                                        const forecastDayDateP = document.createElement("p");
                                        forecastDayDateP.innerHTML = DAYS[theDay] + ", " + MONTHS[theMonth] + " " + theDate;

                                        // forecast content
                                        const forecastDayContentDiv = document.createElement("div");
                                        forecastDayContentDiv.className = "w-full flex flex-row";

                                        // icon
                                        const forecastDayIconImg = document.createElement("img");
                                        forecastDayIconImg.src = ref["icon"];
                                        forecastDayIconImg.width = 20;
                                        forecastDayIconImg.height = 20;
                                        forecastDayIconImg.className = "size-fit flex flex-row justify-left text-left place-content-center";

                                        // text
                                        const forecastDayTextDiv = document.createElement("div");
                                        forecastDayTextDiv.className = "w-full flex flex-col justify-right text-right place-content-center whitespace-wrap overflow-hidden";
                                        const forecastDayTextTempP = document.createElement("p");
                                        var forecastDayTextTempPInnerHtml = "";
                                        forecastDayTextTempPInnerHtml += ref["mintemp"] + "<sup>°C</sup> / ";
                                        forecastDayTextTempPInnerHtml += "<b>" + ref["maxtemp"] + "</b><sup>°C</sup>"
                                        forecastDayTextTempP.innerHTML = forecastDayTextTempPInnerHtml;
                                        forecastDayTextTempP.className = "w-full text-right text-[24px]";
                                        const forecastDayTextDescP = document.createElement("p");
                                        forecastDayTextDescP.textContent = ref["desc"];
                                        forecastDayTextDescP.className = "h-fit w-full text-right text-[12px] mt-[-8px]";
                                        
                                        // append
                                        forecastDayTextDiv.appendChild(forecastDayTextTempP);
                                        forecastDayTextDiv.appendChild(forecastDayTextDescP);
                                        forecastDayContentDiv.appendChild(forecastDayIconImg);
                                        forecastDayContentDiv.appendChild(forecastDayTextDiv);
                                        forecastDay.appendChild(forecastDayDateP);
                                        forecastDay.appendChild(forecastDayContentDiv);
                                        forecastDiv.appendChild(forecastDay);
                                    }

                                    // replace placeholder with what we have now
                                    // append current
                                    nowDiv.appendChild(nowIconImg);
                                    nowTextDiv.appendChild(nowTempP);
                                    nowTextDiv.appendChild(nowDescP);
                                    nowDiv.appendChild(nowTextDiv);
                                    
                                    // replace
                                    stopInfoWeather.innerHTML = "";
                                    stopInfoWeather.appendChild(nowDiv);
                                    stopInfoWeather.appendChild(forecastP);
                                    stopInfoWeather.appendChild(forecastDiv);
                                } else {
                                    // replace placeholder with failed text
                                    const currentInnerHTML = stopInfoWeather.innerHTML;
                                    stopInfoWeather.innerHTML = currentInnerHTML.replace(WEATHER_LOADING_PLACEHOLDER, WEATHER_FAILED_TEXT);
                                }
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
            renderRoutes(true, routeShapesToRender);
            renderTrackOverlays(sortedTrackOverlaySegments);
            renderRoutes(false, trainRemainingCoordinates);
            renderTrains();
            renderStops();
            // =========================== END =========================== //


            // log counters
            console.log("[INFO]: Total layers: " + layerCounter);
            console.log("[INFO]: ----> Route layers: " + routeLayers);
            console.log("[INFO]: ----> Overlay layers: " + overlayLayers);
            console.log("[INFO]: ----> Train layers: " + trainLayers);
            console.log("[INFO]: ----> Stop layers: " + stopLayers);

            console.log("[INFO]: Total routes: " + totalRoutes);
            console.log("[INFO]: Total stops : " + totalStops);
            console.log("[INFO]: Total trains: " + totalTrains);

            setLoading(false);
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
                        <div className="flex flex-row gap-2 text-left">
                            {!isRouteOnExpandedPage &&
                                <Link className="dark_button_mini" href="/map">Expand Map</Link>
                            }
                        </div>
                        <div id="mapActions" className="flex flex-row gap-2 text-right">
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
                    <div id="train_menu" className="flex flex-col gap-1 overflow-scroll p-1 list-disc">
                    </div>
                </div>
            </div>
        </div>
    );
}
