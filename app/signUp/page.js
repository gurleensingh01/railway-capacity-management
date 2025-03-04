"use client";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { signUp } from "../components/utils/auth-context";
import "../styles.css";

export default function Page() {
    const router = useRouter();
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(null); // Success message state

    const emailRef = useRef(null);
    const passwordRef = useRef(null);
    const confirmPasswordRef = useRef(null);

    const validateInputs = (email, password, confirmPassword) => {
        if (!email || !password) return "Please fill out all fields.";
        if (password.length < 6) return "Password must be at least 6 characters.";
        if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter.";
        if (!/\d/.test(password)) return "Password must contain at least one number.";
        if (password !== confirmPassword) return "Passwords do not match.";
        return null;
    };

    const onSubmit = async (event) => {
        event.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);

        const email = emailRef.current.value;
        const password = passwordRef.current.value;
        const confirmPassword = confirmPasswordRef.current.value;

        const validationError = validateInputs(email, password, confirmPassword);
        if (validationError) {
            setError(validationError);
            setLoading(false);
            return;
        }

        try {
            const { userId, userToken } = await signUp(email, password);
            if (userId) {
                setSuccess("Account created successfully! Redirecting...");
                setTimeout(() => {
                    router.push(`/dashboard?userId=${userId}&userToken=${userToken}`);
                }, 1500);
            }
        } catch (error) {
            setError(error.message || "An error occurred during signup.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ext_main_container">
            <div className="mb-16">
                <h1 className="ext_title">Create an Account</h1>
                <h2 className="ext_subtitle">Please fill in the form to continue</h2>
            </div>

            {error && <p className="text-red-800 mb-4">{error}</p>}
            {success && <p style={{ color: "#223B34" }} className="mb-4">{success}</p>}

            <form onSubmit={onSubmit} className="flex flex-col">
                <h3 className="pl-2 pb-2 ext_label">E-mail</h3>
                <input className="w-[80%] max-w-[560px] h-[64px] pt-4 pr-0 pb-4 pl-6 mb-8" ref={emailRef} type="email" placeholder="e-mail" autoFocus/>

                <h3 className="pl-2 pb-2 ext_label">Password</h3>
                <input className="w-[80%] max-w-[560px] h-[64px] pt-4 pr-0 pb-4 pl-6 mb-8" ref={passwordRef} type="password" placeholder="password"/>

                <h3 className="pl-2 pb-2 ext_label">Confirm Password</h3>
                <input className="w-[80%] max-w-[560px] h-[64px] pt-4 pr-0 pb-4 pl-6 mb-16" ref={confirmPasswordRef} type="password" placeholder="confirm password"/>
                <div>
                    <button type="submit" className="w-[80%] max-w-[560px] h-[64px] pv-4 ph-24 dark_button" disabled={loading}>
                        {loading ? "Creating Account..." : "Register"}
                    </button>
                </div>

                {loading && (
                    <div className="flex justify-center mt-4">
                        <div className="animate-spin h-8 w-8 border-t-2 border-blue-500 rounded-full"></div>
                    </div>
                )}
            </form>
            <button onClick={() => router.push("/signIn")} className="mt-14 w-[80%] max-w-[560px] h-[64px] dark_button_without_background">I Have an Account</button>
        </div>
    );
}

