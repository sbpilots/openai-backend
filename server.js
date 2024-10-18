const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors'); // Import CORS module
require('dotenv').config();

const app = express();

// Enable CORS middleware globally for all routes
app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.post('/api/chat', async (req, res) => {
    const userInput = req.body.message;
    const assistantId = req.body.assistant; // Corrected to match front-end key

    try {
        console.log('Assistant ID Provided:', assistantId); // Debug: Log Assistant ID
        // Step 1: Create a thread
        const threadResponse = await fetch('https://api.openai.com/v1/threads', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'OpenAI-Beta': 'assistants=v2' // Set correct version as shown by OpenAI
            },
            body: JSON.stringify({ assistant: assistantId }) // Ensure this is correct
        });

        const threadData = await threadResponse.json();
        console.log('Thread Data:', threadData); // Debug: Log Thread Data

        if (!threadData.id) {
            throw new Error('Failed to create thread. No thread ID received.');
        }

        const threadId = threadData.id;

        // Step 2: Append user message to the thread
        await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'OpenAI-Beta': 'assistants=v2' // Ensure all calls have the correct version
            },
            body: JSON.stringify({
                role: 'user',
                content: userInput
            })
        });

        // Step 3: Create a run to process the message
        await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'OpenAI-Beta': 'assistants=v2' // Ensure all calls have the correct version
            },
            body: JSON.stringify({ assistant: assistantId }) // Ensure this matches
        });

        // Step 4: Get the assistant's response
        const aiResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'OpenAI-Beta': 'assistants=v2' // Ensure all calls have the correct version
            }
        });

        // Step to fetch the AI response
        const aiData = await aiResponse.json();
        console.log('AI Response Data:', aiData); // Debug: Log AI Response Data

        let assistantMessage = "No response received from assistant.";
        if (aiData && aiData.messages && aiData.messages.length > 0) {
            assistantMessage = aiData.messages[aiData.messages.length - 1].content;
        }

        res.json({ response: assistantMessage });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error processing request.');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
