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
    const assistantId = req.body.assistantId;

    try {
        const threadResponse = await fetch('https://api.openai.com/v1/threads', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'OpenAI-Beta': 'assistants=v1'
            },
            body: JSON.stringify({ assistant_id: assistantId })
        });
        
        // Log the response from creating the thread
        const threadData = await threadResponse.json();
        console.log("Thread Data:", threadData); // Log the entire thread data

        // Check if thread ID exists
        if (!threadData.id) {
            throw new Error("Failed to create thread. No thread ID received.");
        }

        const threadId = threadData.id;

        await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
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

        await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'OpenAI-Beta': 'assistants=v1'
            },
            body: JSON.stringify({ assistant_id: assistantId })
        });

        const aiResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'OpenAI-Beta': 'assistants=v1'
            }
        });
        
        // Step to fetch the AI response
        const aiData = await aiResponse.json();
        console.log("AI Response Data:", aiData); // Log the AI response data

        let assistantMessage = "No response received from assistant.";
        if (aiData && aiData.messages && aiData.messages.length > 0) {
            assistantMessage = aiData.messages[aiData.messages.length - 1].content;
        }

        res.json({ response: assistantMessage });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).send(`Error processing request: ${error.message}`);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
