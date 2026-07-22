// ==========================================================
// 1. IMPORTS & WEB SERVER (KEEPS BOT ALIVE ON RENDER)
// ==========================================================
const { Client, GatewayIntentBits, Partials, EmbedBuilder } = require('discord.js');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Bot is active and running!');
});

app.listen(PORT, () => {
    console.log(`Web server listening on port ${PORT}`);
});

// ==========================================================
// 2. CONFIGURATION & IDs
// ==========================================================
const CONFIG = {
    TOKEN: process.env.TOKEN,
    TITLES_CHANNEL_ID: '1527697750701903902',
    WELCOME_CHANNEL_ID: '1527764233872478259',
    RULES_CHANNEL_ID: '1528947871469277337',

    GENDER_MESSAGE_ID: '1529309150549381150',
    AGE_MESSAGE_ID: '1529311002259226705',
    BUILD_MESSAGE_ID: '1529313035850616962',
    NOTIF_MESSAGE_ID: '1529315478978433096',
    RULES_MESSAGE_ID: '1529316728352542791',

    RULES_ROLES: {
        '1527793574614405282': '1527396616871481446' 
    },
    
    GENDER_ROLES: {
        '1527740678904217753': '1527767895935815750',
        '1527741710140964975': '1527768038395346995',
        '1527810586476286202': '1527768077297520730'
    },
    AGE_ROLES: {
        '1527810013693874298': '1527813175418818710',
        '1527812664103927818': '1527813308206416024',
        '1527810465642840204': '1527813347699986552'
    },
    BUILD_ROLES: {
        '1529312231219531928': '1527736673973305344',
        '1527732953453695086': '1527736733641216151',
        '1527737783765172264': '1527736772346253322',
        '1527732978376114319': '1527736817837801522',
        '1527733511165968435': '1527737017285218385',
        '1527737759337283835': '1527736869507305652',
        '1527733043689816395': '1527737060922884146',
        '1527733016829624441': '1527737095395737660',
        '1527737711576748263': '1527737135774437498'
    },
    NOTIF_ROLES: {
        '1527793713009524916': '1527796519799881728',
        '1527793077652295680': '1527796742555435161',
        '1527795758856667207': '1527796861082275840'
    }
};

if (!CONFIG.TOKEN) {
    console.error("Missing TOKEN environment variable.");
    process.exit(1);
}

// ==========================================================
// 3. DISCORD CLIENT SETUP (INTENTS & PARTIALS)
// ==========================================================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
        Partials.GuildMember
    ]
});

// ==========================================================
// 4. BOT STARTUP: INITIALIZE REACTION MENUS
// ==========================================================
client.once('ready', async () => {
    console.log(`${client.user.tag} is online.`);

    try {
        const channel = await client.channels.fetch(CONFIG.TITLES_CHANNEL_ID);

       const menus = [
    { channelId: CONFIG.TITLES_CHANNEL_ID, msgId: CONFIG.GENDER_MESSAGE_ID, roles: CONFIG.GENDER_ROLES },
    { channelId: CONFIG.TITLES_CHANNEL_ID, msgId: CONFIG.AGE_MESSAGE_ID, roles: CONFIG.AGE_ROLES },
    { channelId: CONFIG.TITLES_CHANNEL_ID, msgId: CONFIG.BUILD_MESSAGE_ID, roles: CONFIG.BUILD_ROLES },
    { channelId: CONFIG.TITLES_CHANNEL_ID, msgId: CONFIG.NOTIF_MESSAGE_ID, roles: CONFIG.NOTIF_ROLES },
    { channelId: CONFIG.RULES_CHANNEL_ID, msgId: CONFIG.RULES_MESSAGE_ID, roles: CONFIG.RULES_ROLES }
];

        for (const menu of menus) {
    const channel = await client.channels.fetch(menu.channelId).catch(console.error);
    if (!channel) continue;

    const msg = await channel.messages.fetch(menu.msgId).catch(err => {
        console.error(`Couldn't fetch message ${menu.msgId}:`, err);
        return null;
    });

    if (!msg) continue;

    for (const emojiId of Object.keys(menu.roles)) {
        if (!msg.reactions.cache.has(emojiId) && !msg.reactions.cache.find(r => r.emoji.name === emojiId)) {
            await msg.react(emojiId).catch(console.error);
        }
    }
}
        console.log("Reaction menus initialized.");
    } catch (err) {
        console.error("Error initializing reactions:", err);
    }
});

