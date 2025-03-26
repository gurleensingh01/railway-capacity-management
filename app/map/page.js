"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../components/utils/firebase"; // Import Firebase
import { doc, getDoc } from "firebase/firestore"; // Firestore functions
import { RandomLoadMessage } from "../components/utils/randomLoadMessage.js";
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
        return <RandomLoadMessage/>;
    } else {
        return (
            <div className="int_main_container h-[calc(100%-88px)] w-full">
                <Sidebar />
                <div className="p-4 mb-[-32]">
                    <h1 className="int_title">Railway Map</h1>
                    <h2 className="int_subtitle">{userLocation}</h2>
                </div>


                {/* Main Content */}
                <div className="size-full flex flex-row flex-auto grow-0 shrink-0">
                    <Map region={userLocation}/>
                </div>
            </div>
        );
    }
}
