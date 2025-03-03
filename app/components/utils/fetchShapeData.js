import JSZip from "jszip";

const ZIP_FILE_URL = `https://api.allorigins.win/raw?url=${encodeURIComponent("https://www.viarail.ca/sites/all/files/gtfs/viarail.zip")}`;

export async function fetchGTFSData() {
    try {
        const response = await fetch(ZIP_FILE_URL);
        if (!response.ok) throw new Error("Failed to download ZIP file");

        const zipBlob = await response.blob();
        const zip = await JSZip.loadAsync(zipBlob);

        // ====================== Process Shapes.txt ====================== //
        const shapesTxt = zip.file("shapes.txt");
        if (!shapesTxt) throw new Error("shapes.txt not found in ZIP");

        const shapesText = await shapesTxt.async("text");
        const shapeLines = shapesText.trim().split("\n");
        let shapes = {};

        for (let i = 1; i < shapeLines.length; i++) {
            const values = shapeLines[i].split(",");
            if (values.length == 5) {
                const shape_id = values[0];
                const shape_pt_lat = parseFloat(values[1]);
                const shape_pt_lon = parseFloat(values[2]);
                const coord = [shape_pt_lon, shape_pt_lat];
                if (shape_id in shapes) {
                    shapes[shape_id].unshift(coord);
                } else {
                    shapes[shape_id] = [coord];
                }
            }
        }

        // ====================== Process stops.txt ====================== //
        const stopsTxt = zip.file("stops.txt");
        if (!stopsTxt) throw new Error("stops.txt not found in ZIP");
        const stopsText = await stopsTxt.async("text");
        const stopsLines = stopsText.trim().split("\n");
        let stops = {};
        for (let i = 1; i < stopsLines.length; i++) {
            const values = stopsLines[i].split(",");
            console.log("####### Adding stop " + values);
            if (values.length == 9) {
                const stop_id = values[0];
                const stop_lon = values[4];
                const stop_lat = values[5];
                const coord = [stop_lon, stop_lat];
                stops[stop_id] = coord;
            }
        }

        // ====================== Process Stop_times.txt ====================== //
        const stopTimesTxt = zip.file("stop_times.txt");
        if (!stopTimesTxt) throw new Error("stop_times.txt not found in ZIP");

        const stopTimesText = await stopTimesTxt.async("text");
        const stopTimesLines = stopTimesText.trim().split("\n");

        let trips = {};
        for (let i = 1; i < stopTimesLines.length; i++) {
            const values = stopTimesLines[i].split(",");
            if (values.length >= 1) {
                const trip_id = values[0].trim();
                if (trip_id in trips) {
                    trips[trip_id] = trips[trip_id] + 1;
                } else {
                    trips[trip_id] = 1;
                }
            }
        }

        // TODO: return a list of different shapes for each route id
        return { 
            shapes,
            stops,
            trips
        };

    } catch (error) {
        console.error("Error fetching GTFS data:", error);
        return {
            "shapes": {},
            "stops": {},
            "trips": {}
        };
    }
}
