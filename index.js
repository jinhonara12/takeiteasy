import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyAmmsatPaLxIGvdDMJk5X1IK3fN_KKFj3g",
    authDomain: "takeiteasy-d0bc5.firebaseapp.com",
    projectId: "takeiteasy-d0bc5",
    storageBucket: "takeiteasy-d0bc5.appspot.com",
    messagingSenderId: "857785177353",
    appId: "1:857785177353:web:83a41686cada58e8936fd8",
    measurementId: "G-7ZJHB220HB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);