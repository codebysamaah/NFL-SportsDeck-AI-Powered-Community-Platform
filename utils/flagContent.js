import { InferenceClient } from "@huggingface/inference";

export async function checkContent(content){
    const client = new InferenceClient(process.env.HUGGINGFACE_API_KEY);
    const result = await client.textClassification({
        model: "unitary/unbiased-toxic-roberta",
        inputs: content,
        provider: "hf-inference",
    })
    return result.map((item) => ({
        ...item,
        label: item.label.toLowerCase() === "toxicity" ? "toxic" : item.label,
    }));
}