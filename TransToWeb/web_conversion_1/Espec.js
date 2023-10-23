let previousCal = null;
let ipAddress = '192.168.66.23';
let someTestBoolean = true;
let globalA = 0;
let globalB = 0;
let predictedConcentration = 0;



function confirmIP() {
  const input = document.getElementById('ipAddress').value;  // 從輸入框獲取 IP 地址
  if (input) {  // 如果輸入不是空的
    ipAddress = input;  // 更新 IP 地址
    console.log(`IP 地址已更新為 ${ipAddress}`);
    console.log("開始進行資料獲取...");
    repeatedlyFetchData();
  }
}

async function repeatedlyFetchData() {
  while (true) {  // 一直執行
    await fetchData();  // 等待 fetchData 執行完畢
    await new Promise(resolve => setTimeout(resolve, 3000));  // 等待 5 秒
  }
}

async function fetchData() {
  console.log("准備開始進行HTTPS請求...");

  try {
    const response = await fetch(`https://${ipAddress}:8080/`);
    console.log("收到回應，開始檢查...");

    if (!response.ok) {
      console.log("回應有問題，結束。");
      return;
    }

    console.log("回應正常，開始解析JSON...");
    const data = await response.json();
    console.log(`解析完成，數據為: ${JSON.stringify(data)}`);

    if (previousCal !== data.cal) {
      previousCal = data.cal;  // 更新先前的Cal值
      // 新增表格行並在第一個輸入框中填入Cal值

      if (someTestBoolean) {
        addRowWithCal(data.cal);
        // Add a new row with the new 'calculate' value
        console.log("addrow");
      }else{
        predictConcentration(data.cal);9
        console.log("predict");
      }
    }

    // 更新HTML
    document.getElementById('lux').textContent = `Lux: ${data.lux}`;
    document.getElementById('blk').textContent = `Blk: ${data.blk}`;
    document.getElementById('cal').textContent = `Cal: ${data.cal}`;
    document.getElementById('tst').textContent = `Tst: ${data.tst}`;

  } catch (error) {
    console.log(`發生錯誤: ${error}`);
  }
}

async function sendCommand(command) {
  console.log(`准備發送 /${command} 指令...`);

  try {
    const response = await fetch(`https://${ipAddress}:8080/${command}`);
    console.log("收到回應，開始檢查...");

    if (!response.ok) {
      console.log("回應有問題，結束。");
      return;
    }

    console.log("回應正常。");
    // 這裡你可以加入更多的邏輯，例如解析回應內容

  } catch (error) {
    console.log(`發生錯誤: ${error}`);
  }
}

// 預先設定好的字典
let dataDict = {};

// 添加一行
function addRow() {
  const table = document.getElementById("tableBody");
  const row = table.insertRow(-1);
  const cell1 = row.insertCell(0);
  const cell2 = row.insertCell(1);
  const cell3 = row.insertCell(2);

  // 增加輸入框
  cell1.innerHTML = '<input type="text" class="input1"><span class="text1"></span>';
  cell2.innerHTML = '<input type="text" class="input2"><span class="text2"></span>';

  // 增加保存和刪除按鈕
  cell3.innerHTML = '<button class="btn btn-success custom-padding-btn" onclick="saveData(this)" style="padding-top: 1px; padding-bottom: 1px;">Save</button> <button class="btn btn-danger custom-padding-btn" onclick="deleteRow(this)" style="padding-top: 1px; padding-bottom: 1px;">Delete</button>';
}

// 保存數據
function saveData(buttonElement) {
  const row = buttonElement.parentElement.parentElement;
  const input1Element = row.getElementsByClassName("input1")[0];
  const input2Element = row.getElementsByClassName("input2")[0];
  const text1Element = row.getElementsByClassName("text1")[0];
  const text2Element = row.getElementsByClassName("text2")[0];

  const input1Value = input1Element.value;
  const input2Value = input2Element.value;


  if (input1Value && input2Value) {  // 檢查兩個輸入欄是否都有填入數據
    // 存入字典
    dataDict[input1Value] = input2Value;
    console.log('目前的字典:', dataDict);

    // 然後設置字體為粗體
    input1Element.classList.add('boldText');
    input2Element.classList.add('boldText');
    // text1Element.style.fontWeight = 'bold';
    // text2Element.style.fontWeight = 'bold';
    console.log("bold");
  }
}

// 刪除行
function deleteRow(buttonElement) {
  const row = buttonElement.parentElement.parentElement;
  const input1 = row.getElementsByClassName("input1")[0].value;

  // 從字典中刪除（如果存在）
  if (dataDict.hasOwnProperty(input1)) {
    delete dataDict[input1];
  }
  console.log('目前的字典:', dataDict);

  // 從表格中刪除
  row.remove();
}

function addRowWithCal(calValue) {
  const table = document.getElementById("tableBody");
  const row = table.insertRow(-1);
  const cell1 = row.insertCell(0);
  const cell2 = row.insertCell(1);
  const cell3 = row.insertCell(2);

  cell1.innerHTML = `<input type="text" class="input1" value="${calValue}">`; // 將Cal值填入第一個輸入框
  cell2.innerHTML = '<input type="text" class="input2">';
  cell3.innerHTML = '<button class="btn btn-success custom-padding-btn" onclick="saveData(this)" style="padding-top: 1px; padding-bottom: 1px;">Save</button> <button class="btn btn-danger custom-padding-btn" onclick="deleteRow(this)" style="padding-top: 1px; padding-bottom: 1px;">Delete</button>';
}

// function calculateTrendLine() {
//   // 確保字典不是空的
//   if (Object.keys(dataDict).length === 0) {
//     console.log("字典是空的，無法計算TrendLine");
//     return;
//   }

