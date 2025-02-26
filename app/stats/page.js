"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { KPI } from "../components/kpi.js";
import { Sidebar } from "../components/sidebar.js";
import "../styles.css";

export default function Page() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // Retrieve authentication token from cookies
        const authToken = document.cookie
            .split("; ")
            .find((row) => row.startsWith("authToken="))
            ?.split("=")[1];

        if (!authToken) {
            router.replace("/"); // Redirect to login if not authenticated
        } else {
            setIsAuthenticated(true);
        }
    }, []);

    if (!isAuthenticated) {
        return <p className="text-center text-lg font-bold">Redirecting to sign in...</p>;
    }

    // TODO: dynamically load location
    var location = "Alberta";

    return (
        <div className="h-full w-full flex flex-col">
            <Sidebar />

            {/* Main Content */}
            <div className="flex flex-col h-full w-full justify-stretch p-4">
                <div className="p-4 pb-0 mb-0">
                    <h1 className="text-4xl font-bold">Statistics</h1>
                    <h2 className="text-base font-bold pb-8">{location}</h2>
                </div>
                {/* TODO: use actual data */}
                <div className="flex-auto flex flex-row justify-stretch">
                    <KPI />
                </div>
            </div>
        </div>
    );
}
