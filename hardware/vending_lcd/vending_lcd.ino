#include <Wire.h>
#include <rgb_lcd.h>
#include <stdlib.h>
#include <string.h>

rgb_lcd lcd;
char input[96];
byte length = 0;
bool displayReady = false;

void initializeDisplay();

void line(byte row, const char* text) {
  lcd.setCursor(0, row);
  for (byte i = 0; i < 16; i++) lcd.print(' ');
  lcd.setCursor(0, row);
  for (byte i = 0; text[i] && i < 16; i++) lcd.print(text[i]);
}
void handle(char* message) {
  char* type = strtok(message, "|");
  if (!type) return;
  if (!displayReady && strcmp(type, "PING") == 0) initializeDisplay();
  if (!displayReady) {
    Serial.println("ERROR|LCD_MISSING_CHECK_I2C_WIRING");
    return;
  }
  if (strcmp(type, "PING") == 0) {
    Serial.println("READY|LCD");
  } else if (strcmp(type, "START") == 0) {
    char* items = strtok(NULL, "|");
    char* doses = strtok(NULL, "|");
    if (!items || !doses) { Serial.println("ERROR|INVALID_START"); return; }
    lcd.setRGB(66, 91, 154);
    line(0, "Preparing...");
    char summary[24];
    snprintf(summary, sizeof(summary), "%s doses / %s meds", doses, items);
    line(1, summary);
    Serial.println("ACK|START");
  } else if (strcmp(type, "STEP") == 0) {
    char* index = strtok(NULL, "|");
    char* total = strtok(NULL, "|");
    char* doses = strtok(NULL, "|");
    char* name = strtok(NULL, "|");
    if (!index || !total || !doses || !name) { Serial.println("ERROR|INVALID_STEP"); return; }
    char heading[24];
    snprintf(heading, sizeof(heading), "Dispense %s/%s", index, total);
    line(0, heading);
    char item[48];
    snprintf(item, sizeof(item), "%.10s x%s", name, doses);
    line(1, item);
    // Deliberately no motor, relay or dispensing-pin commands: this is an LCD simulation.
    delay(1300);
    Serial.print("ACK|STEP|"); Serial.println(index);
  } else if (strcmp(type, "END") == 0) {
    char* doses = strtok(NULL, "|");
    if (!doses) { Serial.println("ERROR|INVALID_END"); return; }
    lcd.setRGB(105, 190, 142);
    line(0, "Ready to collect");
    char summary[24];
    snprintf(summary, sizeof(summary), "%s doses ready", doses);
    line(1, summary);
    Serial.println("ACK|END");
  } else {
    Serial.println("ERROR|UNKNOWN_COMMAND");
  }
}
void initializeDisplay() {
  // Let the supplied library initialize Wire and the display, as its examples do.
  lcd.begin(16, 2);
  lcd.setRGB(255, 246, 220);
  lcd.print("Medmobi Kiosk");
  lcd.setCursor(0, 1);
  lcd.print("Ready to help");
  displayReady = true;
}
void setup() {
  Serial.begin(9600);
  initializeDisplay();
}
void loop() {
  while (Serial.available()) {
    const char value = Serial.read();
    if (value == '\n') {
      input[length] = '\0';
      handle(input);
      length = 0;
    } else if (value != '\r') {
      if (length < sizeof(input) - 1) input[length++] = value;
      else { length = 0; Serial.println("ERROR|LINE_TOO_LONG"); }
    }
  }
}
