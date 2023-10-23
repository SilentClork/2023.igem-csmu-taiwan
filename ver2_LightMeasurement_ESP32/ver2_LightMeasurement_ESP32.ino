/*
 * Open-source Arduino Light Measurement System
 * 
 * Hardware Assembly:
 * 1. Connect an LCD with I2C interface to the SDA and SCL pins of your Arduino board.
 *    - VCC to Arduino 5V
 *    - GND to Arduino GND
 *    - SDA to appropriate SDA pin (depends on the board model)
 *    - SCL to appropriate SCL pin (depends on the board model)
 * 2. Connect the BH1750 light sensor to the same SDA and SCL pins for I2C communication.
 * 3. Connect LEDs or other indicators to digital pins defined (PIN_RED, PIN_GREEN, and PIN_BLUE).
 * 4. Connect buttons or switches to BUTTON_PIN1 and BUTTON_PIN2.
 * 5. Ensure the board is connected to the Wi-Fi network using provided SSID and password.
 * 
 * Note:
 * - Make sure to use pull-up resistors for the I2C connection if your module doesn't have them.
 * - This code is open-source and can be modified and shared freely, but please attribute the original author.
 * - Ensure your power connections are correct to avoid damaging your components.
 * 
 * Author: CSMU-Taiwan
 * 
 * --- LICENSE INFORMATION ---
 * Copyright (c) 2023 CSMU-Taiwan
 * Licensed under the MIT License. 
 * For the full license text, please see the LICENSE file in the project root.
 */
 
#include <Wire.h>
#include <BH1750.h>
#include <LiquidCrystal_I2C.h>
#include <math.h>
#include <WiFi.h>

#define PIN_RED    4
#define PIN_GREEN  2
#define PIN_BLUE   15
const int BUTTON_PIN1 = 23;
const int BUTTON_PIN2 = 19;
const long buttonInterval = 200;
const long lightInterval = 2000;

const char* ssid = "csmulib";
const char* password = "8112281123";
WiFiServer server(8080);

BH1750 lightMeter(0x23);
LiquidCrystal_I2C lcd(0x27, 16, 2);

uint16_t BlankResult = 0;
uint16_t TestResult = 0;
double CalculateResult = 0;
String lastMode = "";
double lastCalcResult = 0.0;
unsigned long previousButtonMillis = 0;
unsigned long previousLightMillis = 0;
char buffer[50];

struct DataToSend {
  int lux = 0;
  int blk = 0;
  double cal = 0;
  int tst = 0;
};
DataToSend dataToSend;

void BlankFunction();
double TestFunction();
uint16_t getAverageLux();
void readAndDisplayLightLevel();
void handleButton(int, const char*);
void handleClient(String RequestLine, WiFiClient client, String key1, int value1, String key2, int value2, String key3, double value3, String key4, int value4);
void sendJSONData(WiFiClient client, String key1, int value1, String key2, int value2, String key3, double value3, String key4, int value4);

void setup() {
    Serial.begin(115200);
    delay(1000);
    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid, password);

    while (WiFi.status() != WL_CONNECTED) {
        delay(100);
    }

    lcd.begin();
    lcd.backlight();
    lcd.clear();
    lcd.setCursor(0, 1);
    lcd.print("IP:");
    lcd.print(WiFi.localIP());
    Wire.begin();
    lightMeter.begin();

    pinMode(BUTTON_PIN1, INPUT_PULLUP);
    pinMode(BUTTON_PIN2, INPUT_PULLUP);
    pinMode(PIN_RED, OUTPUT);
    pinMode(PIN_GREEN, OUTPUT);
    pinMode(PIN_BLUE, OUTPUT);
    analogWrite(PIN_RED, 255);
    analogWrite(PIN_GREEN, 0);
    analogWrite(PIN_BLUE, 0);

    delay(10000);
    server.begin();
}

