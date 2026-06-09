// utils/translate.js
export async function translateToEnglish(text) {
  //if text looks like english, skip translation
  // the model has an issue when translating english to english
  if (!text || /^[A-Za-z0-9\s.,!?]+$/.test(text)) {
    return text;
  }
  try {
    const modelUrl = "https://router.huggingface.co/hf-inference/models/facebook/mbart-large-50-many-to-many-mmt";

    const response = await fetch(modelUrl, {
      headers: { 
        "Authorization": `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({ 
        inputs: text,
        parameters: { 
          src_lang: "auto", 
          tgt_lang: "en_XX" 
        },
        options: { 
          wait_for_model: true 
        } 
      }),
    });

    const result = await response.json();

    if (Array.isArray(result) && result[0]?.translation_text) {
      return result[0].translation_text;
    }
    return text; 
  } catch (error) {
    console.error("Translation via Router failed:", error);
    return text; 
  }
}