import Layout from '../components/layout/Layout';
import Sidebar from '../components/layout/Sidebar';
import DashboardContent from '../components/layout/DashboardContent';
import AuthGuard from './api/AuthGuard';
<<<<<<< HEAD
import { useState, useEffect } from 'react';
=======

>>>>>>> 66a1d9f5529ed3d01ed3def56943a028fc3be26a
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
<<<<<<< HEAD
      <Sidebar />
      <MainContent />
    </Layout>
=======
        <Sidebar />
        <DashboardContent />
      </Layout>
>>>>>>> 66a1d9f5529ed3d01ed3def56943a028fc3be26a
    </AuthGuard>
  );
}