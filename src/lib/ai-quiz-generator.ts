import OpenAI from "openai";
import type { QuizQuestion, QuizDifficulty } from "@/types";

interface AIQuizGenerationOptions {
  lessonContent: string;
  lessonTitle: string;
  numQuestions: number;
  difficulty: QuizDifficulty;
}

interface CustomQuizGenerationOptions {
  topic: string;
  description?: string;
  numQuestions: number;
  difficulty: QuizDifficulty;
}

/**
 * Initializes OpenAI client
 */
function getOpenAIClient(): OpenAI {
  const apiKey = import.meta.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  return new OpenAI({
    apiKey,
  });
}

/**
 * Gets the configured model for quiz generation
 */
function getQuizModel(): string {
  return import.meta.env.OPENAI_QUIZ_MODEL || "gpt-4o";
}

/**
 * Gets the max tokens for quiz generation
 */
function getMaxTokens(): number {
  const tokens = import.meta.env.OPENAI_QUIZ_MAX_TOKENS;
  return tokens ? parseInt(tokens) : 4000;
}

/**
 * Generates quiz questions using AI based on lesson content
 */
export async function generateQuizFromLesson(options: AIQuizGenerationOptions): Promise<QuizQuestion[]> {
  const { lessonContent, lessonTitle, numQuestions, difficulty } = options;

  // Strip HTML tags from lesson content
  const plainContent = stripHtml(lessonContent);

  // Truncate content if too long (max ~8000 chars to stay within token limits)
  const truncatedContent = plainContent.length > 8000 ? plainContent.substring(0, 8000) + "..." : plainContent;

  // Build the prompt
  const prompt = buildQuizGenerationPrompt(lessonTitle, truncatedContent, numQuestions, difficulty);

  return await generateQuizWithOpenAI(prompt, numQuestions);
}

/**
 * Generates quiz questions using AI based on custom topic and description
 */
export async function generateQuizFromPrompt(options: CustomQuizGenerationOptions): Promise<QuizQuestion[]> {
  const { topic, description, numQuestions, difficulty } = options;

  // Validate topic
  if (!topic || topic.trim().length < 3) {
    throw new Error("Temat quizu musi mieć co najmniej 3 znaki");
  }

  // Build the prompt for custom topic
  const prompt = buildCustomQuizPrompt(topic, description, numQuestions, difficulty);

  return await generateQuizWithOpenAI(prompt, numQuestions);
}

/**
 * Core function that calls OpenAI API to generate quiz
 */
