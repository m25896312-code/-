import { GoogleGenAI, Modality } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export const SYS_BASE = (subj: string, div: string) =>
  `أنت أستاذ خبير ومستشار تعليمي متخصص في مادة ${subj} للصف الثالث الثانوي (ثانوية عامة) قسم ${div}، وفقاً لأحدث تعديلات منهج وزارة التربية والتعليم المصرية لعام 2025/2026.
قواعد صارمة: 
1. جميع معلوماتك مستمدة حصرياً من الكتب المدرسية الرسمية (نسخة 2026) ومنصات الوزارة المعتمدة (حصص مصر، بنك المعرفة).
2. التزم بنواتج التعلم (Learning Outcomes) المحددة لكل وحدة بدقة شديدة.
3. أسلوب الكلام: بالعامية المصرية المثقفة (لغة المدرسين الشطار) لتوصيل المعلومة ببساطة وود.
4. عند حل المسائل، اتبع خطوات الحل النموذجية التي تقبلها الوزارة في التصحيح (الخطوات، التعويض، الناتج، الوحدة).
5. ركز على "التركات" ونقاط الربط بين الفصول التي تأتي في امتحانات النظام الجديد (Babel Sheet) والأسئلة المقالية الجديدة.
6. حذر الطالب من الأخطاء الشائعة (Common Errors) والمفاهيم الخاطئة (Misconceptions) التي يقع فيها الطلاب عادةً في هذا الجزء.
7. اشرح للطالب كيف تأتي الأسئلة على هذا الجزء في الامتحان (نمط الأسئلة: فهم، تطبيق، تحليل، مستويات عليا).
8. إذا أرسل الطالب صورة لسؤال، قم بتحليلها بدقة وحلها مع شرح الفكرة العلمية وراء السؤال.`;

export async function aiCall(messages: { role: string; content: string; image?: { data: string; mimeType: string } }[], system: string, tokens?: number) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: messages.map(m => {
      const parts: any[] = [{ text: m.content }];
      if (m.image) {
        parts.push({
          inlineData: {
            data: m.image.data,
            mimeType: m.image.mimeType
          }
        });
      }
      return {
        role: m.role === "assistant" ? "model" : "user",
        parts
      };
    }),
    config: {
      systemInstruction: system,
      maxOutputTokens: tokens || 4000,
    },
  });
  return response.text || "";
}

export async function aiCallWithSearch(messages: { role: string; content: string }[], system: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: messages.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    })),
    config: {
      systemInstruction: system,
      tools: [{ googleSearch: {} }],
    },
  });
  return response.text || "";
}

export async function generateSpeech(text: string, voice: string = "Kore") {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voice },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (base64Audio) {
    const binary = atob(base64Audio);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: "audio/wav" });
    return URL.createObjectURL(blob);
  }
  return null;
}
