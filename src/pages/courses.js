import Layout from '../components/layout/Layout';
import Sidebar from '../components/layout/Sidebar';
import MainContent from '../components/layout/CoursesContent';
import RightPanel from '../components/layout/RightPanel';

export default function Courses() {
  return (
    <Layout>
      <Sidebar />
      <MainContent />
      <RightPanel />
    </Layout>
  );
}