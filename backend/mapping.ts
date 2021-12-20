// Transforms Smart Contract Events into Entities
import { log } from "@graphprotocol/graph-ts";

import { User, Option, OptionPosition } from "../generated/schema";
import { Deposit, Transfer, OptionCreated } from "../generated/PKKTHodlBoosterCallOption/PKKTHodlBoosterCallOption";

export function handleTransfer(event: Transfer): void {
    log.debug("from: {} to: {} amount: {}", [event.params.from.toHexString(), event.params.to.toHexString(), event.params.value.toString()])
    let userId = event.params.to.toHexString();
    let user = User.load(userId);
    if (user == null) {
        user = new User(userId);
    }
    let optionId = event.params.from.toHexString();
    // At this point the option entity should already be created
    let option = Option.load(optionId) as Option;
    let optionPositionId = optionId.concat('-').concat(userId);
    let optionPosition = new OptionPosition(optionPositionId);
    optionPosition.user = user.id;
    optionPosition.optionType = option.id;
    optionPosition.optionBalance = event.params.value;
    user.save();
}

// export function handleDeposit(event: Deposit): void {
//     // User address's represent their id
//     let id = event.transaction.from.toHex();
//     let user = User.load(id);
//     // User has not deposited before
//     if (user == null) {
//         user = new User(id);
//     }
//     user.save();
// }

export function handleOptionCreated(event: OptionCreated): void {
    log.debug("Option created at: {}", [event.params.option.toHexString()]);
    let option = new Option(event.params.option.toHexString());
    option.save();
}