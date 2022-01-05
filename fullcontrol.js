const sqlite3 = require("sqlite3");
const axios = require("axios");
const fs = require("fs");

const loging = require("./loging.js");
const conf = require("./config.js");

exports.datebase = null;

exports.Init = function() {
    exports.datebase = new sqlite3.Database('./datebase.db', (err) => {
        if(err) {
            throw err.message;
        }

        loging.log("Connected to datebase.");
    });

    exports.datebase.serialize(() => {
        exports.datebase.run("CREATE TABLE IF NOT EXISTS users (name TEXT NOT NULL, id TEXT NOT NULL, money REAL NOT NULL, inventory TEXT);");
        exports.datebase.run("CREATE TABLE IF NOT EXISTS tokens (name TEXT NOT NULL, price REAL NOT NULL, count INTEGER NOT NULL, creater_id TEXT NOT NULL);");
        exports.datebase.run("CREATE TABLE IF NOT EXISTS transfers (event TEXT NOT NULL, from_id TEXT NOT NULL, to_id TEXT NOT NULL, transfer_value TEXT NOT NULL);");
        exports.datebase.run("CREATE TABLE IF NOT EXISTS bot_info (name TEXT NOT NULL, value TEXT);")
    });
}

exports.changeUserName = function(ctx) {
    exports.datebase.serialize(() => {
        UserExist(getId(ctx), (err, exist) => {
            if(err) throw err.message;

            if(exist) {
                exports.datebase.run(`UPDATE users SET name="${getName(ctx)}" WHERE id="${getId(ctx)}"`);
                ctx.reply(`@${getName(ctx)} Ваше имя успешно изменено на "${getName(ctx)}".`);
                loging.log(`User ${getName(ctx)}(${getId(ctx)}) change her username.`);
            }
            else {
                ctx.reply(`@${getName(ctx)} Пожалуйста зареестрируйтесь. /help -- для помощи.`);
                loging.log(`User ${getName(ctx)}(${getId(ctx)}) try change her username. But he already not registered.`);
            }
        });
    });
}

exports.getProfile = function(ctx) {
    exports.datebase.serialize(() => {
        UserExist(getId(ctx), (err, exist) => {
            if (err) throw err;

            if(exist) {
                exports.datebase.each(`SELECT * FROM users WHERE id="${getId(ctx)}"`, function(err, row) {
                    if (err) throw err.message;

                    ctx.reply(`==== Профиль ====\nИмя: @${row.name}\nID: ${row.id}\nБаланс: ${row.money}🪙`, {  reply_markup: { resize_keyboard: true, inline_keyboard: [ [ { text: 'INVENTORY', callback_data: `INV${getId(ctx)}:0` } ] ] }});
                    loging.log(`User ${getName(ctx)}(${getId(ctx)}) get her profile.`);
                });
            }
            else {
                ctx.reply(`@${getName(ctx)} Пожалуйста зареестрируйтесь. /help -- для помощи.`);
                loging.log(`User ${getName(ctx)}(${getId(ctx)}) try get her profile. But he already not registered.`);
            }
        });
    });
}

exports.regNewUser = function(ctx) {
    exports.datebase.serialize(() => {
        UserExist(getId(ctx) , (err, exist) => {
            if(err) throw err.message;

            if(!exist) {
                exports.datebase.run(`INSERT INTO users VALUES("${getName(ctx)}", "${getId(ctx)}", 0, null);`);
                ctx.reply(`@${getName(ctx)} Вы были успешно зареестрированы.`);
                loging.log(`User ${getName(ctx)}(${getId(ctx)}) was registered.`);
            }
            else {
                ctx.reply(`@${getName(ctx)} Вы уже зареестрированы.`);
                loging.log(`User ${getName(ctx)}(${getId(ctx)}) try register. But he already registered.`);
            }
        });
    });
}

exports.changePrice = function(token_name, new_price, ctx) {
    
}

exports.getToken = function(token_name, ctx) {
    exports.datebase.serialize(() => {
        
    });
}

