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