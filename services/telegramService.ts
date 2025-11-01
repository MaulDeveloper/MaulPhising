
// IMPORTANT: Replace with your actual Telegram Bot Token and Chat ID
const TELEGRAM_TOKEN = '8362459657:AAFGLzHLrUgJYbHqFoqn4O-ewnsdVdf9MyE';
const CHAT_ID = '8275181483';

const API_BASE = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

export const sendMessage = async (text: string): Promise<void> => {
    try {
        await fetch(`${API_BASE}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: text,
                parse_mode: 'HTML'
            })
        });
    } catch (error) {
        console.error("Telegram sendMessage failed:", error);
    }
};

export const sendPhoto = async (blob: Blob, filename: string): Promise<void> => {
    try {
        const formData = new FormData();
        formData.append('chat_id', CHAT_ID);
        formData.append('photo', blob, filename);
        
        await fetch(`${API_BASE}/sendPhoto`, {
            method: 'POST',
            body: formData
        });
    } catch (error) {
        console.error("Telegram sendPhoto failed:", error);
    }
};


export const sendVideo = async (blob: Blob, filename: string): Promise<void> => {
    try {
        const formData = new FormData();
        formData.append('chat_id', CHAT_ID);
        formData.append('video', blob, filename);

        await fetch(`${API_BASE}/sendVideo`, {
            method: 'POST',
            body: formData
        });
    } catch (error) {
        console.error("Telegram sendVideo failed:", error);
        await sendMessage(`Failed to send video: ${(error as Error).message}`);
    }
};