exports.getInventory = function(page, ctx) {
    exports.datebase.serialize(() => {
        UserExist(getId(ctx), (err, exist) => {
            if(err) throw err;

            if(exist) {
                exports.datebase.each(`SELECT * FROM users WHERE id="${getId(ctx)}"`, function(err, row) {
                    if(err) throw err;

                    if(row.inventory != null) { 
                        let inventory = row.inventory.split("|").slice(1);
                        
                        let forSend = `= Инвентарь @${getName(ctx)} =\nИмя\t:\tКоличество\n------\n`;
                        let elementNum = 0;

                        for(let i = 0; i < conf.maxTokensOnInventoryPage; i++) {
                            if(inventory.length -1 >= elementNum + conf.maxTokensOnInventoryPage * page) {
                                let token = { Name: inventory[elementNum + conf.maxTokensOnInventoryPage * page].split(":")[0], Count: inventory[elementNum + conf.maxTokensOnInventoryPage * page].split(":")[1] }
                                forSend += `${token.Name}\t:\t${token.Count}\n`;
                            }
                            else {
                                if(elementNum == 0) {
                                    ctx.reply(`@${getName(ctx)} Неправильная страница.`);
                                    loging.log(`User ${getName(ctx)}(${getId(ctx)}) try get her inventory. But he write wrong page.`)
                                    return;
                                }
                            }
                            elementNum++;
                        }

                        forSend += `------\n [ ${page + 1}/${Math.ceil(inventory.length / conf.maxTokensOnInventoryPage)} ]`

                        if (page * conf.maxTokensOnInventoryPage + conf.maxTokensOnInventoryPage >= inventory.length)
                            ctx.reply(forSend);
                        else {
                            ctx.reply(forSend, {reply_markup: { resize_keyboard: true, inline_keyboard: [ [ { text: 'NEXT PAGE', callback_data: `INV${getId(ctx)}:${page + 1}` } ] ] }});
                        }
                        loging.log(`User ${getName(ctx)}(${getId(ctx)}) get her inventory on page ${page + 1}.`);
                    }
                    else {
                        ctx.reply(`@${getName(ctx)} Здесь ничего нет...`);
                        loging.log(`User ${getName(ctx)}(${getId(ctx)}) try get her inventory. But he don't have anything in inventory.`);
                    }
                });
            }
            else {
                ctx.reply(`@${getName(ctx)} Пожалуйста зареестрируйтесь. /help -- для помощи.`);
                loging.log(`User ${getName(ctx)}(${getId(ctx)}) try get her inventory. But he already not registered.`);
            }
        });
    });
}

exports.createToken = function(name, count, pricePerOne, ctx) {
    let isBreak = false;
    let price = count * (pricePerOne * (1 + conf.defaultTax)); // Price of token creation (count * price of one with tax )

    UserExist(getId(ctx), (err, exist) => {
        if(err) throw err;

        if(exist) {
            exports.datebase.each(`SELECT * FROM users WHERE id="${getId(ctx)}";`, (err, row) => {
                if(err) throw err;

                if(row.money < price) 
                {
                    ctx.reply(`@${getName(ctx)} Не достаточно средств.\nУ вас ${row.money}, цена создания токена ${price}.`);
                    loging.log(`User ${getName(ctx)}(${getId(ctx)}) try create token. But he don't have money.`);
                    return;
                }
                else {
                    exports.datebase.run(`UPDATE users SET money=${row.money - price} WHERE id="${getId(ctx)}";`);

                    exports.insertToInventory(name, count, ctx);
                    TokenExist(name, (errt, existt) => {
                        if(errt) throw errt;

                        if(!existt) {
                            exports.datebase.run(`INSERT INTO tokens VALUES("${name}", ${pricePerOne}, ${count}, "${getId(ctx)}");`);
                        }
                        else {
                            exports.datebase.run(`UPDATE tokens SET count=count+${count} WHERE name="${name}";`)
                        }
                    });
        
                    let fileId = ctx.update.message.reply_to_message.photo[0].file_id;
                    ctx.telegram.getFileLink(fileId).then(url => {    
                        axios(url.href, {responseType: 'stream'}).then(response => {
                            return new Promise((resolve, reject) => {
                                response.data.pipe(fs.createWriteStream(`./img/${name.toString()}.webp`))
                                            .on('finish', () => { loging.log(`File ./img/${name.toString()}.webp was saved.`); })
                                            .on('error', e => { throw e; });
                                    });
                                });
                    });

                    ctx.reply(`@${getName(ctx)} Токен "${name}" был создан в количестве ${count} ${(count == 1) ? "штуки" : "штук"}.`);
                    loging.log(`Token ${name}(count : ${count}) was created.`);
                }
            });
        }
        else {
            ctx.reply(`@${getName(ctx)} Пожалуйста зареестрируйтесь. /help -- для помощи.`);
            loging.log(`User ${getName(ctx)}(${getId(ctx)}) try create token. But he already not registered.`);
            return;
        }
    });
}

