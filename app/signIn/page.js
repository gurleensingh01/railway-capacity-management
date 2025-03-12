"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "../components/utils/auth-context"; // Ensure signIn is properly implemented
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

        if (!email || !password) {
            setError("Please fill out e-mail/password fields.");
            setLoading(false); // Stop loading
            return;
        }

        try {
            const { userToken } = await signIn(email, password); // Assume signIn returns a userToken
            if (userToken) {
                // Store authentication token in cookies
                document.cookie = `authToken=${userToken}; path=/; max-age=3600`; // Expires in 1 hour
                
                // Redirect to dashboard without query parameters
                router.push("/dashboard");
            }
        } catch (error) {
            setError(error.message);
            setLoading(false); // Stop loading if error occurs
        }
    };

    return (
        <div className="ext_main_container">
            <div className="mb-16">
                <h1 className="ext_title">Welcome Back</h1>
                <h2 className="ext_subtitle">Please sign in to continue</h2>
            </div>

            {error && <p className="text-red-500 mb-4">{error}</p>} {/* Show error message */}

            <form onSubmit={onSubmit} className="flex flex-col">
                <h3 className="pl-2 pb-2 ext_label">E-mail</h3>
                <input className="w-[80%] max-w-[560px] h-[64px] pt-4 pr-0 pb-4 pl-6 mb-8" name="email" type="email" placeholder="e-mail"/>

                <h3 className="pl-2 pb-2 ext_label">Password</h3>
                <input className="w-[80%] max-w-[560px] h-[64px] pt-4 pr-0 pb-4 pl-6 mb-16" name="password" type="password" placeholder="password"/>

                <button type="submit" className="w-[80%] max-w-[560px] h-[64px] pv-4 ph-24 dark_button" disabled={loading}>
                    {loading ? "Signing In..." : "Sign In"}
                </button>

                {/* Show loading icon when signing in */}
                {loading && (
                    <div className="flex justify-center mt-4">
                        <div className="animate-spin h-8 w-8 border-t-2 border-blue-500 rounded-full"></div>
                    </div>
                )}
            </form>
            <button onClick={() => router.push("/signUp")} className="pt-14 w-[80%] max-w-[560px] h-[64px] dark_button_without_background">
                I Don't Have an Account
            </button>
        </div>
    );
}
