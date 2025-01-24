"use client";
import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { KPI } from "../components/kpi.js";
import { Map } from "../components/map.js";
import { Sidebar } from "../components/sidebar.js";
import "../styles.css";

export default function Page({ searchParams }) {
    const router = useRouter();
    const { userId, userToken } = use(searchParams);

    useEffect(() => {
        router.replace("/dashboard");
        // TODO: delete after debug
        // TODO: write auth cookie
        // TODO: make expiry for cookie
        alert("User authenticated: " + (userId != null && userToken != null).toString());
    }, []);

    // TODO: dynamically load names
    const username = "Bob";
    // TODO: dynamically load greeting
    var greeting = "evening";
    // TODO: dynamically load location
    var location = "Alberta";

    return (
        <div className="h-full w-full flex flex-col">
            <Sidebar/>

            {/* Main Content */}
            <div className="flex flex-col h-full w-full justify-stretch p-4">
                <div className="p-4 pb-0 mb-0">
                    <h1 className="text-4xl font-bold">Good {greeting}, {username}!</h1>
                    <h2 className="text-base font-bold pb-8">Here is your overview for {location}.</h2>
                </div>
                {/* TODO: use actual data */}
                <div className="flex flex-col h-full w-full">
                    <div className="h-40 flex-auto flex flex-col justify-center text-center">
                        <Map/>
                    </div>
                    <div className="h-10 flex-auto mt-2 flex flex-row justify-stretch">
                        <KPI/>
                    </div>
                </div>
            </div>
        </div>
    );
}
