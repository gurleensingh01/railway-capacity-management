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

    let coordinates = []; // Stores all shape coordinates
    let shapeGroupsMap = new Map(); // Stores coordinates grouped by shape_id

    for (let i = 1; i < shapeLines.length; i++) {
      const values = shapeLines[i].split(",");
      if (values.length >= 4) {
        const shape_id = values[0];
        const shape_pt_lat = parseFloat(values[1]);
        const shape_pt_lon = parseFloat(values[2]);
        const coord = [shape_pt_lon, shape_pt_lat];

        coordinates.push(coord); // Store all coordinates

        // Group coordinates by shape_id
        if (!shapeGroupsMap.has(shape_id)) {
          shapeGroupsMap.set(shape_id, []);
        }
        shapeGroupsMap.get(shape_id).push(coord);
      }
    }

    // Get the middle coordinate for each shape_id
    let shapeGroups = [];
    shapeGroupsMap.forEach((coords, shape_id) => {
      const middleIndex = Math.floor(coords.length / 2);
      shapeGroups.push({ shape_id, coordinates: [coords[middleIndex]] });
    });

    // ====================== Process Stop_times.txt ====================== //
    const stopTimesTxt = zip.file("stop_times.txt");
    if (!stopTimesTxt) throw new Error("stop_times.txt not found in ZIP");

    const stopTimesText = await stopTimesTxt.async("text");
    const stopTimesLines = stopTimesText.trim().split("\n");

    let tripCounts = new Map(); // Stores counts of trip_id occurrences

    for (let i = 1; i < stopTimesLines.length; i++) {
      const values = stopTimesLines[i].split(",");
      if (values.length >= 1) {
        const trip_id = values[0].trim();

        // Count trip occurrences
        tripCounts.set(trip_id, (tripCounts.get(trip_id) || 0) + 1);
      }
    }

   // TODO: return a list of different shapes for each route id
    return { 
      coordinates, 
      shapeGroups, 
      tripCounts: Object.fromEntries(tripCounts) // Convert Map to Object for easier use
    };

  } catch (error) {
    console.error("Error fetching GTFS data:", error);
    return { coordinates: [], shapeGroups: [], tripCounts: {} };
  }
}
