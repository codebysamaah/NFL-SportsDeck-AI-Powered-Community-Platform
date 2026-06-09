export async function calculateSentiment(text) {
  try {
    const modelUrl = "https://router.huggingface.co/hf-inference/models/cardiffnlp/twitter-roberta-base-sentiment-latest";

    const response = await fetch(modelUrl, {
      headers: { 
        "Authorization": `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({ 
        inputs: text,
        options: { wait_for_model: true } 
      }),
    });

    // The api returns an array of arrays of sentiment scores
    //[[{"label":"positive","score":0.98...}, {"label":"neutral","score":0.01...}, {"label":"negative","score":0.01...}]]
    const result = await response.json();

    const top = result[0].reduce((prev, curr) => prev.score > curr.score ? prev : curr);

    if (top.label === "positive") return top.score;
    if (top.label === "negative") return -top.score;
    // If neutral, return 0
    return 0;
  } catch (error) {
    console.error("Sentiment calculation failed:", error);
    return 0; 
  }
}