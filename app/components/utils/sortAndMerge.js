// sorting function/algorithm for train capacity highlights
export function sortAndMerge(unsortedIn) {
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