import Sidebar from "@/components/layout/Sidebar";
import AuthGuard from "../api/AuthGuard";
import Layout from "@/components/layout/Layout";
import { useAuth } from "../api/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";

export default function EventContainer() {
    const { user } = useAuth();
    const [thisEvent, setThisEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const router = useRouter();
    const { id } = router.query; // Get the event ID from the URL

    useEffect(()=>{
        const fetchEvent = async () =>{
            try{
                setLoading(true);
                const response = await fetch(`/api/events/${id}`);
                if(!response){
                    setError("Event not found.");
                    return;
                }else{
                    setThisEvent(thisE);
                    console.log(thisEvent);
                }
            }catch{
                console.log("Error bad");
            }finally{
                setLoading(false);
            }
        }
    },[user])

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

    if (error || !thisEvent) {
        return (
            <AuthGuard>
                <Layout>
                    <Sidebar />
                    <div className="flex flex-col w-full h-full overflow-hidden bg-gray-100 dark:bg-gray-900">
                        <p className="text-center text-gray-500 mt-10">{error || "Event not found."}</p>
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
                    <h1 className="text-3xl font-bold mb-4">Event Title: {thisEvent.title}</h1>
                    <p className="text-gray-700 mb-4">Description: {thisEvent.description}</p>
                    <p className="text-gray-500">
                        <strong>Location:</strong> {thisEvent.location || "Virtual"}
                    </p>
                    <p className="text-gray-500">
                        <strong>Start Time:</strong> {new Date(thisEvent.startTime).toLocaleString()}
                    </p>
                    <p className="text-gray-500">
                        <strong>End Time:</strong> {new Date(thisEvent.endTime).toLocaleString()}
                    </p>p
                </div>
            </Layout>
        </AuthGuard> 
    );   

}