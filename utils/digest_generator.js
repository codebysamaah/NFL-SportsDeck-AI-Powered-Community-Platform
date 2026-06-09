export async function generateDigest(data) {
    try {
        const modelUrl = "https://router.huggingface.co/hf-inference/models/facebook/bart-large-cnn";

        const response = await fetch(modelUrl, {
            headers: {
                "Authorization": `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
                "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({
                inputs: data,
                options: { wait_for_model: true }
            }),
        });

        const result = await response.json();

        if (Array.isArray(result) && result[0].summary_text) {
            return result[0].summary_text;
        }
        
        return "Could not generate a summary from the provided data.";

    } catch (error) {
        console.error("Digest generation failed:", error);
        return "Daily Digest is currently unavailable.";
    }
}