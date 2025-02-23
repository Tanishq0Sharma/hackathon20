
document.addEventListener('DOMContentLoaded', () => {
    const chatContainer = document.createElement('div');
    chatContainer.id = 'chatContainer';
    chatContainer.style.position = 'fixed';
    chatContainer.style.bottom = '0';
    chatContainer.style.left = '0';
    chatContainer.style.width = '100%';
    chatContainer.style.height = '300px';
    chatContainer.style.backgroundColor = '#fff';
    chatContainer.style.borderTop = '1px solid #ccc';
    chatContainer.style.boxShadow = '0 -1px 5px rgba(0, 0, 0, 0.1)';
    chatContainer.style.display = 'flex';
    chatContainer.style.flexDirection = 'column';

    const chatHeader = document.createElement('div');
    chatHeader.style.padding = '10px';
    chatHeader.style.backgroundColor = '#f1f1f1';
    chatHeader.style.borderBottom = '1px solid #ccc';
    chatHeader.textContent = 'AI Chat';
    chatContainer.appendChild(chatHeader);

    const chatMessages = document.createElement('div');
    chatMessages.id = 'chatMessages';
    chatMessages.style.flexGrow = '1';
    chatMessages.style.overflowY = 'auto';
    chatContainer.appendChild(chatMessages);

    const chatInputContainer = document.createElement('div');
    chatInputContainer.style.display = 'flex';
    chatInputContainer.style.borderTop = '1px solid #ccc';
    chatInputContainer.style.padding = '5px';

    const chatInput = document.createElement('input');
    chatInput.id = 'chatInput';
    chatInput.type = 'text';
    chatInput.placeholder = 'Type a message...';
    chatInput.style.flexGrow = '1';
    chatInput.style.padding = '5px';
    chatInput.style.border = 'none';
    chatInput.style.borderRadius = '4px';
    chatInputContainer.appendChild(chatInput);

    const sendButton = document.createElement('button');
    sendButton.textContent = 'Send';
    sendButton.style.padding = '5px 10px';
    sendButton.style.marginLeft = '5px';
    sendButton.style.border = 'none';
    sendButton.style.borderRadius = '4px';
    sendButton.style.backgroundColor = '#28a745';
    sendButton.style.color = '#fff';
    sendButton.style.cursor = 'pointer';
    sendButton.addEventListener('click', sendMessage);
    chatInputContainer.appendChild(sendButton);

    chatContainer.appendChild(chatInputContainer);
    document.body.appendChild(chatContainer);

    async function sendMessage() {
        const userMessage = chatInput.value.trim();
        if (!userMessage) return;

        appendMessage('You', userMessage);
        chatInput.value = '';

        try {
            const response = await fetch('https://api.openai.com/v1/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer YOUR_OPENAI_API_KEY`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [{ role: 'user', content: userMessage }],
                    max_tokens: 150
                })
            });

            const data = await response.json();
            const aiMessage = data.choices[0].message.content.trim();
            appendMessage('AI', aiMessage);
        } catch (error) {
            console.error('Error:', error);
            appendMessage('AI', 'Sorry, I am unable to respond at the moment.');
        }
    }

    function appendMessage(sender, message) {
        const messageElement = document.createElement('div');
        messageElement.style.padding = '5px';
        messageElement.style.margin = '5px 0';
        messageElement.style.borderRadius = '4px';
        messageElement.style.backgroundColor = sender === 'You' ? '#f1f1f1' : '#e9ecef';
        messageElement.textContent = `${sender}: ${message}`;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});