void loop() {
    unsigned long currentMillis = millis();

    if (currentMillis - previousButtonMillis >= buttonInterval) {
        previousButtonMillis = currentMillis;
        handleButton(BUTTON_PIN1, "Blank Mode On");
        handleButton(BUTTON_PIN2, "Test Mode On");
    }

    if (currentMillis - previousLightMillis >= lightInterval) {
        previousLightMillis = currentMillis;
        readAndDisplayLightLevel();
        dataToSend.lux = lightMeter.readLightLevel();
    }

    WiFiClient client = server.available();
    if (client) {
        String InitRequest = client.readStringUntil('\r');
        handleClient(InitRequest, client, "lux", dataToSend.lux, "blk", dataToSend.blk, "cal", dataToSend.cal, "tst", dataToSend.tst);
    }
}

void handleButton(int buttonPin, const char* message) {
  int buttonState = digitalRead(buttonPin);
  String currentMode;
  double currentCalcResult = 0.0;

  if (buttonState == LOW) {
    lcd.setCursor(0, 1);
    lcd.print(message);
    Serial.println(message);

    if (buttonPin == BUTTON_PIN1) {
      currentMode = "Blank Mode On";
      BlankFunction();
    } else if (buttonPin == BUTTON_PIN2) {
      currentMode = "Test Mode On";
      currentCalcResult = TestFunction();
    }

    if (currentMode != lastMode || currentCalcResult != lastCalcResult) {
      lastMode = currentMode;
      lastCalcResult = currentCalcResult;
      if (buttonPin == BUTTON_PIN1) {
        lcd.setCursor(0, 1);
        lcd.print("Blank Licht: ");
        lcd.print(BlankResult);
        lastMode = "Blank Licht: ";
      } else if (buttonPin == BUTTON_PIN2 && BlankResult != 0) {
        lcd.setCursor(0, 1);
        lcd.print("Calc: ");
        lcd.print(CalculateResult);

        int usedChars = 6 + String(CalculateResult).length();
        int remainingChars = 16 - usedChars;

        for (int i = 0; i < remainingChars; i++) {
          lcd.print(" ");
        }
        lastMode = "Calc: ";
      }
    }

    delay(2000);

  } else {
    lcd.setCursor(0, 1);
    lcd.print("                ");
    lastMode = "";
  }
}
uint16_t getAverageLux() {
  const int SAMPLES = 20;
  uint32_t totalLux = 0;
  uint16_t luxValues[SAMPLES];

  for (int i = 0; i < SAMPLES; i++) {
    luxValues[i] = lightMeter.readLightLevel();
    totalLux += luxValues[i];
    delay(50);
  }

  uint16_t avgLux = totalLux / SAMPLES;
  for (int i = 0; i < SAMPLES; i++) {
    Serial.println("lux_sample_" + String(i) + ": " + String(luxValues[i]));
  }

  return avgLux;
}


void readAndDisplayLightLevel() {
  uint16_t lux = lightMeter.readLightLevel();

  Serial.print("Licht: ");
  Serial.print(lux);
  Serial.println(" lux");

  lcd.setCursor(0, 0);
  lcd.print("Licht: ");
  lcd.print(lux);
  lcd.print(" lux   ");
}

