import Layout from '../components/layout/Layout';
import Sidebar from '../components/layout/Sidebar';
import CoursesContent from '../components/layout/CoursesContent';


export default function Courses() {
  return (
    <Layout>
      <Sidebar />
      <CoursesContent />
      
    </Layout>
  );
}