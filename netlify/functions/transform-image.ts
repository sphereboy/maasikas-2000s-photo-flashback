import type { Handler } from "@netlify/functions";
import { GoogleGenAI, Modality } from "@google/genai";

// These prompts are copied from the original geminiService.ts to make the function self-contained.
const LOFI_PROMPT = `Transform this photo to look like it was taken at a party or social event between 2002-2005 with a typical consumer point-and-shoot digital camera. The aesthetic is "2000s Nightlife Throwback" - think authentic, not overly polished.

Key transformations to apply:
1.  **Simulate On-Camera Flash:** Re-light the image to mimic a direct, on-camera flash. This should create bright, slightly blown-out highlights on the foreground subject (especially faces) and cause the background to appear darker with some vignetting, as if it were a poorly lit room. Avoid making the shadows completely black; some background detail should remain visible.
2.  **Authentic Color Shift:** Adjust the colors to match early digital sensors. This includes slightly boosting saturation and adding a subtle cool tint (blue or magenta), particularly in the mid-tones and shadows.
3.  **Low-Resolution Feel:** Introduce a moderate amount of digital noise/grain and a slight overall softness to the image to replicate a low-megapixel sensor.
4.  **Date Stamp:** Add a classic yellow or orange digital date stamp in the bottom-right corner. Use a common font from that era. The format should be like '04 11 18' (YY MM DD). Use a random date between 2003 and 2005.
5.  **Watermark Logo:** In the bottom-left corner, add a small, semi-transparent watermark logo. The logo should be text-based, saying '2000s FLASHBACK' in a clean, futuristic, sans-serif font (similar to Orbitron or other digital-style fonts). The word 'FLASH' should be a different, vibrant color like neon pink or cyan. The rest of the text should be white.

The transformation should be noticeable and stylistic, but it must respect the original subject and composition. The final image should look like a plausible photograph from that time, not an extreme special effect.`;

const CUTOUT_PROMPT = `Create a fun, "paper cutout" or scrapbook-style image from the provided photo. The aesthetic is a playful and chaotic 2000s throwback.

Key transformations to apply:
1.  **Isolate and Style Subject:** Identify the main subject(s) in the photo. Create a "cutout" of them with a distinct, slightly uneven white border, as if they were cut out with scissors.
2.  **Create Artboard Background:** Place the subject cutout onto a simple, flat, colored artboard background. The color should be vibrant and reminiscent of the era, like pastel pink, electric blue, or lime green.
3.  **Add a Random Mix of Themed Objects:** From the extensive list below, randomly select 3 to 5 different objects to generate as small paper cutouts. Scatter them around the main subject. These objects must also have white "cutout" borders.
    **Iconic 2000s Object List:**
    - A flip phone (like a Motorola RAZR or a Nokia)
    - A blank CD-R with "Mix Tape" handwritten on it
    - An energy drink can (like Red Bull)
    - An early iPod model with a click wheel
    - A disposable camera
    - A digital pet on a keychain (like a Tamagotchi)
    - A Blockbuster video rental case
    - A portable CD player (Discman)
    - A floppy disk
    - Y2K-style sunglasses (like shield sunglasses)
    - Butterfly hair clips
    - A chunky CRT computer monitor displaying a classic instant messenger window
    - Bubble graffiti text saying one of the following: "OMG!", "LOL", "BFF", "Pwned", or "Cool!".
4.  **Composition and Shadow:** Arrange all cutouts (the main subject and the randomly selected themed objects) in a dynamic, overlapping, and random-looking composition. Apply a subtle drop shadow to all cutouts to give them a slight 3D effect, making them look like they're sitting on top of the artboard.
5.  **Watermark Logo:** Somewhere on the artboard, place a stylized text logo that says '2000s FLASHBACK'. The logo should fit the scrapbook theme, perhaps looking like another cutout or a sticker. Use a clean, futuristic font. The word 'FLASH' should be a different, vibrant color like neon pink or cyan to make it pop.

The final image should be a creative, fun, and unique collage that screams nostalgia for the early 2000s. The randomness of the objects is key to making each creation feel special.`;

interface RequestBody {
    base64ImageData: string;
    mimeType: string;
    style: 'lofi' | 'cutout';
}

const handler: Handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { API_KEY } = process.env;

    if (!API_KEY) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Server configuration error: API key is not set up." }),
        };
    }

    try {
        const { base64ImageData, mimeType, style } = JSON.parse(event.body || '{}') as RequestBody;

        if (!base64ImageData || !mimeType || !style) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Missing required image data or style." }),
            };
        }

        const ai = new GoogleGenAI({ apiKey: API_KEY });
        const prompt = style === 'lofi' ? LOFI_PROMPT : CUTOUT_PROMPT;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
                parts: [
                    { inlineData: { data: base64ImageData, mimeType: mimeType } },
                    { text: prompt },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return {
                    statusCode: 200,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ transformedBase64: part.inlineData.data }),
                };
            }
        }

        return {
            statusCode: 500,
            body: JSON.stringify({ error: "The AI model did not return an image. Please try a different photo." }),
        };

    } catch (error) {
        console.error("Error in transform-image function:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "An internal error occurred while transforming the image." }),
        };
    }
};

export { handler };
