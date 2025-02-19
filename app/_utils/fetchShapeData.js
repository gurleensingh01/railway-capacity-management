import JSZip from "jszip";

const ZIP_FILE_URL = `https://api.allorigins.win/raw?url=${encodeURIComponent("https://www.viarail.ca/sites/all/files/gtfs/viarail.zip")}`;

export async function fetchShapeData() {
  try {
    const response = await fetch(ZIP_FILE_URL);
    if (!response.ok) throw new Error("Failed to download ZIP file");

    const zipBlob = await response.blob();
    const zip = await JSZip.loadAsync(zipBlob);

    const shapesTxt = zip.file("shapes.txt");
    if (!shapesTxt) throw new Error("shapes.txt not found in ZIP");

    const text = await shapesTxt.async("text");
    const lines = text.trim().split("\n");

    const data = lines.slice(1).map((line) => {
      const values = line.split(",");
      if (values.length >= 3) {
        const shape_pt_lat = parseFloat(values[1]);
        const shape_pt_lon = parseFloat(values[2]);
        return [shape_pt_lon, shape_pt_lat]; // Mapbox requires [lon, lat]
      }
    }).filter(Boolean); // Remove any undefined entries

    return data;
  } catch (error) {
    console.error("Error fetching shape data:", error);
    return [];
  }
}
