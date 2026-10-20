
const CAPACITY = 20;

let occupied = 0;
let entered = 0;
let left = 0;
let simMinutes = 8 * 60;
let running = false;
let autoTimer = null;
let events = [];

let hourly = Array.from({ length: 8 }, () => ({
    entered: 0,
    left: 0
}));

const $ = id => document.getElementById(id);

function formatTime(minutes) {
    const hours = Math.floor(minutes / 60) % 24;
    const mins = minutes % 60;
    const suffix = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 || 12;

    return `${String(hour12).padStart(2, "0")}:${String(mins).padStart(2, "0")} ${suffix}`;
}

function currentHourIndex() {
    return Math.min(7, Math.max(0, Math.floor(simMinutes / 60) - 8));
}

function setMessage(title, detail, type = "info") {
    const box = $("message");
    const symbol = type === "error" ? "!" :
                   type === "success" ? "✓" : "i";

    box.className = "notice" +
        (type === "error" ? " error" :
        type === "success" ? " success" : "");

    box.innerHTML = `
        <span class="notice-icon">${symbol}</span>
        <span>
            <b>${title}</b>
            <small>${detail}</small>
        </span>
    `;
}

function renderSpaces() {
    const grid = $("parkingGrid");
    grid.innerHTML = "";

    for (let i = 1; i <= CAPACITY; i++) {
        const space = document.createElement("div");
        const isOccupied = i <= occupied;

        space.className = "space" +
            (isOccupied ? " occupied" : "");

        space.innerHTML = `
            <span class="space-number">
                ${String(i).padStart(2, "0")}
            </span>
            <span class="space-mark">
                ${isOccupied ? "🚘" : "P"}
            </span>
        `;

        space.title = `Space ${i}: ${
            isOccupied ? "Occupied" : "Available"
        }`;

        grid.appendChild(space);
    }

    $("totalSpaces").textContent = CAPACITY;
    $("occupiedCount").textContent = occupied;
    $("availableCount").textContent = CAPACITY - occupied;
    $("enteredCount").textContent = entered;
    $("leftCount").textContent = left;

    $("occupancyPercent").textContent =
        `${Math.round(occupied / CAPACITY * 100)}% occupancy`;

    $("capacityText").textContent =
        `${occupied} / ${CAPACITY} spaces`;

    $("progressBar").style.width =
        `${occupied / CAPACITY * 100}%`;

    $("simTime").textContent = formatTime(simMinutes);
}

function addEvent(action, count) {
    events.unshift({
        action: action,
        count: count,
        occupied: occupied,
        time: formatTime(simMinutes)
    });

    events = events.slice(0, 8);
    renderActivity();
}

function renderActivity() {
    const tbody = $("activityRows");

    if (events.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-row">
                <td colspan="4">
                    No activity yet. Start the simulation.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = events.map(event => `
        <tr>
            <td>
                <span class="table-action">
                    <span class="table-icon ${
                        event.action === "Entered" ? "enter" : "leave"
                    }">
                        ${event.action === "Entered" ? "↘" : "↗"}
                    </span>
                    Cars ${event.action}
                </span>
            </td>
            <td>${event.count}</td>
            <td>${event.occupied} / ${CAPACITY}</td>
            <td>${event.time}</td>
        </tr>
    `).join("");
}

function renderChart() {
    const chart = $("chart");
    const labels = $("chartLabels");

    chart.innerHTML = "";
    labels.innerHTML = "";

    const maxValue = Math.max(
        5,
        ...hourly.map(item =>
            Math.max(item.entered, item.left)
        )
    );

    hourly.forEach((item, index) => {
        const group = document.createElement("div");
        group.className = "chart-group";

        group.innerHTML = `
            <div class="bar entered"
                 title="Entered: ${item.entered}"
                 style="height:${item.entered / maxValue * 100}%">
            </div>
            <div class="bar left"
                 title="Left: ${item.left}"
                 style="height:${item.left / maxValue * 100}%">
            </div>
        `;

        chart.appendChild(group);

        const label = document.createElement("span");

        if (index < 4) {
            label.textContent = `${8 + index} AM`;
        } else if (index === 4) {
            label.textContent = "12 PM";
        } else {
            label.textContent = `${index - 4} PM`;
        }

        labels.appendChild(label);
    });

    if (entered === 0 && left === 0) {
        const empty = document.createElement("div");
        empty.className = "chart-empty";
        empty.textContent =
            "Use the controls to create simulation data.";

        chart.appendChild(empty);
    }
}

function enterCars(count) {
    const available = CAPACITY - occupied;
    const actual = Math.min(count, available);

    if (actual <= 0) {
        setMessage(
            "Parking lot is full",
            "No spaces are available. Simulate cars leaving.",
            "error"
        );
        return;
    }

    occupied += actual;
    entered += actual;

    hourly[currentHourIndex()].entered += actual;

    addEvent("Entered", actual);

    simMinutes += 5;

    setMessage(
        "Car entry simulated",
        `${actual} car(s) entered. ${CAPACITY - occupied} spaces remain.`,
        "success"
    );

    renderAll();
}

function leaveCars(count) {
    const actual = Math.min(count, occupied);

    if (actual <= 0) {
        setMessage(
            "Parking lot is empty",
            "There are no parked cars to leave.",
            "error"
        );
        return;
    }

    occupied -= actual;
    left += actual;

    hourly[currentHourIndex()].left += actual;

    addEvent("Left", actual);

    simMinutes += 5;

    setMessage(
        "Departure simulated",
        `${actual} car(s) left. ${occupied} cars remain parked.`,
        "success"
    );

    renderAll();
}

function renderAll() {
    renderSpaces();
    renderChart();
    renderActivity();
}

function stopAuto() {
    running = false;

    if (autoTimer) {
        clearInterval(autoTimer);
    }

    autoTimer = null;

    $("runBtn").innerHTML =
        "▶ Run Auto Simulation";
}

function startAuto() {
    if (running) {
        stopAuto();

        setMessage(
            "Auto simulation paused",
            "You can continue manually or run it again."
        );

        return;
    }

    running = true;

    $("runBtn").innerHTML =
        "Ⅱ Pause Auto Simulation";

    setMessage(
        "Auto simulation running",
        "Cars will enter and leave automatically."
    );

    autoTimer = setInterval(() => {
        const count = 1 + Math.floor(Math.random() * 2);

        if (occupied === 0) {
            enterCars(count);
        } else if (occupied === CAPACITY) {
            leaveCars(count);
        } else if (Math.random() < 0.62) {
            enterCars(count);
        } else {
            leaveCars(count);
        }
    }, 1300);
}

function resetSimulation() {
    stopAuto();

    occupied = 0;
    entered = 0;
    left = 0;
    simMinutes = 8 * 60;
    events = [];

    hourly = Array.from({ length: 8 }, () => ({
        entered: 0,
        left: 0
    }));

    setMessage(
        "Simulation reset",
        "All spaces are available. Start a new simulation."
    );

    renderAll();
}

/* BUTTON EVENTS */

$("enterBtn").addEventListener("click", () => {
    enterCars(Number($("carAmount").value));
});

$("leaveBtn").addEventListener("click", () => {
    leaveCars(Number($("carAmount").value));
});

$("runBtn").addEventListener("click", startAuto);

$("resetBtn").addEventListener("click", resetSimulation);

$("clearLogBtn").addEventListener("click", () => {
    events = [];
    renderActivity();

    setMessage(
        "Activity log cleared",
        "New actions will appear here."
    );
});

/* START THE APPLICATION */

renderAll();
