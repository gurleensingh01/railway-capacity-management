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
  const [greeting, setGreeting] = useState("Hello");

  useEffect(() => {
    // Authenticate user
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
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

    // Set greeting dynamically
    const hours = new Date().getHours();
    if (hours < 12) setGreeting("Morning");
    else if (hours < 18) setGreeting("Afternoon");
    else setGreeting("Evening");

    return () => unsubscribe();
  }, [router]);

  if (!isAuthenticated) {
    return <p className="text-center text-lg font-bold">Redirecting to sign in...</p>;
  }

  return (
    <div className="int_main_container">
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex flex-col h-full w-full justify-stretch p-4">
        <div className="p-4 pt-1 mb-4 mt-0">
          <h1 className="int_title">Good {greeting}!</h1>
          <h2 className="int_subtitle">Here is your overview for {userLocation}.</h2>
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
