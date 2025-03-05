import JSZip from "jszip";

export async function fetchGTFSData() {
    try {
        // fetch file
        // use this link in production:
        // `https://api.allorigins.win/raw?url=${encodeURIComponent("https://www.viarail.ca/sites/all/files/gtfs/viarail.zip")}`;
        // use local file for debug/dev:
        // "viarail.zip"
        const ZIP_FILE_URL = "viarail.zip";
        const response = await fetch(ZIP_FILE_URL);
        if (!response.ok) throw new Error("Failed to download ZIP file");
        const zipBlob = await response.blob();
        const zip = await JSZip.loadAsync(zipBlob);


        const STOPS_TEXT_FILE_NAME = "stops.txt";
        const SHAPES_TEXT_FILE_NAME = "shapes.txt";
        const STOP_TIMES_TEXT_FILE_NAME = "stop_times.txt";
        const CALENDAR_TEXT_FILE_NAME = "calendar.txt";


        const stopsTxt = zip.file(STOPS_TEXT_FILE_NAME);
        const shapesTxt = zip.file(SHAPES_TEXT_FILE_NAME);
        const stopTimesTxt = zip.file(STOP_TIMES_TEXT_FILE_NAME);
        const calendarTxt = zip.file(CALENDAR_TEXT_FILE_NAME);


        if (!stopsTxt) throw new Error(STOPS_TEXT_FILE_NAME + " not found in ZIP");
        if (!shapesTxt) throw new Error(SHAPES_TEXT_FILE_NAME + " not found in ZIP");
        if (!stopTimesTxt) throw new Error(STOP_TIMES_TEXT_FILE_NAME + " not found in ZIP");
        if (!calendarTxt) throw new Error(CALENDAR_TEXT_FILE_NAME + " not found in ZIP");


        const stopsText = await stopsTxt.async("text");
        const shapesText = await shapesTxt.async("text");
        const stopTimesText = await stopTimesTxt.async("text");
        const calendarText = await calendarTxt.async("text");


        const stopsLines = stopsText.trim().split("\n");
        const shapeLines = shapesText.trim().split("\n");
        const stopTimesLines = stopTimesText.trim().split("\n");
        const calendarLines = calendarText.trim().split("\n");


        // ====================== returned objects ====================== //

        // trains structure (array of dictionaries):
        // {
        //      id:                 String      ->      id of the train/route/service
        //      coordinates:        Array       ->      an array of route coordinates [[lon,lat], [lon,lat], ...]
        //      startDate:          Number      ->      date of start service
        //      endDate:            Number      ->      date of end service
        //      daysOfOperation     Array       ->      days this train will run on (key is type Number)
        //          0               Boolean     ->      sunday
        //          1               Boolean     ->      monday
        //          2               Boolean
        //          3               Boolean
        //          4               Boolean
        //          5               Boolean
        //          6               Boolean     ->      saturday
        // }
        let trains = [];


        // stops structure (array of dictionaries):
        // {
        //      id:                 String      ->      id of the stop
        //      coordinates:        Array       ->      the stop coordinates [lon,lat]
        // }
        let stops = [];


        let trips = {};


        // ====================== Process stops.txt ====================== //
        for (let i = 1; i < stopsLines.length; i++) {
            const values = stopsLines[i].split(",");
            if (values.length === 9) {
                let stop = {};
                stop["id"] = values[0];
                stop["coordinates"] = [values[4], values[5]];
                stops.unshift(stop);
            }
        }


        // ====================== Process Shapes.txt ====================== //
        let currentTrain = {};
        for (let i = 1; i < shapeLines.length; i++) {
            const values = shapeLines[i].split(",");
            if (values.length === 5) {
                const trainId = values[0];
                const coordinates = [parseFloat(values[2]), parseFloat(values[1])];
                if (!currentTrain.hasOwnProperty("id") || currentTrain["id"] !== trainId) {
                    if (currentTrain["id"] && currentTrain["id"] != trainId) {
                        // different current train id
                        // add current train, then make a new train
                        trains.unshift(currentTrain);
                        currentTrain = {};
                    }
                    currentTrain["id"] = trainId;
                    currentTrain["coordinates"] = [coordinates];
                } else {
                    // continue adding coordinates to the current train
                    currentTrain["coordinates"].unshift(coordinates);
                }
            }
        }


        // ====================== Process Stop_times.txt ====================== //
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


        // ====================== Process calendar.txt ====================== //
        for (let i = 1; i < calendarLines.length; i++) {
            const values = calendarLines[i].split(",");
            if (values.length === 10) {
                const trainId = values[0].trim();
                for (let j = 0; j < trains.length; j++) {
                    if (trains[j]["id"] && trains[j]["id"] === trainId) {
                        trains[j]["startDate"] = Number(values[1]);
                        trains[j]["endDate"] = Number(values[2]);
                        let days = {};
                        days[0] = (values[9] == 1);   // sunday
                        days[1] = (values[3] == 1);   // monday
                        days[2] = (values[4] == 1);
                        days[3] = (values[5] == 1);
                        days[4] = (values[6] == 1);
                        days[5] = (values[7] == 1);
                        days[6] = (values[8] == 1);   // saturday
                        trains[j]["daysOfOperation"] = days;
                    }
                }
            }
        }


        return { 
            trains,
            stops,
            trips
        };
    } catch (error) {
        console.error("Error fetching GTFS data:", error);
        return {
            "trains": [],
            "stops": [],
            "trips": {}
        };
    }
}
