import { ethers } from "hardhat";
import { Request, Response} from "express";
import { canShowInitiateSettlement, canShowMoneyMovement, getDeployedContractHelper, getTrader } from "../utilities/utilities";
import { Signer } from "ethers";
import { ERC20Mock, PKKTHodlBoosterOption } from "../../typechain";
import { ETH_DECIMALS, USDC_DECIMALS, WBTC_DECIMALS } from "../../constants/constants";

export async function getTraderBalance(req: Request, res: Response) {
    const trader = await getTrader();

    const vault = await getDeployedContractHelper("PKKTHodlBoosterOption") as PKKTHodlBoosterOption;
    const round = await vault.currentRound();

    let ethBalance: any = await ethers.provider.getBalance(trader.address);
    ethBalance = ethers.utils.formatUnits(ethBalance, ETH_DECIMALS);

    const wbtc = await getDeployedContractHelper("WBTC");
    let wbtcBalance: any = await wbtc.balanceOf(trader.address);
    wbtcBalance = ethers.utils.formatUnits(wbtcBalance, WBTC_DECIMALS);

    const usdc = await getDeployedContractHelper("USDC");
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