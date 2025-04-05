import Layout from '../components/layout/Layout';
import Sidebar from '../components/layout/Sidebar';
import DashboardContent from '../components/layout/DashboardContent';
import AuthGuard from './api/AuthGuard';

export default function Home() {
  return (
    <AuthGuard>
      <Layout>
        <Sidebar />
        <DashboardContent />
      </Layout>
    </AuthGuard>
  );
}