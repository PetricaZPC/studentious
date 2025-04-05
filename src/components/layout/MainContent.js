import React, { useEffect, useState } from "react";
import { useAuth } from "../../pages/api/context/AuthContext";

export default function MainContent() {
    const { getEvents } = useAuth(); // Access getEvents from AuthContext
    const [joinedEvents, setJoinedEvents] = useState([]);
    const [availableEvents, setAvailableEvents] = useState([]);

    useEffect(() => {
        // Fetch events using getEvents from AuthContext
        getEvents().then((events) => {
            const joined = events.filter(event => event.joined); // Adjust based on your data structure
            const available = events.filter(event => !event.joined);
            setJoinedEvents(joined);
            setAvailableEvents(available);
        });
    }, [getEvents]);
    console.log(joinedEvents, availableEvents); // Debugging line
    return (
        <div className="bg-white p-4">
            <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
            
            {/* Courses Section */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-2">Courses I Joined</h2>
                <div className="bg-gray-100 p-4 rounded shadow">
                    <p>No courses joined yet.</p> {/* Placeholder */}
                </div>
            </div>
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-2">Courses Available</h2>
                <div className="bg-gray-100 p-4 rounded shadow">
                    <p>No courses available yet.</p> {/* Placeholder */}
                </div>
            </div>

            {/* Events Section */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-2">Events I Joined</h2>
                <div className="bg-gray-100 p-4 rounded shadow">
                    {joinedEvents.length > 0 ? (
                        joinedEvents.map((event, index) => (
                            <div key={index} className="mb-2">
                                <p>{event.name}</p>
                            </div>
                        ))
                    ) : (
                        <p>No events joined yet.</p>
                    )}
                </div>
            </div>
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-2">Events Available</h2>
                <div className="bg-gray-100 p-4 rounded shadow">
                    {availableEvents.length > 0 ? (
                        availableEvents.map((event, index) => (
                            <div key={index} className="mb-2">
                                <p>{event.name}</p>
                            </div>
                        ))
                    ) : (
                        <p>No events available yet.</p>
                    )}  )
                </div>  
            </div>     
        </div>       
    );   

}
