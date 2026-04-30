import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "fortresspass10",
  appId: "1:947190168239:web:35fb0721f0eda7ebc3f25a",
  storageBucket: "fortresspass10.firebasestorage.app",
  apiKey: "AIzaSyCSD6SANllZ_H-VBVWlG0pjFIbJXb1MzN0",
  authDomain: "fortresspass10.firebaseapp.com",
  messagingSenderId: "947190168239",
  measurementId: "G-Y6NX529XTQ"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
