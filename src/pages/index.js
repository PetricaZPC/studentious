import Layout from '../components/layout/Layout';
import Sidebar from '../components/layout/Sidebar';
import MainContent from '../components/layout/MainContent';
import RightPanel from '../components/layout/RightPanel';
import {useAuth} from './api/context/AuthContext';
import AuthGuard from './api/AuthGuard';
import { useState, useEffect } from 'react';
export default function Home() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
   const fetchEvents = async () => {
        try {
          const q = query(collection(db, 'events'));
          const querySnapshot = await getDocs(q);
          const eventsList = [];
          querySnapshot.forEach((doc) => {
            eventsList.push({ id: doc.id, ...doc.data() });
          });
          setEvents(eventsList);
        } catch (err) {
          console.error('Error fetching events:', err);
        }
      };
  
  const eventlist = ()=>{
    return events.map((event) => (
      <div key={event.id} className="bg-white shadow-md rounded-lg p-4 mb-4">
        <h2 className="text-xl font-semibold">{event.title}</h2>
        <p>{event.description}</p>
        <p className="text-gray-500">{new Date(event.date).toLocaleDateString()}</p>
      </div>
    ));
  }  
  return (
    <AuthGuard>
      <Layout>
      <Sidebar />
      <MainContent />
    </Layout>
    </AuthGuard>
    
  );
}