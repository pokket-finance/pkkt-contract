window.addEventListener("load", () => {

    let manualGasPrice = document.querySelector("input[name='manualGasPrice']");
    if (manualGasPrice) {
        manualGasPrice.addEventListener("input", calculateTransaction);
    }

    let successElement = document.querySelector(".message");
    console.log(successElement);
    if (successElement) {
        if (successElement.dataset.success === ":true") {
            alert("Transaction Submitted");
        }
        else {
            alert("Transaction Failed");
        }
    }

    let ethBalanceElement = document.querySelector(".ethBalance");
    let ethPrice = parseFloat(ethBalanceElement.dataset.ethPrice);
    let ethBalance = parseFloat(ethBalanceElement.innerHTML);
    const ethValue = ethPrice * ethBalance;
    let ethValueElement = document.querySelector(".ethValue");
    ethValueElement.innerHTML = `$${ethValue}`;

    let wbtcBalanceElement = document.querySelector(".wbtcBalance");
    let wbtcPrice = parseFloat(wbtcBalanceElement.dataset.wbtcPrice);
    let wbtcBalance = parseFloat(wbtcBalanceElement.innerHTML);
    const wbtcValue = wbtcPrice * wbtcBalance;
    let wbtcValueElement = document.querySelector(".wbtcValue");
    wbtcValueElement.innerHTML = `$${wbtcValue}`;
});

/**
 * Calculates the new transaction cost and displays it to the page
 */
 function calculateTransaction() {
    let gasPriceElement = document.querySelector("input[name='manualGasPrice']");
    let gasPrice = parseFloat(gasPriceElement.value);
    let gasEstimate = parseFloat(gasPriceElement.dataset.gasEstimate);
    let transactionPrice = gasPrice * gasEstimate / 10000000000;
    let costToWithdraw = document.querySelector(".transactionCost");
    costToWithdraw.innerHTML = transactionPrice;
}