// Import Chart.js library
import { Chart } from 'chart.js';

// Global Variables
let concentration = [0.1, 0.2, 0.3, 0.4, 0.5];
let absorbance = [0.15, 0.28, 0.38, 0.45, 0.59];
let chart = null;
let trendlineEquation = '';
let m = 0;
let b = 0;
let isTrendlineCreated = false;
let predictedConcentration = 0;
let rSquared = 0;
let showStats = false;
let showCard = true;
let rows = [{ calculate: '', concentration: '' }];
let dataDictionary = {};
let dataFromArduino = { lux: 'Not tested yet', blk: 'Not tested yet', cal: 'Not tested yet', tst: 'Not tested yet' };
let esp32_ip = "";
let isIpSet = false;
let isFetchingStarted = false;
let someTestBoolean = true;

// Function to Start Fetching Data from Arduino
function startFetchingData() {
  if (isFetchingStarted) {
    return;
  }
  isFetchingStarted = true;
  
  // Using setInterval and fetch instead of RxJS's interval and httpClient
  setInterval(async () => {
    console.log('Fetching data from Arduino');
    try {
      const response = await fetch(`http://${esp32_ip}:8080`);
      const data = await response.json();
      
      console.log('Successfully fetched data:', data);
      
      // Your logic here, example:
      if (dataFromArduino.cal !== data.cal && data.cal != 0) {
        console.log('change');
        dataFromArduino.cal = data.cal;
        
        if (someTestBoolean) {
          // Call your addRow function here
          addRow(dataFromArduino.cal);
        }
      }
      
      const newCalValue = data.cal;
      if (newCalValue !== lastCalValue) {
        predictedConcentration = (newCalValue - b) / m;
        console.log("Predicted Concentration:", predictedConcentration);
      }
      
      lastCalValue = newCalValue;
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
  }, 5000);  // Interval set to 5 seconds
}

// TODO: Implement other functions like 'restartFetching', 'setESP32Ip', etc.


// Function to set the IP
function setESP32Ip(ip) {
  esp32_ip = ip;
  isIpSet = true;
  disableConfirmButton();
  // Call startFetchingData function here if needed
  console.log("IP set to:", esp32_ip);
}

// Function to get input and confirm IP
function confirmIP() {
  var ip = document.getElementById("ipInput").value;
  setESP32Ip(ip);
}

// Initialize Arrays from Data Dictionary
function initializeArraysFromDictionary() {
    // TODO: Implement this function based on your original Angular code
}

// Function to Plot Graph
function plotGraph() {
    // TODO: Implement this function based on your original Angular code
}

// Function to Add Row
function addRow(newCalculate) {
    // TODO: Implement this function based on your original Angular code
}

// Function to Remove Row
function removeRow(index) {
    // TODO: Implement this function based on your original Angular code
}

// Function to Save Data
function saveData(index) {
    // TODO: Implement this function based on your original Angular code
}

// Function to Clear Data
function clearData() {
    // TODO: Implement this function based on your original Angular code
}

// Function to Calculate from Trendline
function calculateFromTrendline() {
    // TODO: Implement this function based on your original Angular code
}

// Function to Check if Data is Saved
function isSaved(row) {
    // TODO: Implement this function based on your original Angular code
}

// Function to Set someTestBoolean to True
function setBooleanTrue() {
    someTestBoolean = true;
    console.log("true");
}

// Function to Set someTestBoolean to False
function setBooleanFalse() {
    someTestBoolean = false;
    console.log("false");
}

// Initialize when Document is Ready
document.addEventListener("DOMContentLoaded", function() {
    // Equivalent to Angular's ngOnInit
    initializeArraysFromDictionary();
    // TODO: Add event listeners for buttons and other elements in your HTML
});
