import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, onValue } from 'firebase/database';

// Cấu hình Firebase Realtime Database do người dùng cung cấp
// Bạn có thể dán đè config thực tế của mình vào đây
const firebaseConfig = {
  databaseURL: "https://kqxs-b0135-default-rtdb.asia-southeast1.firebasedatabase.app", // Link Realtime Database của bạn
  apiKey: "AIzaSyAl4ywxMuKL0Gwliu61ntL-rJ5qUFS26t8",
  authDomain: "kqxs-b0135.firebaseapp.com",
  projectId: "kqxs-b0135",
  storageBucket: "kqxs-b0135.firebasestorage.app",
  messagingSenderId: "770805257017",
  appId: "1:770805257017:web:9f7502e34eb99941e5cee8",
  measurementId: "G-WZ9QB2F1CM"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database, ref, set, get, onValue };
