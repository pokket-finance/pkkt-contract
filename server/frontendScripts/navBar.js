// Modifies nav bar

window.addEventListener("load", () => {
    let path = window.location.pathname;    
    let navbar = document.getElementById("navbar");
    
    
    if (path === "/show/epoch") {
        let showEpochNav = document.getElementsByClassName("showEpochNav")[0];
        showEpochNav.classList.add("active");
    }
    else if (path === "/set/epoch" || path === "/set/epoch:true" || path === "/set/epoch:false") {
        let setEpochNav = document.getElementsByClassName("setEpochNav")[0];
        setEpochNav.classList.add("active");
    }
    else if (path === "/set/decision" || path === "/set/decision:true" || path === "/set/decision:false") {
        let decisionNav = document.getElementsByClassName("decisionNav")[0];
        decisionNav.classList.add("active");
    }
    else if (path === "/moneyMovement" || path === "/moneyMovement:true" || path === "/moneyMovement:false") {
        let moneyMovementNav = document.getElementsByClassName("moneyMovementNav")[0];
        moneyMovementNav.classList.add("active");
    }
    else if (path === "/initiateSettlement") {
        let intiateSettlementNav = document.getElementsByClassName("initiateSettlementNav")[0];
        intiateSettlementNav.classList.add("active");
    }
    else {
    
    }
});
