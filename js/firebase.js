// firebase.js
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, push, onValue, update } from 'firebase/database';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBzTBTgdujTM2WGYkaUlHZpvJeoVRqn65o",
  authDomain: "maquina-de-refrigerante.firebaseapp.com",
  databaseURL: "https://maquina-de-refrigerante-default-rtdb.firebaseio.com",
  projectId: "maquina-de-refrigerante",
  storageBucket: "maquina-de-refrigerante.appspot.com",
  messagingSenderId: "857635152294",
  appId: "1:857635152294:web:7123a876c7a2116470de7",
  measurementId: "G-J2D7T7J0W"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const auth = getAuth(app);

// Exportar todas as funções do Firebase
export { 
  ref, set, get, push, onValue, update,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  onAuthStateChanged, signOut 
};