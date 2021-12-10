
import axios from "axios";
import * as dotenv from "dotenv";
dotenv.config();

const url = `https://api.etherscan.io/api?module=stats&action=ethprice&apikey=${[process.env.ETHERSCAN_API_KEY]}`;
const main = async () => {
    try {
        const response = await axios.get(url);
        console.log(`Current ETH-Price: $${response.data.result.ethusd}`);
    } catch(err) {
        console.error(err);
    }
}
main();