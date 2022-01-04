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
    if(!getLastUse("Start", 60, ctx)) return;

    ctx.reply(conf.startMsg);
    loging.log(`${ctx.message.from.first_name}(${ctx.message.from.id}) wrote the /start.`);
});

bot.help((ctx) => {
    if(!getLastUse("Help", 60, ctx)) return;

    ctx.reply(conf.helpMsg);
    loging.log(`User ${ctx.message.from.first_name}(${ctx.message.from.id}) wrote the /help.`);
});

bot.command('change_name', (ctx) => {
    if(!getLastUse("Start", 600, ctx)) return;

    control.changeUserName(ctx);
});

bot.command('reg', (ctx) => {
    if(!getLastUse("reg", 1800, ctx)) return;

    control.regNewUser(ctx);
});

bot.command('my', (ctx) => {
    if(!getLastUse("My", 30, ctx)) return;

    control.getProfile(ctx);
});

bot.command('create', (ctx) => {
    if(!getLastUse("Create", 30, ctx)) return;
    /*
    var spMessage = ctx.message.text.split(" ").slice(1);
    if (spMessage.length >= 2) {
        control.createToken(spMessage.slice(0, spMessage.length - 1), spMessage[spMessage.length - 1], parseFloat(spMessage[2] ?? conf.defaultPrice.toString()), ctx);
    }
    else {
        ctx.reply("Неправильная комманда. /help -- для поомощи.");
        loging.log(`User ${ctx.from.id} wrote wrong /create command.`);
    }
    */
    ctx.reply("Не работает.")
});

bot.command('balance', (ctx) => {
    if(!getLastUse("Balance", 120, ctx)) return;
    control.getBalance(ctx);
});

bot.command("get", (ctx) => {

});

bot.command("inventory", (ctx) => {
    if(!getLastUse("Inventory", 60, ctx)) return;

    var page = ctx.message.text.split(" ")[1];
    control.getInventory(parseInt(page ?? "1") - 1, ctx);
});

bot.on('callback_query', (ctx) => {
    if(!getLastUse("Inventory", 60, ctx)) return;
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
        if(users[ctx.message.from.id].lastMsg != undefined) {
            if(ctx.message.text.indexOf(users[ctx.message.from.id].lastMsg) != -1) return;
            if(users[ctx.message.from.id].lastMsg.indexOf(ctx.message.text) != -1) return;
        }
    }
    else {
        users[ctx.update.message.from.id] = {};
    }

    if(ctx.message.text.startsWith("/")) return;

    let spMessage = ctx.message.text.split(" ").join("");
    let spaceToSymbols = spMessage.length / ctx.message.text.length;

    if(spaceToSymbols < conf.maxSpaceToSymbols && spaceToSymbols != 1) return;

    let pay = parseFloat(((ctx.message.text.length / conf.symbolsPerCoin) * spaceToSymbols).toFixed(5));
    control.addMoney(pay, ctx);

    users[ctx.message.from.id].lastMsg = ctx.message.text;
});

bot.on("sticker", (ctx) => {
    if(users[ctx.message.from.id] != undefined) {
        if(users[ctx.message.from.id].lastSticker == ctx.update.message.sticker.file_id) {
            return;
        }
    }
    else{
        users[ctx.message.from.id] = {};
    }

    let pay = conf.coinsPerStiker;
    control.addMoney(pay, ctx);


    users[ctx.message.from.id].lastSticker = ctx.update.message.sticker.file_id;
});

bot.launch();

function getLastUse(command, time, ctx) {
    let date = new Date();
    if(users[ctx.update.message.from.id] != undefined) {
        if(users[ctx.update.message.from.id][`last${command}Use`] != undefined){
            let userDate = users[ctx.update.message.from.id][`last${command}Use`].time;
            if((date.getMinutes() * 60) + date.getSeconds() - (userDate.getMinutes() * 60) + userDate.getSeconds() <= time && userDate.getHours() == date.getHours()) { 
                if(users[ctx.update.message.from.id][`last${command}Use`].atem != 3) {
                    users[ctx.update.message.from.id][`last${command}Use`].atem++;
                    if(time % 60 == 0) {
                        ctx.reply(`@${ctx.update.message.from.username} Эту поманду можно использовать только раз в ${time / 60} мин.`);
                    }
                    else if(time % 60 == 30 && time != 30){
                        ctx.reply(`@${ctx.update.message.from.username} Эту поманду можно использовать только раз в ${parseInt(time / 60)} мин 30 сек.`);
                    }
                    else if(time % 60 == time) {
                        ctx.reply(`@${ctx.update.message.from.username} Эту поманду можно использовать только раз в ${time} сек.`);
                    }
                    else {
                        ctx.reply(`@${ctx.update.message.from.username} Эту поманду можно использовать только раз в ${parseInt(time / 60)} мин ${time % 60} сек.`);
                    }
                }

                loging.log(`User ${ctx.message.from.first_name}(${ctx.message.from.id}) wrote ${command.toLowerCase()} command already ${users[ctx.update.message.from.id][`last${command}Use`].atem} times.`);
                return false; 
            }
        }
    }
    else {
        users[ctx.update.message.from.id] = {};
    }

    date = new Date();
    users[ctx.update.message.from.id][`last${command}Use`] = {};
    users[ctx.update.message.from.id][`last${command}Use`].time = date;
    users[ctx.update.message.from.id][`last${command}Use`].atem = 0;
    return true;
}