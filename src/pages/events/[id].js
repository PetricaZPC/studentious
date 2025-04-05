import { useParams } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import AuthGuard from "../api/AuthGuard";
import Layout from "@/components/layout/Layout";
import { useAuth } from "../api/context/AuthContext";
import { useEffect, useState } from "react";
import { collection, query, getDocs } from "firebase/firestore";
import { db } from "../api/config/firebaseConfig";

export default function EventContainer() {
    const { user, getAllEvents } = useAuth();
    const [thisEvent, setThisEvent] = useState(null);
    const [loading, setLoading] = useState(true);

    const { id } = useParams();

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                setLoading(true);
                const events = await getAllEvents();
                const event = events.find((event) => event.id === id);
                setThisEvent(event);
                console.log("Event fetched:", event);
            } catch (err) {
                console.error("Error fetching event:", err);
            } finally {
                setLoading(false);
                console.log("Loading state set to false");
            }
        };

        if (user) {
            fetchEvent();
        }
    }, [id, user, getAllEvents]);

    if (loading) {
        return (
            <AuthGuard>
                <Layout>
                    <Sidebar />
                    <div className="flex flex-col justify-center items-center w-full h-full overflow-hidden bg-gray-100 dark:bg-gray-900">
                        <p className="text-center text-gray-500 mt-10">Loading event...</p>
                    </div>
                </Layout>
            </AuthGuard>
        );
    }

    if (!thisEvent) {
        return (
            <AuthGuard>
                <Layout>
                    <Sidebar />
                    <div className="flex flex-col w-full h-full overflow-hidden bg-gray-100 dark:bg-gray-900">
                        <p className="text-center text-gray-500 mt-10">Event not found.</p>
                    </div>
                </Layout>
            </AuthGuard>
        );
    }

    return (
        <AuthGuard>
            <Layout>
                <Sidebar />
                <div className="flex flex-col w-full h-full overflow-hidden bg-white-100 dark:bg-gray-900 z-12 justify-center items-center p-6">
                    <h1 className="text-3xl font-bold mb-4">Titlul evenimentului: {thisEvent.title}</h1>
                    <p className="text-gray-700 mb-4">Descriere: {thisEvent.description}</p>
                    <p className="text-gray-500">
                        <strong>Location:</strong> {thisEvent.location || "Virtual"}
                    </p>
                    <p className="text-gray-500">
                        <strong>Start Time:</strong> {new Date(thisEvent.startTime).toLocaleString()}
                    </p>
                    <p className="text-gray-500">
                        <strong>End Time:</strong> {new Date(thisEvent.endTime).toLocaleString()}
                    </p>
                </div>
            </Layout>
        </AuthGuard>
    );
}