// frontend/scripts/assistant.js

document.addEventListener("DOMContentLoaded", () => {
    const chatForm = document.getElementById("chat-form");
    const userInput = document.getElementById("user-input");
    const chatBox = document.getElementById("chat-box");
    const suggestionButtons = document.querySelectorAll(".suggest-btn");
    const categoryButtons = document.querySelectorAll(".category-btn");

    // Get icons for animation
    const sendBtn = document.getElementById("send-btn");
    const sendIcon = document.getElementById("send-icon");
    const loaderIcon = document.getElementById("loader-icon");

    const transactions = JSON.parse(localStorage.getItem("cybernest-transactions")) || [];

    // --- NEW: Function to show/hide typing indicator ---
    const showTypingIndicator = (show) => {
        let indicator = document.getElementById("typing-indicator");
        if (show) {
            if (!indicator) {
                const indicatorHTML = `
                    <div id="typing-indicator" class="chat-message bot-message">
                        <div class="ai-avatar">AI</div>
                        <div class="typing-indicator">
                            <span></span><span></span><span></span>
                        </div>
                    </div>`;
                chatBox.innerHTML += indicatorHTML;
                chatBox.scrollTop = chatBox.scrollHeight;
            }
        } else {
            if (indicator) {
                indicator.remove();
            }
        }
    };

    const addMessage = (message, sender) => {
        const messageDiv = document.createElement("div");
        
        if (sender === 'bot') {
            messageDiv.classList.add("chat-message", "bot-message");
            // Add the AI Avatar
            messageDiv.innerHTML = `<div class="ai-avatar">AI</div><div>${message}</div>`;
        } else {
            messageDiv.classList.add("chat-message", "user-message");
            messageDiv.textContent = message;
        }

        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    const askAdvisor = async (question) => {
        if (!question) return;

        addMessage(question, "user");
        userInput.value = "";

        if (transactions.length === 0) {
            addMessage("I don't have any transaction data. Please upload a bank statement on the Dashboard first.", "bot");
            return;
        }

        // --- NEW: Start animations ---
        sendBtn.disabled = true;
        sendIcon.classList.add("hidden");
        loaderIcon.classList.remove("hidden");
        showTypingIndicator(true);

        try {
            const currentBalance = parseFloat(localStorage.getItem("cybernest-balance")) || 0;
            const response = await fetch("/chat-advisor", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question, transactions, balance: currentBalance }),
            });

            if (!response.ok) throw new Error("Network response was not ok.");

            const data = await response.json();
            const answer = data.answer || data.error || "Sorry, I couldn't get a response.";
            
            // --- NEW: Stop typing indicator and add final message ---
            showTypingIndicator(false);
            addMessage(answer, "bot");

        } catch (error) {
            console.error("Error asking advisor:", error);
            showTypingIndicator(false);
            addMessage("An error occurred. Please try again.", "bot");
        } finally {
            // --- NEW: End all animations ---
            sendBtn.disabled = false;
            sendIcon.classList.remove("hidden");
            loaderIcon.classList.add("hidden");
        }
    };
    
    chatForm.addEventListener("submit", (e) => {
        e.preventDefault();
        askAdvisor(userInput.value.trim());
    });

    suggestionButtons.forEach(button => {
        button.addEventListener("click", () => {
            const question = button.textContent;
            userInput.value = question;
            askAdvisor(question);
        });
    });

    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            categoryButtons.forEach(btn => btn.classList.remove('active', 'bg-indigo-600', 'text-white'));
            button.classList.add('active', 'bg-indigo-600', 'text-white');
            
            const targetId = button.dataset.target;
            document.querySelectorAll('.suggestions-group').forEach(group => {
                group.classList.toggle('hidden', group.id !== targetId);
            });
        });
    });
});