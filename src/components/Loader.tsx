
import React from 'react';

const loadingMessages = [
    "Rewinding time to the early 2000s...",
    "Applying digital camera flash...",
    "Finding the perfect Nokia ringtone...",
    "Adding a hint of pixelation...",
    "Processing with dial-up speeds...",
    "Burning a new CD mix for this photo...",
    "Adjusting color temperature...",
    "Reticulating splines...",
];

export const Loader: React.FC = () => {
    const [message, setMessage] = React.useState(loadingMessages[0]);

    React.useEffect(() => {
        const interval = setInterval(() => {
            setMessage(prevMessage => {
                const currentIndex = loadingMessages.indexOf(prevMessage);
                const nextIndex = (currentIndex + 1) % loadingMessages.length;
                return loadingMessages[nextIndex];
            });
        }, 2500);

        return () => clearInterval(interval);
    }, []);


    return (
        <div className="flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-purple-500"></div>
            <h2 className="text-2xl font-bold font-orbitron mt-6 text-white">Transforming...</h2>
            <p className="text-gray-400 mt-2 transition-opacity duration-500">{message}</p>
        </div>
    );
};