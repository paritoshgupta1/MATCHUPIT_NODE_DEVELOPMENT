const swearjar = require('swearjar');

const checkWord = (word) => {
    return swearjar.profane(word);
}


module.exports = checkWord;