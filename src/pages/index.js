import Layout from "../components/layout/Layout";
import Sidebar from "../components/layout/Sidebar";
import DashboardContent from "../components/layout/DashboardContent";
import AuthGuard from "./api/AuthGuard";
import SendRecommendations from "../components/SendRecommendations";
import TodayEvents from "../components/layout/TodayEvents";

export default function Home() {
  return (
    <AuthGuard>
      <Layout>
        <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50 dark:bg-gray-900 overflow-y-auto">
          {/* Sidebar - Fixed on desktop, collapsible on mobile */}
          <div className="lg:w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 lg:min-h-screen">
            <Sidebar />
          </div>

          {/* Main Content Area */}
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            {/* Dashboard Header */}
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                Welcome to Your Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Stay updated with your learning progress and upcoming events
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                  <DashboardContent />
                </div>
              </div>

              <div className="space-y-6">
                {/* Recommendations Section */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Send Event Recommendations
                  </h2>
                  <SendRecommendations />
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Today's Events
                  </h2>
                  <div className="text-gray-500 dark:text-gray-400">
                    <TodayEvents />
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </Layout>
    </AuthGuard>
  );
}
