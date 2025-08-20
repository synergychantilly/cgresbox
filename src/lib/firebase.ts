import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Firebase configuration
// Replace with your Firebase project config
const firebaseConfig = {
    apiKey: "AIzaSyDRFAPbMi42U4jNuioX8hrnFEVXJZju5cc",
    authDomain: "caregiver-resource-box.firebaseapp.com",
    databaseURL: "https://caregiver-resource-box-default-rtdb.firebaseio.com",
    projectId: "caregiver-resource-box",
    storageBucket: "caregiver-resource-box.firebasestorage.app",
    messagingSenderId: "1058377177301",
    appId: "1:1058377177301:web:10ab7ec47a79bc33aaea5c",
    measurementId: "G-V84NLLLCMY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;

