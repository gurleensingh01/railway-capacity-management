"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../components/utils/firebase"; // Import Firebase
import { doc, getDoc } from "firebase/firestore"; // Firestore functions

import { Map } from "../components/map.js";
import { Sidebar } from "../components/sidebar.js";
import "../styles.css";

export default function DashboardPage() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userLocation, setUserLocation] = useState("Loading..."); // Default text

    useEffect(() => {
        // Listen for auth state changes
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (!user) {
                setIsAuthenticated(false);
                router.replace("/signIn"); // Redirect if not authenticated
            } else {
                setIsAuthenticated(true);

            // Fetch user's saved location from Firestore
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

    if (!isAuthenticated) {
        return <p className="text-center text-lg font-bold">Redirecting to sign in...</p>;
    } else {
        return (
            <div className="size-full int_main_container">
                <Sidebar />
          
                {/* Main Content */}
                <div className="size-full flex flex-col p-4">
                    <div className="p-4 pt-1 mb-[-32]">
                        <h1 className="int_title">Railway Map</h1>
                        <h2 className="int_subtitle">{userLocation}</h2>
                    </div>

                    <div className="size-full">
                        <Map region={userLocation}/>
                    </div>
                </div>
            </div>
        );
    }
}
