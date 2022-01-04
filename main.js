const { Telegraf } = require("telegraf");
const fs = require("fs");

const loging = require("./loging.js");
const conf = require("./config.js");
const control = require("./fullcontrol.js");

loging.Start();
control.Init();

const bot = new Telegraf(conf.API_KEY);

bot.start((ctx) => { 
    ctx.reply(conf.startMsg);
    loging.log(`${ctx.message.from.first_name}(${ctx.message.from.id}) wrote the /start.`) 
});

bot.help((ctx) => {
    ctx.reply(conf.helpMsg);
    loging.log(`${ctx.message.from.first_name}(${ctx.message.from.id}) wrote the /help.`);
});

bot.command('changeName', (ctx) => {
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
        control.createToken(spMessage.slice(0, spMessage.length - 1), spMessage[spMessage.length - 1], parseInt(spMessage[2] ?? conf.defaultPrice.toString()), ctx);
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
    let spMessage = ctx.message.text.split(" ");
    let spaceToSymbols = spMessage.length / ctx.message.text;

    if(spaceToSymbols < conf.maxSpaceToSymbols) return;

    let pay = parseInt(((ctx.message.text.length / conf.symbolsPerCoin) * spaceToSymbols).toString());
    control.addMoney(pay, ctx);
});

bot.on("sticker", (ctx) => {
    let pay = conf.coinsPerStiker;
    control.addMoney(pay, ctx);
});

bot.launch();
