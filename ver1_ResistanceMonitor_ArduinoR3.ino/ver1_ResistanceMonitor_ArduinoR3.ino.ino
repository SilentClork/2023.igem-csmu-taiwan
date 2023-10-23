/**
 * Open-source Arduino Resistance Monitor
 * 
 * Hardware Assembly:
 * 1. Connect an LCD with I2C interface to the SDA and SCL pins of your Arduino board.
 *    - VCC to Arduino 5V
 *    - GND to Arduino GND
 *    - SDA to Arduino SDA (often A4)
 *    - SCL to Arduino SCL (often A5)
 * 2. Connect the resistance sensor to analog pin A0.
 * 3. Connect a LED or similar device to digital pin 3 to indicate when the Arduino is reading the resistance.
 * 
 * Note:
 * - Make sure to use pull-up resistors for the I2C connection if your module doesn't have them.
 * - This code is open-source and can be modified and shared freely, but please attribute the original author.
 * - Ensure your power connections are correct to avoid damaging your components.
 * 
 * Author: CSMU-Taiwan
 * License: MIT
 */

#include <Wire.h>                // Include the Wire library for I2C communication
#include <LiquidCrystal_I2C.h>  // Include the LiquidCrystal library for I2C LCDs

// Define constants for LCD configuration
const int LCD_ADDRESS = 0x27;   // I2C address of the LCD
const int LCD_COLUMNS = 16;     // Number of columns in the LCD
const int LCD_ROWS = 2;         // Number of rows in the LCD

// Initialize the LiquidCrystal object with the above constants
LiquidCrystal_I2C lcd(LCD_ADDRESS, LCD_COLUMNS, LCD_ROWS);

void setup() {
  Serial.begin(9600);           // Start the serial communication at 9600 baud rate
  pinMode(3, OUTPUT);           // Set pin 3 as an OUTPUT
  
  lcd.begin();                  // Initialize the LCD
  lcd.backlight();              // Turn on the backlight of the LCD
  
  displayMessage("Hello NSSH !", "");  // Display a welcome message on the LCD
  delay(2000);                  // Wait for 2 seconds
}

void loop() {
  int resistanceValue = analogRead(A0);  // Read the analog value from pin A0
  digitalWrite(3, HIGH);                // Set pin 3 to HIGH

  // Print the resistance value to the serial monitor
  Serial.print("Resistance: ");
  Serial.print(resistanceValue);
  Serial.println(" ohm");

  displayResistance(resistanceValue);  // Display the resistance value on the LCD

  delay(1000);   // Wait for 1 second before the next loop iteration
}

/**
 * Displays a message on the LCD.
 * @param line1: The message to display on the first line of the LCD.
 * @param line2: The message to display on the second line of the LCD.
 */
void displayMessage(String line1, String line2) {
  lcd.clear();                 // Clear the LCD screen
  lcd.setCursor(0, 0);         // Set the cursor to the beginning of the first line
  lcd.print(line1);            // Print the first message
  lcd.setCursor(0, 1);         // Set the cursor to the beginning of the second line
  lcd.print(line2);            // Print the second message
}

/**
 * Displays a resistance value on the LCD.
 * @param value: The resistance value to display.
 */
void displayResistance(int value) {
  displayMessage("Resistance:", String(value) + " Ohm");  // Use the displayMessage function to show the resistance value
}
