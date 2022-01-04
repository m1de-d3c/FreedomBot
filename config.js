exports.version = "0.1a";

exports.API_KEY = "Здесь токен бота";

exports.defaultPrice = 15;
exports.defaultTax = 0.2;

exports.symbolsPerCoin = 5;
exports.coinsPerStiker = 1;

exports.helpMsg = `/reg -- реестрация\n/create <name> <count> [price] (в ответ на картинку) -- для создания токена (Где <name> имя токена(могут быть использованы пробелы), <count> количество токенов, [price] необязательный аргумент цены(по стандарту ${exports.defaultPrice})), пример \"/create Токен 14\"" +
"\n/get <name> -- вывести в чат картинку вашего токена (Где <name> имя токена)\n/my -- ваш профиль\n/inventory [page] -- ваш инвентарь (Где [page] необязательный параметр страницы`;
exports.startMsg = "Привет путник. /help -- для помощи."

exports.unavalibleSymbols = ['\\', '/', ':', '*', "?", '"', '<', '>', '|'];
exports.maxNameLength = 10;

exports.maxTokensOnInventoryPage = 5;

exports.maxSpaceToSymbols = 0.85;
