const BASE_URL = 'http://localhost:8000';

async function handlePdfUpload() {
  const fileInput = document.getElementById("pdfInput");
  const file = fileInput.files[0];

  if (!file || file.type !== "application/pdf") {
    alert("Please select a PDF file.");
    return;
  }

  const fileReader = new FileReader();

  fileReader.onload = async function () {
    const typedArray = new Uint8Array(fileReader.result);

    try {
      const pdf = await pdfjsLib.getDocument(typedArray).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map(item => item.str).join(' ');
        fullText += strings + '\n\n';
      }

      callTextGenerationAPI(fullText);
    } catch (error) {
      console.error("Error reading PDF:", error);
      alert("Failed to extract text from PDF.");
    }
  };

  fileReader.readAsArrayBuffer(file);
}

async function callTextGenerationAPI(promptText) {
  try {
    const res = await fetch(`${BASE_URL}/process_pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: promptText })
    });

    const data = await res.json();
    document.getElementById("text-output").innerText = data.result;
  } catch (error) {
    console.error(error);
    alert("Failed to generate text.");
  }
}
