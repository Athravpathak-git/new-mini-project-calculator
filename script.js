let display = document.getElementById("display");
let historyList = document.getElementById("historyList");
window.onload = function () {
    let history = JSON.parse(localStorage.getItem("calcHistory")) || [];
    history.forEach(addHistoryToUI);
};

function append(value) {
    if (display.innerText === "0") {
        display.innerText = value;
    } else {
        display.innerText += value;
    }
}

function clearDisplay() {
    display.innerText = "0";
}

function deleteLast() {
    display.innerText = display.innerText.slice(0, -1) || "0";
}

function calculate() {
    try {
        let expression = display.innerText;
        let result = eval(expression);
        display.innerText = result;

        saveHistory(expression + " = " + result);
    } catch {
        display.innerText = "Error";
    }
}
function saveHistory(entry) {
    let history = JSON.parse(localStorage.getItem("calcHistory")) || [];
    history.unshift(entry);
    localStorage.setItem("calcHistory", JSON.stringify(history));
    addHistoryToUI(entry);
}

function addHistoryToUI(entry) {
    let li = document.createElement("li");
    li.textContent = entry;
    historyList.prepend(li);
}

function toggleTheme() {
    document.body.classList.toggle("light");
}ss