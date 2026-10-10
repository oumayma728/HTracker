export default function NotFound() {
    return (
        <div className="flex h-screen w-screen items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <h1 className="text-4xl font-bold text-gray-800">404</h1>   
                <p className="text-lg font-medium text-gray-700">Page not found</p>
            </div>
        </div>
    );
}