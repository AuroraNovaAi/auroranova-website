'use server';

export async function generateImage(prompt: string, modelName: string = 'imagen-3.0-generate-001') {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not defined in .env.local');

    const isImagen = modelName.includes('imagen');
    let url = '';
    let requestBody = {};

    if (isImagen) {
      url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:predict?key=${apiKey}`;
      requestBody = {
        instances: [{ prompt: prompt }],
        parameters: { sampleCount: 1, aspectRatio: "1:1", outputOptions: { mimeType: "image/jpeg" } }
      };
    } else {
      url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      requestBody = {
        contents: [{ parts: [{ text: prompt }] }]
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || `API Error: ${response.statusText}`);
    }

    let base64Image = null;

    if (isImagen) {
      if (data.predictions && data.predictions[0]) {
        base64Image = data.predictions[0].bytesBase64Encoded || data.predictions[0].image?.bytesBase64Encoded;
      }
    } else {
      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
        const part = data.candidates[0].content.parts[0];
        if (part.inlineData && part.inlineData.data) {
          base64Image = part.inlineData.data;
        } else if (part.text) {
          throw new Error("Seçtiğiniz model resim yerine metin döndürdü. Lütfen menüden 'imagen' içeren bir model seçin.");
        }
      }
    }

    if (!base64Image) {
      throw new Error('API yanıtından görsel verisi okunamadı. Lütfen model menüsünden bir "Imagen" modeli seçtiğinizden emin olun.');
    }

    return { success: true, imageBase64: `data:image/jpeg;base64,${base64Image}` };
  } catch (error: any) {
    console.error('[Server Action Error] AI Image Generation Failed:', error);
    return { success: false, error: error.message || 'Bilinmeyen bir hata oluştu.' };
  }
}
