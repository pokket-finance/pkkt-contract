
window.addEventListener("load", () => {
    let ethereumPrice = parseFloat(document.querySelector("th[name='ethContainer']").dataset.ethPrice);
    let wbtcPrice = parseFloat(document.querySelector("th[name='wbtcContainer']").dataset.wbtcPrice);
    console.log(ethereumPrice);
    console.log(wbtcPrice);

    let noExerciseEthRow = document.querySelector(".noExerciseEth");
    noExerciseEthRow.setAttribute("style", "opacity:0.3");

    let exerciseCallEthRow = document.querySelector(".exerciseCallEth");
    exerciseCallEthRow.setAttribute("style", "opacity:0.3");
    let ethCallStrikePrice = parseFloat(document.querySelector(".ethCallStrikePrice").innerHTML);

    let exercisePutEthRow = document.querySelector(".exercisePutEth");
    exercisePutEthRow.setAttribute("style", "opacity:0.3");
    let ethPutStrikePrice = parseFloat(document.querySelector(".ethPutStrikePrice").innerHTML);

    let noExerciseWbtcRow = document.querySelector(".noExerciseWbtc");
    noExerciseWbtcRow.setAttribute("style", "opacity:0.3");

    let exerciseCallWbtcRow = document.querySelector(".exerciseCallWbtc");
    exerciseCallWbtcRow.setAttribute("style", "opacity:0.3");
    let wbtcCallStrikePrice = parseFloat(document.querySelector(".wbtcCallStrikePrice").innerHTML);

    let exercisePutWbtcRow = document.querySelector(".exercisePutWbtc");
    exercisePutWbtcRow.setAttribute("style", "opacity:0.3");
    let wbtcPutStrikePrice = parseFloat(document.querySelector(".wbtcPutStrikePrice").innerHTML);

    // exercise eth call
    if (ethereumPrice > ethCallStrikePrice) {
        exerciseCallEthRow.setAttribute("style", "opacity:1");
    }
    // exercise eth put
    else if (ethereumPrice < ethPutStrikePrice) {
        exercisePutEthRow.setAttribute("style", "opacity:1");
    }
    // no exercise
    else {
        noExerciseEthRow.setAttribute("style", "opacity:1");
    }

    // exercise wbtc call
    if (wbtcPrice > wbtcCallStrikePrice) {
        exerciseCallWbtcRow.setAttribute("style", "opacity:1");
    }
    // exercise wbtc put
    else if (wbtcPrice < wbtcPutStrikePrice) {
        exercisePutWbtcRow.setAttribute("style", "opacity:1");
    }
    // No exercise
    else {
        noExerciseWbtcRow.setAttribute("style", "opacity:1");
    }
});