var BASE_URL = "https://ulasim.denizli.bel.tr";
var BUS_LIST_URL = BASE_URL + "/SureHesap.ashx?"


function toTitleCase(text) {
    const lower_case_text= text.toLowerCase();
        const words = lower_case_text.split(" ").map(word => {
        return word.charAt(0).toUpperCase() + word.slice(1);
    });
    return words.join(" ");
}

async function fetchBusList(busStop) {
    const params = new URLSearchParams({
        id: busStop,
        t: "akilliDurakListe",
        beklenenDurak: busStop
    });
    
    try {
        const response = await fetch(BUS_LIST_URL + params.toString());
        
        if (!response.ok) {
            throw new Error("HTTP status: " + response.status);
        }

        const data = await response.arrayBuffer();
        const decoder = new TextDecoder("UTF-16");
        const parser = new XMLParser();
        const output = parser.parse(decoder.decode(data));

        if (!output || !output["OtobusListesi"] || !output["OtobusListesi"]["Otobus"]) {
            throw new Error("Invalid XML structure!");
        }

        return output["OtobusListesi"]["Otobus"];
    }
    catch (error) {
        console.error("Failed to fetch and parse XML: ", error);
        document.getElementById("error").innerText = "Failed to fetch and parse XML: " + error;
    }
}

async function fetchBusStopList() {
    const optionValues = [];

    try {
        const response = await fetch(BASE_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const html = await response.text();
        const parser = new DOMParser();
        const dom = parser.parseFromString(html, 'text/html');
        const options = dom.querySelectorAll("#ddlDurakisimleriModal option");

        options.forEach(option => {
            optionValues.push({"id": option.value, "name": toTitleCase(option.text)});
        });

        if (optionValues.length > 0) {
            optionValues.shift();
        }

        return optionValues;
    }
    catch (error) {
        console.error("Failed to fetch and parse HTML: ", error);
        document.getElementById("error").innerText = "Failed to fetch and parse HTML: " + error;
    }
}

async function createTable(busStop, busNo) {
    const busList = await fetchBusList(busStop);    

    const headerCells = ["Hat No", "Plaka", "Hız", "Süre"];
    const tableElement = document.createElement("table");
    // tableElement.setAttribute("id", "data");
    const headerRow = tableElement.insertRow();
    headerCells.forEach(function(headerText) {
        let headerCell = document.createElement("th");
        headerCell.textContent = headerText;
        headerRow.appendChild(headerCell);
    });

    for (let i = 0; i < busList.length; i++) {
        let bus = busList[i];

        if (true) {
            let row = tableElement.insertRow();
            row.insertCell().textContent = bus["hatno"];
            row.insertCell().textContent = bus["plaka"];
            row.insertCell().textContent = bus["hiz"] + " KM/s";
            row.insertCell().textContent = bus["sure"];

            let hour = parseInt(bus["sure"].split(":")[0]);
            let minute = parseInt(bus["sure"].split(":")[1]);

            if (hour < 1 && minute > 20) {
                row.style.backgroundColor = "green";
            }
            else if (hour < 1 && minute > 5 && minute < 15) {
                row.style.backgroundColor = "orange";
            }
            else if (hour < 1 && minute <= 5) {
                row.style.backgroundColor = "red";
            }
            else if (bus["plaka"] == "EnYakinKalkis") {
                row.style.opacity = "25%";
                row.style.backgroundColor = "gray";
            }
            else {
                row.style.backgroundColor = "gray";
            }
        }
    }
    document.getElementById("table-container").appendChild(tableElement);
}

async function updateTable(busStop, busNo) {
    document.getElementById("table-container").innerHTML = "";
    await createTable(busStop, busNo);
}
