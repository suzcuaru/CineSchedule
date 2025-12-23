
import { GoogleGenAI, Type } from "@google/genai";
import { MovieSession, AnalysisResult } from '../types';

export const analyzeScheduleWithGemini = async (sessions: MovieSession[], date: string): Promise<AnalysisResult> => {
  // Always initialize GoogleGenAI with the apiKey parameter from process.env
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const scheduleData = sessions.map(s => ({
    hall: s.hall_name,
    time: `${s.time}-${s.end_time}`,
    movie: s.name,
    format: s.Format,
    is_new: s.is_new,
    duration: s.duration
  }));

  const prompt = `
    Ты — Старший киномеханик (Chief Projectionist). Проанализируй расписание кинотеатра на ${date}.
    
    Задачи:
    1. Технические конфликты: Проверь одновременный старт 3D (нагрузка на выдачу очков), плотные стыковки (риск задержки сеанса), тяжелые блокбастеры.
    2. Оборудование: Дай рекомендации по подготовке залов (Scope/Flat линзы, 3D фильтры).
    3. Контент: Напомни о проверке ключей (KDM) для новинок.

    Расписание: ${JSON.stringify(scheduleData)}
  `;

  try {
    // Using gemini-3-pro-preview for complex reasoning tasks like schedule analysis
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            technical_notes: { type: Type.ARRAY, items: { type: Type.STRING } },
            schedule_efficiency: { type: Type.STRING },
            alerts: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["summary", "technical_notes", "schedule_efficiency", "alerts"]
        }
      }
    });

    // Access the .text property directly from response
    if (response.text) {
      return JSON.parse(response.text) as AnalysisResult;
    }
    throw new Error("Empty AI response");
  } catch (error) {
    console.error("Gemini Error:", error);
    // Return a safe fallback object on error
    return {
      summary: "Анализ расписания временно недоступен.",
      technical_notes: ["Ошибка выполнения запроса к ИИ"],
      schedule_efficiency: "Неизвестно",
      alerts: ["Проверьте подключение или настройки API-ключа"]
    };
  }
};
