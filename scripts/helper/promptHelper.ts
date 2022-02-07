
const prompt = require('prompt'); 
const util = require('util'); 
prompt.start();
export default util.promisify(prompt.get);