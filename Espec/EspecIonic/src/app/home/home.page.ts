import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { HttpClient } from '@angular/common/http';
import { interval, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

Chart.register(...registerables);

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  @ViewChild('chartCanvas') chartCanvas: ElementRef | null = null;

  // From SpectrometerPage
  concentration = [0.1, 0.2, 0.3, 0.4, 0.5];
  absorbance = [0.15, 0.28, 0.38, 0.45, 0.59];
  chart: Chart | null = null;
  trendlineEquation: string = '';
  private lastCalculate: string = '';
  private m: number = 0;
  private b: number = 0;
  public isTrendlineCreated: boolean = false;
  public predictedConcentration: number = 0;
  rSquared: number = 0;
  showStats: boolean = false;
  showCard: boolean = true;
  objectKeys = Object.keys;

  rows: Array<{ calculate: string, concentration: string }> = [
    { calculate: '', concentration: '' }
  ];
  dataDictionary: { [concentration: string]: string } = {};

  // From Tab2Page
  dataFromArduino: any = { lux: 'Not tested yet', blk: 'Not tested yet', cal: 'Not tested yet', tst: 'Not tested yet' };
  esp32_ip: string = "";
  isIpSet: boolean = false;
  isFetchingStarted: boolean = false;
  someTestBoolean: boolean = true;

  constructor(private http: HttpClient) {
  }

  startFetchingData() {
    let lastCalValue: number | null = null;

    if (this.isFetchingStarted) {
      return;  // 如果已經開始，則不要再次啟動
    }
    this.isFetchingStarted = true;  // 設置這個變量以追蹤數據獲取的啟動

    interval(5000)
      .pipe(
        switchMap(() => {
          console.log('Fetching data from Arduino');
          return this.http.get(`http://${this.esp32_ip}:8080`);  // 使用 esp32_ip
        }),
        catchError(err => {
          console.error('Failed to fetch data:', err);
          return of(null); // return a new Observable
        })
      )
      .subscribe(
        data => {
          console.log('Successfully fetched data:', data);
          const receivedData = data as any;

          this.dataFromArduino.lux = receivedData['lux'] || this.dataFromArduino.lux;
          this.dataFromArduino.blk = receivedData['blk'] || this.dataFromArduino.blk;
          if (this.dataFromArduino.cal !== receivedData['cal'] && receivedData['cal']!=0 ) {
            console.log('change');  // Print 'change' if the value has changed
            this.dataFromArduino.cal = receivedData['cal'];  // Update the last value
            if (this.someTestBoolean) {
              this.addRow(this.dataFromArduino.cal);  // Add a new row with the new 'calculate' value
            }
          }
          this.dataFromArduino.tst = receivedData['tst'] || this.dataFromArduino.tst;
          const newCalValue = receivedData['cal'];
          if (this.isTrendlineCreated && newCalValue !== lastCalValue) {
            this.predictedConcentration = (newCalValue - this.b) / this.m;
            console.log("Predicted Concentration:", this.predictedConcentration);
          }
          lastCalValue = newCalValue;
        },
        error => {
          console.error('An unexpected error occurred:', error);
        }
      );
  }

  restartFetching() {
    this.isFetchingStarted = false;  // 重置標誌
    this.startFetchingData();  // 重新啟動數據獲取
    console.log("Restart");
  }

  setESP32Ip(ip: string) {
    this.esp32_ip = ip;
    this.isIpSet = true;
    this.startFetchingData();
    console.log(this.esp32_ip);
  }

  ngOnInit() {
    // From SpectrometerPage ngOnInit
    this.initializeArraysFromDictionary();
  }

  // Methods from SpectrometerPage
  initializeArraysFromDictionary() {
    this.concentration = [];
    this.absorbance = [];
    for (let [key, value] of Object.entries(this.dataDictionary)) {
      this.concentration.push(Number(key));
      this.absorbance.push(Number(value));
    }
  }


  plotGraph() {
    console.log('Concentration:', this.concentration);
    console.log('Absorbance:', this.absorbance);
    this.showStats = true;
    this.isTrendlineCreated = true;
    if (this.chartCanvas) {
      const n = this.concentration.length;
      const sumX = this.concentration.reduce((a, b) => a + b, 0);
      const sumY = this.absorbance.reduce((a, b) => a + b, 0);
      const sumXY = this.concentration.reduce((sum, x, i) => sum + x * this.absorbance[i], 0);
      const sumX2 = this.concentration.reduce((a, b) => a + b * b, 0);

      const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX ** 2);
      const b = (sumY - m * sumX) / n;

      const predictions = this.concentration.map(x => m * x + b);
      const yMean = sumY / n;
      const ssTot = this.absorbance.reduce((sum, y) => sum + (y - yMean) ** 2, 0);
      const ssRes = this.absorbance.reduce((sum, y, i) => sum + (y - predictions[i]) ** 2, 0);

      this.rSquared = 1 - ssRes / ssTot;
      this.m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX ** 2);
      this.b = (sumY - this.m * sumX) / n;
      this.trendlineEquation = `y = ${m.toFixed(3)}x + ${b.toFixed(3)}`;
      console.log("A");
      if (!this.chart) {
        console.log("B");
        this.chart = new Chart(this.chartCanvas.nativeElement, {
          type: 'scatter',
          data: {
            datasets: [
              {
                label: 'Concentration vs Absorbance',
                data: this.concentration.map((c, i) => ({ x: c, y: this.absorbance[i] })),
                backgroundColor: 'rgba(0, 123, 255, 0.5)'
              },
              {
                type: 'line',
                label: 'Trendline',
                data: this.concentration.map((c, i) => ({ x: c, y: predictions[i] })),
                borderColor: 'rgba(255, 0, 0, 0.5)',
                fill: false
              }
            ]
          },
          options: {
            scales: {
              x: { title: { display: true, text: 'Concentration' } },
              y: { title: { display: true, text: 'Absorbance' } }
            }
          }
        });
        console.log("C");
      } else {
        // 更新現有圖表的代碼
        const scatterDataset = this.chart.data.datasets[0] as any;
        scatterDataset.data = this.concentration.map((c, i) => ({ x: c, y: this.absorbance[i] }));

        const trendlineDataset = this.chart.data.datasets[1] as any;
        trendlineDataset.data = this.concentration.map((c, i) => ({ x: c, y: predictions[i] }));

        const newTrendlineData = this.concentration.map((c, i) => ({ x: c, y: predictions[i] }));
        trendlineDataset.data = newTrendlineData;

        this.chart.update();
      }
      const trendlineDataset = this.chart.data.datasets[1] as any;
      trendlineDataset.borderDash = [5, 5];
      this.chart.update();
      console.log("D");
    }
  }

  addRow(newCalculate?: string) {
    this.rows.push({ calculate: newCalculate || '', concentration: '' });
  }


  removeRow(index: number) {
    const concentrationValue = this.rows[index].concentration;
    this.rows.splice(index, 1);

    if (this.dataDictionary[concentrationValue]) {
      delete this.dataDictionary[concentrationValue];
    }

    console.log('Updated data dictionary:', this.dataDictionary);
  }

  saveData(index: number) {
    this.showCard = true;
    this.dataDictionary[this.rows[index].concentration] = this.rows[index].calculate;
    console.log('Current data dictionary:', this.dataDictionary);
    this.initializeArraysFromDictionary();  // 添加這一行
    console.log('initializeArraysFromDictionary');

    // 添加以下这一行来刷新字典数据
    this.dataDictionary = { ...this.dataDictionary };
  }

  // Methods from Tab2Page
  REDLED(): void {
    this.http.get(`http://${this.esp32_ip}:8080/red`).subscribe(
      (res: any) => {
        console.log("red LED", res);
      },
      (err: any) => {
        console.log("Error turning ON RED", err);
      }
    );
  }

  GREENLED(): void {
    this.http.get(`http://${this.esp32_ip}:8080/green`).subscribe(  // 將 httpClient 改為 http
      (res: any) => {  // Added type here
        console.log("green LED", res);
      },
      (err: any) => {  // Added type here
        console.log("Error turning OFF LED", err);
      }
    );
  }

  BLUELED(): void {
    this.http.get(`http://${this.esp32_ip}:8080/blue`).subscribe(  // 將 httpClient 改為 http
      (res: any) => {  // Added type here
        console.log("blue LED", res);
      },
      (err: any) => {  // Added type here
        console.log("Error turning OFF LED", err);
      }
    );
  }

  ESPBLK(): void {
    this.http.get(`http://${this.esp32_ip}:8080/blk`).subscribe(  // 將 httpClient 改為 http
      (res: any) => {  // Added type here
        console.log("Blank", res);
      },
      (err: any) => {  // Added type here
        console.log("Error blanking", err);
      }
    );
  }

  ESPTST(): void {
    this.http.get(`http://${this.esp32_ip}:8080/tst`).subscribe(  // 將 httpClient 改為 http
      (res: any) => {  // Added type here
        console.log("Test", res);
      },
      (err: any) => {  // Added type here
        console.log("Error testing", err);
      }
    );
  }

  clearData() {
    this.dataDictionary = {};
    this.showCard = false;  // 更新这个变量以隐藏卡片
    console.log('Cleared data dictionary:', this.dataDictionary);
  }


  calculateFromTrendline() {
    const testAbsorbance = 1;  // 這裡用 1 作為預設的吸光度值
    const testConcentration = (testAbsorbance - this.b) / this.m;
    console.log("Test Concentration:", testConcentration);
  }

  isSaved(row: { calculate: string, concentration: string }): boolean {
    return this.dataDictionary.hasOwnProperty(row.concentration);
  }

  setBooleanTrue() {
    this.someTestBoolean = true;
    console.log("true");
  }

  setBooleanFalse() {
    this.someTestBoolean = false;
    console.log("false");
  }

}    

