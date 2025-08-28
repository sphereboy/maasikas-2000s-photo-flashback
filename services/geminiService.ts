
import type { TransformStyle } from '../App';

export const transformImage = async (base64ImageData: string, mimeType: string, style: TransformStyle): Promise<string | null> => {
    try {
        const response = await fetch('/.netlify/functions/transform-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                base64ImageData,
                mimeType,
                style,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Failed to process the transformation on the server.' }));
            throw new Error(errorData.error || `Server responded with status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.transformedBase64) {
            return result.transformedBase64;
        }

        return null;

    } catch (error) {
        console.error("Error calling transformation service:", error);
        if (error instanceof Error) {
             throw new Error(error.message);
        }
        throw new Error("An unknown error occurred during image transformation.");
    }
};
