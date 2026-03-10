import { initializeApp } from "firebase/app";
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged,
    signOut,
    sendEmailVerification,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    updateProfile,
    updatePassword
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, updateDoc, increment, collection, addDoc, getDocs, query, where, orderBy, limit, startAfter } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBH0z--UwM5A38TP15efyDk-1rOytmPjG8",
    authDomain: "secretcloset-7993c.firebaseapp.com",
    projectId: "secretcloset-7993c",
    storageBucket: "secretcloset-7993c.firebasestorage.app",
    messagingSenderId: "12647219250",
    appId: "1:12647219250:web:00705a4bf496231779bc2b",
    measurementId: "G-NJ4R5JDW6R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export {
    auth,
    db,
    googleProvider,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    onAuthStateChanged,
    signOut,
    sendEmailVerification,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    updateProfile,
    updatePassword,
    doc, setDoc, getDoc, updateDoc, increment, collection, addDoc, getDocs, query, where, orderBy, limit, startAfter
};
