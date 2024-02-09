const axios = require('axios');
require('dotenv').config(); 
const { Client, IntentsBitField } = require('discord.js');

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ]
})

client.on('ready', () => {
  console.log("Muse-chan is ready!🫡");
})

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.channel.id !== process.env.CHANNEL_ID) return;
  if (message.content.startsWith('!')) return;

  let conversationLog = [{ role: 'system', content: "You are a Tsundere.You will act like one" }];

  await message.channel.sendTyping();

  let prevMessages = await message.channel.messages.fetch({ limit: 3 });
  prevMessages.reverse();

  prevMessages.forEach((msg)=>{
    if (message.content.startsWith('!')) return;
    if (msg.author.id !== client.user.id && message.author.bot) return;
    if (msg.author.id !== message.author.id ) return;

    conversationLog.push({
      role: 'user',
      content: msg.content
    })
  })

  async function createChatCompletion() {
    const url = 'http://localhost:1234/v1/chat/completions';
    const apiKey = 'not-needed';

    const body = {
      model: 'local-model',
      messages: conversationLog
    };

    try {
      const response = await axios.post(url, body, { 
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        }
      });

      const data = response.data; 

      // Split message into chunks of 2000 characters or less
      const chunks = splitMessage(data.choices[0].message.content + `<@${message.author.id}>`, { maxLength: 2000 });

      // Send each chunk as a separate message
      for (const chunk of chunks) {
        await message.reply(chunk);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }

  createChatCompletion();

});

// Function to split message into chunks
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

client.login(process.env.TOKEN);
