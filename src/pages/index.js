import Layout from '../components/layout/Layout';
import Sidebar from '../components/layout/Sidebar';
import MainContent from '../components/layout/MainContent';
import RightPanel from '../components/layout/RightPanel';
import {useAuth} from './api/context/AuthContext';
import AuthGuard from './api/AuthGuard';
export default function Home() {
  return (
    <AuthGuard>
      <Layout>
      <Sidebar />
      <MainContent />
  
    </Layout>
    </AuthGuard>
    
  );
}