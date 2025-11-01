
import React from 'react';

interface LoadingScreenProps {
    progress: number;
    details: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress, details }) => {
    return (
        <div className="text-center w-full max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-4 text-purple-400">PROSES LOADING</h1>
            <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
            <p className="mt-4 text-sm text-gray-500 h-5">{details}</p>
        </div>
    );
};

export default LoadingScreen;
