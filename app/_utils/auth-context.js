import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";

export const signUp = async (email, password) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const userToken = await user.getIdToken(); // Ensure we wait for the token

        return { userId: user.uid, userToken }; // Return both values
    } catch (error) {
        console.error("Error signing up:", error.message);
        throw error;
    }
};

export const signIn = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const userToken = await user.getIdToken(); // Ensure we wait for the token

        return { userId: user.uid, userToken }; // Return both values
    } catch (error) {
        console.error("Error signing in:", error.message);
        throw error;
    }
};
