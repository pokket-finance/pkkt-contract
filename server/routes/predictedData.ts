import { Request, Response } from "express";

import { getPredictedOptionData } from "../utilities/utilities";

export function getPredictedData(req: Request, res: Response) {
    res.json({
        ethOptionData: getPredictedOptionData(req.app, "predictedEthOption"),
        wbtcOptionData: getPredictedOptionData(req.app, "predictedWbtcOption")
    })
}

export function getPredictedEthData(req: Request, res: Response) {
    res.json({
        ethOptionData: getPredictedOptionData(req.app, "predictedEthOption")
    });
}

export function getPredictedWbtcData(req: Request, res: Response) {
    res.json({
        wbtcOptionData: getPredictedOptionData(req.app, "predictedEthOption" )
    });
}