void handleClient(String RequestLine, WiFiClient client, String key1, int value1, String key2, int value2, String key3, double value3, String key4, int value4) {
  String header;
  String request = client.readStringUntil('\r');
  String currentLine = "";

  while (client.connected()) {
    if (client.available()) {
      char c = client.read();
      Serial.write(c);
      header += c;

      if (c == '\n') {
        if (currentLine.length() == 0) {
          client.println("HTTP/1.1 200 OK");
          client.println("Content-Type: application/json");
          client.println("Access-Control-Allow-Origin: *");
          client.println("Connection: close");
          client.println();

          sendJSONData(client, key1, value1, key2, value2, key3, value3, key4, value4);

          break;
        } else {
          currentLine = "";
        }
      } else if (c != '\r') {
        currentLine += c;
      }
    }
  }
  Serial.print("RequestLine: ");
  Serial.println(RequestLine);
  if (RequestLine.indexOf("GET /blk") >= 0) {
    Serial.println("Blank");
    BlankFunction();
    client.println("HTTP/1.1 200 OK");
    client.println("Content-Type: text/plain");
    client.println("Access-Control-Allow-Origin: *");
    client.println();
    client.println("LED is OFF");
  }
  else if (RequestLine.indexOf("GET /tst") >= 0) {
    Serial.println("Test");
    TestFunction();
    client.println("HTTP/1.1 200 OK");
    client.println("Content-Type: text/plain");
    client.println("Access-Control-Allow-Origin: *");
    client.println();
    client.println("LED is OFF");
  }
  if (RequestLine.indexOf("GET /green") >= 0) {
    Serial.println("GREEN LED");
    analogWrite(PIN_RED,   0);
    analogWrite(PIN_GREEN, 255);
    analogWrite(PIN_BLUE,  0);

    client.println("HTTP/1.1 200 OK");
    client.println("Content-Type: text/plain");
    client.println("Access-Control-Allow-Origin: *");
    client.println();
    client.println("GreenLED is ON");
  }
  if (RequestLine.indexOf("GET /blue") >= 0) {
    Serial.println("BLUE LED");
    analogWrite(PIN_RED,   0);
    analogWrite(PIN_GREEN, 0);
    analogWrite(PIN_BLUE,  255);

    client.println("HTTP/1.1 200 OK");
    client.println("Content-Type: text/plain");
    client.println("Access-Control-Allow-Origin: *");
    client.println();
    client.println("BlueLED is ON");
  }
  if (RequestLine.indexOf("GET /red") >= 0) {
    Serial.println("RED LED");
    analogWrite(PIN_RED,   255);
    analogWrite(PIN_GREEN, 0);
    analogWrite(PIN_BLUE,  0);

    client.println("HTTP/1.1 200 OK");
    client.println("Content-Type: text/plain");
    client.println("Access-Control-Allow-Origin: *");
    client.println();
    client.println("RedLED is ON");
  }
  client.stop();
  Serial.println("Client disconnected.");
  Serial.println("");
}

void sendJSONData(WiFiClient client, String key1, int value1, String key2, int value2, String key3, double value3, String key4, int value4) {
  dtostrf(value3, 10, 4, buffer);
  String calcString = String(buffer);

  String jsonData = "{";
  jsonData += "\"" + key1 + "\":" + String(value1) + ",";
  jsonData += "\"" + key2 + "\":" + String(value2) + ",";
  jsonData += "\"" + key3 + "\":" + calcString + ",";
  jsonData += "\"" + key4 + "\":" + String(value4);
  jsonData += "}";

  client.println(jsonData);
  Serial.println("JSON data sent: " + jsonData);
}
void BlankFunction() {
  lcd.setCursor(0, 1);
  lcd.print("Blanking...     ");
  Serial.println("Blanking...     ");
  BlankResult = getAverageLux();
  Serial.print("Blank: ");
  Serial.print(BlankResult);
  Serial.println(" lux");
  dataToSend.blk = BlankResult;
  lcd.setCursor(0, 1);
  lcd.print("Blank Licht: ");
  lcd.print(BlankResult);
}
double TestFunction() {
  double currentResultInFunction = 0.0 ;
  Serial.println(BlankResult);
  if (BlankResult != 0) {
    lcd.setCursor(0, 1);
    lcd.print("Testing...     ");
    Serial.println("Testing...     ");
    TestResult = getAverageLux();

    double logTestResult = log10(TestResult);
    double logBlankResult = log10(BlankResult);
    CalculateResult = logBlankResult - logTestResult;
    currentResultInFunction = CalculateResult;
    dtostrf(CalculateResult, 10, 4, buffer);
    String calcString = String(buffer);

    Serial.print("Test: ");
    Serial.print(TestResult);
    Serial.println(" lux");
    Serial.print("Calculate: ");
    Serial.print(calcString);
    Serial.println(" lux");

    dataToSend.cal = CalculateResult;
    dataToSend.tst = TestResult;

    lcd.setCursor(0, 1);
    lcd.print("Calc: ");
    lcd.print(calcString);
  }
  else {
    lcd.setCursor(0, 1);
    lcd.print("Please Blank");
    Serial.println("Please Blank");
    delay(2000);
    lcd.setCursor(0, 1);
    lcd.print("                ");
  }
  return currentResultInFunction;
}
