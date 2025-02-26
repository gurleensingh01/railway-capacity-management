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
        <div className="h-full w-full flex flex-col items-center justify-center">
            <div className="text-center">
                <h1 className="text-6xl font-bold mb-4">Welcome</h1>
                <h2 className="text-2xl italic mb-8">Railway Capacity Management</h2>

                <div className="flex space-x-6">
                {userId && <p className="text-lg font-bold text-gray-800">User ID: {userId}</p>}
                    <button
                        onClick={() => router.push("/signIn")}
                        className="h-16 w-[160px] dark_button text-lg font-bold"
                    >
                        Sign In
                    </button>
                    <button
                        onClick={() => router.push("/signUp")}
                        className="h-16 w-[160px] dark_button text-lg font-bold"
                    >
                        Sign Up
                    </button>
                </div>
            </div>
        </div>
    );
}
