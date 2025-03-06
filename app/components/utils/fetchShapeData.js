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

        // trains structure (dictionary):
        // {
        //      "trainId": {
        //          allCoordinates:         Array       ->      an array of all coordinates (for rendering)
        //          distanceCoordinates:    Array       ->      an array of distances along the route with their coordinates
        //              [
        //                  {"distance": [lon,lat]}
        //                  {"distance": [lon,lat]}
        //              ]
        //          startDate:              Date        ->      date of start service
        //          endDate:                Date        ->      date of end service
        //          daysOfOperation         Array       ->      days this train will run on (key is type Number)
        //              0                   Boolean     ->      sunday
        //              1                   Boolean     ->      monday
        //              2                   Boolean
        //              3                   Boolean
        //              4                   Boolean
        //              5                   Boolean
        //              6                   Boolean     ->      saturday
        //      },
        //      ...
        // }
        let trains = {};


        // stops structure (dictionary):
        // {
        //      "id": {
        //          coordinates:            Array       ->      the stop coordinates [lon,lat]
        //      },
        //      ...
        // }
        let stops = {};


        // stopTimes structure (dictionary):
        // {
        //      "tripId": {
        //          0: {
        //              arrivalTime:        Date        ->      time of arrival
        //              departureTime:      Date        ->      time of departure
        //              stopId:             String      ->      id of this stop
        //              distance:           Float       ->      distance along the route
        //          }
        //          1: {},
        //          2: {},
        //          ...
        //      }
        //      ...
        // }
        let stopTimes = {};


        // ====================== Process stops.txt ====================== //
        for (let i = 1; i < stopsLines.length; i++) {
            const values = stopsLines[i].split(",");
            if (values.length === 9) {
                stops[values[0]] = {
                    "coordinates": [values[4], values[5]]
                };
            }
        }


        // ====================== Process Shapes.txt ====================== //
        let currentTrainId = "";
        let currentTrain = {};
        for (let i = 1; i < shapeLines.length; i++) {
            const values = shapeLines[i].split(",");
            if (values.length === 5) {
                const trainId = values[0];
                const coordinates = [parseFloat(values[2]), parseFloat(values[1])];
                const distance = (!values[4] || values[4].length === 0) ? "0.0" : values[4].trim();
                if (currentTrainId.length == 0 || currentTrainId !== trainId) {
                    if (currentTrainId.length > 0 && currentTrainId !== trainId) {
                        // different current train id
                        // add current train, then make a new train
                        trains[currentTrainId] = currentTrain;
                        currentTrainId = "";
                        currentTrain = {};
                    }
                    currentTrainId = trainId;
                    let data = {};
                    data[distance] = coordinates;
                    currentTrain["distanceCoordinates"] = [data];
                    currentTrain["allCoordinates"] = [coordinates];
                } else {
                    // continue adding coordinates to the current train
                    let data = {};
                    data[distance] = coordinates;
                    currentTrain["distanceCoordinates"].push(data);
                    currentTrain["allCoordinates"].push(coordinates);
                }
            }
        }

        // add the last train after iteration completion
        trains[currentTrainId] = currentTrain;
        currentTrainId = "";
        currentTrain = {};


        // ====================== Process Stop_times.txt ====================== //
        let currentTripId = "";
        let currentIter = 0;
        for (let i = 1; i < stopTimesLines.length; i++) {
            const values = stopTimesLines[i].split(",");
            if (values.length === 11) {
                const tripId = values[0];
                const arrive = values[1].split(":");
                const depart = values[2].split(":");
                var arrivalTime = new Date();
                arrivalTime.setHours(Number(arrive[0]), Number(arrive[1]), Number(arrive[2]), 0);
                var departureTime = new Date();
                departureTime.setHours(Number(depart[0]), Number(depart[1]), Number(depart[2]), 0);
                const stopId = values[3];
                const distance = (!values[8] || values[8].length === 0) ? "0.0" : values[8].trim();
                if (currentTripId.length == 0 || currentTripId !== tripId) {
                    currentTripId = tripId;
                    currentIter = 0;
                    stopTimes[currentTripId] = {};
                    stopTimes[currentTripId][currentIter] = {};
                }
                stopTimes[currentTripId][currentIter] = {
                    "arrivalTime": arrivalTime,
                    "departureTime": departureTime,
                    "stopId": stopId,
                    "distance": distance
                };
                currentIter += 1;
            }
        }


        // ====================== Process calendar.txt ====================== //
        for (let i = 1; i < calendarLines.length; i++) {
            const values = calendarLines[i].split(",");
            if (values.length === 10) {
                const trainId = values[0].trim();
                var startDate = new Date(
                    Number(values[1].substring(0,4)),
                    Number(values[1].substring(4,6)) - 1,
                    Number(values[1].substring(6))
                );
                startDate.setHours(0, 0, 0, 0);
                trains[trainId]["startDate"] = startDate;
                var endDate = new Date(
                    Number(values[2].substring(0,4)),
                    Number(values[2].substring(4,6)) - 1,
                    Number(values[2].substring(6))
                );
                endDate.setHours(0, 0, 0, 0);
                trains[trainId]["endDate"] = endDate;
                const days = {
                    0: (values[9] == 1),   // sunday
                    1: (values[3] == 1),
                    2: (values[4] == 1),
                    3: (values[5] == 1),
                    4: (values[6] == 1),
                    5: (values[7] == 1),
                    6: (values[8] == 1)    // saturday
                };
                trains[trainId]["daysOfOperation"] = days;
            }
        }


        return { 
            trains,
            stops,
            stopTimes
        };
    } catch (error) {
        console.error("Error fetching GTFS data:", error);
        return {
            "trains": {},
            "stops": {},
            "stopTimes": {}
        };
    }
}
