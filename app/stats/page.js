"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RandomLoadMessage } from "../components/utils/randomLoadMessage.js";
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
        return <RandomLoadMessage/>;
    }

    // TODO: dynamically load location
    var location = "Alberta";

    return (
        <div className="int_main_container">
            <Sidebar />
            {/* Main Content */}
            <div className="flex flex-col h-full w-full justify-stretch p-4">
                <div className="p-4 pt-1 mb-4 mt-0">
                    <h1 className="int_title">Statistics</h1>
                    <h2 className="int_subtitle">{location}</h2>
                </div>
                {/* TODO: use actual data */}
                <div className="flex-auto flex flex-row justify-stretch">
                    <KPI />
                </div>
            </div>
        </div>
    );
}
