const BASE_URL = 'http://127.0.0.1:8000'; // Replace with your API base URL or set it to your actual API base URL

async function callTextGeneration() {
  try {
    const response = await fetch(`${BASE_URL}/generate_question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: "Give me an intro paragraph for interviews." })
    });
    const data = await response.json();
    alert("Text Generation Response: " + data.result);
  } catch (error) {
    console.error(error);
    alert("Text Generation failed");
  }
}

async function callQuestionGeneration() {
  try {
    const response = await fetch(`${BASE_URL}/question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context: "Software engineering interview" })
    });
    const data = await response.json();
    alert("Question Generation Response: " + data.questions.join(", "));
  } catch (error) {
    console.error(error);
    alert("Question Generation failed");
  }
}

async function callGrammarCorrection() {
  try {
    const response = await fetch(`${BASE_URL}/voice-process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: "He go to school yesterday." })
    });
    const data = await response.json();
    alert("Corrected Sentence: " + data.corrected);
  } catch (error) {
    console.error(error);
    alert("Grammar Correction failed");
  }
}

async function callTextSummarization() {
  try {
    const response = await fetch(`${BASE_URL}/process_pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: "Long article or paragraph here..." })
    });
    const data = await response.json();
    alert("Summary: " + data.summary);
  } catch (error) {
    console.error(error);
    alert("Text Summarization failed");
  }
}
