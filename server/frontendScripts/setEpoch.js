window.addEventListener("load", () => {
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