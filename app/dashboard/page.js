"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { KPI } from "../components/kpi.js";
import { Map } from "../components/map.js";
import { Sidebar } from "../components/sidebar.js";
import "../styles.css";

export default function DashboardPage() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // Check if the auth token exists in cookies
        const authToken = document.cookie
            .split("; ")
            .find((row) => row.startsWith("authToken="))
            ?.split("=")[1];

        if (!authToken) {
            router.replace("/"); // Redirect to sign-in if the user is not authenticated
        } else {
            setIsAuthenticated(true);
        }
    }, [router]);

    if (!isAuthenticated) {
        return <p className="text-center text-lg font-bold">Redirecting to sign in...</p>;
    }

    // TODO: dynamically load greeting
    const greeting = "evening";
    // TODO: dynamically load location
    const location = "Alberta";

    return (
        <div className="int_main_container">
            <Sidebar />
            {/* Main Content */}
            <div className="flex flex-col h-full w-full justify-stretch p-4">
                <div className="p-4 pt-1 mb-4 mt-0">
                    <h1 className="int_title">Good {greeting}!</h1>
                    <h2 className="int_subtitle">Here is your overview for {location}.</h2>
                </div>

                <div className="flex flex-col h-full w-full">
                    <div className="h-40 flex-auto">
                        <Map />
                    </div>
                    <div className="h-10 flex-auto mt-6">
                        <KPI />
                    </div>
                </div>
            </div>
        </div>
    );
}
