// Modifies nav bar

window.onload = () => {
    let path = window.location.pathname;    
    let navbar = document.getElementById("navbar");
    
    
    if (path === "/show/epoch") {
        let showEpochNav = document.getElementsByClassName("showEpochNav")[0];
        showEpochNav.classList.add("active");
    }
    else if (path === "/initiateEpoch") {
        let setEpochNav = document.getElementsByClassName("setEpochNav")[0];
        setEpochNav.classList.add("active");
    }
    else if (path === "/") {
        let decisionNav = document.getElementsByClassName("decisionNav")[0];
        decisionNav.classList.add("active");
    }
    else if (path === "/moneyMovement") {
        let moneyMovementNav = document.getElementsByClassName("moneyMovementNav")[0];
        moneyMovementNav.classList.add("active");
    }
    else {
    
    }
};