async function generateQuizWithOpenAI(prompt: string, numQuestions: number): Promise<QuizQuestion[]> {
  try {
    const openai = getOpenAIClient();

    const completion = await openai.chat.completions.create({
      model: getQuizModel(),
      messages: [
        {
          role: "system",
          content:
            "Jesteś ekspertem w tworzeniu quizów edukacyjnych. Twoje pytania są jasne, merytoryczne i testują rzeczywiste zrozumienie materiału. Zawsze odpowiadasz w formacie JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: getMaxTokens(),
    });

    // Extract the AI's response
    const aiResponse = completion.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error("No response from AI");
    }

    // Parse the response
    const questions = parseAIResponse(aiResponse, numQuestions);

    return questions;
  } catch (error) {
    console.error("Error generating quiz with AI:", error);

    if (error instanceof Error) {
      // Handle specific OpenAI errors
      if (error.message.includes("API key")) {
        throw new Error("Błąd konfiguracji API. Skontaktuj się z administratorem.");
      }
      if (error.message.includes("rate_limit")) {
        throw new Error("Przekroczono limit zapytań API. Spróbuj ponownie za chwilę.");
      }
      throw error;
    }

    throw new Error("Nie udało się wygenerować quizu");
  }
}

/**
 * Builds the prompt for quiz generation from custom topic
 */
function buildCustomQuizPrompt(
  topic: string,
  description: string | undefined,
  numQuestions: number,
  difficulty: QuizDifficulty
): string {
  const difficultyDescriptions = {
    easy: "łatwy - podstawowe pytania sprawdzające znajomość kluczowych pojęć i faktów",
    medium: "średni - pytania wymagające zrozumienia materiału i umiejętności jego zastosowania",
    hard: "trudny - pytania wymagające głębokiej analizy, syntezy wiedzy i rozwiązywania problemów",
  };

  return `Wygeneruj ${numQuestions} pytań wielokrotnego wyboru do quizu na temat: "${topic}".

${description ? `DODATKOWY KONTEKST:\n${description}\n` : ""}
WYMAGANIA:
- Poziom trudności: ${difficultyDescriptions[difficulty]}
- Każde pytanie ma dokładnie 4 opcje odpowiedzi (A, B, C, D)
- Tylko jedna odpowiedź jest poprawna
- Pytania muszą testować zrozumienie tematu
- Unikaj pytań typu "trick question" - pytania powinny być jasne i jednoznaczne
- Odpowiedzi powinny być konkretne i merytoryczne
- Niepoprawne odpowiedzi (dystraktory) powinny być prawdopodobne, ale jednoznacznie błędne
- Pytania powinny być zróżnicowane i pokrywać różne aspekty tematu

FORMAT ODPOWIEDZI:
Odpowiedz TYLKO w formacie JSON (bez żadnego dodatkowego tekstu), używając następującej struktury:

\`\`\`json
[
  {
    "question": "Treść pytania?",
    "options": [
      "Opcja A - pierwsza odpowiedź",
      "Opcja B - druga odpowiedź",
      "Opcja C - trzecia odpowiedź",
      "Opcja D - czwarta odpowiedź"
    ],
    "correct_answer": 0
  }
]
\`\`\`

UWAGI:
- "correct_answer" to indeks poprawnej odpowiedzi (0 dla A, 1 dla B, 2 dla C, 3 dla D)
- Generuj dokładnie ${numQuestions} pytań
- Upewnij się, że JSON jest poprawnie sformatowany
- Nie dodawaj żadnego tekstu poza JSONem`;
}

/**
 * Builds the prompt for quiz generation
 */
function buildQuizGenerationPrompt(
  lessonTitle: string,
  lessonContent: string,
  numQuestions: number,
  difficulty: QuizDifficulty
): string {
  const difficultyDescriptions = {
    easy: "łatwy - podstawowe pytania sprawdzające znajomość kluczowych pojęć i faktów",
    medium: "średni - pytania wymagające zrozumienia materiału i umiejętności jego zastosowania",
    hard: "trudny - pytania wymagające głębokiej analizy, syntezy wiedzy i rozwiązywania problemów",
  };

  return `Wygeneruj ${numQuestions} pytań wielokrotnego wyboru do quizu na podstawie poniższej lekcji.

TYTUŁ LEKCJI:
${lessonTitle}

TREŚĆ LEKCJI:
${lessonContent}

WYMAGANIA:
- Poziom trudności: ${difficultyDescriptions[difficulty]}
- Każde pytanie ma dokładnie 4 opcje odpowiedzi (A, B, C, D)
- Tylko jedna odpowiedź jest poprawna
- Pytania muszą testować zrozumienie materiału z lekcji
- Unikaj pytań typu "trick question" - pytania powinny być jasne i jednoznaczne
- Odpowiedzi powinny być konkretne i merytoryczne
- Niepoprawne odpowiedzi (dystraktory) powinny być prawdopodobne, ale jednoznacznie błędne
- Pytania powinny być zróżnicowane i pokrywać różne aspekty materiału

FORMAT ODPOWIEDZI:
Odpowiedz TYLKO w formacie JSON (bez żadnego dodatkowego tekstu), używając następującej struktury:

\`\`\`json
[
  {
    "question": "Treść pytania?",
    "options": [
      "Opcja A - pierwsza odpowiedź",
      "Opcja B - druga odpowiedź",
      "Opcja C - trzecia odpowiedź",
      "Opcja D - czwarta odpowiedź"
    ],
    "correct_answer": 0
  }
]
\`\`\`

UWAGI:
- "correct_answer" to indeks poprawnej odpowiedzi (0 dla A, 1 dla B, 2 dla C, 3 dla D)
- Generuj dokładnie ${numQuestions} pytań
- Upewnij się, że JSON jest poprawnie sformatowany
- Nie dodawaj żadnego tekstu poza JSONem`;
}

/**
 * Parses AI response and extracts quiz questions
 */
function parseAIResponse(aiResponse: string, expectedCount: number): QuizQuestion[] {
  try {
    // Try to extract JSON from the response
    // Sometimes AI wraps JSON in markdown code blocks
    let jsonStr = aiResponse.trim();

    // Remove markdown code blocks if present
    const jsonMatch = jsonStr.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    // If response doesn't start with '[', try to find the JSON array
    if (!jsonStr.startsWith("[")) {
      const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        jsonStr = arrayMatch[0];
      }
    }

    // Parse the JSON
    const parsedData = JSON.parse(jsonStr);

    if (!Array.isArray(parsedData)) {
      throw new Error("Response is not an array");
    }

    // Validate and transform the questions
    const questions: QuizQuestion[] = parsedData.map((item, index) => {
      // Validate question structure
      if (!item.question || typeof item.question !== "string") {
        throw new Error(`Question ${index + 1}: missing or invalid 'question' field`);
      }

      if (!Array.isArray(item.options) || item.options.length !== 4) {
        throw new Error(`Question ${index + 1}: must have exactly 4 options`);
      }

      if (typeof item.correct_answer !== "number" || item.correct_answer < 0 || item.correct_answer > 3) {
        throw new Error(`Question ${index + 1}: 'correct_answer' must be 0, 1, 2, or 3`);
      }

      // Ensure all options are strings
      const options = item.options.map((opt: any) => String(opt).trim());

      return {
        id: crypto.randomUUID(),
        question: item.question.trim(),
        options,
        correct_answer: item.correct_answer,
      };
    });

    // Check if we got the expected number of questions
    if (questions.length !== expectedCount) {
      console.warn(`Expected ${expectedCount} questions, but got ${questions.length}. Using what we have.`);
    }

    if (questions.length === 0) {
      throw new Error("No valid questions were generated");
    }

    return questions;
  } catch (error) {
    console.error("Error parsing AI response:", error);
    console.error("AI Response:", aiResponse);
    throw new Error(
      error instanceof Error
        ? `Nie udało się przetworzyć odpowiedzi AI: ${error.message}`
        : "Nie udało się przetworzyć odpowiedzi AI"
    );
  }
}

/**
 * Strips HTML tags from content
 */
function stripHtml(html: string): string {
  if (!html) return "";

  // Remove HTML tags
  let text = html.replace(/<[^>]*>/g, " ");

  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");

  // Remove extra whitespace
  text = text.replace(/\s+/g, " ").trim();

  return text;
}

/**
 * Validates lesson content before generating quiz
 */
export function validateLessonContent(content: string): { valid: boolean; error?: string } {
  const plainContent = stripHtml(content);

  if (!plainContent || plainContent.length < 100) {
    return {
      valid: false,
      error: "Treść lekcji jest zbyt krótka. Minimalna długość to 100 znaków.",
    };
  }

  if (plainContent.length > 50000) {
    return {
      valid: false,
      error: "Treść lekcji jest zbyt długa. Maksymalna długość to 50000 znaków.",
    };
  }

  return { valid: true };
}
