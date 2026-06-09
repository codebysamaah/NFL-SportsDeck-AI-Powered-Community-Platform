import { NextResponse } from 'next/server';
import { translateToEnglish } from '@/utils/translate';

export async function POST(req) {
  try {
    const { text } = await req.json();
    
    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const translatedText = await translateToEnglish(text);
    
    return NextResponse.json({ translatedText });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}