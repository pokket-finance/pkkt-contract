
window.addEventListener("load", () => {
    fillFormData("input[name='ethCallStrike']");
    fillFormData("input[name='ethPutStrike']");
    fillFormData("input[name='ethCallPremium']");
    fillFormData("input[name='ethPutPremium']");

    fillFormData("input[name='wbtcCallStrike']");
    fillFormData("input[name='wbtcPutStrike']");
    fillFormData("input[name='wbtcCallPremium']");
    fillFormData("input[name='wbtcPutPremium']");

    fillFormData("input[name='predictedEthCallStrike']");
    fillFormData("input[name='predictedEthPutStrike']");
    fillFormData("input[name='predictedEthCallPremium']");
    fillFormData("input[name='predictedEthPutPremium']");

    fillFormData("input[name='predictedWbtcCallStrike']");
    fillFormData("input[name='predictedWbtcPutStrike']");
    fillFormData("input[name='predictedWbtcCallPremium']");
    fillFormData("input[name='predictedWbtcPutPremium']");
});

function fillFormData(selector) {
    let element = document.querySelector(selector);
    if (element !== null) {
        element.value = window.localStorage.getItem(element.name);
    }
}

window.addEventListener("beforeunload", () => {
    saveFormData("input[name='ethCallStrike']");
    saveFormData("input[name='ethPutStrike']");
    saveFormData("input[name='ethCallPremium']");
    saveFormData("input[name='ethPutPremium']");

    saveFormData("input[name='wbtcCallStrike']");
    saveFormData("input[name='wbtcPutStrike']");
    saveFormData("input[name='wbtcCallPremium']");
    saveFormData("input[name='wbtcPutPremium']");

    saveFormData("input[name='predictedEthCallStrike']");
    saveFormData("input[name='predictedEthPutStrike']");
    saveFormData("input[name='predictedEthCallPremium']");
    saveFormData("input[name='predictedEthPutPremium']");

    saveFormData("input[name='predictedWbtcCallStrike']");
    saveFormData("input[name='predictedWbtcPutStrike']");
    saveFormData("input[name='predictedWbtcCallPremium']");
    saveFormData("input[name='predictedWbtcPutPremium']");
});

function saveFormData(selector) {
    let element = document.querySelector(selector);
    if (element !== null) {
        window.localStorage.setItem(element.name, element.value);
    }
}

