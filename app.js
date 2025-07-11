// Select elements from the DOM
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const latestQuestion = document.getElementById("latestQuestion"); // Container for latest question
const previousQuestionsList = document.getElementById("previousQuestionsList"); // List for previous questions

// Function to append a message to the chat window
function appendMessage(sender, message) {
  const messageDiv = document.createElement("div");
  messageDiv.className = sender === "user" ? "msg user" : "msg ai";
  messageDiv.textContent = message;
  chatWindow.appendChild(messageDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight; // Scroll to the latest message
}

// Display initial message when the page loads
window.onload = () => {
  appendMessage("ai", "Hi, how can I help you?");
};

// Function to fetch a response from the Cloudflare Worker
async function fetchResponse(userMessage) {
  const workerUrl = "https://lorealchatbot.dcunh1a.workers.dev/"; // Replace with your Cloudflare Worker URL

  const requestBody = {
    messages: [{ role: "user", content: userMessage }],
  };

  try {
    const response = await fetch(workerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    return data.choices[0].message.content.trim(); // Extract the assistant's response
  } catch (error) {
    console.error("Error fetching response:", error);
    return "Sorry, I couldn’t process your request. Please try again.";
  }
}

// Event listener for the form submission
chatForm.addEventListener("submit", async (event) => {
  event.preventDefault(); // Prevent the form from refreshing the page

  const userMessage = userInput.value.trim();
  if (userMessage === "") return; // Do nothing if input is empty

  // Update the latest question container
  latestQuestion.textContent = `Latest Question: ${userMessage}`;

  // Update the previous questions list
  const newQuestionItem = document.createElement("li");
  newQuestionItem.textContent = userMessage;
  previousQuestionsList.prepend(newQuestionItem);

  // Limit the list to the last 5 questions
  while (previousQuestionsList.children.length > 5) {
    previousQuestionsList.removeChild(previousQuestionsList.lastChild);
  }

  // Append user's message to the chat window
  appendMessage("user", userMessage);

  // Clear the input field
  userInput.value = "";

  // Append "Thinking..." message to the chat window
  const thinkingMessage = document.createElement("div");
  thinkingMessage.className = "msg ai";
  thinkingMessage.textContent = "Thinking...";
  chatWindow.appendChild(thinkingMessage);

  // Fetch the bot's response
  const botResponse = await fetchResponse(userMessage);

  // Remove the "Thinking..." message
  chatWindow.removeChild(thinkingMessage);

  // Append the bot's response to the chat window
  appendMessage("ai", botResponse);
});
