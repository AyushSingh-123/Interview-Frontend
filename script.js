<<<<<<< HEAD
const BASE_URL = 'https://interview-backend-12.onrender.com'; // Updated to use the new production backend URL

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
=======
const BASE_URL = 'https://interview-backend-12.onrender.com'; // Updated to use the new production backend URL

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
>>>>>>> b15cc55 (updated frontend)
