import { useAuth } from '@/context/AuthContext';
import AuthGuard from '@/components/AuthGuard';
import Head from "next/head";
import Sidebar from "@/components/layout/Sidebar";
import { useEffect } from "react";

export default function Resources() {
    const [Resources, setResources] = useState([]);
    const { user } = useAuth();
   

    return (
        <AuthGuard>

        </AuthGuard>  
  );
}