'use server';

export async function fetchGeminiModels() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined in .env.local');
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Filter models that support generateContent
    const textModels = data.models
      .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
      .map((m: any) => {
        // Strip 'models/' prefix to match the SDK expectation
        const cleanName = m.name.replace('models/', '');
        return {
          name: cleanName,
          displayName: m.displayName || cleanName,
          description: m.description || ''
        };
      });

    return { success: true, models: textModels };
  } catch (error: any) {
    console.error('[Server Action Error] Fetch Models Failed:', error);
    return { success: false, error: error.message };
  }
}

export async function fetchGeminiImageModels() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not defined in .env.local');

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!response.ok) throw new Error(`Failed to fetch models: ${response.statusText}`);

    const data = await response.json();
    
    const imageModels = data.models
      .filter((m: any) => {
        const modelName = m.name.toLowerCase();
        const methods = m.supportedGenerationMethods || [];
        return methods.includes('predict') || 
               modelName.includes('imagen') || 
               modelName.includes('vision') || 
               modelName.includes('image') ||
               modelName.includes('nano') ||
               modelName.includes('banana') ||
               modelName.includes('flash'); // Added flash just in case they used gemini-flash for vision/image tasks previously
      })
      .map((m: any) => {
        const cleanName = m.name.replace('models/', '');
        return {
          name: cleanName,
          displayName: m.displayName || cleanName,
          description: m.description || ''
        };
      });

    if (imageModels.length === 0) {
       return { 
         success: true, 
         models: [{name: 'imagen-3.0-generate-001', displayName: 'Imagen 3.0', description: 'Google Imagen 3.0 for high quality image generation'}] 
       };
    }

    return { success: true, models: imageModels };
  } catch (error: any) {
    console.error('[Server Action Error] Fetch Image Models Failed:', error);
    return { success: false, error: error.message };
  }
}
