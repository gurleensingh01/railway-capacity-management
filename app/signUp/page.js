"use client";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { signUp } from "../_utils/auth-context";
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
        <div className="h-full w-full flex flex-col m-auto justify-center">
            <div className="m-12">
                <div className="mb-12">
                    <h1 className="text-6xl font-bold">Welcome</h1>
                    <h2 className="text-lg font-bold">Please sign up to continue.</h2>
                </div>

                {error && <p className="text-red-800 mb-4">{error}</p>}
                {success && <p style={{ color: "#223B34" }} className="mb-4">{success}</p>}

                <form onSubmit={onSubmit} className="flex flex-col">
                    <InputField label="E-mail:" type="email" ref={emailRef} autoFocus />
                    <InputField label="Password:" type="password" ref={passwordRef} />
                    <InputField label="Confirm Password:" type="password" ref={confirmPasswordRef} />

                    <button
                        type="submit"
                        className="h-16 w-[160px] dark_button text-lg font-bold"
                        disabled={loading}
                    >
                        {loading ? "Creating..." : "Create Account"}
                    </button>

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

// Reusable InputField component
const InputField = ({ label, type, ref, autoFocus }) => (
    <div className="mb-4">
        <h3 className="text-med font-bold pl-2 pb-2">{label}</h3>
        <input
            ref={ref}
            type={type}
            placeholder={label.toLowerCase()}
            className="w-[80%] max-w-[560px] h-16 pl-6"
            autoFocus={autoFocus}
        />
    </div>
);
