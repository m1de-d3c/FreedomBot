const sqlite3 = require("sqlite3");

const loging = require("./loging.js");
const conf = require("./config.js");

exports.datebase = null;

exports.Init = function() {
    exports.datebase = new sqlite3.Database('./datebase.db', (err) => {
        if(err) {
            throw err.message;
        }

        loging.log("Connected to datebase.")
    });

    exports.datebase.serialize(() => {
        exports.datebase.run("CREATE TABLE IF NOT EXISTS users (name TEXT NOT NULL, id TEXT NOT NULL, money REAL NOT NULL, inventory TEXT);");
        exports.datebase.run("CREATE TABLE IF NOT EXISTS tokens (name TEXT NOT NULL, price REAL NOT NULL, count INTEGER NOT NULL, creater_id TEXT NOT NULL);");
        exports.datebase.run("CREATE TABLE IF NOT EXISTS transfers (event TEXT NOT NULL, from_id TEXT NOT NULL, to_id TEXT NOT NULL, transfer_value TEXT NOT NULL);");
    });
}

exports.changeUserName = function(ctx) {
    exports.datebase.serialize(() => {
        UserExist((ctx.update.callback_query || ctx.message || ctx.update).from.id, (err, exist) => {
            if(err) throw err.message;

            if(exist) {
                exports.datebase.run(`UPDATE users SET name="${(ctx.update.callback_query || ctx.message || ctx.update).from.first_name}" WHERE id="${(ctx.update.callback_query || ctx.message || ctx.update).from.id}"`);
                ctx.reply(`Ваше имя успешно изменено на "${(ctx.update.callback_query || ctx.message || ctx.update).from.first_name}".`);
                loging.log(`User ${(ctx.update.callback_query || ctx.message || ctx.update).from.first_name}(${(ctx.update.callback_query || ctx.message || ctx.update).from.id}) change her username.`);
            }
            else {
                ctx.reply("Пожалуйста зареестрируйтесь. /help -- для помощи.");
                loging.log(`User ${(ctx.update.callback_query || ctx.message || ctx.update).from.first_name}(${(ctx.update.callback_query || ctx.message || ctx.update).from.id}) try change her username. But he already not registered.`);
            }
        });
    });
}

exports.getProfile = function(ctx) {
    exports.datebase.serialize(() => {
        UserExist((ctx.update.callback_query || ctx.message || ctx.update).from.id, (err, exist) => {
            if (err) throw err;

            if(exist) {
                exports.datebase.each(`SELECT * FROM users WHERE id="${(ctx.update.callback_query || ctx.message || ctx.update).from.id}"`, function(err, row) {
                    if (err) throw err.message;

                    ctx.reply(`==== Профиль ====\nИмя: ${row.name}\nID: ${row.id}\nБаланс: ${row.money}🪙`, {  reply_markup: { resize_keyboard: true, inline_keyboard: [ [ { text: 'INVENTORY', callback_data: `INV${(ctx.update.callback_query || ctx.message || ctx.update).from.id}:0` } ] ] }});
                    loging.log(`User ${(ctx.update.callback_query || ctx.message || ctx.update).from.first_name}(${(ctx.update.callback_query || ctx.message || ctx.update).from.id}) get her profile.`);
                });
            }
            else {
                ctx.reply("Пожалуйста зареестрируйтесь. /help -- для помощи.");
                loging.log(`User ${(ctx.update.callback_query || ctx.message || ctx.update).from.first_name}(${(ctx.update.callback_query || ctx.message || ctx.update).from.id}) try get her profile. But he already not registered.`);
            }
        });
    });
}

exports.regNewUser = function(ctx) {
    exports.datebase.serialize(() => {
        UserExist((ctx.update.callback_query || ctx.message || ctx.update).from.id , (err, exist) => {
            if(err) throw err.message;

            if(!exist) {
                exports.datebase.run(`INSERT INTO users VALUES("${(ctx.update.callback_query || ctx.message || ctx.update).from.first_name}", "${(ctx.update.callback_query || ctx.message || ctx.update).from.id}", 0, null);`);
                ctx.reply("Вы были успешно зареестрированы.");
                loging.log(`User ${(ctx.update.callback_query || ctx.message || ctx.update).from.first_name}(${(ctx.update.callback_query || ctx.message || ctx.update).from.id}) was registered.`);
            }
            else {
                ctx.reply("Вы уже зареестрированы.");
                loging.log(`User ${(ctx.update.callback_query || ctx.message || ctx.update).from.first_name}(${(ctx.update.callback_query || ctx.message || ctx.update).from.id}) try register. But he already registered.`);
            }
        });
    });
}

exports.changePrice = function(token_name, new_price) {
    
}

exports.getToken = function(token_name, ctx) {
    exports.datebase.serialize(() => {
        
    });
}

