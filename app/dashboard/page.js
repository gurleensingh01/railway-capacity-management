"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../components/utils/firebase"; // Import Firebase
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { RandomLoadMessage } from "../components/utils/randomLoadMessage.js";
import { Map } from "../components/map.js";
import "../styles.css";

export default function DashboardPage() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userLocation, setUserLocation] = useState("Loading...");
    const [message, setMessage] = useState("");
    const [userMessage, setUserMessage] = useState("");
    const [userEmail, setUserEmail] = useState("");
    const hours = new Date().getHours();
    var greeting = "Welcome!";
    if (hours < 12 && hours >= 5) {
        greeting = "Good Morning!";
    } else if (hours >= 12 && hours < 18) {
        greeting = "Good Afternoon!";
    } else {
        greeting = "Good Evening!";
    }

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.replace("/");
        } catch (error) {
            console.error("Logout error:", error.message);
        }
    };

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
                if (!userDoc.exists()) {
                    setUserEmail( "Unknown User");
                    setUserLocation("Unknown");
                } else {
                    let data = userDoc.data();
                    if (data.location) {
                        setUserLocation(data.location) ;
                        setMessage("Here is your overview for " + data.location + ".");
                    } else {
                        setUserLocation("Unknown");
                    }
                    if (data.email) {
                        setUserMessage("Signed in as ");
                        setUserEmail(data.email);
                    } else {
                        setUserEmail("Unknown User");
                    }
                }
            }
        });

        return () => unsubscribe();
    }, [router]);

    while (true) {
        if (!isAuthenticated) {
            return <RandomLoadMessage/>;
        } else {
            if (userLocation !== null && userLocation !== undefined && userLocation !== "Unknown") {
                return (
                    <div className="int_main_container h-[calc(100%-112px)] w-full">
                        <div className="w-full h-fit flex flex-row p-2 mb-2 space-between">
                            <div className="w-full h-fit flex flex-col">
                                <h1 className="int_title">{greeting}</h1>
                                <h2 className="int_subtitle">{message}&nbsp;</h2>
                            </div>
                            <div className="w-full flex flex-col justify-items-end text-right mt-2">
                                <div className="w-full flex flex-row whitespace-nowrap justify-end">
                                    <p className="text-m">{userMessage}&#20;</p>
                                    <p className="text-m"><b>{userEmail}</b></p>
                                </div>
                                <a onClick={handleLogout} href="#" className="w-[80px] dark_button_mini ml-auto mr-0 py-2 px-6">Log Out</a>
                            </div>
                        </div>
                        <div className="size-full flex flex-row flex-auto grow-0 shrink-0">
                            <Map region={userLocation}/>
                        </div>
                    </div>
                );
            }
        }
    }
}