//   let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
//   let n = 0;

//   // 遍歷字典並計算所需的總和
//   for (const x in dataDict) {
//     const y = dataDict[x];
//     sumX += parseFloat(x);
//     sumY += parseFloat(y);
//     sumXY += parseFloat(x) * parseFloat(y);
//     sumX2 += parseFloat(x) * parseFloat(x);
//     n++;
//   }

//   // 計算斜率（m）和截距（b）： y = mx + b
//   const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX ** 2);
//   const b = (sumY - m * sumX) / n;

//   // 計算R方值
//   let sumY2 = 0, sumResidual2 = 0;
//   for (const x in dataDict) {
//     const y = parseFloat(dataDict[x]);
//     const predictedY = m * parseFloat(x) + b;
//     sumY2 += (y - sumY / n) ** 2;
//     sumResidual2 += (y - predictedY) ** 2;
//   }
//   const r2 = 1 - sumResidual2 / sumY2;

//   // 輸出結果到控制台
//   console.log(`方程式：y = ${m.toFixed(2)}x + ${b.toFixed(2)}`);
//   console.log(`R方值：${r2.toFixed(2)}`);
//   drawChart(dataDict, m, b, r2);
// }



// function drawChart(dataDict, m, b, r2) {
//   const ctx = document.getElementById('myChart').getContext('2d');
//   const dataPoints = [];
//   const trendLinePoints = [];
//   let min_x = Infinity;
//   let max_x = -Infinity;

//   // 計算數據點並找出最小和最大的x值
//   for (const x in dataDict) {
//     const y = parseFloat(dataDict[x]);
//     const x_float = parseFloat(x);
//     dataPoints.push({ x: x_float, y: y });

//     if (x_float < min_x) min_x = x_float;
//     if (x_float > max_x) max_x = x_float;
//   }

//   // 使用最小和最大的x值來計算趨勢線的起點和終點
//   trendLinePoints.push({ x: min_x, y: m * min_x + b });
//   trendLinePoints.push({ x: max_x, y: m * max_x + b });

//   const myChart = new Chart(ctx, {
//     type: 'scatter',
//     data: {
//       datasets: [
//         {
//           label: 'Data Points',
//           data: dataPoints,
//           backgroundColor: 'rgba(0, 123, 255, 0.5)'
//         },
//         {
//           type: 'line',
//           label: 'Trend Line',
//           data: trendLinePoints,
//           fill: false,
//           borderColor: 'rgba(255, 0, 0, 0.5)',
//           borderDash: [5, 5]  // 虛線設定，[線長, 間隔]
//         }
//       ]
//     },
//     options: {
//       plugins: {
//         title: {
//           display: true,
//           text: `Equation: y = ${m.toFixed(2)}x + ${b.toFixed(2)}, R² = ${r2.toFixed(2)}`
//         }
//         // ,
//         // tooltip: {
//         //   callbacks: {
//         //     label: function (context) {
//         //       return `x: ${context.raw.x}, y: ${context.raw.y}`;
//         //     }
//         //   }
//         // }
//       },
//       scales: {
//         x: {
//           type: 'linear',
//           position: 'bottom'
//         }
//       },
//       elements: {
//         line: {
//           tension: 0  // 線條為直線
//         }
//       }
//     }
//   });
// }


// 初始化：添加一個初始行
addRow();


// function saveData(buttonElement) {
//     drawChart();
// }

function linearRegression(x, y) {
  const n = x.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumXX += x[i] * x[i];
  }

  const a = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const b = (sumY - a * sumX) / n;

  let sumResiduals = 0, sumTotal = 0, yMean = sumY / n;

  for (let i = 0; i < n; i++) {
    const predicted = a * x[i] + b;
    sumResiduals += Math.pow(y[i] - predicted, 2);
    sumTotal += Math.pow(y[i] - yMean, 2);
  }

  const rsquared = 1 - sumResiduals / sumTotal;

  return { a, b, rsquared };
}

function drawChart() {
  const ctx = document.getElementById('myChart').getContext('2d');

  const labels = Object.keys(dataDict).map(Number);
  const data = Object.values(dataDict).map(Number);
  const { a, b, rsquared } = linearRegression(labels, data);

  const equation = `y = ${a.toFixed(4)}x + ${b.toFixed(4)}`;
  globalA = a;
  globalB = b;

  document.getElementById('equation').innerText = `方程式: ${equation}`;
  document.getElementById('rsquared').innerText = `R²: ${rsquared.toFixed(4)}`;
  
  const chart = new Chart(ctx, {
    type: 'scatter',
    data: {
      labels: labels,
      datasets: [{
        label: '原始資料',
        data: labels.map((label, i) => ({ x: label, y: data[i] })),
        backgroundColor: 'rgba(0, 123, 255, 1)'
      },
      {
        type: 'line',
        label: '趨勢線',
        data: labels.map((label) => ({ x: label, y: a * label + b })),
        borderColor: 'rgba(255, 0, 0, 1)',
        borderWidth: 1,
        fill: false,
        borderDash: [5, 5],
        pointRadius: 0
      }]
    },
    options: {
      scales: {
        x: { type: 'linear', position: 'bottom' }
      }
    }
  });
}


function setBooleanTrue() {
  someTestBoolean = true;
  console.log("true");
}

function setBooleanFalse() {
  someTestBoolean = false;
  console.log("false");
}


function predictConcentration(absorbance) {

  const predictedConcentration = (absorbance - globalB) / globalA;

  document.getElementById('predictionResult').innerText = `預測濃度：${predictedConcentration.toFixed(4)}`;
}