"use client";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../components/utils/firebase"; // Import Firebase services
import { doc, setDoc } from "firebase/firestore"; // Firestore functions
import "../styles.css";

// List of Canadian provinces
const provinces = [
    "All", "ON", "QC", "BC", "AB", "MB",
    "SK", "NS", "NB", "NL",
    "PE", "NT", "YT", "NU"
  ];  

export default function Page() {
  const router = useRouter();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [province, setProvince] = useState("All"); // Default province selection

  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  // Validation for email and password
  const validateInputs = (email, password, confirmPassword) => {
    if (!email || !password) return "Please fill out all fields.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter.";
    if (!/\d/.test(password)) return "Password must contain at least one number.";
    if (password !== confirmPassword) return "Passwords do not match.";
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
        router.push(`/dashboard?userId=${user.uid}`);
      }, 1500);
    } catch (error) {
      setError(error.message || "An error occurred during signup.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ext_main_container">
      <div className="mb-4">
        <h1 className="ext_title">Create an Account</h1>
        <h2 className="ext_subtitle">Please fill in the form to continue</h2>
      </div>

      {error && <p className="text-red-800 mb-4">{error}</p>}
      {success && <p style={{ color: "#223B34" }} className="mb-4">{success}</p>}

      <div className="flex justify-center items-center">
        <div className="w-[90%] max-w-[400px] p-6 border-2 border-gray-700 rounded-3xl">
            <form onSubmit={onSubmit} className="flex flex-col items-center">
            <h3 className="pl-2 self-start pb-2 ext_label">E-mail</h3>
            <input
                className="w-[80%] max-w-[560px] px-4 py-3 mb-8 border"
                ref={emailRef}
                type="email"
                placeholder="e-mail"
                autoFocus
                required
            />

            <h3 className="pl-2 self-start pb-2 ext_label">Password</h3>
            <input
                className="w-[80%] max-w-[560px] px-4 py-3 mb-8 border"
                ref={passwordRef}
                type="password"
                placeholder="password"
                required
            />

            <h3 className="pl-2 self-start pb-2 ext_label">Confirm Password</h3>
            <input
                className="w-[80%] max-w-[560px] px-4 py-3 mb-8 border"
                ref={confirmPasswordRef}
                type="password"
                placeholder="confirm password"
                required
            />

            {/* Province Selection */}
            <h3 className="pl-2 self-start pb-2 ext_label">Select Your Province</h3>
            <select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="w-[80%] max-w-[560px] px-4 py-3 mb-8 border"
                required
            >
                {provinces.map((prov) => (
                <option key={prov} value={prov}>
                    {prov}
                </option>
                ))}
            </select>

            <button
                type="submit"
                className="w-40 px-4 py-3 mx-auto mb-2 dark_button"
                disabled={loading}
            >
                {loading ? "Creating Account..." : "Register"}
            </button>

            {loading && (
                <div className="flex justify-center mt-4">
                <div className="animate-spin h-8 w-8 border-t-2 border-blue-500 rounded-full"></div>
                </div>
            )}
            </form>

            <button
            onClick={() => router.push("/signIn")}
            className="mx-20 mt-4 dark_button_without_background"
            >
            I have an account already
            </button>
        </div>
        </div>
    </div>
  );
}
