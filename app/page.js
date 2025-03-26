"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "./styles.css";

export default function WelcomePage() {
    const router = useRouter();
    const [userId, setUserId] = useState(null);
    const [userToken, setUserToken] = useState(null);

    useEffect(() => {
        // Retrieve authentication token and user ID from cookies
        const authToken = document.cookie
            .split("; ")
            .find((row) => row.startsWith("authToken="))
            ?.split("=")[1];

        const storedUserId = document.cookie
            .split("; ")
            .find((row) => row.startsWith("userId="))
            ?.split("=")[1];

        if (authToken && storedUserId) {
            setUserId(storedUserId);
            setUserToken(authToken);

            // Redirect authenticated users to the dashboard with user details
            router.replace(`/dashboard?userId=${storedUserId}&userToken=${authToken}`);
        }
    }, []);

    return (
        <div className="ext_main_container">
            <div className="h-full w-full flex flex-col items-center justify-center">
                <div className="text-center">
                    <h1 className="ext_greeting_title">Welcome</h1>
                    <h2 className="font-thin italic mb-8">Railway Capacity Management</h2>

                    <div className="flex flex-row space-x-5 justify-center" >
                        <button onClick={() => router.push("/signUp")} className="w-[50%] max-w-[560px] h-[64px] pv-4 ph-24 dark_button">Register</button>
                        <button onClick={() => router.push("/signIn")} className="w-[50%] max-w-[560px] h-[64px] pv-4 ph-24 dark_button">Sign In</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