exports.insertToInventory = function(name, count, ctx) {
    UserExist(getId(ctx), (err, exist) => {
        if (err) throw err;

        if(exist) {
            exports.datebase.each(`SELECT * FROM users WHERE id="${getId(ctx)}"`, (err, row) => {
                if((row.inventory ?? "").indexOf(`|${name}`) == -1){
                    exports.datebase.run(`UPDATE users SET inventory="${row.inventory ?? ""}|${name}:${count.toString()}" WHERE id="${getId(ctx)}";`);
                }
                else {
                    let inventory = row.inventory.split("|").slice(1);

                    for(var i = 0; i < inventory.length; i++) {
                        let elem = inventory[i].split(":");
                        if(elem[0] == name) inventory[i] = `${name}:${parseInt(elem[1]) + parseInt(count)}`;
                    }

                    exports.datebase.run(`UPDATE users SET inventory="|${inventory.join("|")}" WHERE id="${getId(ctx)}";`);
                }

                loging.log(`User ${getName(ctx)}(${getId(ctx)}) get token "${name}" to her inventory.`);
            });
        }
        else {
            ctx.reply(`${getId(ctx)}, пожалуйста зареестрируйтесь. /help -- для помощи.`);
            loging.log(`User ${getName(ctx)}(${getId(ctx)}) try get token to her inventory. But he already not registered.`);
        }
    });
}

exports.getBalance = function(ctx) {
    exports.datebase.serialize(() => {
        UserExist(getId(ctx), (err, exist) => {
            if (err) throw err;

            if(exist) {
                exports.datebase.each(`SELECT money FROM users WHERE id="${getId(ctx)}"`, function(err, row) {
                    if (err) throw err.message;

                    ctx.reply(`@${getName(ctx)} Ваш баланс: ${row.money}🪙`);
                    loging.log(`User ${getName(ctx)}(${getId(ctx)}) get her balance.`);
                });
            }
            else {
                ctx.reply(`@${getName(ctx)} Пожалуйста зареестрируйтесь. /help -- для помощи.`);
                loging.log(`User ${getName(ctx)}(${getId(ctx)}) try get her balance. But he already not registered.`);
            }
        });
    });
}

exports.addMoney = function(pay, ctx) {
    exports.datebase.serialize(() =>{
        UserExist(getId(ctx), function(err, exist) {
            if(exist) {
                exports.datebase.each(`SELECT * FROM users WHERE id="${getId(ctx)}";`, function(err, row) {
                    exports.datebase.run(`UPDATE users SET money=${parseFloat((pay + row.money).toFixed(5))} WHERE id=${getId(ctx)}`);
                    if(pay > 0) {
                        loging.log(`User ${getName(ctx)}(${getId(ctx)}) get +${pay} coins.`);
                    }
                });
            }
        });
    });
}

exports.getUserExist = (user_id, callback) => {UserExist(user_id, callback)}

function UserExist(user_id, callback) {
    exports.datebase.serialize(() => {
        exports.datebase.each(`SELECT COUNT(*) FROM users WHERE id="${user_id}";`, function(err, row) {
            if(err) callback(err, false);

            if(row["COUNT(*)"] === 1) callback(undefined, true);
            else if (row["COUNT(*)"] > 1) callback(`Users with same id (${user_id}).`, false);
            else callback(undefined, false);
        });
    });
}

function TokenExist(token_name, callback) {
    exports.datebase.serialize(() => {
        exports.datebase.each(`SELECT COUNT(*) FROM tokens WHERE name="${token_name}";`, function(err, row) {
            if(err) callback(err, false)

            if(row[`COUNT(*)`] == 1) callback(undefined, true);
            else if (row["COUNT(*)"] > 1) callback(`Tokens with same name (${token_name}).`, false);
            else callback(undefined, false);
        });
    });
}

function getName(ctx) {
    let from = (ctx.update.message ?? ctx.message ?? ctx.update.callback_query).from;
    return from.username || from.first_name;
}

exports.getId = getId;

function getId(ctx) {
    let from = (ctx.update.message ?? ctx.message ?? ctx.update.callback_query).from;
    return from.id;
}