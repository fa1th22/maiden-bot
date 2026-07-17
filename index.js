const http = require('http');
http.createServer((req, res) => {
    res.write("I am alive!");
    res.end();
}).listen(process.env.PORT || 3000);

const { Client, GatewayIntentBits, Partials } = require('discord.js');

const CONFIG = {
    TOKEN: process.env.TOKEN, 
    WELCOME_CHANNEL_ID: '1527764233872478259',
    TITLES_CHANNEL_ID: '1527697750701903902',
    
    // Message IDs
    GENDER_MESSAGE_ID: '1527808716076879924',
    AGE_MESSAGE_ID: '1527812847562789026',
    BUILD_MESSAGE_ID: '1527814805287604476',

    // Role Mapping
    GENDER_ROLES: {
        '1527740678904217753': '1527767895935815750', // Female
        '1527741710140964975': '1527768038395346995', // Male
        '1527740787062997153': '1527768077297520730'  // Other
    }, 

    AGE_ROLES: {
        '1527810013693874298': '1527813175418818710', // 18+
        '1527812664103927818': '1527813308206416024', // 21+
        '1527810465642840204': '1527813347699986552'  // 25+
    },

    BUILD_ROLES: {
        // You can populate these with your specific IDs
        'EMOJI_ID_HERE': 'ROLE_ID_HERE'
    }
};

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

client.once('ready', async () => {
    console.log(`${client.user.tag} is online.`);
    try {
        const channel = await client.channels.fetch(CONFIG.TITLES_CHANNEL_ID);
        
        // Setup Menus
        const menus = [
            { msgId: CONFIG.GENDER_MESSAGE_ID, roles: CONFIG.GENDER_ROLES },
            { msgId: CONFIG.AGE_MESSAGE_ID, roles: CONFIG.AGE_ROLES },
            { msgId: CONFIG.BUILD_MESSAGE_ID, roles: CONFIG.BUILD_ROLES }
        ];

        for (const menu of menus) {
            const msg = await channel.messages.fetch(menu.msgId);
            for (const emojiId of Object.keys(menu.roles)) {
                await msg.react(emojiId).catch(console.error);
            }
        }
        console.log("Reaction menus initialized.");
    } catch (err) { console.error("Error initializing reactions:", err); }
});

client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;
    if (reaction.partial) await reaction.fetch();

    const isGender = reaction.message.id === CONFIG.GENDER_MESSAGE_ID;
    const isAge = reaction.message.id === CONFIG.AGE_MESSAGE_ID;
    const isBuild = reaction.message.id === CONFIG.BUILD_MESSAGE_ID;
    
    if (!isGender && !isAge && !isBuild) return;

    let roleMap;
    if (isGender) roleMap = CONFIG.GENDER_ROLES;
    else if (isAge) roleMap = CONFIG.AGE_ROLES;
    else roleMap = CONFIG.BUILD_ROLES;

    const roleId = roleMap[reaction.emoji.id];
    if (!roleId) return;

    const member = await reaction.message.guild.members.fetch(user.id);
    
    // EXCLUSIVE LOGIC (Gender/Age)
    if (isGender || isAge) {
        for (const id of Object.values(roleMap)) {
            if (member.roles.cache.has(id)) await member.roles.remove(id).catch(() => {});
        }
        // Remove other reactions from user on this specific message
        for (const react of reaction.message.reactions.cache.values()) {
            if (react.emoji.id !== reaction.emoji.id && roleMap[react.emoji.id]) {
                await react.users.remove(user.id).catch(() => {});
            }
        }
    }

    await member.roles.add(roleId).catch(console.error);
});

client.on('messageReactionRemove', async (reaction, user) => {
    if (user.bot) return;
    if (reaction.partial) await reaction.fetch();

    const isGender = reaction.message.id === CONFIG.GENDER_MESSAGE_ID;
    const isAge = reaction.message.id === CONFIG.AGE_MESSAGE_ID;
    const isBuild = reaction.message.id === CONFIG.BUILD_MESSAGE_ID;
    if (!isGender && !isAge && !isBuild) return;

    let roleMap;
    if (isGender) roleMap = CONFIG.GENDER_ROLES;
    else if (isAge) roleMap = CONFIG.AGE_ROLES;
    else roleMap = CONFIG.BUILD_ROLES;

    const roleId = roleMap[reaction.emoji.id];
    if (roleId) {
        const member = await reaction.message.guild.members.fetch(user.id);
        await member.roles.remove(roleId).catch(console.error);
    }
});

client.login(CONFIG.TOKEN);
