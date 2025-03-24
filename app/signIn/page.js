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
      <div className="mb-16">
        <h1 className="ext_title">Welcome Back</h1>
        <h2 className="ext_subtitle">Please sign in to continue</h2>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>} {/* Show error message */}

      <div className="flex justify-center items-center">
        <div className="w-[90%] max-w-[400px] p-6 border-2 border-gray-700 rounded-3xl">
            <form onSubmit={onSubmit} className="flex flex-col items-center">
            <h3 className="pl-2 self-start pb-2 text-gray-700 ext_label">E-mail</h3>
            <input className="w-[80%] max-w-[560px] px-4 py-3 mb-8 border" name="email" type="email" placeholder="e-mail" required />

            <h3 className="pl-2 self-start pb-2 text-gray-700 ext_label">Password</h3>
            <input className="w-[80%] max-w-[560px] px-4 py-3 mb-8 border" name="password" type="password" placeholder="password" required />

            <button type="submit" className="w-32 px-4 py-3 mx-auto dark_button" disabled={loading}>
                {loading ? "Signing In..." : "Sign In"}
            </button>

            {loading && (
                <div className="flex justify-center mt-4">
                <div className="animate-spin h-8 w-8 border-t-2 border-blue-500 rounded-full"></div>
                </div>
            )}
            </form>

            <button onClick={() => router.push("/signUp")} className="mx-20 mt-4 dark_button_without_background">
            I don't have an account
            </button>
        </div>
        </div>
    </div>
  );
}
