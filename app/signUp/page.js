"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signUp } from "../_utils/auth-context";
import "../styles.css";

export default function Page() {
    const router = useRouter();
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false); // State to track loading

    const onSubmit = async (event) => {
        event.preventDefault();
        setError(null);
        setLoading(true); // Show loading state

        const email = event.target.email.value;
        const password = event.target.password.value;
        const confirmPassword = event.target.confirmPassword.value; // Get confirm password

        // Check if passwords match
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            setLoading(false); // Stop loading
            return;
        }

        if (!email || !password) {
            setError("Please fill out e-mail/password fields.");
            setLoading(false); // Stop loading
            return;
        }

        try {
            const { userId, userToken } = await signUp(email, password);
            if (userId) {
                router.push(`/dashboard?userId=${userId}&userToken=${userToken}`);
            }
        } catch (error) {
            setError(error.message);
            setLoading(false); // Stop loading if error occurs
        }
    };

    return (
        <div className="h-full w-full flex flex-col m-auto justify-center">
            <div className="m-12">
                <div className="mb-12">
                    <h1 className="text-6xl font-bold">Welcome</h1>
                    <h2 className="text-lg font-bold">Please sign up to continue.</h2>
                </div>

                {error && <p className="text-red-500 mb-4">{error}</p>} {/* Show error message */}

                <form onSubmit={onSubmit} className="flex flex-col">
                    <h3 className="text-med font-bold pl-2 pb-2">E-mail:</h3>
                    <input
                        name="email"
                        type="email"
                        placeholder="e-mail"
                        className="w-[80%] max-w-[560px] h-16 pl-6 mb-4"
                    />

                    <h3 className="text-med font-bold pl-2 pb-2">Password:</h3>
                    <input
                        name="password"
                        type="password"
                        placeholder="password"
                        className="w-[80%] max-w-[560px] h-16 pl-6 mb-4"
                    />

                    <h3 className="text-med font-bold pl-2 pb-2">Confirm Password:</h3>
                    <input
                        name="confirmPassword"
                        type="password"
                        placeholder="confirm password"
                        className="w-[80%] max-w-[560px] h-16 pl-6 mb-12"
                    />

                    <button
                        type="submit"
                        className="h-16 w-[160px] dark_button text-lg font-bold p-auto"
                        disabled={loading} // Disable button while loading
                    >
                        {loading ? "Creating..." : "Create Account"}
                    </button>

                    {/* Show loading icon when signing up */}
                    {loading && (
                        <div className="flex justify-center mt-4">
                            <div className="animate-spin h-8 w-8 border-t-2 border-blue-500 rounded-full"></div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
