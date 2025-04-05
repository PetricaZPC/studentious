import { createContext, useContext, useEffect, useState } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, db } from '../config/firebaseConfig';

import { doc, setDoc, getDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function signup(email, password, fullName) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        fullName,
        email,
        createdAt: serverTimestamp()
      });
      return userCredential;
    } catch (error) {
      throw error;
    }
  }
  
  async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function logout() {
    return signOut(auth);
  }

  async function getEvents() {
    if(!user) return [];
    try{
      const eventRef = doc(db,"events");
      const docSnap = await getDoc(eventRef);
      if(docSnap.exists()){
        return {id: docSnap.id, ...docSnap.data()};
      }else{
        console.log("Sorry nu avem eventuri de loc");
      }
    }catch(error){
      console.log("nu esti bun bosule ")
    }
  }

  async function getAllEvents() {
    try {
        const eventsRef = collection(db, 'events');
        const querySnapshot = await getDocs(eventsRef);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching events:', error);
        return [];
    }
  }

  async function getUserProfile() {
    if (!user) return null;
    try {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        console.log('No such document!');
        return null;
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUser({ ...user, ...docSnap.data() });
        } else {
          setUser(user);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    signup,
    login,
    logout,
    getEvents,
    getAllEvents,
    getUserProfile,
    loading
};

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
