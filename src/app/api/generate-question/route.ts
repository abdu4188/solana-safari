import { OpenAI } from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST() {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a word puzzle generator. Generate an engaging word puzzle or vocabulary question. Return only a JSON object with 'question', 'answer', and optionally 'hint' fields. Make the questions challenging but solvable.",
        },
        {
          role: "user",
          content: "Generate a word puzzle question",
        },
      ],
      temperature: 0.7,
    });

    const responseContent = completion.choices[0].message.content;
    if (!responseContent) {
      throw new Error("No response from OpenAI");
    }

    // Parse the JSON response
    const questionData = JSON.parse(responseContent);

    return NextResponse.json(questionData);
  } catch (error) {
    console.error("Error generating question:", error);
    return NextResponse.json(
      { error: "Failed to generate question" },
      { status: 500 }
    );
  }
}
