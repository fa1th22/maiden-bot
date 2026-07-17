const { Client, GatewayIntentBits, Partials } = require('discord.js');

const CONFIG = {
    // 1. Paste your bot token from the Discord Developer Portal here
    TOKEN: 'YOUR_BOT_TOKEN_HERE',
    
    // 2. ID of the channel where you want welcome messages
    WELCOME_CHANNEL_ID: 'YOUR_WELCOME_CHANNEL_ID',
    
    // 3. Map emojis to Role IDs
    // Format: 'emoji_name': 'role_id'
    // Get Role IDs: Settings > Roles > Right click role > Copy ID
    REACTION_ROLES: {
        '🔥': 'ROLE_ID_1',
        '💍': 'ROLE_ID_2',
        '🩸': 'ROLE_ID_3'
    },
    
    // ID of the message you want people to react to for roles
    REACTION_MESSAGE_ID: 'YOUR_MESSAGE_ID'
};

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

client.on('guildMemberAdd', member => {
    const channel = member.guild.channels.cache.get(CONFIG.WELCOME_CHANNEL_ID);
    if (!channel) return;
    
    channel.send(`Welcome to the fold, ${member}! May you find your worth in the waking world.`);
});

client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;
    if (reaction.message.id !== CONFIG.REACTION_MESSAGE_ID) return;

    const roleId = CONFIG.REACTION_ROLES[reaction.emoji.name];
    if (roleId) {
        const member = await reaction.message.guild.members.fetch(user.id);
        member.roles.add(roleId).catch(console.error);
    }
});

client.on('messageReactionRemove', async (reaction, user) => {
    if (user.bot) return;
    if (reaction.message.id !== CONFIG.REACTION_MESSAGE_ID) return;

    const roleId = CONFIG.REACTION_ROLES[reaction.emoji.name];
    if (roleId) {
        const member = await reaction.message.guild.members.fetch(user.id);
        member.roles.remove(roleId).catch(console.error);
    }
});

client.once('ready', () => {
    console.log(`Maiden in Black is ready! Logged in as ${client.user.tag}`);
});

client.login(CONFIG.TOKEN);