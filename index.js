const { Client, GatewayIntentBits, Partials } = require('discord.js');

const CONFIG = {
    TOKEN: process.env.TOKEN,

    WELCOME_CHANNEL_ID: '1527764233872478259',

    TITLES_CHANNEL_ID: '1527697750701903902',

    GENDER_MESSAGE_ID: '1527741983857311855',

    BUILD_MESSAGE_ID: '1527749647697711124',


    GENDER_ROLES: {
        '1527740678904217753': '1527767895935815750', // Female
        '1527741710140964975': '1527768038395346995', // Male
        '1527740787062997153': '1527768077297520730'  // Other
    }

    BUILD_ROLES: {
        '1527732922558451722': '1527736673973305344', // Greatsword 
        '1527732953453695086': '1527736733641216151', // Mace
        '1527737783765172264': '1527736772346253322', // Axe
        '1527732978376114319': '1527736817837801522', // Scythe
        '1527733511165968435': '1527737017285218385', // Bow
        '1527737759337283835': '1527736869507305652', // Daggers
        '1527733043689816395': '1527737060922884146', // Shield
        '1527733016829624441': '1527737095395737660', // Spear
        '1527737711576748263': '1527737135774437498', // Seal
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
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction
    ]
});

//
// Welcome Message
//

const { AttachmentBuilder, EmbedBuilder } = require('discord.js');

client.on('guildMemberAdd', async member => {
    const channel = member.guild.channels.cache.get(CONFIG.WELCOME_CHANNEL_ID);

    if (!channel) return;

    const image = new AttachmentBuilder('./images/darksoulsbonfire.png', {
        name: 'darksoulsbonfire.png'
    });

    const embed = new EmbedBuilder()
        .setColor('#696969')
        .setTitle('🩸 Welcome to the Fold')
        .setDescription(
            `Welcome to the fold, ${member}.\n\n` +
            `May you find your worth in the waking world.\n\n` +
            `Before beginning your hunt, visit <#1527697750701903902> to choose your titles.`
        )
        .setImage('attachment://darksoulsbonfire.png')
        .setFooter({
            text: 'Fear the Old Blood.'
        });

    await channel.send({
        embeds: [embed],
        files: [image]
    });
});
//
// Ready
//

client.once('ready', async () => {
    console.log(`${client.user.tag} is online.`);

    try {
        const channel = await client.channels.fetch(CONFIG.TITLES_CHANNEL_ID);

        const message = await channel.messages.fetch(CONFIG.GENDER_MESSAGE_ID);

        // Add reactions if they aren't already present
        for (const emojiId of Object.keys(CONFIG.GENDER_ROLES)) {
            if (!message.reactions.cache.has(emojiId)) {
                await message.react(emojiId);
            }
        }

        console.log("Gender role menu initialized.");
    } catch (err) {
        console.error("Error setting up gender reactions:", err);
    }
});

//
// Reaction Added
//

client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;

    if (reaction.partial) {
        await reaction.fetch();
    }

    if (reaction.message.id !== CONFIG.GENDER_MESSAGE_ID) return;

    const emojiId = reaction.emoji.id;

    const roleId = CONFIG.GENDER_ROLES[emojiId];

    if (!roleId) return;

    const member = await reaction.message.guild.members.fetch(user.id);

    // Remove existing gender roles
    for (const id of Object.values(CONFIG.GENDER_ROLES)) {
        if (member.roles.cache.has(id)) {
            await member.roles.remove(id).catch(() => {});
        }
    }

    // Add selected role
    await member.roles.add(roleId).catch(console.error);

    // Remove all other gender reactions
    for (const react of reaction.message.reactions.cache.values()) {

        if (
            react.emoji.id &&
            react.emoji.id !== emojiId &&
            CONFIG.GENDER_ROLES[react.emoji.id]
        ) {
            await react.users.remove(user.id).catch(() => {});
        }
    }
});

//
// Reaction Removed
//

client.on('messageReactionRemove', async (reaction, user) => {
    if (user.bot) return;

    if (reaction.partial) {
        await reaction.fetch();
    }

    if (reaction.message.id !== CONFIG.GENDER_MESSAGE_ID) return;

    const roleId = CONFIG.GENDER_ROLES[reaction.emoji.id];

    if (!roleId) return;

    const member = await reaction.message.guild.members.fetch(user.id);

    await member.roles.remove(roleId).catch(console.error);
});

client.login(CONFIG.TOKEN);
