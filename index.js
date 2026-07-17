const { Client, GatewayIntentBits, Partials, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const http = require('http'); // 1. Added this for the Render dummy server

// 2. Dummy server to satisfy Render's port requirement
const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Bot is running');
});
server.listen(process.env.PORT || 3000);

const CONFIG = {
    TOKEN: process.env.TOKEN,
    WELCOME_CHANNEL_ID: '1527764233872478259',
    TITLES_CHANNEL_ID: '1527697750701903902',
    
    GENDER_MESSAGE_ID: '1527741983857311855',
    BUILD_MESSAGE_ID: '1527749647697711124',
    NOTIF_MESSAGE_ID: '1527796442771624040',
    GAME_MESSAGE_ID: '1527799048453492776', 

    GENDER_ROLES: {
        '1527740678904217753': '1527767895935815750',
        '1527741710140964975': '1527768038395346995',
        '1527740787062997153': '1527768077297520730'
    },
    BUILD_ROLES: {
        '1527732922558451722': '1527736673973305344',
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
    },
    GAME_ROLES: {
        '1527700515494826045': '1527692913537056788',
        '1527709935570255892': '1527693469538324630',
        '1527703455295209543': '1527693749944188948',
        '1527707233625047351': '1527693501108584648',
        '1527708687794176010': '1527693550282870796',
        '1527709402109579274': '1527693585129017374',
        '1527710178810794126': '1527693822899781662',
        '1527711064991465734': '1527693940143296663',
        '1527711513799037089': '1527695024739848342',
        '1527711874819555500': '1527693970455527545',
        '1527712860967403560': '1527694577841078352',
        '1527714096391127141': '1527694404276584478',
        '1527714620389724180': '1527694003745718483',
        '1527714890112831708': '1527694122155245818'
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

async function setupReactions(channelId, messageId, roles) {
    try {
        const channel = await client.channels.fetch(channelId);
        const message = await channel.messages.fetch(messageId);
        for (const emojiId of Object.keys(roles)) {
            if (!message.reactions.cache.has(emojiId)) await message.react(emojiId);
        }
    } catch (err) { console.error(`Setup Error for ${messageId}:`, err); }
}

client.once('ready', async () => {
    console.log(`${client.user.tag} is online.`);
    await setupReactions(CONFIG.TITLES_CHANNEL_ID, CONFIG.GENDER_MESSAGE_ID, CONFIG.GENDER_ROLES);
    await setupReactions(CONFIG.TITLES_CHANNEL_ID, CONFIG.BUILD_MESSAGE_ID, CONFIG.BUILD_ROLES);
    await setupReactions(CONFIG.TITLES_CHANNEL_ID, CONFIG.NOTIF_MESSAGE_ID, CONFIG.NOTIF_ROLES);
    await setupReactions(CONFIG.TITLES_CHANNEL_ID, CONFIG.GAME_MESSAGE_ID, CONFIG.GAME_ROLES);
});

client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;
    if (reaction.partial) await reaction.fetch();

    const isGender = reaction.message.id === CONFIG.GENDER_MESSAGE_ID;
    const isBuild = reaction.message.id === CONFIG.BUILD_MESSAGE_ID;
    const isNotif = reaction.message.id === CONFIG.NOTIF_MESSAGE_ID;
    const isGame = reaction.message.id === CONFIG.GAME_MESSAGE_ID;
    
    if (!isGender && !isBuild && !isNotif && !isGame) return;

    let roleMap;
    if (isGender) roleMap = CONFIG.GENDER_ROLES;
    else if (isBuild) roleMap = CONFIG.BUILD_ROLES;
    else if (isNotif) roleMap = CONFIG.NOTIF_ROLES;
    else if (isGame) roleMap = CONFIG.GAME_ROLES;

    const roleId = roleMap[reaction.emoji.id];
    if (!roleId) return;

    const member = await reaction.message.guild.members.fetch(user.id);

    if (isGender) {
        for (const id of Object.values(CONFIG.GENDER_ROLES)) {
            if (member.roles.cache.has(id)) await member.roles.remove(id).catch(() => {});
        }
        for (const react of reaction.message.reactions.cache.values()) {
            if (react.emoji.id !== reaction.emoji.id && CONFIG.GENDER_ROLES[react.emoji.id]) {
                await react.users.remove(user.id).catch(() => {});
            }
        }
    }

    await member.roles.add(roleId).catch(console.error);
});

client.on('messageReactionRemove', async (reaction, user) => {
    if (user.bot) return;
    if (reaction.partial) await reaction.fetch();

    let roleMap;
    if (reaction.message.id === CONFIG.GENDER_MESSAGE_ID) roleMap = CONFIG.GENDER_ROLES;
    else if (reaction.message.id === CONFIG.BUILD_MESSAGE_ID) roleMap = CONFIG.BUILD_ROLES;
    else if (reaction.message.id === CONFIG.NOTIF_MESSAGE_ID) roleMap = CONFIG.NOTIF_ROLES;
    else if (reaction.message.id === CONFIG.GAME_MESSAGE_ID) roleMap = CONFIG.GAME_ROLES;

    if (!roleMap) return;

    const roleId = roleMap[reaction.emoji.id];
    if (roleId) {
        const member = await reaction.message.guild.members.fetch(user.id);
        await member.roles.remove(roleId).catch(console.error);
    }
});

client.login(CONFIG.TOKEN);


