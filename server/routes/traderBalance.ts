 import { Request, Response} from "express";
import { canShowInitiateSettlement, canShowMoneyMovement, getPKKTHodlBoosterOption, getWBTC, getUSDC, settlerWallet } from "../utilities/utilities";
import { Signer, ethers } from "ethers"; 
import { ETH_DECIMALS, USDC_DECIMALS, WBTC_DECIMALS } from "../utilities/constants";

export async function getTraderBalance(req: Request, res: Response) {
    const trader = settlerWallet;

    const vault = await getPKKTHodlBoosterOption();
    const round = await vault.currentRound();

    let ethBalance: any = await settlerWallet.provider.getBalance(trader.address);
    ethBalance = ethers.utils.formatUnits(ethBalance, ETH_DECIMALS);

    const wbtc = await getWBTC();
    let wbtcBalance: any = await wbtc.balanceOf(trader.address);
    wbtcBalance = ethers.utils.formatUnits(wbtcBalance, WBTC_DECIMALS);

    const usdc = await getUSDC();
    let usdcBalance: any = await usdc.balanceOf(trader.address);
    usdcBalance = ethers.utils.formatUnits(usdcBalance, USDC_DECIMALS);

    res.render(
        "traderBalance",
        {
            ethBalance,
            wbtcBalance,
            usdcBalance,
            traderAddress: trader.address,
            showMoneyMovement: await canShowMoneyMovement(vault, round),
            showInitiateSettlement: await canShowInitiateSettlement(req.app)
        }
    );
}