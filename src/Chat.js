import { Dombuilder } from "@aponahmed/dombuilder";
import Background from "three/src/renderers/common/Background.js";

export default class Chat {
    constructor() {
        // Create the main chat container
        this.callback = null;
        this.chatContainer = new Dombuilder('div').class('chat-container').styles({
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            width: '300px',
            border: '0',
            borderRadius: '0',
            backgroundColor: 'transparent',
            zIndex: 1000,
        }).renderTo(document.body);

        // Create message area
        this.messageArea = new Dombuilder('div').class('message-area').styles({
            overflowY: 'auto',
            padding: '10px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        }).renderTo(this.chatContainer.element);

        // Create input area
        this.inputContainer = new Dombuilder('div').class('input-container').styles({
            display: 'flex',
            padding: '10px',
        }).renderTo(this.chatContainer.element);

        // Create input field
        this.inputField = new Dombuilder('input')
            .attr('type', 'text')
            .attr('placeholder', 'Type a message...')
            .class('chat-input')
            .styles({
                flexGrow: 1,
                padding: '5px',
                border: '0',
                borderRadius: '4px',
                marginRight: '5px',
                background: 'transparent',
            }).renderTo(this.inputContainer.element);

        // Create send button
        this.sendButton = new Dombuilder('button')
            .html('Send')
            .class('send-button')
            .styles({
                padding: '5px 10px',
                backgroundColor: '#5a9328',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
            })
            .event('click', () => this.handleSend())
            .renderTo(this.inputContainer.element);

        // Optional: Add keyboard event to handle "Enter" key
        this.inputField.event('keypress', (event) => {
            if (event.key === 'Enter') {
                this.handleSend();
            }
        });
    }

    // Set the callback somewhere in your code
    setCallbacks(callback) {
        this.callbacks = callback;
    }

    // Public method to add a message to the chat
    addMessage(txt, type = 'user') {
        const messageClass = type === 'user' ? 'user-message' : 'bot-message';
        //text-wrapper
        const wrapper = new Dombuilder('div').class('message-wrapper').class(messageClass);
        const messageHtml = new Dombuilder('div')
            .html(txt)
            .styles({
                margin: '5px 0',
                padding: '10px',
                borderRadius: '4px',
                backgroundColor: type === 'user' ? 'rgba(0, 159, 255, 0.2)' : 'rgba(126, 216, 39,.2)',
                backdropFilter: 'blur(2px)',
                maxWidth: '210px'
            }).element;

        wrapper.append(messageHtml);
        // Append message to message area
        this.messageArea.append(wrapper.element);

        // Scroll to bottom of message area
        this.messageArea.element.scrollTop = this.messageArea.element.scrollHeight;

        // Limit the number of messages to 2
        if (this.messageArea.element.childElementCount > 3) {
            this.messageArea.element.removeChild(this.messageArea.element.firstChild);
        }
    }

    // Handle sending the message
    async handleSend() {
        const APIKey = "$2y$12$8E.VJl0bNPR6sCk0sKxYZ.M4g5XWHi5rc3Rb/r4ky3JVH.fQ8dudi";
        const messageText = this.inputField.element.value.trim();

        if (messageText) {
            this.addMessage(messageText, 'user'); // Add user message
            this.inputField.element.value = ''; // Clear input field
            if (this.callbacks.wait && typeof this.callbacks.wait === 'function') {
                this.callbacks.wait.call(this); // Pass the message text
            }
            try {
                const response = await fetch("https://edesk.siatex.com/bot/api/chat", {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'api-key': APIKey // Add API key as a header
                    },
                    body: JSON.stringify({ message: messageText }) // Send message as JSON
                });

                if (!response.ok) {
                    throw new Error(`Error: ${response.statusText}`);
                }

                const data = await response.json();
                // Here you can handle the bot response if needed
                // For now, we simulate a bot response:
                // setTimeout(() => {
                //     this.addMessage(data.response, 'bot'); // Add bot message
                // }, 1000);
                if (this.callbacks.response && typeof this.callbacks.response === 'function') {
                    this.callbacks.response.call(this, data); // Pass the message text
                }
            } catch (error) {
                console.error('Failed to send message:', error);
                // Optionally, handle error feedback to the user
            }
        }
    }

}
