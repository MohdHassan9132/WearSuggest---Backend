import "dotenv/config";
async function listModels() {
    console.log("API KEY:", process.env.GEMINI_API_KEY);
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1/models?key=${process.env.GEMINI_API_KEY}`
  );

  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }

  const data = await res.json();

  for (const model of data.models) {
    console.log("Name:", model.name);
    console.log("Methods:", model.supportedGenerationMethods);
    console.log("------");
  }
}

listModels();