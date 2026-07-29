import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAdGqdSqmCvMKtn9FYJ0H66B4GfUBaPqA0",
  authDomain: "rental-camera-aa424.firebaseapp.com",
  databaseURL: "https://rental-camera-aa424-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "rental-camera-aa424",
  storageBucket: "rental-camera-aa424.firebasestorage.app",
  messagingSenderId: "769500616417",
  appId: "1:769500616417:web:2d252989226bf15e5109a0"
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);