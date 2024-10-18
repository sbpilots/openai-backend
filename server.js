const express = require('express');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// POST route to handle chat requests
app.post('/api/chat', async (req, res) => {
    const userInput = req.body.message;
    const assistantId = req.body.assistantId;

    try {
        // Step 1: Create a thread
        const threadResponse = await fetch('https://api.openai.com/v1/threads', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'OpenAI-Beta': 'assistants=v1'
            },
            body: JSON.stringify({ assistant_id: assistantId })
        });

        // Check for thread creation errors
        if (!threadResponse.ok) {
            throw new Error(`Error creating thread: ${threadResponse.statusText}`);
        }

        const threadData = await threadResponse.json();
        const threadId = threadData.id;

        // Step 2: Append user message to the thread
        const messageResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'OpenAI-Beta': 'assistants=v1'
            },
            body: JSON.stringify({
                role: 'user',
                content: userInput
            })
        });

        // Check for message append errors
        if (!messageResponse.ok) {
            throw new Error(`Error appending message: ${messageResponse.statusText}`);
        }

        // Step 3: Create a run to get the assistant's response
        const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'OpenAI-Beta': 'assistants=v1'
            },
            body: JSON.stringify({ assistant_id: assistantId })
        });

        // Check for run creation errors
        if (!runResponse.ok) {
            throw new Error(`Error creating run: ${runResponse.statusText}`);
        }

        // Step 4: Fetch the assistant's response
        const aiResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'OpenAI-Beta': 'assistants=v1'
            }
        });

        // Check for AI response errors
        if (!aiResponse.ok) {
            throw new Error(`Error fetching AI response: ${aiResponse.statusText}`);
        }

        const aiData = await aiResponse.json();

        // Get the last message in the thread (assistant's response)
        const assistantMessage = aiData.messages[aiData.messages.length - 1]?.content;

        // Respond with the assistant's message
        res.json({ response: assistantMessage || "No response from assistant." });

    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Error processing request. ' + error.message });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
