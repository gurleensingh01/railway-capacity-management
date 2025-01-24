"use client";
import { useRouter } from "next/navigation";

import { Map } from "../components/map.js";
import { Sidebar } from "../components/sidebar.js";
import "../styles.css";

export default function Page() {
    const router = useRouter();

    // TODO: dynamically load location
    var location = "Alberta";

    return (
        <div className="h-full w-full flex flex-col">
            <Sidebar/>

            {/* Main Content */}
            <div className="flex flex-col h-full w-full justify-stretch p-4">
                <div className="p-4 pb-0 mb-0">
                    <h1 className="text-4xl font-bold">Railway Map</h1>
                    <h2 className="text-base font-bold pb-8">{location}</h2>
                </div>
                {/* TODO: use actual data */}
                <div className="flex-auto flex flex-col h-full w-full">
                    <Map/>
                </div>
            </div>
        </div>
    );
}
