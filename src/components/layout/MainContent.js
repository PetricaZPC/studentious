import React, { useEffect, useState } from "react";
import { useAuth } from "../../pages/api/context/AuthContext";

export default function MainContent() {
    const { getAllEvents, user } = useAuth();
    const [joinedEvents, setJoinedEvents] = useState([]);
    const [availableEvents, setAvailableEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                setLoading(true);
                const events = await getAllEvents();
                const joined = events.filter(event => event.attendees && event.attendees.includes(user.uid));
                const available = events.filter(event => !event.attendees || !event.attendees.includes(user.uid));
                setJoinedEvents(joined);
                setAvailableEvents(available);
            } catch (error) {
                console.error("Error fetching events:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchEvents();
        }
    }, [getAllEvents, user]);

    return (
        <div className="bg-white p-6" id="main-content">
            <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

            {loading ? (
                <div className="text-center text-gray-500">Loading events...</div>
            ) : (
                <>
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold mb-4">Courses I Joined</h2>
                        <div className="bg-gray-100 p-4 rounded shadow">
                            <p>No courses joined yet.</p>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-xl font-semibold mb-4">Courses Available</h2>
                        <div className="bg-gray-100 p-4 rounded shadow">
                            <p>No courses available yet.</p>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-xl font-semibold mb-4">Events I Joined</h2>
                        <div className="bg-gray-100 p-4 rounded shadow">
                            {joinedEvents.length > 0 ? (
                                joinedEvents.map((event) => (
                                    <div key={event.id} className="mb-4">
                                        <h3 className="text-lg font-medium">{event.title}</h3>
                                        <p className="text-gray-600">{event.description}</p>
                                    </div>
                                ))
                            ) : (
                                <p>No events joined yet.</p>
                            )}
                        </div>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-xl font-semibold mb-4">Events Available</h2>
                        <div className="bg-gray-100 p-4 rounded shadow">
                            {availableEvents.length > 0 ? (
                                availableEvents.map((event) => (
                                    <div key={event.id} className="mb-4">
                                        <h3 className="text-lg font-medium">{event.title}</h3>
                                        <p className="text-gray-600">{event.description}</p>
                                    </div>
                                ))
                            ) : (
                                <p>No events available yet.</p>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}