import { Request, Response } from "express";

import { getPredictedOptionData } from "../utilities/utilities";
import {  ETH_USDC_OPTION_ID, WBTC_USDC_OPTION_ID } from "../utilities/constants";

export function getPredictedData(req: Request, res: Response) {
    res.json({
        ethOptionData: getPredictedOptionData(req.app, ETH_USDC_OPTION_ID),
        wbtcOptionData: getPredictedOptionData(req.app, WBTC_USDC_OPTION_ID)
    })
}

export function getPredictedEthData(req: Request, res: Response) {
    res.json({
        ethOptionData: getPredictedOptionData(req.app, ETH_USDC_OPTION_ID)
    });
}

export function getPredictedWbtcData(req: Request, res: Response) {
    res.json({
        wbtcOptionData: getPredictedOptionData(req.app, WBTC_USDC_OPTION_ID)
    });
}