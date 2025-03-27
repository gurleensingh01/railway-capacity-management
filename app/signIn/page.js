"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../components/utils/firebase"; // Import Firebase
import { doc, getDoc } from "firebase/firestore"; // Firestore functions
import "../styles.css";

export default function SignInPage() {
    const router = useRouter();
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const onSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const email = event.target.email.value;
    const password = event.target.password.value;

    if (!email || !password) {
        setError("Please fill out e-mail/password fields.");
        setLoading(false);
        return;
    }

    try {
        // Sign in using Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Fetch user's location from Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        let location = "Unknown";
        if (userDoc.exists()) {
            location = userDoc.data().location || "Unknown";
        }

        // Redirect to dashboard with location
        router.push(`/dashboard`);
        } catch (error) {
            setError(error.message || "Invalid email or password.");
        } finally {
            setLoading(false);
        }
    };

    return (
    <div className="ext_main_container">
        <div className="ext_greeting">
            <h1 className="ext_greeting_title">Welcome Back</h1>
            <h2 className="ext_greeting_subtitle">Please sign in to continue</h2>
        </div>

        <div className="ext_auth_container">
            <form onSubmit={onSubmit} className="ext_auth_form">
                <div className="ext_field_section">
                    <h3 className="ext_field_label">E-mail</h3>
                    <input className="ext_field_entry" name="email" type="email" placeholder="e-mail" autoFocus required />
                </div>

                <div className="ext_field_section">
                    <h3 className="ext_field_label">Password</h3>
                    <input className="ext_field_entry" name="password" type="password" placeholder="password" required />
                </div>

                {/* Error messages */}
                { error && (
                    <p className="ext_auth_error">{error}</p>
                )}

                <div className="ext_field_section">
                    <button type="submit" className="ext_auth_submit_button dark_button flex flex-row justify-center" disabled={loading}>
                    {loading ? <div className="text-center animate-spin h-8 w-8 border-t-2 border-white-500 rounded-full"></div> : "Sign In"}
                    </button>
                </div>
            </form>
            <button onClick={() => router.push("/signUp")} className="ext_auth_context_switcher dark_button_without_background">
                I don't have an account
            </button>
        </div>
    </div>
    );
}
