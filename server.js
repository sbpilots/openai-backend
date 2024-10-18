const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors'); // Import CORS module
require('dotenv').config();

const app = express();
app.use(cors()); // Enable CORS middleware
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
        const threadData = await threadResponse.json();
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
        const aiData = await aiResponse.json();

        const assistantMessage = aiData.messages[aiData.messages.length - 1].content;

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