exports.getInventory = function(ctx, page) {
    exports.datebase.serialize(() => {
        UserExist((ctx.update.callback_query || ctx.message || ctx.update).from.id, (err, exist) => {
            if(err) throw err;

            if(exist) {
                exports.datebase.each(`SELECT * FROM users WHERE id="${(ctx.update.callback_query || ctx.message || ctx.update).from.id}"`, function(err, row) {
                    if(err) throw err;

                    if(row.inventory != null) { 
                        let inventory = row.inventory.split("|").slice(1);
                        
                        let forSend = `= Инвентарь ${(ctx.update.callback_query || ctx.message || ctx.update).from.first_name} =\nИмя\t:\tКоличество\n------\n`;
                        let elementNum = 0;

                        for(let i = 0; i < conf.maxInventoryPage; i++) {
                            if(inventory.length -1 >= elementNum + conf.maxInventoryPage * page) {
                                let token = {Name: inventory[elementNum + conf.maxInventoryPage * page].split(":")[0], Count: inventory[elementNum + conf.maxInventoryPage * page].split(":")[1]}
                                forSend += `${token.Name}\t:\t${token.Count}\n`;
                            }
                            else {
                                if(elementNum == 0) {
                                    ctx.reply("Неправильная страница.");
                                    loging.log(`User ${(ctx.update.callback_query || ctx.message || ctx.update).from.first_name}(${(ctx.update.callback_query || ctx.message || ctx.update).from.id}) try get her inventory. But he write wrong page.`)
                                    return;
                                }
                            }
                            elementNum++;
                        }

                        forSend += `------\n [ ${page + 1}/${Math.ceil(inventory.length / conf.maxInventoryPage)} ]`

                        if (page * conf.maxInventoryPage + conf.maxInventoryPage >= inventory.length)
                            ctx.reply(forSend);
                        else {
                            ctx.reply(forSend, {reply_markup: { resize_keyboard: true, inline_keyboard: [ [ { text: 'NEXT PAGE', callback_data: `INV${(ctx.update.callback_query || ctx.message || ctx.update).from.id}:${page + 1}` } ] ] }});
                        }
                        loging.log(`User ${(ctx.update.callback_query || ctx.message || ctx.update).from.first_name}(${(ctx.update.callback_query || ctx.message || ctx.update).from.id}) get her inventory on page ${page + 1}.`);
                    }
                    else {
                        ctx.reply("Здесь ничего нет...");
                        loging.log(`User ${(ctx.update.callback_query || ctx.message || ctx.update).from.first_name}(${(ctx.update.callback_query || ctx.message || ctx.update).from.id}) try get her inventory. But he don't have anything in inventory.`);
                    }
                });
            }
            else {
                ctx.reply("Пожалуйста зареестрируйтесь. /help -- для помощи.");
                loging.log(`User ${(ctx.update.callback_query || ctx.message || ctx.update).from.first_name}(${(ctx.update.callback_query || ctx.message || ctx.update).from.id}) try get her inventory. But he already not registered.`);
            }
        });
    });
}

exports.createToken = function(name, count, pricePerOne, ctx) {
    let isBreak = false;
    let price = count * (pricePerOne * (1 + conf.defaultTax)); // Price of token creation (count * price of one with tax )

    UserExist((ctx.update.callback_query || ctx.message || ctx.update).from.id, (err, exist) => {
        if(err) throw err;

        if(!exist) {
            ctx.reply("Пожалуйста зареестрируйтесь. /help -- для помощи.");
            loging.log(`User ${(ctx.update.callback_query || ctx.message || ctx.update).from.first_name}(${(ctx.update.callback_query || ctx.message || ctx.update).from.id}) try create token. But he already not registered.`);
            return;
        }
    });
}

exports.insertToInventory = function(name, count, ctx) {
    UserExist((ctx.update.callback_query || ctx.message || ctx.update).from.id || ctx.update.message.from.id, (err, exist) => {
        if (err) throw err;

        if(exist) {
            exports.datebase.each(`SELECT * FROM users WHERE id="${(ctx.update.callback_query || ctx.message || ctx.update).from.id}"`, (err, row) => {
                exports.datebase.run(`UPDATE users SET inventory="${row.inventory}" || "|${name}:${count}" WHERE id="${(ctx.update.callback_query || ctx.message || ctx.update).from.id || ctx.update.message.from.id}";`);
                loging.log(`User ${(ctx.update.callback_query || ctx.message || ctx.update).from.first_name}(${(ctx.update.callback_query || ctx.message || ctx.update).from.id}) get token "${name}" to her inventory.`);
            });
        }
        else {
            ctx.reply(`${(ctx.update.callback_query || ctx.message || ctx.update).from.id || ctx.update.message.from.id}, пожалуйста зареестрируйтесь. /help -- для помощи.`);
            loging.log(`User ${(ctx.update.callback_query || ctx.message || ctx.update).from.first_name}(${(ctx.update.callback_query || ctx.message || ctx.update).from.id}) try get token to her inventory. But he already not registered.`);
        }
    });
}

exports.getBalance = function(ctx) {
    exports.datebase.serialize(() => {
        UserExist((ctx.update.callback_query || ctx.message || ctx.update).from.id, (err, exist) => {
            if (err) throw err;

            if(exist) {
                exports.datebase.each(`SELECT money FROM users WHERE id="${(ctx.update.callback_query || ctx.message || ctx.update).from.id}"`, function(err, row) {
                    if (err) throw err.message;

                    ctx.reply(`Ваш баланс: ${row.money}🪙`);
                    loging.log(`User ${(ctx.update.callback_query || ctx.message || ctx.update).from.first_name}(${(ctx.update.callback_query || ctx.message || ctx.update).from.id}) get her balance.`);
                });
            }
            else {
                ctx.reply("Пожалуйста зареестрируйтесь. /help -- для помощи.");
                loging.log(`User ${(ctx.update.callback_query || ctx.message || ctx.update).from.first_name}(${(ctx.update.callback_query || ctx.message || ctx.update).from.id}) try get her balance. But he already not registered.`);
            }
        });
    });
}

exports.addMoney = function(pay, ctx) {
    exports.datebase.serialize(() =>{
        UserExist((ctx.update.callback_query || ctx.message || ctx.update).from.id, function(err, exist) {
            if(exist) {
                exports.datebase.run(`UPDATE users SET money=money+${pay} WHERE id=${(ctx.update.callback_query || ctx.message || ctx.update).from.id}`);
                if(pay > 0) {
                    loging.log(`User ${(ctx.update.callback_query || ctx.message || ctx.update).from.first_name}(${(ctx.update.callback_query || ctx.message || ctx.update).from.id}) get +${pay} coins.`);
                }
            }
        });
    });
}

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