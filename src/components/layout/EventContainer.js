export default function EventContainer({ children }) {
    return (
        <div className="h-screen w-full flex overflow-hidden select-none bg-gray-100 dark:bg-gray-900">
        <div className="flex flex-col w-full h-full">
            <div className="flex-grow overflow-y-auto">{children}</div>
        </div>
        </div>
    );
    }