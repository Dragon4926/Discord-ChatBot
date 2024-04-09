"use strict";
require('dotenv').config();

const Groq = require('groq-sdk');

const { Client, IntentsBitField } = require('discord.js');

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ]
})
const groqClient = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

const status = [
    { name: 'Twitch', type: 'WATCHING', url: 'https://twitch.tv/ryuga071' },
    { name: 'Spotify', type: 'LISTENING', url: null },
    { name: 'Genshin Impact', type: 'PLAYING' },
    { name: 'Honkai Star Rail', type: 'PLAYING' }
];

client.once('ready', () => {
    console.log('Muse-Chan is ready 👌');

    // Set initial status
    updateStatus();

    // Update status every 3 minutes
    setInterval(updateStatus, 180000);
});

async function updateStatus() {
    try {
        const randomIndex = Math.floor(Math.random() * status.length);
        const { name, type, url } = status[randomIndex];
        await client.user.setPresence({
            activities: [{ name: name, type: type, url: url }],
            status: 'online'
        });
    } catch (error) {
        console.error('Error updating status:', error);
    }
}

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.channel.id !== process.env.CHANNEL_ID) return;
    if (message.content.startsWith('!')) return;

    const conversationLog = [
        { role: 'system', content: "You are a Tsundere waifu (19 years)." },
        { role: 'user', content: message.content }
    ];

    try {
        const chatCompletion = await getGroqChatCompletion(conversationLog);
        const response = chatCompletion.choices[0]?.message?.content || "";
        await message.reply(response);
    } catch (error) {
        console.error('Error:', error);
    }
});

async function getGroqChatCompletion(messages) {
    return groqClient.chat.completions.create({
        messages: messages,
        model: "mixtral-8x7b-32768"
    });
}

client.login(process.env.TOKEN);

// Split message into chunks of 2000 characters or less
function splitMessage(message, options) {
    const { maxLength = 2000, char = '\n', prepend = '', append = '' } = options || {};
    if (message.length <= maxLength) return [message];
    const splitText = message.split(char);
    if (splitText.some(chunk => chunk.length > maxLength)) throw new RangeError('SPLIT_MAX_LEN');
    const messages = [];
    let msg = '';
    for (const chunk of splitText) {
        if (msg && (msg + char + chunk + append).length > maxLength) {
            messages.push(msg + append);
            msg = prepend;
        }
        msg += (msg && msg !== prepend ? char : '') + chunk;
    }
    return messages.concat(msg).filter(m => m);
}
