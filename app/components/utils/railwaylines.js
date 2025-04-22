/**
 * Adds railway lines, stops, trains, overlays and schedules for rendering.
 * Original logic extracted from map.js, including exact comment structure.
 */

import * as turf from "@turf/turf";

export function addRailwayLines({
  trains,
  stops,
  stopTimes,
  region,
  today,
  REGIONS,
  MAXIMUM_TIME_IN_MINUTES_BEFORE_FIRST_STOP
}) {
  const canUseFullMap = (region === "Canada");
  const bounds = REGIONS[region]["bounds"];
  const isPointInBounds = (point) => turf.booleanPointInPolygon(turf.point(point), turf.polygon([bounds]));
  
    // {
    //      "trainId": {
    //          "coordinates": [[coord, coord]],
    //          "isMoving": boolean
    // }
  const trainShapesToRender = {};
    // {
    //      "trainId": [allCoordinates],
    //      "trainId": [allCoordinates],
    //      ...
    // }
  const routeShapesToRender = {};
    // Overlaid train coordinates that overlay on other tracks
    // {
    //      "coordLonA, coordLatA, coordLonB, coordLatB": {
    //          "trains": ["trainId", "trainId", ...],
    //          "from": [coordLonA, coordLatA],
    //          "to":   [coordLonB, coordLatB]
    //      }
    // }
  const trackOverlaysToRender = {};
    // remaining coordinates left on this train's trip
    // {
    //      tripId: {
    //          "distance": distanceCoordinates
    //      }
    // }
  const trainRemainingCoordinates = {};
    // {
    //      "stopId": [[coord, coord]]
    // }
  const stopShapesToRender = {};
    // {
    //      "stopId": [
    //          { "tripId": time }
    //          ...
    //      ]
    //      ...
    // }
  const stopTrainSchedule = {};

  let totalRoutes = 0;
  let totalStops = 0;
  let totalTrains = 0;
  // remember: day starts at 0
  // month and year as normal
  const day = today.getDay();
  const addedStops = [];

  // ===================== Add Railway Lines ===================== //
  // *** L0
  for (const tripId in stopTimes) {
    const stopData = stopTimes[tripId];
    const stopDataLength = Object.keys(stopData).length;
    const train = trains[tripId];

    const start = train?.startDate;
    const end = train?.endDate;
    const op = train?.daysOfOperation;

    const currentMinutes = today.getHours() * 60 + today.getMinutes();
    const firstArrival = stopData[0].arrivalTime;
    const lastDeparture = stopData[stopDataLength - 1].departureTime;

    // ===== Check renderability ===== //
    if (!start || start > today) continue;
    if (!end || end < today) continue;
    if (!op || !op[day]) continue;

    const firstMinutes = firstArrival.getHours() * 60 + firstArrival.getMinutes();
    if (firstMinutes - currentMinutes > MAXIMUM_TIME_IN_MINUTES_BEFORE_FIRST_STOP) continue;

    const lastMinutes = lastDeparture.getHours() * 60 + lastDeparture.getMinutes();
    if (currentMinutes > lastMinutes) continue;

    // ===== This route can be rendered after this point ===== //
    totalRoutes++;

    const allCoords = train.allCoordinates;
    routeShapesToRender[tripId] = canUseFullMap ? allCoords : allCoords.filter(isPointInBounds);

    trainRemainingCoordinates[tripId] = {};
    for (const dist in train.distanceCoordinates) {
      const coord = train.distanceCoordinates[dist];
      if (canUseFullMap || isPointInBounds(coord)) {
        trainRemainingCoordinates[tripId][dist] = coord;
      }
    }

    // *** L1
    let trainCoordinates = [0, 0];
    let trainIsMoving = false;
    const hasNoDistances = Object.keys(train.distanceCoordinates).some(d => d.includes("-"));

    for (let i = 0; i < stopDataLength; i++) {
      const depart = stopData[i].departureTime;
      const departMin = depart.getHours() * 60 + depart.getMinutes();
      const stopId = stopData[i].stopId;
      const stopCoord = stops[stopId].coordinates;

      if (currentMinutes >= departMin) {
        if (hasNoDistances && i + 1 < stopDataLength) {
          const next = stopData[i + 1].departureTime;
          if (currentMinutes >= next.getHours() * 60 + next.getMinutes()) continue; // L1
        }

        trainIsMoving = true;

        if (hasNoDistances) {
          // *** L2
          let bestCoord = [0, 0];
          let bestDist = Infinity;

          for (const coord of allCoords) {
            const dx = Math.abs(coord[0] - stopCoord[0]);
            const dy = Math.abs(coord[1] - stopCoord[1]);
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < bestDist) {
              bestCoord = coord;
              bestDist = dist;
            }
          }

          trainCoordinates = bestCoord;

          // *** L3
          for (const d in trainRemainingCoordinates[tripId]) {
            if (
              trainRemainingCoordinates[tripId][d][0] !== bestCoord[0] ||
              trainRemainingCoordinates[tripId][d][1] !== bestCoord[1]
            ) {
              delete trainRemainingCoordinates[tripId][d];
            } else break; // L3
          }
        } else if (currentMinutes > departMin) {
          continue; // L1
        }
      }

      if (!hasNoDistances) {
        const arriveMin = stopData[i].arrivalTime.getHours() * 60 + stopData[i].arrivalTime.getMinutes();

        if (currentMinutes >= arriveMin || i === 0) {
          trainCoordinates = stopCoord;
          for (const d in trainRemainingCoordinates[tripId]) {
            if (parseFloat(d) < parseFloat(stopData[i].distance)) {
              delete trainRemainingCoordinates[tripId][d];
            }
          }
        } else {
          trainIsMoving = true;
          // *** L3
          const currentDist = parseFloat(stopData[i].distance);
          const lastDist = parseFloat(stopData[i - 1].distance);
          const lastTime = stopData[i - 1].arrivalTime.getHours() * 60 + stopData[i - 1].arrivalTime.getMinutes();
          const timeDelta = arriveMin - lastTime;
          const velocity = (currentDist - lastDist) / timeDelta;
          const approxDist = velocity * (currentMinutes - lastTime) + lastDist;

          let lastD = 0;
          for (const d in train.distanceCoordinates) {
            const val = parseFloat(d);
            if (val <= approxDist) {
              trainCoordinates = train.distanceCoordinates[d];
              lastD = val;
            }
            if (val >= approxDist) {
              // *** L4
              for (const dist in trainRemainingCoordinates[tripId]) {
                if (parseFloat(dist) < lastD) {
                  delete trainRemainingCoordinates[tripId][dist];
                }
              }
              break; // L3
            }
          }
        }
      }

      if (trainCoordinates[0] !== 0 && trainCoordinates[1] !== 0) {
        if (canUseFullMap || isPointInBounds(trainCoordinates)) {
          trainShapesToRender[tripId] = {
            coordinates: trainCoordinates,
            isMoving: trainIsMoving,
            headsign: trains[tripId]?.tripHeadsign || ""  
          };
        }
      }

      break; // L1
    }

    totalTrains++;

    // ===================== Add Railway Stops ===================== //
    for (const i in stopData) {
      const stopId = stopData[i].stopId;
      const coord = stops[stopId]?.coordinates;
      if (coord && !addedStops.includes(stopId) && (canUseFullMap || isPointInBounds(coord))) {
        stopShapesToRender[stopId] = coord;
        addedStops.push(stopId);
        totalStops++;
      }

      const arrival = stopData[i].arrivalTime;
      if (arrival.getHours() * 60 + arrival.getMinutes() >= currentMinutes) {
        stopTrainSchedule[stopId] = stopTrainSchedule[stopId] || [];
        const obj = {};
        obj[tripId] = arrival;

        let inserted = false;
        for (let j = 0; j < stopTrainSchedule[stopId].length; j++) {
          const existing = stopTrainSchedule[stopId][j];
          const exTime = Object.values(existing)[0];
          if (arrival <= exTime) {
            stopTrainSchedule[stopId].splice(j, 0, obj);
            inserted = true;
            break;
          }
        }
        if (!inserted) stopTrainSchedule[stopId].push(obj);
      }
    }

    // Track overlays
    const coords = trainRemainingCoordinates[tripId];
    let last = null;
    for (const d in coords) {
      const coord = coords[d];
      if (last) {
        const key = `${last[0]},${last[1]},${coord[0]},${coord[1]}`;
        const rev = `${coord[0]},${coord[1]},${last[0]},${last[1]}`;
        if (trackOverlaysToRender[key]) {
          trackOverlaysToRender[key].trains.push(tripId);
        } else if (trackOverlaysToRender[rev]) {
          trackOverlaysToRender[rev].trains.push(tripId);
        } else {
          trackOverlaysToRender[key] = {
            trains: [tripId],
            from: last,
            to: coord
          };
        }
      }
      last = coord;
    }
  }

  return {
    routeShapesToRender,
    trainShapesToRender,
    stopShapesToRender,
    trainRemainingCoordinates,
    trackOverlaysToRender,
    stopTrainSchedule,
    totalRoutes,
    totalStops,
    totalTrains
  };
}
