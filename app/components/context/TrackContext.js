"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { fetchGTFSData } from "../utils/fetchShapeData"; // Import function to fetch GTFS data

const TrackContext = createContext();

export function TrackProvider({ children }) {
    const [selectedTrack, setSelectedTrack] = useState(null);
    const [tripCounts, setTripCounts] = useState({}); // Store trip counts

    useEffect(() => {
        // Fetch GTFS data (including trip counts) when the app starts
        async function loadGTFSData() {
            const data = await fetchGTFSData();
            setTripCounts(data.tripCounts);
        }
        loadGTFSData();
    }, []);

    return (
        <TrackContext.Provider value={{ selectedTrack, setSelectedTrack, tripCounts }}>
            {children}
        </TrackContext.Provider>
    );
}

export function useTrack() {
    return useContext(TrackContext);
}
