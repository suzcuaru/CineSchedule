import { GoogleGenAI, Type } from "@google/genai";
import { MovieSession, AnalysisResult } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeScheduleWithGemini = async (sessions: MovieSession[], date: string): Promise<AnalysisResult> => {
  
  // Simplified summary for token efficiency
  const scheduleSummary = sessions.map(s => ({
    hall: s.hall_name,
    start: s.time,
    end: s.end_time,
    movie: s.name,
    format: s.Format,
    is_new: s.is_new,
    duration: s.duration
  }));

  const prompt = `
    Act as a Senior Chief Projectionist. Analyze the cinema schedule for ${date}.
    
    Focus on:
    1. Technical Conflicts: Are there 3D movies starting at the exact same time (glasses shortage)? Are heavy blockbusters ending simultaneously (cleaning crew overload)?
    2. Projectionist Workflow: Suggestions for lamp pre-heating or format changing (changing lens for 2D/3D).
    3. New Content: Highlight specific operational risks with new releases (keys/KDM check).

    Data: ${JSON.stringify(scheduleSummary).slice(0, 15000)}
  `;

  try {
    const response = await ai.models.generateContent({
      // FIX: Use a valid and current model name. 'gemini-1.5-flash-latest' is deprecated.
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            technical_notes: { type: Type.ARRAY, items: { type: Type.STRING } },
            // FIX: Type.ENUM is not a valid enum member. Use Type.STRING and the enum property.
            schedule_efficiency: { type: Type.STRING, enum: ["Low", "Medium", "Optimal"] },
            alerts: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    if (response.text) {
        return JSON.parse(response.text) as AnalysisResult;
    }
    throw new Error("No text");

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return {
      summary: "Система анализа временно недоступна.",
      technical_notes: [],
      schedule_efficiency: "N/A",
      alerts: ["Ошибка соединения с AI сервером"]
    };
  }
};