// ==========================================================
// 5. REACTION ROLES: ADD ROLE WHEN REACTED
// ==========================================================
client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;

    try {
        if (reaction.partial) await reaction.fetch();

        const isGender = reaction.message.id === CONFIG.GENDER_MESSAGE_ID;
        const isAge = reaction.message.id === CONFIG.AGE_MESSAGE_ID;
        const isBuild = reaction.message.id === CONFIG.BUILD_MESSAGE_ID;
        const isNotif = reaction.message.id === CONFIG.NOTIF_MESSAGE_ID;
        const isRules = reaction.message.id === CONFIG.RULES_MESSAGE_ID;

        // UPDATE THIS LINE TO INCLUDE isRules:
        if (!isGender && !isAge && !isBuild && !isNotif && !isRules) return;

        let roleMap;
        if (isGender) roleMap = CONFIG.GENDER_ROLES;
        else if (isAge) roleMap = CONFIG.AGE_ROLES;
        else if (isBuild) roleMap = CONFIG.BUILD_ROLES;
        else if (isRules) roleMap = CONFIG.RULES_ROLES;
        else roleMap = CONFIG.NOTIF_ROLES;
        if (!isGender && !isAge && !isBuild && !isNotif) return;

        const roleId = roleMap[reaction.emoji.id];
        if (!roleId) return;

        const member = await reaction.message.guild.members.fetch(user.id);

        if (isGender || isAge) {
            for (const id of Object.values(roleMap)) {
                if (member.roles.cache.has(id)) {
                    await member.roles.remove(id).catch(() => {});
                }
            }

            for (const react of reaction.message.reactions.cache.values()) {
                if (react.emoji.id !== reaction.emoji.id && roleMap[react.emoji.id]) {
                    await react.users.remove(user.id).catch(() => {});
                }
            }
        }

        await member.roles.add(roleId).catch(console.error);
    } catch (err) {
        console.error("Reaction Add Error:", err);
    }
});

// ==========================================================
// 6. REACTION ROLES: REMOVE ROLE WHEN UN-REACTED
// ==========================================================
client.on('messageReactionRemove', async (reaction, user) => {
    if (user.bot) return;

    try {
        if (reaction.partial) await reaction.fetch();

       let roleMap;
        if (reaction.message.id === CONFIG.GENDER_MESSAGE_ID) roleMap = CONFIG.GENDER_ROLES;
        else if (reaction.message.id === CONFIG.AGE_MESSAGE_ID) roleMap = CONFIG.AGE_ROLES;
        else if (reaction.message.id === CONFIG.BUILD_MESSAGE_ID) roleMap = CONFIG.BUILD_ROLES;
        else if (reaction.message.id === CONFIG.NOTIF_MESSAGE_ID) roleMap = CONFIG.NOTIF_ROLES;
        else if (reaction.message.id === CONFIG.RULES_MESSAGE_ID) roleMap = CONFIG.RULES_ROLES;

        if (!roleMap) return;

        const roleId = roleMap[reaction.emoji.id];
        if (!roleId) return;

        const member = await reaction.message.guild.members.fetch(user.id);
        await member.roles.remove(roleId).catch(console.error);
    } catch (err) {
        console.error("Reaction Remove Error:", err);
    }
});

// ==========================================================
// 7. HELPER FUNCTION: NUMBER SUFFIXES (1st, 2nd, 3rd)
// ==========================================================
function ordinal(number) {
    if (number % 100 >= 11 && number % 100 <= 13) return `${number}th`;
    switch (number % 10) {
        case 1: return `${number}st`;
        case 2: return `${number}nd`;
        case 3: return `${number}rd`;
        default: return `${number}th`;
    }
}

// ==========================================================
// 8. WELCOME MESSAGE: NEW MEMBER JOINS
// ==========================================================
client.on('guildMemberAdd', async (member) => {
    const channel = member.guild.channels.cache.get(CONFIG.WELCOME_CHANNEL_ID);
    if (!channel) {
        console.log("Welcome channel not found.");
        return;
    }

    const memberNumber = ordinal(member.guild.memberCount);
    const embed = new EmbedBuilder()
        .setColor('#000000')
        .setTitle('welcome!')
        .setDescription(`welcome to the fold, ${member}!`)
        .setImage('https://cdn.discordapp.com/attachments/1527764233872478259/1527863722746450012/darksoulsbonfire.jpeg')
        .setFooter({ text: `${memberNumber} to enter the hold` });

    await channel.send({ content: ``, embeds: [embed] });
});

// ==========================================================
// 9. SERVER BOOST TRACKER (STARTS AND STOPS)
// ==========================================================
client.on('guildMemberUpdate', async (oldMember, newMember) => {
    const boosterRoleId = '1527396335223963819'; 

    // User JUST STARTED boosting
    if (!oldMember.premiumSince && newMember.premiumSince) {
        const announcementChannelId = '1527904649217314967';
        const imageUrl = 'https://cdn.discordapp.com/attachments/1527904649217314967/1529250496135565353/the-roundtable-hold-will-be-our-next-home-after-16-days-v0-5uimfg7ros0f1.png'; 

        try {
            const role = newMember.guild.roles.cache.get(boosterRoleId);
            if (role) await newMember.roles.add(role);

            const channel = newMember.guild.channels.cache.get(announcementChannelId);
            if (channel) {
                await channel.send({
                    content: `thank you so much for boosting the server, <@${newMember.id}>!`,
                    files: [imageUrl] 
                });
            }
        } catch (error) {
            console.error('Failed to handle server boost:', error);
        }
    } 
    // User STOPPED boosting
    else if (oldMember.premiumSince && !newMember.premiumSince) {
        try {
            const role = newMember.guild.roles.cache.get(boosterRoleId);
            if (role) {
                await newMember.roles.remove(role);
                console.log(`Removed booster role from ${newMember.user.tag} because their boost ended.`);
            }
        } catch (error) {
            console.error('Failed to remove booster role:', error);
        }
    }
});

// ==========================================================
// 10. BOT LOGIN
// ==========================================================
client.login(CONFIG.TOKEN);
