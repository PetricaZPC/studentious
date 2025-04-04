import Layout from '../components/layout/Layout';
import Sidebar from '../components/layout/Sidebar';
import MainContent from '../components/layout/MainContent';
import RightPanel from '../components/layout/RightPanel';

export default function Home() {
  return (
    <Layout>
      <Sidebar />
      <MainContent />
      <RightPanel />
    </Layout>
  );
}