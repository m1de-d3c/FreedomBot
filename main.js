const { Telegraf } = require("telegraf");
const fs = require("fs");

const loging = require("./loging.js");
const conf = require("./config.js");
const control = require("./fullcontrol.js");

loging.Start();
control.Init();

const bot = new Telegraf(conf.API_KEY); //"5036948830:AAFqesNAcenfs2c7lpPF6HFguMOjOBEc-3Y"

var users = {};

bot.start((ctx) => { 
    let date = new Date();
    if(date.getMinutes() == users[ctx.update.message.from.id].lastStartUse) return;

    ctx.reply(conf.startMsg);
    loging.log(`${ctx.message.from.first_name}(${ctx.message.from.id}) wrote the /start.`);

    date = new Date();
    users[ctx.update.message.from.id].lastStartUse = date.getMinutes();
});

bot.help((ctx) => {
    let date = new Date();
    if((date.getMinutes() * 60) + date.getSeconds() - users[ctx.update.message.from.id].lastHelpUse.time >= 60) { 
        if(users[ctx.update.message.from.id].lastHelpUse.atem != 3) {
            users[ctx.update.message.from.id].lastHelpUse.atem++;
            ctx.reply("Эту поманду можно использовать только раз в 60 сек.");
        }

        loging.log(`User ${ctx.message.from.first_name}(${ctx.message.from.id}) wrote /help already ${users[ctx.update.message.from.id].lastHelpUse.atem} times.`);
        return; 
    }

    ctx.reply(conf.helpMsg);
    loging.log(`User ${ctx.message.from.first_name}(${ctx.message.from.id}) wrote the /help.`);

    date = new Date();
    users[ctx.update.message.from.id].lastHelpUse.time = (date.getMinutes() * 60) + date.getSeconds();
    users[ctx.update.message.from.id].lastHelpUse.atem = 0;
});

bot.command('change_name', (ctx) => {
    let date = new Date();
    if(date.getDay() == users[ctx.update.message.from.id].lastStartUse) return;
    control.changeUserName(ctx);
});

bot.command('reg', (ctx) => {
    control.regNewUser(ctx);
});

bot.command('my', (ctx) => {
    control.getProfile(ctx);
});

bot.command('create', (ctx) => {
    var spMessage = ctx.message.text.split(" ").slice(1);
    if (spMessage.length >= 2) {
        control.createToken(spMessage.slice(0, spMessage.length - 1), spMessage[spMessage.length - 1], parseFloat(spMessage[2] ?? conf.defaultPrice.toString()), ctx);
    }
    else {
        ctx.reply("Неправильная комманда. /help -- для поомощи.");
        loging.log(`User ${ctx.from.id} wrote wrong /create command.`);
    }
});

bot.command('balance', (ctx) => {
    control.getBalance(ctx);
});

bot.command("get", (ctx) => {

});

bot.command("inventory", (ctx) => {
    var page = ctx.message.text.split(" ")[1];
    control.getInventory(parseInt(page ?? "1") - 1, ctx);
});

bot.on('callback_query', (ctx) => {
    if(ctx.update.callback_query.data.startsWith("INV")) {
        if(ctx.update.callback_query.data.indexOf(ctx.from.id) != -1) {
            control.getInventory(parseInt(ctx.update.callback_query.data.split(":")[1]), ctx);
        }
        else {
            ctx.reply(`${ctx.from.first_name} ето не твое.`);
        }
    }
});

bot.on('text', (ctx) => {
    if(users[ctx.message.from.id] != undefined){
        if(ctx.message.text.indexOf(users[ctx.message.from.id].lastMsg) != -1) return;
        if(users[ctx.message.from.id].lastMsg.indexOf(ctx.message.text) != -1) return;
    }

    if(ctx.message.text.startsWith("/")) return;

    let spMessage = ctx.message.text.split(" ").join("");
    let spaceToSymbols = spMessage.length / ctx.message.text.length;

    if(spaceToSymbols < conf.maxSpaceToSymbols && spaceToSymbols != 1) return;

    let pay = parseFloat(((ctx.message.text.length / conf.symbolsPerCoin) * spaceToSymbols).toFixed(5));
    control.addMoney(pay, ctx);

    usersMsgTest[ctx.message.from.id].lastMsg = ctx.message.text;
});

bot.on("sticker", (ctx) => {
    if(users[ctx.message.from.id].lastSticker == ctx.update.message.sticker.file_id) return;

    let pay = conf.coinsPerStiker;
    control.addMoney(pay, ctx);

    users[ctx.message.from.id].lastSticker = ctx.update.message.sticker.file_id;
});

bot.launch();