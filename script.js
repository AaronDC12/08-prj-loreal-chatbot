/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

// Array to store conversation history
let conversationHistory = [];
let userName = ""; // Variable to store the user's name

// Set initial message
chatWindow.textContent = "👋 Hello! How can I help you today?";

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get the user's input
  const userMessage = userInput.value.trim();
  if (!userMessage) return; // Do nothing if input is empty

  // Display the user's message in the chat window
  chatWindow.innerHTML += `<div class="user-message">${userMessage}</div>`;

  // Clear the input field
  userInput.value = "";

  // Add the user's message to the conversation history
  conversationHistory.push({ role: "user", content: userMessage });

  // Extract user's name if provided
  if (!userName) {
    const nameMatch = userMessage.match(/my name is (\w+)/i);
    if (nameMatch) {
      userName = nameMatch[1];
      conversationHistory.push({
        role: "assistant",
        content: `Nice to meet you, ${userName}! How can I assist you today?`,
      });
      chatWindow.innerHTML += `<div class="assistant-message">Nice to meet you, ${userName}! How can I assist you today?</div>`;
      return; // Skip fetching assistant reply for this turn
    }
  }

  // Remove old assistant messages and latest question from the chat window
  const oldAssistantMessages = document.querySelectorAll(
    ".assistant-message, .latest-question"
  );
  oldAssistantMessages.forEach((message) => message.remove());

  // Add a "thinking effect" to the chat window
  const thinkingMessage = document.createElement("div");
  thinkingMessage.className = "assistant-message thinking";
  thinkingMessage.textContent = "Thinking...";
  chatWindow.appendChild(thinkingMessage);

  // Fetch the assistant's reply from OpenAI API
  const assistantReply = await getOpenAIResponse(conversationHistory);

  // Remove the "thinking effect"
  chatWindow.removeChild(thinkingMessage);

  // Display the user's latest question above the assistant's reply
  chatWindow.innerHTML += `<div class="latest-question">You asked: ${userMessage}</div>`;
  chatWindow.innerHTML += `<div class="assistant-message">${assistantReply}</div>`;

  // Add the assistant's reply to the conversation history
  conversationHistory.push({ role: "assistant", content: assistantReply });
});

/* Function to send a message to Cloudflare Worker endpoint and get a response */
async function getOpenAIResponse(conversationHistory) {
  const workerUrl = "https://lorealchatbot.dcunh1a.workers.dev/"; // Replace with your actual Cloudflare Worker URL

  // Prepare the request body
  const requestBody = {
    messages: conversationHistory, // Pass the conversation history
    max_tokens: 300, // Limit the response length
  };

  try {
    // Send the POST request
    const response = await fetch(workerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody), // Convert the request body to JSON
    });

    // Parse the response
    const data = await response.json();
    return data.choices[0].message.content; // Return the assistant's reply
  } catch (error) {
    console.error("Error connecting to Cloudflare Worker:", error);
    return "Sorry, I couldn’t process your request.";
  }
}

// Set the assistant's role and context
const systemMessage = {
  role: "system",
  content:
    "You are a virtual assistant specializing in L’Oréal products, routines, and recommendations. Your purpose is to provide accurate and helpful information about L’Oréal's makeup, skincare, haircare, and fragrances. Avoid answering questions unrelated to L’Oréal and politely redirect.",
};

// Add the system message to the beginning of the conversation history
conversationHistory.unshift(systemMessage);
