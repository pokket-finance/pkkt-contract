
window.addEventListener("load", () => {
    let withdrawEth = document.querySelector("input[name='withdrawEth']");
    withdrawEth.addEventListener("click", updateGasEstimate);
    let withdrawWbtc = document.querySelector("input[name='withdrawWbtc']");
    withdrawWbtc.addEventListener("click", updateGasEstimate);
    let withdrawUsdc = document.querySelector("input[name='withdrawUsdc']");
    withdrawUsdc.addEventListener("click", updateGasEstimate);

    let manualGasPriceInput = document.querySelector("input[name='manualGasPrice']");
    manualGasPriceInput.addEventListener("input", calculateTransaction);
});

let gasEstimate = 0;
function updateGasEstimate(event) {
    let newGasEstimate = parseInt(event.target.value);
    if (event.target.checked) {
        gasEstimate += newGasEstimate;
    }
    else {
        gasEstimate -= newGasEstimate;
    }
    calculateTransaction();
}

function calculateTransaction() {
    let gasPrice = parseFloat(document.querySelector("input[name='manualGasPrice']").value);
    let transactionPrice = gasPrice * gasEstimate / 10000000000;
    let costToWithdraw = document.querySelector(".transactionCost");
    costToWithdraw.innerHTML = transactionPrice;
}