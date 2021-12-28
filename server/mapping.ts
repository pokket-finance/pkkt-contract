// Transforms Smart Contract Events into Entities
import { log, Address } from "@graphprotocol/graph-ts";

import { User, RoundInformation, VaultActivity, Option } from "../generated/schema";
import { Deposit, OptionCreated, OptionTransfer } from "../generated/PKKTHodlBoosterCallOption/PKKTHodlBoosterCallOption";

const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'

export function handleDeposit(event: Deposit): void {
    let from = event.params.from.toHexString();
    let account = event.params.account.toHexString();
    let round = event.params.round;
    let optionID = event.params.option.toHexString();
    let roundInformationID = `${account}-${optionID}-${round}`;
    let createdAtTimestamp = event.block.timestamp.toString();

    // If the entity already exists for a given ID the changes are merged into it on .save()
    let user = new User(account);
    user.save();

    let roundInformation = RoundInformation.load(roundInformationID);
    if (roundInformation == null) {
        log.debug("Round information created for account: {} for option {} at round: {}", [user.id, optionID, round.toString()]);
        roundInformation = new RoundInformation(roundInformationID);
        roundInformation.round = round;
        roundInformation.user = user.id;
        roundInformation.save();
    }

    let option = new Option(optionID);

    // It is an auto roll deposit
    if (account != from) {
        let autoRollDepositID = `${from}-${account}-${createdAtTimestamp}`;
        let autoRollDeposit = new VaultActivity(autoRollDepositID);
        autoRollDeposit.user = user.id;
        autoRollDeposit.option = option.id;
        autoRollDeposit.amount = event.params.amount;
        autoRollDeposit.roundInformation = roundInformation.id;
        autoRollDeposit.createdAtTimestamp = createdAtTimestamp;
        autoRollDeposit.activityType = "AutoRollDeposit";
        autoRollDeposit.save();
        log.debug("Auto roll deposit amount: {} from: {} account: {} at round: {}", [autoRollDeposit.amount.toString(), from, account, roundInformation.id]);
        roundInformation.save()
        return;
    }


    let userDepositID = `${from}-${account}-${createdAtTimestamp}`;
    let userDeposit = new VaultActivity(userDepositID);
    userDeposit.user = user.id;
    userDeposit.option = option.id;
    userDeposit.amount = event.params.amount;
    userDeposit.roundInformation = roundInformation.id;
    userDeposit.createdAtTimestamp = createdAtTimestamp;
    userDeposit.activityType = "UserDeposit";
    userDeposit.save();
    log.debug("User deposit amount: {} account: {} at round: {}", [userDeposit.amount.toString(), account, roundInformation.id]);
}

// function createVaultActivity(
//     from: String,
//     to: String,
//     createdAtTimestamp: BigInt,
//     userID: String,
//     optionID: String,
//     amount: BigInt,
//     roundInformationID: String
// ): void {
//     let vaultActivityID = `${from}-${to}-${createdAtTimestamp}`;
//     let vaultActivity = new VaultActivity(vaultActivityID);
//     vaultActivity.user = userID;
//     vaultActivity.option = optionID;
//     vaultActivity.amount = amount;
//     vaultActivity.round = roundInformationID;
//     vaultActivity.createdAtTimestamp = createdAtTimestamp;
//     vaultActivity.save();
// }

export function handleOptionTransfer(event: OptionTransfer): void {
    log.debug("from: {} to: {} premium: {} round: {}", [
        event.params.from.toHexString(),
        event.params.to.toHexString(),
        event.params.premium.toString(),
        event.params.round.toString()
    ]);

    let optionID = event.params.from.toHexString();
    // At this point the option entity should already be created
    let option = new Option(optionID);

    let roundInformationID = `${event.params.to.toHexString()}-${event.params.from.toHexString()}-${event.params.round.toString()}`;
    let roundInformation = RoundInformation.load(roundInformationID);
    if (roundInformation == null) {
        log.error("Error round should already exist id: {}", [roundInformationID]);
        return;
    }
    roundInformation.premium = event.params.premium;
    roundInformation.save();
}

export function handleOptionCreated(event: OptionCreated): void {
    log.debug("Option {} created at: {}", [event.params.name.toString(), event.params.option.toHexString()]);
    let option = new Option(event.params.option.toHexString());
    option.optionType = event.params.name.toString();
    option.save();
}