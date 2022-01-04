const fs = require("fs");

const conf = require("./config.js");

exports.sdate = new Date();
exports.logf_name = `./logs/${exports.sdate.getDay()}_${exports.sdate.getMonth()}_${exports.sdate.getFullYear()} ${exports.sdate.getHours()}-${exports.sdate.getMinutes()}-${exports.sdate.getSeconds()}.log`;

exports.Start = function() {
    fs.appendFile(exports.logf_name, `#${exports.sdate.getHours()}:${exports.sdate.getMinutes()}:${exports.sdate.getSeconds()} FreedomBot v${conf.version} start.`, function(err) {
        if(err) throw err.message;
        exports.log("Log file was created.");
    });
}

exports.log = function(mes) {
    let date = new Date();
    console.log(`[${date}]: ${mes}`);
    fs.appendFile(exports.logf_name, `\n[${date}]: ${mes.toString()}`, function(err) {
        if(err) throw err.message;
    });
}