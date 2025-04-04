export default function Layout({ children }) {
  return (
    <div className="h-screen w-full flex overflow-hidden select-none bg-gray-100 dark:bg-gray-900">
      {children}
    </div>
  );
}