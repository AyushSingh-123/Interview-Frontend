async function callQuestionGeneration() {
    const domain = document.getElementById("domain-select").value;
  
    if (!domain) {
      alert("Please select a domain.");
      return;
    }
  
    try {
      const response = await fetch('http://localhost:8000/question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ domain: domain })
      });
  
      const data = await response.json();
      console.log("Backend Response:", data); // Debugging
  
      const questionList = document.getElementById("question-output");
      questionList.innerHTML = "";
  
      // 🟡 Display the MCQ
      const mcqItem = document.createElement("li");
      mcqItem.innerHTML = `<strong>MCQ:</strong><br><pre>${data.MCQ}</pre>`;
      questionList.appendChild(mcqItem);
  
      // 🔵 Display all Coding Questions
      const codingHeader = document.createElement("li");
      codingHeader.innerHTML = `<strong>Coding Questions:</strong>`;
      questionList.appendChild(codingHeader);
  
      data["Coding Question"].forEach((question, index) => {
        const item = document.createElement("li");
        item.innerHTML = `
          <strong>${index + 1}. ${question.title}</strong><br>
          Difficulty: ${question.difficulty}<br>
          Tags: ${question.tags.join(", ")}<br>
          <a href="${question.url}" target="_blank">View on LeetCode</a>
        `;
        questionList.appendChild(item);
      });
  
    } catch (error) {
      console.error("Error fetching questions:", error);
      alert("Error fetching questions.");
    }
  }
  