"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../components/utils/firebase"; // Import Firebase
import { doc, getDoc } from "firebase/firestore";

import { KPI } from "../components/kpi.js";
import { Map } from "../components/map.js";
import { Sidebar } from "../components/sidebar.js";
import "../styles.css";

export default function DashboardPage() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userLocation, setUserLocation] = useState("Loading..."); // Default text
    const hours = new Date().getHours();
    var greeting = "Welcome!";
    if (hours < 12) greeting = "Good Morning!";
    else if (hours < 18) greeting = "Good Afternoon!";
    else greeting = "Good Evening!";

    useEffect(() => {
        // Authenticate user
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (!user) {
                setIsAuthenticated(false);
                router.replace("/"); // Redirect to sign-in if the user is not authenticated
            } else {
                setIsAuthenticated(true);

                // Fetch user location from Firestore
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    setUserLocation(userDoc.data().location || "Unknown");
                } else {
                    setUserLocation("Unknown");
                }
            }
        });

        return () => unsubscribe();
    }, [router]);

    while (true) {
        if (!isAuthenticated) {
            return <p className="text-center text-lg font-bold">Redirecting to sign in...</p>;
        } else {
            if (userLocation !== null && userLocation !== undefined && userLocation !== "Unknown") {
                return (
                    <div className="size-full int_main_container">
                        <Sidebar/>

                        {/* Main Content */}
                        <div className="size-full flex flex-col p-4">
                            <div className="p-4">
                                <h1 className="int_title">{greeting}</h1>
                                <h2 className="int_subtitle">Here is your overview for {userLocation}.</h2>
                            </div>

                            <div className="size-full flex flex-col gap-2">
                                <div className="h-5/6 w-full">
                                    <Map region={userLocation}/>
                                </div>
                                <div className="h-1/6 w-full">
                                    <KPI/>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            }
        }
    }
}
