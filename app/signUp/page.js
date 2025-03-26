"use client";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../components/utils/firebase"; // Import Firebase services
import { doc, setDoc } from "firebase/firestore"; // Firestore functions
import "../styles.css";

// List of Canadian provinces
const provinces = [
        "Canada", "Alberta", "British Columbia", "Manitoba", "New Brunswick",
        "Newfoundland and Labrador", "Northwest Territories", "Nova Scotia", "Nunavut",
        "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan", "Yukon"
    ];  

export default function Page() {
    const router = useRouter();
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(null);
    const [province, setProvince] = useState("Canada"); // Default province selection

    const emailRef = useRef(null);
    const passwordRef = useRef(null);
    const confirmPasswordRef = useRef(null);

    // Validation for email and password
    const validateInputs = (email, password, confirmPassword) => {
        if (!email || !password)            return "Please fill out all fields.";
        if (password.length < 6)            return "Password must be at least 6 characters.";
        if (!/[A-Z]/.test(password))        return "Password must contain at least one uppercase letter.";
        if (!/\d/.test(password))           return "Password must contain at least one number.";
        if (password !== confirmPassword)   return "Passwords do not match.";
        return null;
    };

    // Handle user sign-up
    const onSubmit = async (event) => {
        event.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);

        const email = emailRef.current.value;
        const password = passwordRef.current.value;
        const confirmPassword = confirmPasswordRef.current.value;

        // Validate input
        const validationError = validateInputs(email, password, confirmPassword);
        if (validationError) {
            setError(validationError);
            setLoading(false);
            return;
        }

        try {
            // Sign up with Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Store user data in Firestore
            await setDoc(doc(db, "users", user.uid), {
                email: user.email,
                location: province,
            });

            setSuccess("Account created successfully! Redirecting...");
            setTimeout(() => {
                router.push(`/dashboard`);
            }, 1500);
        } catch (error) {
            setError(error.message || "An error occurred during signup.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ext_main_container">
            <div className="ext_greeting">
                <h1 className="ext_greeting_title">Create an Account</h1>
                <h2 className="ext_greeting_subtitle">Please fill in the form to continue</h2>
            </div>

            <div className="ext_auth_container">
                <form onSubmit={onSubmit} className="ext_auth_form">
                    <div className="ext_field_section">
                        <h3 className="ext_field_label">E-mail</h3>
                        <input className="ext_field_entry" ref={emailRef} type="email" placeholder="e-mail" autoFocus required/>
                    </div>

                    <div className="ext_field_section">
                        <h3 className="ext_field_label">Password</h3>
                        <input className="ext_field_entry" ref={passwordRef} type="password" placeholder="password" required/>
                    </div>

                    <div className="ext_field_section">
                        <h3 className="ext_field_label">Confirm Password</h3>
                        <input className="ext_field_entry" ref={confirmPasswordRef} type="password" placeholder="confirm password" required/>
                    </div>

                    {/* Province Selection */}
                    <div className="ext_field_section">
                        <h3 className="ext_field_label">Region</h3>
                        <select value={province} onChange={(e) => setProvince(e.target.value)} className="text-center ext_field_entry" required>
                            {provinces.map((prov) => (<option key={prov} value={prov}>{prov}</option>))}
                        </select>
                    </div>

                    {/* Loading message */}
                    {loading && (
                        <div className="flex justify-center mt-4">
                            <div className="animate-spin h-8 w-8 border-t-2 border-blue-500 rounded-full"></div>
                        </div>
                    )}

                    {/* Error messages */}
                    {error && <p className="ext_auth_error">{error}</p>}

                    {/* Success messages */}
                    {success && <p className="">{success}</p>}

                    <div className="ext_field_section">
                        <button type="submit" className="ext_auth_submit_button dark_button" disabled={loading} >
                            {loading ? "Creating Account..." : "Register"}
                        </button>
                    </div>
                </form>

                <button onClick={() => router.push("/signIn")} className="ext_auth_context_switcher dark_button_without_background">
                    I have an account already
                </button>
            </div>
        </div>
    );
}
