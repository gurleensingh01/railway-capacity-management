"use client";
import { useRouter } from "next/navigation";
import "./styles.css";

export default function WelcomePage() {
    const router = useRouter();

    return (
        <div className="h-full w-full flex flex-col items-center justify-center">
            <div className="text-center">
                <h1 className="text-6xl font-bold mb-4">Welcome</h1>
                <h2 className="text-2xl italic mb-8">Railway Capacity Management</h2>

                <div className="flex space-x-6">
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
