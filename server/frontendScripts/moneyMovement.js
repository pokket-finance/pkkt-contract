
window.addEventListener("load", () => {
    // Update the page elements
    updateRequired(".ethRequired", ".ethSelectionData");
    updateRequired(".wbtcRequired", ".wbtcSelectionData");
    updateRequired(".usdcRequired", ".usdcSelectionData");

    // initiate the click event listeners
    initiateClickListener("input[name='withdrawEth']");
    initiateClickListener("input[name='withdrawWbtc']");
    initiateClickListener("input[name='withdrawUsdc']");
});

/**
 * Updates the color of the movable assets column
 * Updates the html of the selection column
 * @param {string} selector query selector string for the movable asset
 * @param {string} dataSelector query selector string for the selection table element
 */
function updateRequired(selector, dataSelector) {
    let element = document.querySelector(selector);
    let required = parseFloat(element.innerHTML);
    if (required > 0) {
        element.setAttribute("style", "color:green");
        element.insertAdjacentHTML("afterBegin", "+");
    }
    else if (required < 0) {
        element.setAttribute("style", "color:red");
        let selectionData = document.querySelector(dataSelector);
        selectionData.innerHTML= "Send funds back to vault";
    }
    else {
        let selectionData = document.querySelector(dataSelector);
        selectionData.innerHTML = "";
    }
}

/**
 * Initiates an element with the selector to listen for clicks
 * @param {string} selector query selector string to grab element
 */
function initiateClickListener(selector) {
    let element = document.querySelector(selector);
    if (element !== null) {
        element.addEventListener("click", updateGasEstimate);
    }
}

let gasEstimate = 0;
/**
 * Updates the gas estimate and displays it on the page
 * @param {event} event click event
 */
function updateGasEstimate(event) {
    let newGasEstimate = parseInt(event.target.value);
    console.log(event.target);
    if (event.target.checked) {
        gasEstimate += newGasEstimate;
    }
    else {
        gasEstimate -= newGasEstimate;
    }
    calculateTransaction();
}

/**
 * Calculates the new transaction cost and displays it to the page
 */
function calculateTransaction() {
    let gasPrice = parseFloat(document.querySelector("input[name='manualGasPrice']").value);
    let transactionPrice = gasPrice * gasEstimate / 10000000000;
    console.log(gasPrice);
    console.log(gasEstimate);
    console.log(transactionPrice);
    let costToWithdraw = document.querySelector(".transactionCost");
    costToWithdraw.innerHTML = transactionPrice;
}

