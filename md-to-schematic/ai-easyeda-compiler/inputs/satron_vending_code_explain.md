# Explain hardware_manager.c code
_Exported on 07/11/2025 at 13:32:58 GMT+5:30 from Cursor (2.0.64)_

---

**User**

explain hardware_manager.c  code 

---

**Cursor**

I'll analyze the `hardware_manager.c` file to explain its code structure and functionality.

# Hardware Manager (`hardware_manager.c`) - Comprehensive Explanation

The `hardware_manager.c` file is a **Hardware Abstraction Layer (HAL)** for the Satron 1.0 vending machine system. It manages all low-level hardware interactions and provides a clean interface for the rest of the system.

## 🎯 Main Purpose

This module controls three critical hardware subsystems:
1. **Motor Control** via shift registers (8x16 matrix)
2. **ADC Feedback Systems** for motor position sensing (MCP3208 + Atlas feedback)
3. **I2C Communication** for OLED display

---

## 📋 Key Components

### 1. **I2C Master Initialization** (Lines 94-108)

```84:108:satron-board/main/hardware_manager.c
/**
 * @brief Initialize I2C master interface for OLED display communication
 * 
 * This function configures the ESP32's I2C master interface to communicate
 * with the OLED display. It sets up the SDA and SCL pins, configures
 * pull-up resistors, and sets the communication frequency.
 * 
 * The I2C interface is used exclusively for the OLED display in this system.
 * 
 * @note This function must be called before any OLED display operations.
 */
void i2cMasterInit(void) {
    // Configure I2C master parameters
    i2c_config_t conf = {
        .mode = I2C_MODE_MASTER,                    // ESP32 acts as I2C master
        .sda_io_num = OLED_SDA_PIN,                 // SDA pin for data line
        .sda_pullup_en = GPIO_PULLUP_ENABLE,        // Enable pull-up on SDA
        .scl_io_num = OLED_SCL_PIN,                 // SCL pin for clock line
        .scl_pullup_en = GPIO_PULLUP_ENABLE,        // Enable pull-up on SCL
        .master.clk_speed = I2C_MASTER_FREQ_HZ,     // I2C clock frequency (100kHz)
    };
    
    // Configure I2C parameters and install driver
    ESP_ERROR_CHECK(i2c_param_config(I2C_MASTER_NUM, &conf));
    ESP_ERROR_CHECK(i2c_driver_install(I2C_MASTER_NUM, conf.mode, I2C_MASTER_RX_BUF_DISABLE, I2C_MASTER_TX_BUF_DISABLE, 0));
}
```

- Configures I2C at 100kHz for OLED display communication
- Enables internal pull-up resistors on SDA/SCL lines
- Must be called before any display operations

---

### 2. **Shift Register Control** (Lines 110-157)

```110:157:satron-board/main/hardware_manager.c
void shiftRegisterInit(void) {
    gpio_config_t io_conf = {};
    io_conf.intr_type = GPIO_INTR_DISABLE;
    io_conf.mode = GPIO_MODE_OUTPUT;
    io_conf.pin_bit_mask = (1ULL << LATCH_PIN) | (1ULL << CLOCK_PIN) | (1ULL << DATA_PIN);
    io_conf.pull_down_en = GPIO_PULLDOWN_DISABLE;
    io_conf.pull_up_en = GPIO_PULLUP_DISABLE;
    gpio_config(&io_conf);
    
    // Initialize pins to low
    gpio_set_level((gpio_num_t)LATCH_PIN, 0);
    gpio_set_level((gpio_num_t)CLOCK_PIN, 0);
    gpio_set_level((gpio_num_t)DATA_PIN, 0);
    
    // Configure other GPIO pins
    gpio_set_direction((gpio_num_t)23, GPIO_MODE_OUTPUT);
    gpio_set_level((gpio_num_t)23, 0);
    gpio_set_direction((gpio_num_t)27, GPIO_MODE_OUTPUT);
    gpio_set_level((gpio_num_t)27, 1);
    
    // Configure item GPIO pins
    for (int i = 0; i < NUM_ITEMS; i++) {
        gpio_set_direction((gpio_num_t)itemGpios[i], GPIO_MODE_OUTPUT);
        gpio_set_level((gpio_num_t)itemGpios[i], 0);
    }
    
    clearAll();
}

void clearAll(void) {
    colData[0] = 0;
    colData[1] = 0;
    rowData = 0;

    gpio_set_level((gpio_num_t)LATCH_PIN, 0);
    
    // Clear all three shift registers (24 bits total)
    for (int reg = 0; reg < 3; reg++) {
        for (int i = 7; i >= 0; i--) {
            gpio_set_level((gpio_num_t)DATA_PIN, 0);
            gpio_set_level((gpio_num_t)CLOCK_PIN, 1);
            gpio_set_level((gpio_num_t)CLOCK_PIN, 0);
        }
    }
    
    gpio_set_level((gpio_num_t)LATCH_PIN, 1);
    ESP_LOGI(HARDWARE_TAG, "All shift registers cleared");
}
```

**How it works:**
- Uses **3 cascaded 74HC595 shift registers** (24 bits total)
- Controls an **8×16 motor matrix**:
  - 8 rows (1 shift register)
  - 16 columns (2 shift registers)
- **Data/Clock/Latch pins** shift data serially into registers
- Clears all motors on initialization

---

### 3. **MCP3208 ADC Setup** (Lines 168-207)

```168:207:satron-board/main/hardware_manager.c
esp_err_t mcp3208Init(void) {
    
    // Configure SPI bus
    spi_bus_config_t buscfg = {
        .miso_io_num = MCP3208_MISO_PIN,
        .mosi_io_num = MCP3208_MOSI_PIN,
        .sclk_io_num = MCP3208_CLK_PIN,
        .quadwp_io_num = -1,
        .quadhd_io_num = -1,
        .max_transfer_sz = 32,
    };
    
    // Configure SPI device
    spi_device_interface_config_t devcfg = {
        .clock_speed_hz = 1000000,  // 1 MHz
        .mode = 0,                  // SPI mode 0
        .spics_io_num = MCP3208_CS_PIN,
        .queue_size = 1,
        .flags = 0,
    };
    
    // Initialize SPI bus
    esp_err_t ret = spi_bus_initialize(SPI2_HOST, &buscfg, SPI_DMA_CH_AUTO);
    if (ret != ESP_OK) {
        ESP_LOGE(HARDWARE_TAG, "Failed to initialize SPI bus: %s", esp_err_to_name(ret));
        return ret;
    }
    
    // Add MCP3208 device to SPI bus
    ret = spi_bus_add_device(SPI2_HOST, &devcfg, &mcp3208_spi);
    if (ret != ESP_OK) {
        ESP_LOGE(HARDWARE_TAG, "Failed to add MCP3208 to SPI bus: %s", esp_err_to_name(ret));
        return ret;
    }
    
    
    ESP_LOGI(HARDWARE_TAG, "MCP3208 ADC initialized successfully");
    
    return ESP_OK;
}
```

- **MCP3208** = 8-channel, 12-bit ADC chip
- Communicates via SPI at 1 MHz
- Used for **Titan/Bench motor feedback** (8 channels for 8 rows)

---

### 4. **Atlas Feedback ADC** (Lines 214-297)

```214:297:satron-board/main/hardware_manager.c
esp_err_t atlasFeedbackAdcInit(adc_oneshot_unit_handle_t existing_adc_handle) {
    
    if (existing_adc_handle == NULL) {
        ESP_LOGE(HARDWARE_TAG, "Existing ADC handle is NULL");
        return ESP_FAIL;
    }
    
    // Store the existing handle
    atlas_adc1_handle = existing_adc_handle;
    
    // Create mutex for ADC synchronization
    if (atlas_adc_mutex == NULL) {
        atlas_adc_mutex = xSemaphoreCreateMutex();
        if (atlas_adc_mutex == NULL) {
            ESP_LOGE(HARDWARE_TAG, "Failed to create Atlas ADC mutex");
            return ESP_FAIL;
        }
    }
    
    // Configure channel: 12-bit resolution (0-4095), 12 dB attenuation for wider range
    adc_oneshot_chan_cfg_t chan_cfg = {
        .bitwidth = ADC_BITWIDTH_12,
        .atten = ADC_ATTEN_DB_12,
    };
    esp_err_t ret = adc_oneshot_config_channel(atlas_adc1_handle, ATLAS_FEEDBACK_ADC_CHANNEL, &chan_cfg);
    if (ret != ESP_OK) {
        ESP_LOGE(HARDWARE_TAG, "Failed to configure Atlas ADC channel: %s", esp_err_to_name(ret));
        atlas_adc1_handle = NULL;
        return ret;
    }
    
    // Configure Atlas motor feedback GPIO pins
    ESP_LOGI(HARDWARE_TAG, "Configuring Atlas motor feedback pins...");
    ESP_LOGI(HARDWARE_TAG, "  LED Pin: GPIO%d, Sensor Pin: GPIO%d (ADC1_CH%d)", 
            ATLAS_FEEDBACK_LED_PIN, ATLAS_FEEDBACK_SENSOR_PIN, ATLAS_FEEDBACK_ADC_CHANNEL);
    
    // Configure only the LED pin as GPIO - GPIO34 (sensor pin) should NOT be configured as GPIO when used for ADC
    gpio_config_t atlas_conf = {
        .intr_type = GPIO_INTR_DISABLE,
        .mode = GPIO_MODE_INPUT,
        .pin_bit_mask = (1ULL << ATLAS_FEEDBACK_LED_PIN), // Only configure LED pin as GPIO
        .pull_up_en = 0,
        .pull_down_en = 0,
    };
    ret = gpio_config(&atlas_conf);
    if (ret != ESP_OK) {
        ESP_LOGE(HARDWARE_TAG, "Failed to configure Atlas feedback LED GPIO: %s", esp_err_to_name(ret));
        atlas_adc1_handle = NULL;
        return ret;
    }
    
    ESP_LOGI(HARDWARE_TAG, "GPIO34 (sensor pin) left unconfigured for ADC use - this is correct");
    
    // Test initial Atlas feedback state
    bool initial_led = gpio_get_level(ATLAS_FEEDBACK_LED_PIN);
    int initial_sensor_analog = readAtlasFeedbackAdc();
    if (initial_sensor_analog >= 0) {
        ESP_LOGI(HARDWARE_TAG, "Initial Atlas feedback state - LED: %s, Sensor (analog): %d",
                initial_led ? "ON" : "OFF", initial_sensor_analog);
    } else {
        ESP_LOGE(HARDWARE_TAG, "Failed to read initial Atlas feedback sensor");
    }
    
    // Test multiple readings to verify ADC stability (but don't disable on failure)
    int startup_failures = 0;
    for (int i = 0; i < 5; i++) {
        int test_value = readAtlasFeedbackAdc();
        if (test_value < 0) {
            startup_failures++;
        }
        vTaskDelay(pdMS_TO_TICKS(100));
    }
    
    // Log startup test results but continue regardless
    if (startup_failures >= 4) {
        ESP_LOGW(HARDWARE_TAG, "Atlas feedback startup test - %d/%d tests failed, but continuing anyway", 
                startup_failures, 5);
    } else {
        ESP_LOGI(HARDWARE_TAG, "Atlas feedback startup test - %d/%d tests passed", 
                5 - startup_failures, 5);
    }
    
    return ESP_OK;
}
```

**Atlas-specific feedback:**
- Uses **GPIO34 (ADC1_CH6)** for analog position sensing
- GPIO26 for LED state monitoring
- Uses **shared ADC handle** from vending.c (important for resource sharing!)
- Mutex protected for thread-safe access
- **Never disables** on failure (keeps retrying)

---

### 5. **Motor Feedback Reading** (Lines 299-369)

```299:369:satron-board/main/hardware_manager.c
int mcp3208ReadChannel(uint8_t channel) {
    if (mcp3208_spi == NULL) {
        ESP_LOGE(HARDWARE_TAG, "MCP3208 not initialized");
        return -1;
    }
    
    if (channel > 7) {
        ESP_LOGE(HARDWARE_TAG, "Invalid MCP3208 channel: %d", channel);
        return -1;
    }
    
    // Prepare SPI transaction
    spi_transaction_t trans = {
        .length = 24,  // 3 bytes * 8 bits
        .tx_buffer = NULL,
        .rx_buffer = NULL,
    };
    
    // MCP3208 command structure:
    // Byte 1: Start bit + SGL/DIFF + D2
    // Byte 2: D1 + D0 + don't care bits
    // Byte 3: don't care (for receiving data)
    
    uint8_t tx_data[3];
    uint8_t rx_data[3];
    
    tx_data[0] = 0x06 | ((channel & 0x04) >> 2);  // Start + SGL + D2
    tx_data[1] = (channel & 0x03) << 6;           // D1 + D0 << 6
    tx_data[2] = 0x00;                            // Don't care
    
    trans.tx_buffer = tx_data;
    trans.rx_buffer = rx_data;
    
    // Perform SPI transaction
    esp_err_t ret = spi_device_transmit(mcp3208_spi, &trans);
    if (ret != ESP_OK) {
        ESP_LOGE(HARDWARE_TAG, "MCP3208 SPI transaction failed: %s", esp_err_to_name(ret));
        return -1;
    }
    
    // Extract 12-bit ADC result
    int result = ((rx_data[1] & 0x0F) << 8) | rx_data[2];
    return result;
}

int getMotorFeedback(void) {
    return mcp3208ReadChannel(MOTOR_FEEDBACK_CHANNEL);
}

/**
 * @brief Get motor feedback for a specific row
 * @param row Row number (1-8) to determine which ADC channel to read from
 * @return ADC value from the specified channel, or -1 on error
 * 
 * Channel mapping:
 * - Row 1 -> MCP3208 Channel 0
 * - Row 2 -> MCP3208 Channel 1
 * - Row 3 -> MCP3208 Channel 2
 * - Row 4 -> MCP3208 Channel 3
 * - Row 5 -> MCP3208 Channel 4
 * - Row 6 -> MCP3208 Channel 5
 * - Row 7 -> MCP3208 Channel 6
 * - Row 8 -> MCP3208 Channel 7
 */
int getMotorFeedbackForRow(int row) {
    if (row < 1 || row > 8) {
        ESP_LOGE(HARDWARE_TAG, "Invalid row number: %d (must be 1-8)", row);
        return -1;
    }
    return mcp3208ReadChannel(row - 1);
}
```

- Implements MCP3208 SPI protocol (3-byte command sequence)
- Returns 12-bit ADC value (0-4095 range)
- Per-row feedback for Titan/Bench motors

---

### 6. **Motor Stop Detection State Machine** (Lines 371-495)

This is the **most complex part** - it detects when a motor completes one rotation:

```387:495:satron-board/main/hardware_manager.c
bool checkMotorStopForRow(int row, int threshold) {
    // Validate row number
    if (row < 1 || row > 8) {
        ESP_LOGE(HARDWARE_TAG, "Invalid row number for feedback: %d", row);
        return false;
    }
    
    motor_type_t motor_type = config_manager_get_motor_type();
    
    // Route to appropriate feedback system based on motor type
    if (motor_type == MOTOR_TYPE_ATLAS) {
        // Atlas motors use GPIO pin 34 feedback (not per-row MCP3208)
        // Use the shared Atlas feedback from pin 34
        int adc_value = readAtlasFeedbackAdc();
        if (adc_value < 0) {
            ESP_LOGW(HARDWARE_TAG, "Row%d: Failed to read Atlas ADC (pin 34) - returning false", row);
            return false;
        }
        
        // Get state for this specific row
        motor_feedback_state_t* state = &motor_feedback_states[row - 1];
        
        // Atlas: ADC goes HIGH when clicked
        bool currently_clicked = (adc_value > threshold);
        
        // Static variable for periodic logging (to avoid spam)
        static int log_counter = 0;
        if (log_counter == 0) {
            ESP_LOGI(HARDWARE_TAG, "Row%d (Atlas pin 34): ADC=%d, threshold=%d, state=%s", 
                    row, adc_value, threshold, currently_clicked ? "CLICKED" : "unclicked");
        }
        log_counter = (log_counter + 1) % 50;
        
        // State machine for detecting click pattern
        if (!state->motor_cycle_started) {
            if (currently_clicked && !state->was_clicked) {
                state->first_click_detected = true;
                state->motor_cycle_started = true;
                ESP_LOGI(HARDWARE_TAG, "ATLAS FEEDBACK: First click detected on row %d (pin 34) - spiral engaged", row);
            }
        } else {
            if (state->first_click_detected && !currently_clicked && state->was_clicked) {
                ESP_LOGI(HARDWARE_TAG, "ATLAS FEEDBACK: Second unclick detected on row %d (pin 34) - ROW COMPLETE!", row);
                
                // Reset state for next motor cycle
                state->first_click_detected = false;
                state->motor_cycle_started = false;
                state->was_clicked = false;
                
                return true;
            }
        }
        
        state->was_clicked = currently_clicked;
        return false;
        
    } else {
        // Titan/Bench motors use MCP3208 per-row channels
        // Logic: Two-click detection (first click → second unclick)
        
        // Get state for this specific row (array is 0-indexed, rows are 1-indexed)
        motor_feedback_state_t* state = &motor_feedback_states[row - 1];
        
        // Determine ADC channel based on row (row 1 = channel 0, row 2 = channel 1, etc.)
        uint8_t feedback_channel = row - 1;
        
        int adc_value = mcp3208ReadChannel(feedback_channel);
        if (adc_value < 0) {
            ESP_LOGW(HARDWARE_TAG, "Row%d (CH%d): Failed to read MCP3208 - returning false", row, feedback_channel);
            return false;
        }
        
        // Titan/Bench: ADC goes HIGH when clicked (same as Atlas)
        bool currently_clicked = (adc_value > threshold);
        
        // Static variable for periodic logging (to avoid spam)
        static int log_counter = 0;
        if (log_counter == 0) {
            ESP_LOGI(HARDWARE_TAG, "Row%d (MCP3208 CH%d): ADC=%d, threshold=%d, state=%s", row, feedback_channel, adc_value, threshold, currently_clicked ? "CLICKED" : "unclicked");
        }
        log_counter = (log_counter + 1) % 50;
        
        // State machine for detecting two-click pattern (same as Atlas)
        if (!state->motor_cycle_started) {
            // Starting state - we're in unclicked position, wait for first click
            if (currently_clicked && !state->was_clicked) {
                state->first_click_detected = true;
                state->motor_cycle_started = true;
                ESP_LOGI(HARDWARE_TAG, "TITAN/BENCH FEEDBACK: First click detected on row %d (CH%d) - spiral engaged", row, feedback_channel);
            }
        } else {
            // Motor cycle has started, now look for the unclick after first click
            if (state->first_click_detected && !currently_clicked && state->was_clicked) {
                // We've gone from clicked back to unclicked - one complete rotation!
                ESP_LOGI(HARDWARE_TAG, "TITAN/BENCH FEEDBACK: Second unclick detected on row %d (CH%d) - ROW COMPLETE!", row, feedback_channel);
                
                // Reset state for next motor cycle
                state->first_click_detected = false;
                state->motor_cycle_started = false;
                state->was_clicked = false;
                
                return true;  // This row is complete
            }
        }
        
        state->was_clicked = currently_clicked;
        return false;
    }
}
```

**State Machine Logic:**
1. **Wait for first click** → spiral engages product
2. **Detect transition to unclick** → one rotation complete
3. **Return true** → motor should stop

**Key features:**
- Maintains separate state for each of 8 rows
- Routes between Atlas (pin 34) vs Titan/Bench (MCP3208) based on motor type
- Prevents false positives with state tracking

---

### 7. **Atlas ADC Reading with Retry** (Lines 561-620)

```561:620:satron-board/main/hardware_manager.c
int readAtlasFeedbackAdc(void) {
    if (atlas_adc1_handle == NULL) {
        ESP_LOGE(HARDWARE_TAG, "Atlas feedback ADC handle is NULL - ADC not initialized");
        return -1;
    }

    // Check if Atlas feedback is disabled due to repeated failures
    if (atlas_feedback_disabled) {
        return -1; // Silently fail if disabled
    }

    // Take mutex to prevent concurrent ADC access
    if (atlas_adc_mutex != NULL) {
        if (xSemaphoreTake(atlas_adc_mutex, pdMS_TO_TICKS(100)) != pdTRUE) {
            ESP_LOGW(HARDWARE_TAG, "Atlas ADC mutex timeout - another operation in progress");
            return -1;
        }
    }

    int analog_value = 0;
    esp_err_t adc_result = ESP_FAIL;
    const int max_retries = 3;
    
    // Retry mechanism for ADC reading
    for (int retry = 0; retry < max_retries; retry++) {
        adc_result = adc_oneshot_read(atlas_adc1_handle, ATLAS_FEEDBACK_ADC_CHANNEL, &analog_value);
        
        if (adc_result == ESP_OK) {
            // Success - reset failure count and return value
            atlas_feedback_failure_count = 0;
            if (atlas_adc_mutex != NULL) {
                xSemaphoreGive(atlas_adc_mutex);
            }
            return analog_value;
        }
        
        // If not the last retry, wait a bit before retrying
        if (retry < max_retries - 1) {
            vTaskDelay(pdMS_TO_TICKS(1)); // 1ms delay between retries
        }
    }
    
    // Release mutex before error handling
    if (atlas_adc_mutex != NULL) {
        xSemaphoreGive(atlas_adc_mutex);
    }
    
    // All retries failed - increment failure count but don't disable the system
    atlas_feedback_failure_count++;
    
    // Log error with less detail to avoid spam
    if (atlas_feedback_failure_count <= 3 || atlas_feedback_failure_count % 50 == 1) {
        ESP_LOGD(HARDWARE_TAG, "Atlas ADC read failed after %d retries - Error: %s (0x%x), failure count: %d (ignoring)", 
                max_retries, esp_err_to_name(adc_result), adc_result, atlas_feedback_failure_count);
    }
    
    // DON'T disable Atlas feedback - just continue trying
    // Return 0 instead of -1 to indicate "no reading" but continue operation
    return 0;
}
```

**Robust error handling:**
- 3 retry attempts with 1ms delay
- Mutex-protected (prevents concurrent reads)
- Tracks failure count but **never disables**
- Returns 0 on failure (graceful degradation)

---

### 8. **Shift Register Update** (Lines 665-695)

```665:695:satron-board/main/hardware_manager.c
static void shift_out(gpio_num_t data_pin, gpio_num_t clock_pin, uint8_t val) {
    for (int i = 7; i >= 0; i--) {  // Always MSBFIRST (bit 7 to bit 0)
        uint8_t bit = val & (1 << i);
        
        gpio_set_level(data_pin, bit ? 1 : 0);
        gpio_set_level(clock_pin, 1);
        gpio_set_level(clock_pin, 0);
    }
}

/**
 * @brief Update shift registers with row and column data
 * @param rowData Row data (8 bits)
 * @param colData Column data array (2 elements, 16 bits total)
 */
void updateShiftRegisters(uint8_t rowData, uint8_t* colData) {
    gpio_set_level((gpio_num_t)LATCH_PIN, 0);
    
    // Shift out row data (8 bits) - IC_C
    shift_out((gpio_num_t)DATA_PIN, (gpio_num_t)CLOCK_PIN, rowData);
    
    // Shift out column data [1] (8 bits) - IC_B
    shift_out((gpio_num_t)DATA_PIN, (gpio_num_t)CLOCK_PIN, colData[1]);
    
    // Shift out column data [0] (8 bits) - IC_A
    shift_out((gpio_num_t)DATA_PIN, (gpio_num_t)CLOCK_PIN, colData[0]);
    
    gpio_set_level((gpio_num_t)LATCH_PIN, 1);
    ESP_LOGI(HARDWARE_TAG, "Shift registers updated - Row: 0x%02X, Col[0]: 0x%02X, Col[1]: 0x%02X", 
            rowData, colData[0], colData[1]);
}
```

**How data flows:**
1. **Latch LOW** → prepare to receive data
2. **Shift 24 bits** (row + col[1] + col[0]) MSB first
3. **Latch HIGH** → output to motors

---

## 🔧 Hardware Architecture Summary

```
┌─────────────────────────────────────────────────┐
│           ESP32 (Main Controller)               │
├─────────────────────────────────────────────────┤
│                                                 │
│  I2C ──────► OLED Display (SDA/SCL)            │
│                                                 │
│  GPIO ─────► Shift Registers (Data/Clock/Latch)│
│              ├── IC_A (Col 0-7)                │
│              ├── IC_B (Col 8-15)               │
│              └── IC_C (Row 1-8)                │
│                   └──► 8×16 Motor Matrix       │
│                                                 │
│  SPI ──────► MCP3208 ADC (8 channels)          │
│              └──► Titan/Bench motor feedback   │
│                                                 │
│  ADC1_CH6 ─► Atlas motor feedback (GPIO34)     │
│  GPIO26 ───► Atlas LED state                   │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🎯 Key Design Patterns

1. **Hardware Abstraction** - Clean API hides complexity
2. **State Machine** - Reliable motor stop detection
3. **Error Resilience** - Retry logic + graceful degradation
4. **Resource Sharing** - Shared ADC handle with mutex protection
5. **Motor Type Agnostic** - Routes between Atlas/Titan/Bench automatically

---

## 💡 Important Notes

- **GPIO34 must NOT be configured as GPIO** when used for ADC (correctly handled!)
- Shift registers are **daisy-chained** (order matters: Row → Col[1] → Col[0])
- Atlas feedback uses **one sensor for all rows** (GPIO34), Titan uses **8 separate channels**
- All motor operations are **logged** for debugging
- System continues operating even if feedback fails (returns 0 vs -1)

This module is the foundation that makes the vending machine's motor control system work reliably across different motor types!

```c
/**
 * @brief Initialize I2C master interface for OLED display communication
 * 
 * This function configures the ESP32's I2C master interface to communicate
 * with the OLED display. It sets up the SDA and SCL pins, configures
 * pull-up resistors, and sets the communication frequency.
 * 
 * The I2C interface is used exclusively for the OLED display in this system.
 * 
 * @note This function must be called before any OLED display operations.
 */
void i2cMasterInit(void) {
    // Configure I2C master parameters
    i2c_config_t conf = {
        .mode = I2C_MODE_MASTER,                    // ESP32 acts as I2C master
        .sda_io_num = OLED_SDA_PIN,                 // SDA pin for data line
        .sda_pullup_en = GPIO_PULLUP_ENABLE,        // Enable pull-up on SDA
        .scl_io_num = OLED_SCL_PIN,                 // SCL pin for clock line
        .scl_pullup_en = GPIO_PULLUP_ENABLE,        // Enable pull-up on SCL
        .master.clk_speed = I2C_MASTER_FREQ_HZ,     // I2C clock frequency (100kHz)
    };
    
    // Configure I2C parameters and install driver
    ESP_ERROR_CHECK(i2c_param_config(I2C_MASTER_NUM, &conf));
    ESP_ERROR_CHECK(i2c_driver_install(I2C_MASTER_NUM, conf.mode, I2C_MASTER_RX_BUF_DISABLE, I2C_MASTER_TX_BUF_DISABLE, 0));
}
```

```c
void shiftRegisterInit(void) {
    gpio_config_t io_conf = {};
    io_conf.intr_type = GPIO_INTR_DISABLE;
    io_conf.mode = GPIO_MODE_OUTPUT;
    io_conf.pin_bit_mask = (1ULL << LATCH_PIN) | (1ULL << CLOCK_PIN) | (1ULL << DATA_PIN);
    io_conf.pull_down_en = GPIO_PULLDOWN_DISABLE;
    io_conf.pull_up_en = GPIO_PULLUP_DISABLE;
    gpio_config(&io_conf);
    
    // Initialize pins to low
    gpio_set_level((gpio_num_t)LATCH_PIN, 0);
    gpio_set_level((gpio_num_t)CLOCK_PIN, 0);
    gpio_set_level((gpio_num_t)DATA_PIN, 0);
    
    // Configure other GPIO pins
    gpio_set_direction((gpio_num_t)23, GPIO_MODE_OUTPUT);
    gpio_set_level((gpio_num_t)23, 0);
    gpio_set_direction((gpio_num_t)27, GPIO_MODE_OUTPUT);
    gpio_set_level((gpio_num_t)27, 1);
    
    // Configure item GPIO pins
    for (int i = 0; i < NUM_ITEMS; i++) {
        gpio_set_direction((gpio_num_t)itemGpios[i], GPIO_MODE_OUTPUT);
        gpio_set_level((gpio_num_t)itemGpios[i], 0);
    }
    
    clearAll();
}

void clearAll(void) {
    colData[0] = 0;
    colData[1] = 0;
    rowData = 0;

    gpio_set_level((gpio_num_t)LATCH_PIN, 0);
    
    // Clear all three shift registers (24 bits total)
    for (int reg = 0; reg < 3; reg++) {
        for (int i = 7; i >= 0; i--) {
            gpio_set_level((gpio_num_t)DATA_PIN, 0);
            gpio_set_level((gpio_num_t)CLOCK_PIN, 1);
            gpio_set_level((gpio_num_t)CLOCK_PIN, 0);
        }
    }
    
    gpio_set_level((gpio_num_t)LATCH_PIN, 1);
    ESP_LOGI(HARDWARE_TAG, "All shift registers cleared");
}
```

```c
esp_err_t mcp3208Init(void) {
    
    // Configure SPI bus
    spi_bus_config_t buscfg = {
        .miso_io_num = MCP3208_MISO_PIN,
        .mosi_io_num = MCP3208_MOSI_PIN,
        .sclk_io_num = MCP3208_CLK_PIN,
        .quadwp_io_num = -1,
        .quadhd_io_num = -1,
        .max_transfer_sz = 32,
    };
    
    // Configure SPI device
    spi_device_interface_config_t devcfg = {
        .clock_speed_hz = 1000000,  // 1 MHz
        .mode = 0,                  // SPI mode 0
        .spics_io_num = MCP3208_CS_PIN,
        .queue_size = 1,
        .flags = 0,
    };
    
    // Initialize SPI bus
    esp_err_t ret = spi_bus_initialize(SPI2_HOST, &buscfg, SPI_DMA_CH_AUTO);
    if (ret != ESP_OK) {
        ESP_LOGE(HARDWARE_TAG, "Failed to initialize SPI bus: %s", esp_err_to_name(ret));
        return ret;
    }
    
    // Add MCP3208 device to SPI bus
    ret = spi_bus_add_device(SPI2_HOST, &devcfg, &mcp3208_spi);
    if (ret != ESP_OK) {
        ESP_LOGE(HARDWARE_TAG, "Failed to add MCP3208 to SPI bus: %s", esp_err_to_name(ret));
        return ret;
    }
    
    
    ESP_LOGI(HARDWARE_TAG, "MCP3208 ADC initialized successfully");
    
    return ESP_OK;
}
```

```c
esp_err_t atlasFeedbackAdcInit(adc_oneshot_unit_handle_t existing_adc_handle) {
    
    if (existing_adc_handle == NULL) {
        ESP_LOGE(HARDWARE_TAG, "Existing ADC handle is NULL");
        return ESP_FAIL;
    }
    
    // Store the existing handle
    atlas_adc1_handle = existing_adc_handle;
    
    // Create mutex for ADC synchronization
    if (atlas_adc_mutex == NULL) {
        atlas_adc_mutex = xSemaphoreCreateMutex();
        if (atlas_adc_mutex == NULL) {
            ESP_LOGE(HARDWARE_TAG, "Failed to create Atlas ADC mutex");
            return ESP_FAIL;
        }
    }
    
    // Configure channel: 12-bit resolution (0-4095), 12 dB attenuation for wider range
    adc_oneshot_chan_cfg_t chan_cfg = {
        .bitwidth = ADC_BITWIDTH_12,
        .atten = ADC_ATTEN_DB_12,
    };
    esp_err_t ret = adc_oneshot_config_channel(atlas_adc1_handle, ATLAS_FEEDBACK_ADC_CHANNEL, &chan_cfg);
    if (ret != ESP_OK) {
        ESP_LOGE(HARDWARE_TAG, "Failed to configure Atlas ADC channel: %s", esp_err_to_name(ret));
        atlas_adc1_handle = NULL;
        return ret;
    }
    
    // Configure Atlas motor feedback GPIO pins
    ESP_LOGI(HARDWARE_TAG, "Configuring Atlas motor feedback pins...");
    ESP_LOGI(HARDWARE_TAG, "  LED Pin: GPIO%d, Sensor Pin: GPIO%d (ADC1_CH%d)", 
            ATLAS_FEEDBACK_LED_PIN, ATLAS_FEEDBACK_SENSOR_PIN, ATLAS_FEEDBACK_ADC_CHANNEL);
    
    // Configure only the LED pin as GPIO - GPIO34 (sensor pin) should NOT be configured as GPIO when used for ADC
    gpio_config_t atlas_conf = {
        .intr_type = GPIO_INTR_DISABLE,
        .mode = GPIO_MODE_INPUT,
        .pin_bit_mask = (1ULL << ATLAS_FEEDBACK_LED_PIN), // Only configure LED pin as GPIO
        .pull_up_en = 0,
        .pull_down_en = 0,
    };
    ret = gpio_config(&atlas_conf);
    if (ret != ESP_OK) {
        ESP_LOGE(HARDWARE_TAG, "Failed to configure Atlas feedback LED GPIO: %s", esp_err_to_name(ret));
        atlas_adc1_handle = NULL;
        return ret;
    }
    
    ESP_LOGI(HARDWARE_TAG, "GPIO34 (sensor pin) left unconfigured for ADC use - this is correct");
    
    // Test initial Atlas feedback state
    bool initial_led = gpio_get_level(ATLAS_FEEDBACK_LED_PIN);
    int initial_sensor_analog = readAtlasFeedbackAdc();
    if (initial_sensor_analog >= 0) {
        ESP_LOGI(HARDWARE_TAG, "Initial Atlas feedback state - LED: %s, Sensor (analog): %d",
                initial_led ? "ON" : "OFF", initial_sensor_analog);
    } else {
        ESP_LOGE(HARDWARE_TAG, "Failed to read initial Atlas feedback sensor");
    }
    
    // Test multiple readings to verify ADC stability (but don't disable on failure)
    int startup_failures = 0;
    for (int i = 0; i < 5; i++) {
        int test_value = readAtlasFeedbackAdc();
        if (test_value < 0) {
            startup_failures++;
        }
        vTaskDelay(pdMS_TO_TICKS(100));
    }
    
    // Log startup test results but continue regardless
    if (startup_failures >= 4) {
        ESP_LOGW(HARDWARE_TAG, "Atlas feedback startup test - %d/%d tests failed, but continuing anyway", 
                startup_failures, 5);
    } else {
        ESP_LOGI(HARDWARE_TAG, "Atlas feedback startup test - %d/%d tests passed", 
                5 - startup_failures, 5);
    }
    
    return ESP_OK;
}
```

```c
int mcp3208ReadChannel(uint8_t channel) {
    if (mcp3208_spi == NULL) {
        ESP_LOGE(HARDWARE_TAG, "MCP3208 not initialized");
        return -1;
    }
    
    if (channel > 7) {
        ESP_LOGE(HARDWARE_TAG, "Invalid MCP3208 channel: %d", channel);
        return -1;
    }
    
    // Prepare SPI transaction
    spi_transaction_t trans = {
        .length = 24,  // 3 bytes * 8 bits
        .tx_buffer = NULL,
        .rx_buffer = NULL,
    };
    
    // MCP3208 command structure:
    // Byte 1: Start bit + SGL/DIFF + D2
    // Byte 2: D1 + D0 + don't care bits
    // Byte 3: don't care (for receiving data)
    
    uint8_t tx_data[3];
    uint8_t rx_data[3];
    
    tx_data[0] = 0x06 | ((channel & 0x04) >> 2);  // Start + SGL + D2
    tx_data[1] = (channel & 0x03) << 6;           // D1 + D0 << 6
    tx_data[2] = 0x00;                            // Don't care
    
    trans.tx_buffer = tx_data;
    trans.rx_buffer = rx_data;
    
    // Perform SPI transaction
    esp_err_t ret = spi_device_transmit(mcp3208_spi, &trans);
    if (ret != ESP_OK) {
        ESP_LOGE(HARDWARE_TAG, "MCP3208 SPI transaction failed: %s", esp_err_to_name(ret));
        return -1;
    }
    
    // Extract 12-bit ADC result
    int result = ((rx_data[1] & 0x0F) << 8) | rx_data[2];
    return result;
}

int getMotorFeedback(void) {
    return mcp3208ReadChannel(MOTOR_FEEDBACK_CHANNEL);
}

/**
 * @brief Get motor feedback for a specific row
 * @param row Row number (1-8) to determine which ADC channel to read from
 * @return ADC value from the specified channel, or -1 on error
 * 
 * Channel mapping:
 * - Row 1 -> MCP3208 Channel 0
 * - Row 2 -> MCP3208 Channel 1
 * - Row 3 -> MCP3208 Channel 2
 * - Row 4 -> MCP3208 Channel 3
 * - Row 5 -> MCP3208 Channel 4
 * - Row 6 -> MCP3208 Channel 5
 * - Row 7 -> MCP3208 Channel 6
 * - Row 8 -> MCP3208 Channel 7
 */
int getMotorFeedbackForRow(int row) {
    if (row < 1 || row > 8) {
        ESP_LOGE(HARDWARE_TAG, "Invalid row number: %d (must be 1-8)", row);
        return -1;
    }
    return mcp3208ReadChannel(row - 1);
}
```

```c
bool checkMotorStopForRow(int row, int threshold) {
    // Validate row number
    if (row < 1 || row > 8) {
        ESP_LOGE(HARDWARE_TAG, "Invalid row number for feedback: %d", row);
        return false;
    }
    
    motor_type_t motor_type = config_manager_get_motor_type();
    
    // Route to appropriate feedback system based on motor type
    if (motor_type == MOTOR_TYPE_ATLAS) {
        // Atlas motors use GPIO pin 34 feedback (not per-row MCP3208)
        // Use the shared Atlas feedback from pin 34
        int adc_value = readAtlasFeedbackAdc();
        if (adc_value < 0) {
            ESP_LOGW(HARDWARE_TAG, "Row%d: Failed to read Atlas ADC (pin 34) - returning false", row);
            return false;
        }
        
        // Get state for this specific row
        motor_feedback_state_t* state = &motor_feedback_states[row - 1];
        
        // Atlas: ADC goes HIGH when clicked
        bool currently_clicked = (adc_value > threshold);
        
        // Static variable for periodic logging (to avoid spam)
        static int log_counter = 0;
        if (log_counter == 0) {
            ESP_LOGI(HARDWARE_TAG, "Row%d (Atlas pin 34): ADC=%d, threshold=%d, state=%s", 
                    row, adc_value, threshold, currently_clicked ? "CLICKED" : "unclicked");
        }
        log_counter = (log_counter + 1) % 50;
        
        // State machine for detecting click pattern
        if (!state->motor_cycle_started) {
            if (currently_clicked && !state->was_clicked) {
                state->first_click_detected = true;
                state->motor_cycle_started = true;
                ESP_LOGI(HARDWARE_TAG, "ATLAS FEEDBACK: First click detected on row %d (pin 34) - spiral engaged", row);
            }
        } else {
            if (state->first_click_detected && !currently_clicked && state->was_clicked) {
                ESP_LOGI(HARDWARE_TAG, "ATLAS FEEDBACK: Second unclick detected on row %d (pin 34) - ROW COMPLETE!", row);
                
                // Reset state for next motor cycle
                state->first_click_detected = false;
                state->motor_cycle_started = false;
                state->was_clicked = false;
                
                return true;
            }
        }
        
        state->was_clicked = currently_clicked;
        return false;
        
    } else {
        // Titan/Bench motors use MCP3208 per-row channels
        // Logic: Two-click detection (first click → second unclick)
        
        // Get state for this specific row (array is 0-indexed, rows are 1-indexed)
        motor_feedback_state_t* state = &motor_feedback_states[row - 1];
        
        // Determine ADC channel based on row (row 1 = channel 0, row 2 = channel 1, etc.)
        uint8_t feedback_channel = row - 1;
        
        int adc_value = mcp3208ReadChannel(feedback_channel);
        if (adc_value < 0) {
            ESP_LOGW(HARDWARE_TAG, "Row%d (CH%d): Failed to read MCP3208 - returning false", row, feedback_channel);
            return false;
        }
        
        // Titan/Bench: ADC goes HIGH when clicked (same as Atlas)
        bool currently_clicked = (adc_value > threshold);
        
        // Static variable for periodic logging (to avoid spam)
        static int log_counter = 0;
        if (log_counter == 0) {
            ESP_LOGI(HARDWARE_TAG, "Row%d (MCP3208 CH%d): ADC=%d, threshold=%d, state=%s", row, feedback_channel, adc_value, threshold, currently_clicked ? "CLICKED" : "unclicked");
        }
        log_counter = (log_counter + 1) % 50;
        
        // State machine for detecting two-click pattern (same as Atlas)
        if (!state->motor_cycle_started) {
            // Starting state - we're in unclicked position, wait for first click
            if (currently_clicked && !state->was_clicked) {
                state->first_click_detected = true;
                state->motor_cycle_started = true;
                ESP_LOGI(HARDWARE_TAG, "TITAN/BENCH FEEDBACK: First click detected on row %d (CH%d) - spiral engaged", row, feedback_channel);
            }
        } else {
            // Motor cycle has started, now look for the unclick after first click
            if (state->first_click_detected && !currently_clicked && state->was_clicked) {
                // We've gone from clicked back to unclicked - one complete rotation!
                ESP_LOGI(HARDWARE_TAG, "TITAN/BENCH FEEDBACK: Second unclick detected on row %d (CH%d) - ROW COMPLETE!", row, feedback_channel);
                
                // Reset state for next motor cycle
                state->first_click_detected = false;
                state->motor_cycle_started = false;
                state->was_clicked = false;
                
                return true;  // This row is complete
            }
        }
        
        state->was_clicked = currently_clicked;
        return false;
    }
}
```

```c
int readAtlasFeedbackAdc(void) {
    if (atlas_adc1_handle == NULL) {
        ESP_LOGE(HARDWARE_TAG, "Atlas feedback ADC handle is NULL - ADC not initialized");
        return -1;
    }

    // Check if Atlas feedback is disabled due to repeated failures
    if (atlas_feedback_disabled) {
        return -1; // Silently fail if disabled
    }

    // Take mutex to prevent concurrent ADC access
    if (atlas_adc_mutex != NULL) {
        if (xSemaphoreTake(atlas_adc_mutex, pdMS_TO_TICKS(100)) != pdTRUE) {
            ESP_LOGW(HARDWARE_TAG, "Atlas ADC mutex timeout - another operation in progress");
            return -1;
        }
    }

    int analog_value = 0;
    esp_err_t adc_result = ESP_FAIL;
    const int max_retries = 3;
    
    // Retry mechanism for ADC reading
    for (int retry = 0; retry < max_retries; retry++) {
        adc_result = adc_oneshot_read(atlas_adc1_handle, ATLAS_FEEDBACK_ADC_CHANNEL, &analog_value);
        
        if (adc_result == ESP_OK) {
            // Success - reset failure count and return value
            atlas_feedback_failure_count = 0;
            if (atlas_adc_mutex != NULL) {
                xSemaphoreGive(atlas_adc_mutex);
            }
            return analog_value;
        }
        
        // If not the last retry, wait a bit before retrying
        if (retry < max_retries - 1) {
            vTaskDelay(pdMS_TO_TICKS(1)); // 1ms delay between retries
        }
    }
    
    // Release mutex before error handling
    if (atlas_adc_mutex != NULL) {
        xSemaphoreGive(atlas_adc_mutex);
    }
    
    // All retries failed - increment failure count but don't disable the system
    atlas_feedback_failure_count++;
    
    // Log error with less detail to avoid spam
    if (atlas_feedback_failure_count <= 3 || atlas_feedback_failure_count % 50 == 1) {
        ESP_LOGD(HARDWARE_TAG, "Atlas ADC read failed after %d retries - Error: %s (0x%x), failure count: %d (ignoring)", 
                max_retries, esp_err_to_name(adc_result), adc_result, atlas_feedback_failure_count);
    }
    
    // DON'T disable Atlas feedback - just continue trying
    // Return 0 instead of -1 to indicate "no reading" but continue operation
    return 0;
}
```

```c
static void shift_out(gpio_num_t data_pin, gpio_num_t clock_pin, uint8_t val) {
    for (int i = 7; i >= 0; i--) {  // Always MSBFIRST (bit 7 to bit 0)
        uint8_t bit = val & (1 << i);
        
        gpio_set_level(data_pin, bit ? 1 : 0);
        gpio_set_level(clock_pin, 1);
        gpio_set_level(clock_pin, 0);
    }
}

/**
 * @brief Update shift registers with row and column data
 * @param rowData Row data (8 bits)
 * @param colData Column data array (2 elements, 16 bits total)
 */
void updateShiftRegisters(uint8_t rowData, uint8_t* colData) {
    gpio_set_level((gpio_num_t)LATCH_PIN, 0);
    
    // Shift out row data (8 bits) - IC_C
    shift_out((gpio_num_t)DATA_PIN, (gpio_num_t)CLOCK_PIN, rowData);
    
    // Shift out column data [1] (8 bits) - IC_B
    shift_out((gpio_num_t)DATA_PIN, (gpio_num_t)CLOCK_PIN, colData[1]);
    
    // Shift out column data [0] (8 bits) - IC_A
    shift_out((gpio_num_t)DATA_PIN, (gpio_num_t)CLOCK_PIN, colData[0]);
    
    gpio_set_level((gpio_num_t)LATCH_PIN, 1);
    ESP_LOGI(HARDWARE_TAG, "Shift registers updated - Row: 0x%02X, Col[0]: 0x%02X, Col[1]: 0x%02X", 
            rowData, colData[0], colData[1]);
}
```

```plaintext
┌─────────────────────────────────────────────────┐
│           ESP32 (Main Controller)               │
├─────────────────────────────────────────────────┤
│                                                 │
│  I2C ──────► OLED Display (SDA/SCL)            │
│                                                 │
│  GPIO ─────► Shift Registers (Data/Clock/Latch)│
│              ├── IC_A (Col 0-7)                │
│              ├── IC_B (Col 8-15)               │
│              └── IC_C (Row 1-8)                │
│                   └──► 8×16 Motor Matrix       │
│                                                 │
│  SPI ──────► MCP3208 ADC (8 channels)          │
│              └──► Titan/Bench motor feedback   │
│                                                 │
│  ADC1_CH6 ─► Atlas motor feedback (GPIO34)     │
│  GPIO26 ───► Atlas LED state                   │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

**User**

process_vending_request



explain flow and function calling in this func

---

**Cursor**

I'll analyze the `process_vending_request` function to explain its flow and function calls.

Now let me get the function calls referenced in this function:

Now let me look at related helper functions:

Now let me check the vending.h to understand the vending functions:

Perfect! Now I have all the information needed. Let me create a comprehensive explanation of the `process_vending_request` function flow.

# `process_vending_request()` - Complete Flow & Function Call Analysis

## 🎯 Function Overview

```533:660:satron-board/main/main.c
bool process_vending_request(cJSON* json_data, const char* source_name) {
    ESP_LOGI(TAG, "Processing vending request from %s", source_name);
    
    cJSON *itemsArray = cJSON_GetObjectItem(json_data, "items");
    cJSON *order_id_json = cJSON_GetObjectItem(json_data, "orderId");
    
    // Debug: Print the entire JSON structure
    char *json_string = cJSON_Print(json_data);
    ESP_LOGI(TAG, "Full JSON payload from %s: %s", source_name, json_string);
    free(json_string);
    
    if (!itemsArray || !order_id_json) {
        ESP_LOGE(TAG, "Invalid JSON structure - missing items or orderId");
        ESP_LOGE(TAG, "itemsArray: %p, order_id_json: %p", itemsArray, order_id_json);
        return false;
    }
    
    // Debug: Check if items array is actually an array and its size
    if (!cJSON_IsArray(itemsArray)) {
        ESP_LOGE(TAG, "items field is not an array!");
        return false;
    }
    
    int items_count = cJSON_GetArraySize(itemsArray);
    ESP_LOGI(TAG, "Found %d items in items array", items_count);
    
    char* order_id = order_id_json->valuestring;
    ESP_LOGI(TAG, "Processing order: %s from %s with %d items", order_id, source_name, items_count);
    
    // Check for optional sensorEnabled field in the order
    cJSON *sensor_enabled_json = cJSON_GetObjectItem(json_data, "sensorEnabled");
    bool sensor_enabled = config_manager_get_sensor_enabled(); // Get current local state
    
    if (sensor_enabled_json != NULL && cJSON_IsBool(sensor_enabled_json)) {
        bool order_sensor_enabled = cJSON_IsTrue(sensor_enabled_json);
        ESP_LOGI(TAG, "Order contains sensorEnabled field: %s, overriding local state (%s)", 
                order_sensor_enabled ? "true" : "false", sensor_enabled ? "true" : "false");
        
        // Update local state with the value from the order
        esp_err_t err = config_manager_set_sensor_enabled(order_sensor_enabled);
        if (err == ESP_OK) {
            sensor_enabled = order_sensor_enabled;
            ESP_LOGI(TAG, "Local sensor enabled state updated to: %s", sensor_enabled ? "true" : "false");
        } else {
            ESP_LOGE(TAG, "Failed to update local sensor enabled state: %s", esp_err_to_name(err));
        }
    } else {
        ESP_LOGI(TAG, "Order %s from %s, using configured sensor_enabled: %s", order_id, source_name, sensor_enabled ? "true" : "false");
    }
    
    // Display order received message on OLED
    char order_msg[32];
    snprintf(order_msg, sizeof(order_msg), "Order Received for %d items", items_count);
    printOnOled(order_msg, 2);
    
    bool all_successful = true;
    cJSON *item = NULL;
    cJSON_ArrayForEach(item, itemsArray) {
        cJSON *item_pos_json = cJSON_GetObjectItem(item, "position");
        cJSON *oiid_json = cJSON_GetObjectItem(item, "oiid");
        cJSON *related_positions_json = cJSON_GetObjectItem(item, "relatedPositions");
        
        if (!item_pos_json || !oiid_json) continue;
        
        char* item_pos_str = item_pos_json->valuestring;
        char* oiid = oiid_json->valuestring;

        // convert item_pos_str to integer
        int position = atoi(item_pos_str);
        
        ESP_LOGI(TAG, "Processing item position: %s, oiid: %s from %s", item_pos_str, oiid, source_name);

        // Check for relatedPositions array
        int positions[13]; // Max 12 positions + 1 for main position
        int position_count = 0;
        
        // Add main position first
        positions[position_count++] = position;
        
        // Check if relatedPositions exists and has data
        if (related_positions_json && cJSON_IsArray(related_positions_json)) {
            int array_size = cJSON_GetArraySize(related_positions_json);
            ESP_LOGI(TAG, "Found relatedPositions array with %d entries", array_size);
            
            if (array_size > 0 && array_size <= 12) { // Max 12 additional positions
                cJSON *related_pos = NULL;
                cJSON_ArrayForEach(related_pos, related_positions_json) {
                    if (cJSON_IsString(related_pos) && position_count < 13) {
                        int related_position = atoi(related_pos->valuestring);
                        positions[position_count++] = related_position;
                        ESP_LOGI(TAG, "Added related position: %d", related_position);
                    }
                }
            } else if (array_size > 12) {
                ESP_LOGW(TAG, "relatedPositions array too large (%d), ignoring", array_size);
            }
        } else {
            ESP_LOGI(TAG, "No relatedPositions or empty array, using single position only");
        }
        
        ESP_LOGI(TAG, "Total positions to vend: %d", position_count);
        for (int i = 0; i < position_count; i++) {
            ESP_LOGI(TAG, "  Position %d: %d", i+1, positions[i]);
        }

        // Display vending item message on OLED
        char vend_msg[32];
        snprintf(vend_msg, sizeof(vend_msg), "Vending item pos %s", item_pos_str);
        printOnOled(vend_msg, 2);
        
        // Send vending request asynchronously to avoid blocking MQTT
        bool request_queued = send_vending_request_async(positions, position_count, order_id, item_pos_str, oiid, 
            (strcmp(source_name, "MQTT") == 0));
        
        if (request_queued) {
            ESP_LOGI(TAG, "Vending request queued successfully for item %s from %s", item_pos_str, source_name);
            // Response will be handled by vending_status_monitor_task when vending completes
        } else {
            ESP_LOGE(TAG, "Failed to queue vending request for item %s from %s", item_pos_str, source_name);
            // Send immediate failure response
            send_vending_response(item_pos_str, false, order_id, oiid, "VEND_FAILED_SYSTEM_BUSY");
            all_successful = false;
        }
    }
    
    ESP_LOGI(TAG, "Order %s from %s completed with %s", order_id, source_name, all_successful ? "SUCCESS" : "FAILURE");
    return all_successful;
}
```

---

## 📊 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CALLER (MQTT or Serial)                          │
│                            ↓                                        │
│            process_vending_request(json_data, source_name)          │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 1: JSON VALIDATION & PARSING                                  │
├─────────────────────────────────────────────────────────────────────┤
│ • cJSON_GetObjectItem(json_data, "items")                          │
│ • cJSON_GetObjectItem(json_data, "orderId")                        │
│ • cJSON_Print(json_data) → Log full JSON                           │
│ • Validate: itemsArray exists and is array                         │
│ • Get items_count from array                                       │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 2: SENSOR CONFIGURATION OVERRIDE (Optional)                   │
├─────────────────────────────────────────────────────────────────────┤
│ • cJSON_GetObjectItem(json_data, "sensorEnabled")                  │
│ • config_manager_get_sensor_enabled() → Get current state          │
│ • IF sensorEnabled in JSON:                                        │
│   └─ config_manager_set_sensor_enabled(value) → Update NVS         │
│ • ELSE: Use existing configuration                                 │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 3: DISPLAY ORDER CONFIRMATION                                 │
├─────────────────────────────────────────────────────────────────────┤
│ • printOnOled("Order Received for N items", 2)                     │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 4: ITERATE THROUGH EACH ITEM (FOR EACH LOOP)                  │
├─────────────────────────────────────────────────────────────────────┤
│ For each item in itemsArray:                                       │
│   ┌───────────────────────────────────────────────────────────┐   │
│   │ 4A: EXTRACT ITEM DATA                                     │   │
│   │ • cJSON_GetObjectItem(item, "position")                   │   │
│   │ • cJSON_GetObjectItem(item, "oiid")                       │   │
│   │ • cJSON_GetObjectItem(item, "relatedPositions")           │   │
│   │ • atoi(item_pos_str) → Convert position to integer        │   │
│   └───────────────────────────────────────────────────────────┘   │
│                          ↓                                          │
│   ┌───────────────────────────────────────────────────────────┐   │
│   │ 4B: BUILD POSITIONS ARRAY (Multi-position support)        │   │
│   │ • positions[0] = main position                            │   │
│   │ • IF relatedPositions exists:                             │   │
│   │   └─ Loop through related positions (max 12)              │   │
│   │   └─ Add to positions[] array                             │   │
│   │ • Final position_count (1-13 positions)                   │   │
│   └───────────────────────────────────────────────────────────┘   │
│                          ↓                                          │
│   ┌───────────────────────────────────────────────────────────┐   │
│   │ 4C: UPDATE DISPLAY                                        │   │
│   │ • printOnOled("Vending item pos XX", 2)                   │   │
│   └───────────────────────────────────────────────────────────┘   │
│                          ↓                                          │
│   ┌───────────────────────────────────────────────────────────┐   │
│   │ 4D: QUEUE VENDING REQUEST ASYNCHRONOUSLY                  │   │
│   │ • send_vending_request_async(...)                         │   │
│   │   ├─ Prepare VendingRequest struct                        │   │
│   │   ├─ Store in currentOrder                                │   │
│   │   └─ xQueueSend(vending_request_queue, ...) ─────────┐    │   │
│   │                                                       │    │   │
│   │ IF queue full/failed:                                │    │   │
│   │   └─ send_vending_response(..., "VEND_FAILED_...")   │    │   │
│   └───────────────────────────────────────────────────────────┘   │
│                                                           │        │
└───────────────────────────────────────────────────────────┼────────┘
                                                            │
                    ┌───────────────────────────────────────┘
                    │ REQUEST GOES TO CORE 0 QUEUE
                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│ CORE 0 (PRO_CPU): vending_execution_task (Priority 6)              │
├─────────────────────────────────────────────────────────────────────┤
│ • xQueueReceive(vending_request_queue, &request, ...)              │
│ • execute_single_vend(request.positions, ..., &result)             │
│   └─ [vending.c] Hardware motor control + sensor monitoring        │
│ • Update last_vend_result with success/failure                     │
│ • IF immediate response needed:                                    │
│   └─ send_vending_response(...)                                    │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│ CORE 1 (APP_CPU): vending_status_monitor_task (Priority 5)         │
├─────────────────────────────────────────────────────────────────────┤
│ • Monitors: is_vending_busy() state changes                        │
│ • When vending completes (busy → not busy):                        │
│   ├─ get_last_vend_result() → Get detailed results                │
│   ├─ Update machineState ("VEND_SUCCESS" or "VEND_FAILED")        │
│   ├─ Update OLED with success/failure message                     │
│   ├─ send_vending_response(item, success, order_id, oiid, code)   │
│   └─ Clear currentOrder                                            │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│ send_vending_response() → Route based on communication mode        │
├─────────────────────────────────────────────────────────────────────┤
│ IF MQTT mode:                                                       │
│   └─ mqttPublishOrderItemResponse(item, success, order_id, ...)   │
│ ELSE (Serial mode):                                                │
│   └─ serialSendResponse(JSON response)                            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Detailed Function Calls Breakdown

### **1. JSON Parsing Functions** (Lines 536-560)

| Function | Purpose | Returns |
|----------|---------|---------|
| `cJSON_GetObjectItem(json_data, "items")` | Extract "items" array from JSON | cJSON pointer to array |
| `cJSON_GetObjectItem(json_data, "orderId")` | Extract "orderId" string | cJSON pointer to string |
| `cJSON_Print(json_data)` | Convert JSON to formatted string for logging | Allocated string (must free) |
| `cJSON_IsArray(itemsArray)` | Validate items field is array | true/false |
| `cJSON_GetArraySize(itemsArray)` | Get number of items in array | Integer count |

---

### **2. Configuration Management** (Lines 562-581)

| Function | Purpose | Returns |
|----------|---------|---------|
| `config_manager_get_sensor_enabled()` | Get current drop sensor state from NVS | bool (enabled/disabled) |
| `config_manager_set_sensor_enabled(value)` | Update sensor state in NVS & RAM | ESP_OK or error code |
| `cJSON_IsBool(sensor_enabled_json)` | Check if JSON field is boolean | true/false |
| `cJSON_IsTrue(sensor_enabled_json)` | Get boolean value from JSON | true/false |

**Key Insight:** This allows cloud to **override local sensor settings** per order!

---

### **3. Display Update** (Lines 584-641)

| Function | Purpose | Parameters |
|----------|---------|------------|
| `printOnOled(message, line)` | Display text on OLED at specific line | message string, line number (2) |

Used twice:
- Line 586: "Order Received for N items"
- Line 641: "Vending item pos XX"

---

### **4. Item Data Extraction** (Lines 590-636)

| Function | Purpose | Returns |
|----------|---------|---------|
| `cJSON_ArrayForEach(item, itemsArray)` | Iterate through items array | Macro - loops through array |
| `cJSON_GetObjectItem(item, "position")` | Get main position field | cJSON pointer to string |
| `cJSON_GetObjectItem(item, "oiid")` | Get order item ID | cJSON pointer to string |
| `cJSON_GetObjectItem(item, "relatedPositions")` | Get array of additional positions | cJSON pointer to array or NULL |
| `atoi(item_pos_str)` | Convert position string to int | Integer position |

**Multi-Position Support:** Allows vending from **up to 13 positions** per item:
- 1 main position
- Up to 12 related positions (for combo items or multi-location products)

---

### **5. Async Vending Queue** (Lines 644-655)

```492:525:satron-board/main/main.c
bool send_vending_request_async(int* positions, int position_count, 
    const char* order_id, const char* item_position, const char* oiid, bool is_mqtt_request) {
    if (vending_request_queue == NULL) {
        ESP_LOGE(TAG, "Vending request queue not initialized");
        return false;
    }
    
    // Don't check if busy - let the queue handle sequential processing
    
    // Prepare vending request
    VendingRequest request;
    memcpy(request.positions, positions, sizeof(int) * position_count);
    request.position_count = position_count;
    safe_strcpy(request.order_id, order_id, sizeof(request.order_id));
    safe_strcpy(request.item_position, item_position, sizeof(request.item_position));
    safe_strcpy(request.oiid, oiid, sizeof(request.oiid));
    request.is_mqtt_request = is_mqtt_request;
    
    // Store current order for response
    safe_strcpy(currentOrder.order_id, order_id, sizeof(currentOrder.order_id));
    safe_strcpy(currentOrder.item_position, item_position, sizeof(currentOrder.item_position));
    safe_strcpy(currentOrder.oiid, oiid, sizeof(currentOrder.oiid));
    currentOrder.has_active_order = true;
    
    // Send request to vending task (queue will handle sequential processing)
    if (xQueueSend(vending_request_queue, &request, pdMS_TO_TICKS(1000)) == pdTRUE) {
        ESP_LOGI(TAG, "Vending request queued successfully for %d position(s) (item: %s)", position_count, item_position);
        return true;
    } else {
        ESP_LOGE(TAG, "Failed to queue vending request - queue full");
        currentOrder.has_active_order = false;
        return false;
    }
}
```

**Critical:** Uses FreeRTOS queue to send request from **Core 1 (APP_CPU)** to **Core 0 (PRO_CPU)**

| Function | Purpose | Returns |
|----------|---------|---------|
| `xQueueSend(vending_request_queue, &request, timeout)` | Send request to Core 0 vending task | pdTRUE if queued, pdFALSE if full |
| `memcpy(request.positions, positions, size)` | Copy positions array to request struct | void |
| `safe_strcpy(dest, src, size)` | Safe string copy with bounds checking | void |

---

### **6. Response Handling** (Lines 653-655)

```455:479:satron-board/main/main.c
void send_vending_response(const char* item_pos, bool success, const char* order_id, 
    const char* oiid, const char* response_code) {
    if (is_main_communication_mode_active(COMM_MODE_MQTT)) {
        // Send MQTT response
        mqttPublishOrderItemResponse(item_pos, success, order_id, oiid, response_code);
        ESP_LOGI(TAG, "Sent MQTT response for order %s: %s", order_id, response_code);
    } else {
        // Send Serial response
        cJSON *response = cJSON_CreateObject();
        cJSON_AddStringToObject(response, "status", success ? "SUCCESS" : "FAILURE");
        cJSON_AddStringToObject(response, "message", success ? "Vending completed successfully" : "Vending failed");
        cJSON_AddStringToObject(response, "source", "Serial");
        cJSON_AddStringToObject(response, "machine_id", MACHINE_ID);
        cJSON_AddStringToObject(response, "order_id", order_id);
        cJSON_AddStringToObject(response, "item_position", item_pos);
        cJSON_AddStringToObject(response, "oiid", oiid);
        cJSON_AddStringToObject(response, "response_code", response_code);
        
        char *response_str = cJSON_Print(response);
        serialSendResponse(response_str);
        free(response_str);
        cJSON_Delete(response);
        ESP_LOGI(TAG, "Sent Serial response for order %s: %s", order_id, response_code);
    }
}
```

| Function | Purpose | Parameters |
|----------|---------|------------|
| `send_vending_response()` | Send success/failure response to caller | item_pos, success, order_id, oiid, code |
| `mqttPublishOrderItemResponse()` | Publish MQTT response to cloud | MQTT-specific parameters |
| `serialSendResponse()` | Send JSON response over serial | JSON string |

**Response Codes:**
- `"VEND_FAILED_SYSTEM_BUSY"` - Queue full or system busy
- `"VEND_SUCCESS"` - Successful vend
- `"VEND_FAILED"` - Motor or sensor failure

---

## 🎯 Key Design Decisions

### **1. Asynchronous Architecture**
- ✅ **Non-blocking:** Returns immediately after queuing
- ✅ **Prevents MQTT timeout:** MQTT task doesn't wait for motor completion
- ✅ **Queue depth:** 50 items (configurable)

### **2. Dual-Core Utilization**
- **Core 1 (APP_CPU):** Runs `process_vending_request()` - handles network, JSON parsing
- **Core 0 (PRO_CPU):** Runs `vending_execution_task()` - controls motors with precise timing

### **3. Multi-Position Support**
- Enables **combo orders** (e.g., burger + fries from 2 positions)
- Gracefully handles **1-13 positions** per item

### **4. Configuration Override**
- Cloud can **dynamically enable/disable** drop sensor per order
- Persisted to NVS for future orders

### **5. Response Routing**
- Automatically routes responses to **MQTT or Serial** based on `source_name`
- Maintains order context with `currentOrder` struct

---

## 📋 Example JSON Input

```json
{
  "orderId": "ORD-12345",
  "sensorEnabled": true,
  "items": [
    {
      "position": "23",
      "oiid": "ITEM-001",
      "relatedPositions": ["24", "35"]
    },
    {
      "position": "45",
      "oiid": "ITEM-002"
    }
  ]
}
```

**Result:**
- Item 1: Vends from positions 23, 24, 35 (3 motors)
- Item 2: Vends from position 45 (1 motor)
- Drop sensor: Enabled (overridden by order)

---

## 🚀 Complete Call Chain

```
Serial/MQTT → process_vending_request()
                └─ config_manager_get_sensor_enabled()
                └─ config_manager_set_sensor_enabled() [optional]
                └─ printOnOled() [x2]
                └─ send_vending_request_async()
                    └─ xQueueSend() → Core 0 Queue
                        └─ vending_execution_task() [Core 0]
                            └─ execute_single_vend() [vending.c]
                                └─ activateMotor() [hardware]
                                └─ checkMotorStopForRow() [feedback]
                                └─ clearAllMotors()
                        └─ vending_status_monitor_task() [Core 1]
                            └─ get_last_vend_result()
                            └─ send_vending_response()
                                └─ mqttPublishOrderItemResponse() [MQTT]
                                └─ serialSendResponse() [Serial]
```

---

This function is the **central orchestrator** for all vending operations, handling multi-source requests (MQTT/Serial), multi-position vending, and dynamic configuration - all while maintaining responsive network communication through asynchronous queue-based execution! 🎰

```c
bool process_vending_request(cJSON* json_data, const char* source_name) {
    ESP_LOGI(TAG, "Processing vending request from %s", source_name);
    
    cJSON *itemsArray = cJSON_GetObjectItem(json_data, "items");
    cJSON *order_id_json = cJSON_GetObjectItem(json_data, "orderId");
    
    // Debug: Print the entire JSON structure
    char *json_string = cJSON_Print(json_data);
    ESP_LOGI(TAG, "Full JSON payload from %s: %s", source_name, json_string);
    free(json_string);
    
    if (!itemsArray || !order_id_json) {
        ESP_LOGE(TAG, "Invalid JSON structure - missing items or orderId");
        ESP_LOGE(TAG, "itemsArray: %p, order_id_json: %p", itemsArray, order_id_json);
        return false;
    }
    
    // Debug: Check if items array is actually an array and its size
    if (!cJSON_IsArray(itemsArray)) {
        ESP_LOGE(TAG, "items field is not an array!");
        return false;
    }
    
    int items_count = cJSON_GetArraySize(itemsArray);
    ESP_LOGI(TAG, "Found %d items in items array", items_count);
    
    char* order_id = order_id_json->valuestring;
    ESP_LOGI(TAG, "Processing order: %s from %s with %d items", order_id, source_name, items_count);
    
    // Check for optional sensorEnabled field in the order
    cJSON *sensor_enabled_json = cJSON_GetObjectItem(json_data, "sensorEnabled");
    bool sensor_enabled = config_manager_get_sensor_enabled(); // Get current local state
    
    if (sensor_enabled_json != NULL && cJSON_IsBool(sensor_enabled_json)) {
        bool order_sensor_enabled = cJSON_IsTrue(sensor_enabled_json);
        ESP_LOGI(TAG, "Order contains sensorEnabled field: %s, overriding local state (%s)", 
                order_sensor_enabled ? "true" : "false", sensor_enabled ? "true" : "false");
        
        // Update local state with the value from the order
        esp_err_t err = config_manager_set_sensor_enabled(order_sensor_enabled);
        if (err == ESP_OK) {
            sensor_enabled = order_sensor_enabled;
            ESP_LOGI(TAG, "Local sensor enabled state updated to: %s", sensor_enabled ? "true" : "false");
        } else {
            ESP_LOGE(TAG, "Failed to update local sensor enabled state: %s", esp_err_to_name(err));
        }
    } else {
        ESP_LOGI(TAG, "Order %s from %s, using configured sensor_enabled: %s", order_id, source_name, sensor_enabled ? "true" : "false");
    }
    
    // Display order received message on OLED
    char order_msg[32];
    snprintf(order_msg, sizeof(order_msg), "Order Received for %d items", items_count);
    printOnOled(order_msg, 2);
    
    bool all_successful = true;
    cJSON *item = NULL;
    cJSON_ArrayForEach(item, itemsArray) {
        cJSON *item_pos_json = cJSON_GetObjectItem(item, "position");
        cJSON *oiid_json = cJSON_GetObjectItem(item, "oiid");
        cJSON *related_positions_json = cJSON_GetObjectItem(item, "relatedPositions");
        
        if (!item_pos_json || !oiid_json) continue;
        
        char* item_pos_str = item_pos_json->valuestring;
        char* oiid = oiid_json->valuestring;

        // convert item_pos_str to integer
        int position = atoi(item_pos_str);
        
        ESP_LOGI(TAG, "Processing item position: %s, oiid: %s from %s", item_pos_str, oiid, source_name);

        // Check for relatedPositions array
        int positions[13]; // Max 12 positions + 1 for main position
        int position_count = 0;
        
        // Add main position first
        positions[position_count++] = position;
        
        // Check if relatedPositions exists and has data
        if (related_positions_json && cJSON_IsArray(related_positions_json)) {
            int array_size = cJSON_GetArraySize(related_positions_json);
            ESP_LOGI(TAG, "Found relatedPositions array with %d entries", array_size);
            
            if (array_size > 0 && array_size <= 12) { // Max 12 additional positions
                cJSON *related_pos = NULL;
                cJSON_ArrayForEach(related_pos, related_positions_json) {
                    if (cJSON_IsString(related_pos) && position_count < 13) {
                        int related_position = atoi(related_pos->valuestring);
                        positions[position_count++] = related_position;
                        ESP_LOGI(TAG, "Added related position: %d", related_position);
                    }
                }
            } else if (array_size > 12) {
                ESP_LOGW(TAG, "relatedPositions array too large (%d), ignoring", array_size);
            }
        } else {
            ESP_LOGI(TAG, "No relatedPositions or empty array, using single position only");
        }
        
        ESP_LOGI(TAG, "Total positions to vend: %d", position_count);
        for (int i = 0; i < position_count; i++) {
            ESP_LOGI(TAG, "  Position %d: %d", i+1, positions[i]);
        }

        // Display vending item message on OLED
        char vend_msg[32];
        snprintf(vend_msg, sizeof(vend_msg), "Vending item pos %s", item_pos_str);
        printOnOled(vend_msg, 2);
        
        // Send vending request asynchronously to avoid blocking MQTT
        bool request_queued = send_vending_request_async(positions, position_count, order_id, item_pos_str, oiid, 
            (strcmp(source_name, "MQTT") == 0));
        
        if (request_queued) {
            ESP_LOGI(TAG, "Vending request queued successfully for item %s from %s", item_pos_str, source_name);
            // Response will be handled by vending_status_monitor_task when vending completes
        } else {
            ESP_LOGE(TAG, "Failed to queue vending request for item %s from %s", item_pos_str, source_name);
            // Send immediate failure response
            send_vending_response(item_pos_str, false, order_id, oiid, "VEND_FAILED_SYSTEM_BUSY");
            all_successful = false;
        }
    }
    
    ESP_LOGI(TAG, "Order %s from %s completed with %s", order_id, source_name, all_successful ? "SUCCESS" : "FAILURE");
    return all_successful;
}
```

```plaintext
┌─────────────────────────────────────────────────────────────────────┐
│                    CALLER (MQTT or Serial)                          │
│                            ↓                                        │
│            process_vending_request(json_data, source_name)          │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 1: JSON VALIDATION & PARSING                                  │
├─────────────────────────────────────────────────────────────────────┤
│ • cJSON_GetObjectItem(json_data, "items")                          │
│ • cJSON_GetObjectItem(json_data, "orderId")                        │
│ • cJSON_Print(json_data) → Log full JSON                           │
│ • Validate: itemsArray exists and is array                         │
│ • Get items_count from array                                       │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 2: SENSOR CONFIGURATION OVERRIDE (Optional)                   │
├─────────────────────────────────────────────────────────────────────┤
│ • cJSON_GetObjectItem(json_data, "sensorEnabled")                  │
│ • config_manager_get_sensor_enabled() → Get current state          │
│ • IF sensorEnabled in JSON:                                        │
│   └─ config_manager_set_sensor_enabled(value) → Update NVS         │
│ • ELSE: Use existing configuration                                 │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 3: DISPLAY ORDER CONFIRMATION                                 │
├─────────────────────────────────────────────────────────────────────┤
│ • printOnOled("Order Received for N items", 2)                     │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 4: ITERATE THROUGH EACH ITEM (FOR EACH LOOP)                  │
├─────────────────────────────────────────────────────────────────────┤
│ For each item in itemsArray:                                       │
│   ┌───────────────────────────────────────────────────────────┐   │
│   │ 4A: EXTRACT ITEM DATA                                     │   │
│   │ • cJSON_GetObjectItem(item, "position")                   │   │
│   │ • cJSON_GetObjectItem(item, "oiid")                       │   │
│   │ • cJSON_GetObjectItem(item, "relatedPositions")           │   │
│   │ • atoi(item_pos_str) → Convert position to integer        │   │
│   └───────────────────────────────────────────────────────────┘   │
│                          ↓                                          │
│   ┌───────────────────────────────────────────────────────────┐   │
│   │ 4B: BUILD POSITIONS ARRAY (Multi-position support)        │   │
│   │ • positions[0] = main position                            │   │
│   │ • IF relatedPositions exists:                             │   │
│   │   └─ Loop through related positions (max 12)              │   │
│   │   └─ Add to positions[] array                             │   │
│   │ • Final position_count (1-13 positions)                   │   │
│   └───────────────────────────────────────────────────────────┘   │
│                          ↓                                          │
│   ┌───────────────────────────────────────────────────────────┐   │
│   │ 4C: UPDATE DISPLAY                                        │   │
│   │ • printOnOled("Vending item pos XX", 2)                   │   │
│   └───────────────────────────────────────────────────────────┘   │
│                          ↓                                          │
│   ┌───────────────────────────────────────────────────────────┐   │
│   │ 4D: QUEUE VENDING REQUEST ASYNCHRONOUSLY                  │   │
│   │ • send_vending_request_async(...)                         │   │
│   │   ├─ Prepare VendingRequest struct                        │   │
│   │   ├─ Store in currentOrder                                │   │
│   │   └─ xQueueSend(vending_request_queue, ...) ─────────┐    │   │
│   │                                                       │    │   │
│   │ IF queue full/failed:                                │    │   │
│   │   └─ send_vending_response(..., "VEND_FAILED_...")   │    │   │
│   └───────────────────────────────────────────────────────────┘   │
│                                                           │        │
└───────────────────────────────────────────────────────────┼────────┘
                                                            │
                    ┌───────────────────────────────────────┘
                    │ REQUEST GOES TO CORE 0 QUEUE
                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│ CORE 0 (PRO_CPU): vending_execution_task (Priority 6)              │
├─────────────────────────────────────────────────────────────────────┤
│ • xQueueReceive(vending_request_queue, &request, ...)              │
│ • execute_single_vend(request.positions, ..., &result)             │
│   └─ [vending.c] Hardware motor control + sensor monitoring        │
│ • Update last_vend_result with success/failure                     │
│ • IF immediate response needed:                                    │
│   └─ send_vending_response(...)                                    │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│ CORE 1 (APP_CPU): vending_status_monitor_task (Priority 5)         │
├─────────────────────────────────────────────────────────────────────┤
│ • Monitors: is_vending_busy() state changes                        │
│ • When vending completes (busy → not busy):                        │
│   ├─ get_last_vend_result() → Get detailed results                │
│   ├─ Update machineState ("VEND_SUCCESS" or "VEND_FAILED")        │
│   ├─ Update OLED with success/failure message                     │
│   ├─ send_vending_response(item, success, order_id, oiid, code)   │
│   └─ Clear currentOrder                                            │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│ send_vending_response() → Route based on communication mode        │
├─────────────────────────────────────────────────────────────────────┤
│ IF MQTT mode:                                                       │
│   └─ mqttPublishOrderItemResponse(item, success, order_id, ...)   │
│ ELSE (Serial mode):                                                │
│   └─ serialSendResponse(JSON response)                            │
└─────────────────────────────────────────────────────────────────────┘
```

```c
bool send_vending_request_async(int* positions, int position_count, 
    const char* order_id, const char* item_position, const char* oiid, bool is_mqtt_request) {
    if (vending_request_queue == NULL) {
        ESP_LOGE(TAG, "Vending request queue not initialized");
        return false;
    }
    
    // Don't check if busy - let the queue handle sequential processing
    
    // Prepare vending request
    VendingRequest request;
    memcpy(request.positions, positions, sizeof(int) * position_count);
    request.position_count = position_count;
    safe_strcpy(request.order_id, order_id, sizeof(request.order_id));
    safe_strcpy(request.item_position, item_position, sizeof(request.item_position));
    safe_strcpy(request.oiid, oiid, sizeof(request.oiid));
    request.is_mqtt_request = is_mqtt_request;
    
    // Store current order for response
    safe_strcpy(currentOrder.order_id, order_id, sizeof(currentOrder.order_id));
    safe_strcpy(currentOrder.item_position, item_position, sizeof(currentOrder.item_position));
    safe_strcpy(currentOrder.oiid, oiid, sizeof(currentOrder.oiid));
    currentOrder.has_active_order = true;
    
    // Send request to vending task (queue will handle sequential processing)
    if (xQueueSend(vending_request_queue, &request, pdMS_TO_TICKS(1000)) == pdTRUE) {
        ESP_LOGI(TAG, "Vending request queued successfully for %d position(s) (item: %s)", position_count, item_position);
        return true;
    } else {
        ESP_LOGE(TAG, "Failed to queue vending request - queue full");
        currentOrder.has_active_order = false;
        return false;
    }
}
```

```c
void send_vending_response(const char* item_pos, bool success, const char* order_id, 
    const char* oiid, const char* response_code) {
    if (is_main_communication_mode_active(COMM_MODE_MQTT)) {
        // Send MQTT response
        mqttPublishOrderItemResponse(item_pos, success, order_id, oiid, response_code);
        ESP_LOGI(TAG, "Sent MQTT response for order %s: %s", order_id, response_code);
    } else {
        // Send Serial response
        cJSON *response = cJSON_CreateObject();
        cJSON_AddStringToObject(response, "status", success ? "SUCCESS" : "FAILURE");
        cJSON_AddStringToObject(response, "message", success ? "Vending completed successfully" : "Vending failed");
        cJSON_AddStringToObject(response, "source", "Serial");
        cJSON_AddStringToObject(response, "machine_id", MACHINE_ID);
        cJSON_AddStringToObject(response, "order_id", order_id);
        cJSON_AddStringToObject(response, "item_position", item_pos);
        cJSON_AddStringToObject(response, "oiid", oiid);
        cJSON_AddStringToObject(response, "response_code", response_code);
        
        char *response_str = cJSON_Print(response);
        serialSendResponse(response_str);
        free(response_str);
        cJSON_Delete(response);
        ESP_LOGI(TAG, "Sent Serial response for order %s: %s", order_id, response_code);
    }
}
```

```json
{
  "orderId": "ORD-12345",
  "sensorEnabled": true,
  "items": [
    {
      "position": "23",
      "oiid": "ITEM-001",
      "relatedPositions": ["24", "35"]
    },
    {
      "position": "45",
      "oiid": "ITEM-002"
    }
  ]
}
```

```plaintext
Serial/MQTT → process_vending_request()
                └─ config_manager_get_sensor_enabled()
                └─ config_manager_set_sensor_enabled() [optional]
                └─ printOnOled() [x2]
                └─ send_vending_request_async()
                    └─ xQueueSend() → Core 0 Queue
                        └─ vending_execution_task() [Core 0]
                            └─ execute_single_vend() [vending.c]
                                └─ activateMotor() [hardware]
                                └─ checkMotorStopForRow() [feedback]
                                └─ clearAllMotors()
                        └─ vending_status_monitor_task() [Core 1]
                            └─ get_last_vend_result()
                            └─ send_vending_response()
                                └─ mqttPublishOrderItemResponse() [MQTT]
                                └─ serialSendResponse() [Serial]
```

---

**User**

@main.c (613-631) 

---

**Cursor**

I'll explain the selected code section that handles **related positions** in the vending request.

## 📍 Related Positions Processing (Lines 613-631)

This code block handles **multi-position vending** - allowing one item to trigger multiple motors/positions. This is useful for:
- **Combo products** (e.g., meal with drink from 2 positions)
- **Heavy items** requiring multiple spirals
- **Backup positions** if primary position fails

---

## 🔍 Code Breakdown

```613:631:satron-board/main/main.c
if (related_positions_json && cJSON_IsArray(related_positions_json)) {
            int array_size = cJSON_GetArraySize(related_positions_json);
            ESP_LOGI(TAG, "Found relatedPositions array with %d entries", array_size);
            
            if (array_size > 0 && array_size <= 12) { // Max 12 additional positions
                cJSON *related_pos = NULL;
                cJSON_ArrayForEach(related_pos, related_positions_json) {
                    if (cJSON_IsString(related_pos) && position_count < 13) {
                        int related_position = atoi(related_pos->valuestring);
                        positions[position_count++] = related_position;
                        ESP_LOGI(TAG, "Added related position: %d", related_position);
                    }
                }
            } else if (array_size > 12) {
                ESP_LOGW(TAG, "relatedPositions array too large (%d), ignoring", array_size);
            }
        } else {
            ESP_LOGI(TAG, "No relatedPositions or empty array, using single position only");
        }
```

---

## 📊 Step-by-Step Flow

### **1. Check if relatedPositions Exists and is Valid Array** (Line 613)

```c
if (related_positions_json && cJSON_IsArray(related_positions_json))
```

**Purpose:** Validate that:
- Field exists in JSON (not NULL)
- Field is actually an array type

**Outcome:**
- ✅ Valid array → Process it
- ❌ NULL or not array → Skip to line 630 (single position only)

---

### **2. Get Array Size** (Line 614)

```c
int array_size = cJSON_GetArraySize(related_positions_json);
```

**Returns:** Number of elements in the `relatedPositions` array

**Example:**
```json
"relatedPositions": ["24", "35", "46"]  // array_size = 3
```

---

### **3. Size Validation: 1-12 Additional Positions** (Line 617)

```c
if (array_size > 0 && array_size <= 12)
```

**Why limit to 12?**
- `positions[13]` array declared earlier (line 606)
- Index 0 = main position (already added at line 610)
- Indices 1-12 = related positions (12 slots available)
- **Total capacity: 13 positions per item**

---

### **4. Iterate Through Related Positions** (Lines 618-625)

```c
cJSON *related_pos = NULL;
cJSON_ArrayForEach(related_pos, related_positions_json) {
    if (cJSON_IsString(related_pos) && position_count < 13) {
        int related_position = atoi(related_pos->valuestring);
        positions[position_count++] = related_position;
        ESP_LOGI(TAG, "Added related position: %d", related_position);
    }
}
```

**Detailed Breakdown:**

| Line | Action | Purpose |
|------|--------|---------|
| 619 | `cJSON_ArrayForEach(related_pos, related_positions_json)` | Loop through each element in array |
| 620 | `cJSON_IsString(related_pos)` | Validate element is string type |
| 620 | `position_count < 13` | Prevent array overflow (safety check) |
| 621 | `atoi(related_pos->valuestring)` | Convert string "24" → integer 24 |
| 622 | `positions[position_count++] = related_position` | Add to array & increment counter |
| 623 | `ESP_LOGI(...)` | Log each added position for debugging |

**Safety Features:**
- ✅ Type checking: Only processes string elements
- ✅ Bounds checking: Stops at 13 total positions
- ✅ Post-increment: `position_count++` safely adds and increments

---

### **5. Handle Oversized Arrays** (Lines 626-628)

```c
else if (array_size > 12) {
    ESP_LOGW(TAG, "relatedPositions array too large (%d), ignoring", array_size);
}
```

**Purpose:** Graceful degradation
- If someone sends 20 related positions (invalid)
- Log warning but **don't crash**
- **Ignore entire relatedPositions array**
- Continue with just main position

---

### **6. No Related Positions Case** (Lines 629-631)

```c
else {
    ESP_LOGI(TAG, "No relatedPositions or empty array, using single position only");
}
```

**Triggers when:**
- `relatedPositions` field missing from JSON
- Field exists but is empty array `[]`
- Field exists but is not an array type

**Result:** Vending proceeds with just the main position (already in `positions[0]`)

---

## 🎯 Context: Where This Fits

This code executes **inside the item loop**:

```c
// Line 606: Prepare positions array
int positions[13];      // Max 12 related + 1 main = 13 total
int position_count = 0;

// Line 610: Add main position first
positions[position_count++] = position;  // positions[0] = main position

// Lines 613-631: Add related positions (YOUR CODE HERE)
if (related_positions_json && cJSON_IsArray(related_positions_json)) {
    // ... process related positions ...
}

// Line 644: Send all positions to vending task
send_vending_request_async(positions, position_count, ...);
```

---

## 💡 Example Scenarios

### **Scenario 1: Single Position (No Related)**

**Input JSON:**
```json
{
  "position": "23",
  "oiid": "ITEM-001"
  // No relatedPositions field
}
```

**Result:**
```c
positions[0] = 23
position_count = 1
// Log: "No relatedPositions or empty array, using single position only"
```

---

### **Scenario 2: Combo Product (Main + 2 Related)**

**Input JSON:**
```json
{
  "position": "23",
  "oiid": "COMBO-001",
  "relatedPositions": ["34", "45"]
}
```

**Result:**
```c
positions[0] = 23  // Main position
positions[1] = 34  // First related
positions[2] = 45  // Second related
position_count = 3
// Logs:
// "Found relatedPositions array with 2 entries"
// "Added related position: 34"
// "Added related position: 45"
```

**Vending Behavior:** Motors at positions 23, 34, and 45 will run **sequentially**

---

### **Scenario 3: Empty Related Positions Array**

**Input JSON:**
```json
{
  "position": "23",
  "oiid": "ITEM-002",
  "relatedPositions": []
}
```

**Result:**
```c
positions[0] = 23
position_count = 1
// array_size = 0, so condition (array_size > 0) fails
// Goes to else block: "No relatedPositions or empty array..."
```

---

### **Scenario 4: Oversized Array (Error Case)**

**Input JSON:**
```json
{
  "position": "23",
  "oiid": "ITEM-003",
  "relatedPositions": ["24", "25", "26", ..., "40"]  // 15 positions!
}
```

**Result:**
```c
positions[0] = 23
position_count = 1
// array_size = 15 > 12
// Log: "relatedPositions array too large (15), ignoring"
// Only main position used
```

---

### **Scenario 5: Maximum Capacity (13 Total)**

**Input JSON:**
```json
{
  "position": "11",
  "oiid": "BULK-001",
  "relatedPositions": ["12", "13", "14", "15", "16", "17", "18", "21", "22", "23", "24", "25"]
}
```

**Result:**
```c
positions[0] = 11   // Main
positions[1] = 12   // Related 1
positions[2] = 13   // Related 2
// ... (10 more) ...
positions[12] = 25  // Related 12
position_count = 13 // Maximum
// All 12 related positions added successfully
```

---

## 🛡️ Safety & Error Handling

| Check | Line | Purpose |
|-------|------|---------|
| NULL check | 613 | Prevents crash if field missing |
| Type validation | 613, 620 | Ensures array and string types |
| Size validation | 617 | Rejects arrays > 12 elements |
| Bounds check | 620 | Prevents buffer overflow (`< 13`) |
| Graceful degradation | 626-628 | Logs warning but continues |

---

## 🎯 Why This Design?

### **Advantages:**
1. **Flexibility:** Supports single or multi-position vending
2. **Safety:** Multiple layers of validation prevent crashes
3. **Clarity:** Detailed logging for debugging
4. **Scalability:** Easy to change max positions by adjusting array size

### **Limitations:**
1. **Sequential Only:** Positions run one after another (not parallel)
2. **Fixed Limit:** 13 positions max (could be increased if needed)
3. **No Retry Logic:** If one position fails, doesn't automatically try related positions

---

## 🔗 Related Code Context

**Before this block (Line 610):**
```c
// Main position already added
positions[position_count++] = position;
```

**After this block (Lines 633-636):**
```c
ESP_LOGI(TAG, "Total positions to vend: %d", position_count);
for (int i = 0; i < position_count; i++) {
    ESP_LOGI(TAG, "  Position %d: %d", i+1, positions[i]);
}
```

**Then sent to vending task (Line 644):**
```c
send_vending_request_async(positions, position_count, order_id, ...);
```

---

This code elegantly handles the complexity of **multi-position vending** while maintaining safety and providing clear feedback through logging! 🎰

```c
if (related_positions_json && cJSON_IsArray(related_positions_json)) {
            int array_size = cJSON_GetArraySize(related_positions_json);
            ESP_LOGI(TAG, "Found relatedPositions array with %d entries", array_size);
            
            if (array_size > 0 && array_size <= 12) { // Max 12 additional positions
                cJSON *related_pos = NULL;
                cJSON_ArrayForEach(related_pos, related_positions_json) {
                    if (cJSON_IsString(related_pos) && position_count < 13) {
                        int related_position = atoi(related_pos->valuestring);
                        positions[position_count++] = related_position;
                        ESP_LOGI(TAG, "Added related position: %d", related_position);
                    }
                }
            } else if (array_size > 12) {
                ESP_LOGW(TAG, "relatedPositions array too large (%d), ignoring", array_size);
            }
        } else {
            ESP_LOGI(TAG, "No relatedPositions or empty array, using single position only");
        }
```

```c
if (related_positions_json && cJSON_IsArray(related_positions_json))
```

```c
int array_size = cJSON_GetArraySize(related_positions_json);
```

```json
"relatedPositions": ["24", "35", "46"]  // array_size = 3
```

```c
if (array_size > 0 && array_size <= 12)
```

```c
cJSON *related_pos = NULL;
cJSON_ArrayForEach(related_pos, related_positions_json) {
    if (cJSON_IsString(related_pos) && position_count < 13) {
        int related_position = atoi(related_pos->valuestring);
        positions[position_count++] = related_position;
        ESP_LOGI(TAG, "Added related position: %d", related_position);
    }
}
```

```c
else if (array_size > 12) {
    ESP_LOGW(TAG, "relatedPositions array too large (%d), ignoring", array_size);
}
```

```c
else {
    ESP_LOGI(TAG, "No relatedPositions or empty array, using single position only");
}
```

```c
// Line 606: Prepare positions array
int positions[13];      // Max 12 related + 1 main = 13 total
int position_count = 0;

// Line 610: Add main position first
positions[position_count++] = position;  // positions[0] = main position

// Lines 613-631: Add related positions (YOUR CODE HERE)
if (related_positions_json && cJSON_IsArray(related_positions_json)) {
    // ... process related positions ...
}

// Line 644: Send all positions to vending task
send_vending_request_async(positions, position_count, ...);
```

```json
{
  "position": "23",
  "oiid": "ITEM-001"
  // No relatedPositions field
}
```

```c
positions[0] = 23
position_count = 1
// Log: "No relatedPositions or empty array, using single position only"
```

```json
{
  "position": "23",
  "oiid": "COMBO-001",
  "relatedPositions": ["34", "45"]
}
```

```c
positions[0] = 23  // Main position
positions[1] = 34  // First related
positions[2] = 45  // Second related
position_count = 3
// Logs:
// "Found relatedPositions array with 2 entries"
// "Added related position: 34"
// "Added related position: 45"
```

```json
{
  "position": "23",
  "oiid": "ITEM-002",
  "relatedPositions": []
}
```

```c
positions[0] = 23
position_count = 1
// array_size = 0, so condition (array_size > 0) fails
// Goes to else block: "No relatedPositions or empty array..."
```

```json
{
  "position": "23",
  "oiid": "ITEM-003",
  "relatedPositions": ["24", "25", "26", ..., "40"]  // 15 positions!
}
```

```c
positions[0] = 23
position_count = 1
// array_size = 15 > 12
// Log: "relatedPositions array too large (15), ignoring"
// Only main position used
```

```json
{
  "position": "11",
  "oiid": "BULK-001",
  "relatedPositions": ["12", "13", "14", "15", "16", "17", "18", "21", "22", "23", "24", "25"]
}
```

```c
positions[0] = 11   // Main
positions[1] = 12   // Related 1
positions[2] = 13   // Related 2
// ... (10 more) ...
positions[12] = 25  // Related 12
position_count = 13 // Maximum
// All 12 related positions added successfully
```

```c
// Main position already added
positions[position_count++] = position;
```

```c
ESP_LOGI(TAG, "Total positions to vend: %d", position_count);
for (int i = 0; i < position_count; i++) {
    ESP_LOGI(TAG, "  Position %d: %d", i+1, positions[i]);
}
```

```c
send_vending_request_async(positions, position_count, order_id, ...);
```

---

**User**

send_vending_request_async



explain this func 

---

**Cursor**


Reviewing `send_vending_request_async` to explain its functionality.



Checking the VendingRequest structure definition:



# `send_vending_request_async()` - Function Explanation

## Function overview

This function queues a vending request asynchronously using a FreeRTOS queue, enabling non-blocking communication between Core 1 (network/app) and Core 0 (real-time hardware).

```492:525:satron-board/main/main.c
bool send_vending_request_async(int* positions, int position_count, 
    const char* order_id, const char* item_position, const char* oiid, bool is_mqtt_request) {
    if (vending_request_queue == NULL) {
        ESP_LOGE(TAG, "Vending request queue not initialized");
        return false;
    }
    
    // Don't check if busy - let the queue handle sequential processing
    
    // Prepare vending request
    VendingRequest request;
    memcpy(request.positions, positions, sizeof(int) * position_count);
    request.position_count = position_count;
    safe_strcpy(request.order_id, order_id, sizeof(request.order_id));
    safe_strcpy(request.item_position, item_position, sizeof(request.item_position));
    safe_strcpy(request.oiid, oiid, sizeof(request.oiid));
    request.is_mqtt_request = is_mqtt_request;
    
    // Store current order for response
    safe_strcpy(currentOrder.order_id, order_id, sizeof(currentOrder.order_id));
    safe_strcpy(currentOrder.item_position, item_position, sizeof(currentOrder.item_position));
    safe_strcpy(currentOrder.oiid, oiid, sizeof(currentOrder.oiid));
    currentOrder.has_active_order = true;
    
    // Send request to vending task (queue will handle sequential processing)
    if (xQueueSend(vending_request_queue, &request, pdMS_TO_TICKS(1000)) == pdTRUE) {
        ESP_LOGI(TAG, "Vending request queued successfully for %d position(s) (item: %s)", position_count, item_position);
        return true;
    } else {
        ESP_LOGE(TAG, "Failed to queue vending request - queue full");
        currentOrder.has_active_order = false;
        return false;
    }
}
```

---

## Parameters

| Parameter | Type | Purpose |
|-----------|------|---------|
| `positions` | `int*` | Array of motor positions to vend (e.g., `[23, 34, 45]`) |
| `position_count` | `int` | Number of positions in array (1-13) |
| `order_id` | `const char*` | Unique order identifier from cloud (e.g., `"ORD-12345"`) |
| `item_position` | `const char*` | Item position string (e.g., `"23"`) |
| `oiid` | `const char*` | Order item ID from cloud (e.g., `"ITEM-001"`) |
| `is_mqtt_request` | `bool` | `true` if from MQTT, `false` if from Serial |

---

## Step-by-step flow

### Step 1: Queue validation (Lines 494-497)

```c
if (vending_request_queue == NULL) {
    ESP_LOGE(TAG, "Vending request queue not initialized");
    return false;
}
```

- Checks if the FreeRTOS queue exists
- Returns `false` if not initialized (prevents crash)
- Queue is created during system initialization (line 296)

---

### Step 2: Prepare VendingRequest structure (Lines 502-508)

```c
VendingRequest request;
memcpy(request.positions, positions, sizeof(int) * position_count);
request.position_count = position_count;
safe_strcpy(request.order_id, order_id, sizeof(request.order_id));
safe_strcpy(request.item_position, item_position, sizeof(request.item_position));
safe_strcpy(request.oiid, oiid, sizeof(request.oiid));
request.is_mqtt_request = is_mqtt_request;
```

VendingRequest structure:
```119:127:satron-board/main/main.c
typedef struct {
    int positions[13];        // Array of positions to vend
    int position_count;       // Number of positions
    // sensor_enabled is now managed through configuration, not per-request
    char order_id[64];        // Order ID for response
    char item_position[8];    // Item position string
    char oiid[64];           // Order item ID
    bool is_mqtt_request;     // True if from MQTT, false if from serial
} VendingRequest;
```

Details:
- `memcpy()` copies the positions array
- `safe_strcpy()` ensures null-termination and prevents overflow
- `is_mqtt_request` tracks the source for response routing

---

### Step 3: Store order context (Lines 510-514)

```c
safe_strcpy(currentOrder.order_id, order_id, sizeof(currentOrder.order_id));
safe_strcpy(currentOrder.item_position, item_position, sizeof(currentOrder.item_position));
safe_strcpy(currentOrder.oiid, oiid, sizeof(currentOrder.oiid));
currentOrder.has_active_order = true;
```

Purpose:
- Maintains order context for responses
- Used by `vending_status_monitor_task` to send completion responses
- `has_active_order` flag indicates an active order

CurrentOrder structure:
```86:91:satron-board/main/main.c
typedef struct {
    char order_id[64];        // Unique order identifier from cloud
    char item_position[8];    // Item position (e.g., "01", "02", etc.)
    char oiid[64];           // Order item ID from cloud
    bool has_active_order;    // Flag indicating if an order is currently being processed
} CurrentOrder;
```

---

### Step 4: Send to queue (Lines 516-524)

```c
if (xQueueSend(vending_request_queue, &request, pdMS_TO_TICKS(1000)) == pdTRUE) {
    ESP_LOGI(TAG, "Vending request queued successfully for %d position(s) (item: %s)", position_count, item_position);
    return true;
} else {
    ESP_LOGE(TAG, "Failed to queue vending request - queue full");
    currentOrder.has_active_order = false;
    return false;
}
```

FreeRTOS queue details:
- Queue size: 50 items (created at line 296)
- Timeout: 1000ms (1 second)
- Behavior: Blocks for up to 1 second if queue is full

Outcomes:
- Success (`pdTRUE`): Request queued, returns `true`
- Failure: Queue full after timeout, clears order flag, returns `false`

---

## Architecture: dual-core communication

```
┌─────────────────────────────────────────────────────────────┐
│  CORE 1 (APP_CPU) - Network & Application                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ process_vending_request()                             │  │
│  │   └─ send_vending_request_async()                    │  │
│  │       └─ xQueueSend(vending_request_queue, ...) ────┐  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                                                          │
                                    FreeRTOS Queue (50 items)
                                                          │
                                                          ↓
┌─────────────────────────────────────────────────────────────┐
│  CORE 0 (PRO_CPU) - Real-Time Hardware Control             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ vending_execution_task() (Priority 6)                │  │
│  │   └─ xQueueReceive(vending_request_queue, ...)       │  │
│  │       └─ request_vend(positions, count)              │  │
│  │           └─ Motor control + sensor monitoring      │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

Why this design:
- Non-blocking: Network tasks don't wait for motor operations
- Real-time: Core 0 handles hardware with precise timing
- Sequential: Queue ensures one vend at a time
- Scalable: Queue buffers up to 50 requests

---

## Helper function: `safe_strcpy()`

```207:210:satron-board/main/main.c
static void safe_strcpy(char* dest, const char* src, size_t dest_size) {
    strncpy(dest, src, dest_size - 1);
    dest[dest_size - 1] = '\0';
}
```

Purpose:
- Prevents buffer overflow
- Ensures null termination
- Safer than `strcpy()` or `strncpy()` alone

---

## Consumer side: `vending_execution_task()`

```744:780:satron-board/main/main.c
static void vending_execution_task(void *pvParameters) {
    
    VendingRequest request;
    
    while (1) {
        // Wait for vending request from queue
        if (xQueueReceive(vending_request_queue, &request, portMAX_DELAY) == pdTRUE) {
            bool sensor_enabled = config_manager_get_sensor_enabled();
            ESP_LOGI(TAG, "Received vending request for %d position(s), sensor: %s (item: %s)", 
                    request.position_count, sensor_enabled ? "enabled" : "disabled", request.item_position);
            
            // Execute the vending cycle
            bool vend_result = request_vend(request.positions, request.position_count);
            
            log_vend_operation("Vending execution completed", request.item_position, vend_result, NULL);
            
            // Send immediate response for this item
            vend_result_t result = get_last_vend_result();
            char response_code_buffer[64];
            
            vend_result_summary_t summary = {
                .success = result.success,
                .nudges_used = get_last_nudges_used(),
                .drops_detected = get_last_drops_detected(),
                .sensor_enabled = sensor_enabled,
                .sensor_blocked = result.sensor_blocked,
                .motor_stopped = result.motor_stopped,
                .timeout_occurred = result.timeout_occurred
            };
            
            const char* response_code = generate_response_code(&summary, response_code_buffer, sizeof(response_code_buffer));
            
            // Send response immediately for this item
            send_vending_response(request.item_position, result.success, request.order_id, request.oiid, response_code);
            log_vend_operation("Sent immediate response", request.item_position, true, response_code);
        }
    }
}
```

Flow:
1. Blocks on `xQueueReceive()` waiting for requests
2. Receives `VendingRequest` from queue
3. Executes `request_vend()` (motor control)
4. Sends response via `send_vending_response()`
5. Loops back to wait for next request

---

## Design decisions

### 1. No busy check (Line 499)
```c
// Don't check if busy - let the queue handle sequential processing
```
- Queue naturally serializes requests
- No need for explicit busy flag
- Simpler code

### 2. Immediate order storage (Lines 510-514)
- Stores order context before queuing
- Enables response even if queue fails
- Maintains state for monitoring tasks

### 3. 1-second timeout
- Prevents indefinite blocking
- Allows caller to handle failure quickly
- Balances responsiveness and queue capacity

### 4. Queue size: 50 items
- Handles burst orders
- Prevents memory issues
- Reasonable for vending machine use case

---

## Example usage

```c
// Example: Vending combo product from 3 positions
int positions[] = {23, 34, 45};
int position_count = 3;
const char* order_id = "ORD-12345";
const char* item_position = "23";
const char* oiid = "COMBO-001";
bool is_mqtt = true;

bool queued = send_vending_request_async(
    positions, 
    position_count, 
    order_id, 
    item_position, 
    oiid, 
    is_mqtt
);

if (queued) {
    ESP_LOGI(TAG, "Request queued - will vend from positions 23, 34, 45");
} else {
    ESP_LOGE(TAG, "Failed to queue - system busy or queue full");
}
```

Result:
- Request queued to Core 0
- Function returns immediately (non-blocking)
- Motors will run sequentially: 23 → 34 → 45
- Response sent when complete

---

## Error handling

| Error Case | Detection | Response |
|------------|-----------|----------|
| Queue not initialized | Line 494 | Return `false`, log error |
| Queue full | Line 517 | Return `false`, clear order flag, log error |
| Invalid parameters | Not checked here | Handled by caller validation |

---

## Return value

- `true`: Request queued successfully
- `false`: Queue full, not initialized, or timeout

Caller should handle `false` by:
- Sending failure response immediately
- Logging the error
- Notifying user/system

---

## Summary

`send_vending_request_async()` is the bridge between network/app logic (Core 1) and real-time hardware control (Core 0). It:
- Queues requests asynchronously
- Maintains order context
- Handles errors gracefully
- Enables non-blocking network operations
- Ensures sequential vending execution

This design keeps the system responsive while maintaining precise motor control timing.

```c
bool send_vending_request_async(int* positions, int position_count, 
    const char* order_id, const char* item_position, const char* oiid, bool is_mqtt_request) {
    if (vending_request_queue == NULL) {
        ESP_LOGE(TAG, "Vending request queue not initialized");
        return false;
    }
    
    // Don't check if busy - let the queue handle sequential processing
    
    // Prepare vending request
    VendingRequest request;
    memcpy(request.positions, positions, sizeof(int) * position_count);
    request.position_count = position_count;
    safe_strcpy(request.order_id, order_id, sizeof(request.order_id));
    safe_strcpy(request.item_position, item_position, sizeof(request.item_position));
    safe_strcpy(request.oiid, oiid, sizeof(request.oiid));
    request.is_mqtt_request = is_mqtt_request;
    
    // Store current order for response
    safe_strcpy(currentOrder.order_id, order_id, sizeof(currentOrder.order_id));
    safe_strcpy(currentOrder.item_position, item_position, sizeof(currentOrder.item_position));
    safe_strcpy(currentOrder.oiid, oiid, sizeof(currentOrder.oiid));
    currentOrder.has_active_order = true;
    
    // Send request to vending task (queue will handle sequential processing)
    if (xQueueSend(vending_request_queue, &request, pdMS_TO_TICKS(1000)) == pdTRUE) {
        ESP_LOGI(TAG, "Vending request queued successfully for %d position(s) (item: %s)", position_count, item_position);
        return true;
    } else {
        ESP_LOGE(TAG, "Failed to queue vending request - queue full");
        currentOrder.has_active_order = false;
        return false;
    }
}
```

```c
if (vending_request_queue == NULL) {
    ESP_LOGE(TAG, "Vending request queue not initialized");
    return false;
}
```

```c
VendingRequest request;
memcpy(request.positions, positions, sizeof(int) * position_count);
request.position_count = position_count;
safe_strcpy(request.order_id, order_id, sizeof(request.order_id));
safe_strcpy(request.item_position, item_position, sizeof(request.item_position));
safe_strcpy(request.oiid, oiid, sizeof(request.oiid));
request.is_mqtt_request = is_mqtt_request;
```

```c
typedef struct {
    int positions[13];        // Array of positions to vend
    int position_count;       // Number of positions
    // sensor_enabled is now managed through configuration, not per-request
    char order_id[64];        // Order ID for response
    char item_position[8];    // Item position string
    char oiid[64];           // Order item ID
    bool is_mqtt_request;     // True if from MQTT, false if from serial
} VendingRequest;
```

```c
safe_strcpy(currentOrder.order_id, order_id, sizeof(currentOrder.order_id));
safe_strcpy(currentOrder.item_position, item_position, sizeof(currentOrder.item_position));
safe_strcpy(currentOrder.oiid, oiid, sizeof(currentOrder.oiid));
currentOrder.has_active_order = true;
```

```c
typedef struct {
    char order_id[64];        // Unique order identifier from cloud
    char item_position[8];    // Item position (e.g., "01", "02", etc.)
    char oiid[64];           // Order item ID from cloud
    bool has_active_order;    // Flag indicating if an order is currently being processed
} CurrentOrder;
```

```c
if (xQueueSend(vending_request_queue, &request, pdMS_TO_TICKS(1000)) == pdTRUE) {
    ESP_LOGI(TAG, "Vending request queued successfully for %d position(s) (item: %s)", position_count, item_position);
    return true;
} else {
    ESP_LOGE(TAG, "Failed to queue vending request - queue full");
    currentOrder.has_active_order = false;
    return false;
}
```

```plaintext
┌─────────────────────────────────────────────────────────────┐
│  CORE 1 (APP_CPU) - Network & Application                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ process_vending_request()                             │  │
│  │   └─ send_vending_request_async()                    │  │
│  │       └─ xQueueSend(vending_request_queue, ...) ────┐  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                                                          │
                                    FreeRTOS Queue (50 items)
                                                          │
                                                          ↓
┌─────────────────────────────────────────────────────────────┐
│  CORE 0 (PRO_CPU) - Real-Time Hardware Control             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ vending_execution_task() (Priority 6)                │  │
│  │   └─ xQueueReceive(vending_request_queue, ...)       │  │
│  │       └─ request_vend(positions, count)              │  │
│  │           └─ Motor control + sensor monitoring      │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

```c
static void safe_strcpy(char* dest, const char* src, size_t dest_size) {
    strncpy(dest, src, dest_size - 1);
    dest[dest_size - 1] = '\0';
}
```

```c
static void vending_execution_task(void *pvParameters) {
    
    VendingRequest request;
    
    while (1) {
        // Wait for vending request from queue
        if (xQueueReceive(vending_request_queue, &request, portMAX_DELAY) == pdTRUE) {
            bool sensor_enabled = config_manager_get_sensor_enabled();
            ESP_LOGI(TAG, "Received vending request for %d position(s), sensor: %s (item: %s)", 
                    request.position_count, sensor_enabled ? "enabled" : "disabled", request.item_position);
            
            // Execute the vending cycle
            bool vend_result = request_vend(request.positions, request.position_count);
            
            log_vend_operation("Vending execution completed", request.item_position, vend_result, NULL);
            
            // Send immediate response for this item
            vend_result_t result = get_last_vend_result();
            char response_code_buffer[64];
            
            vend_result_summary_t summary = {
                .success = result.success,
                .nudges_used = get_last_nudges_used(),
                .drops_detected = get_last_drops_detected(),
                .sensor_enabled = sensor_enabled,
                .sensor_blocked = result.sensor_blocked,
                .motor_stopped = result.motor_stopped,
                .timeout_occurred = result.timeout_occurred
            };
            
            const char* response_code = generate_response_code(&summary, response_code_buffer, sizeof(response_code_buffer));
            
            // Send response immediately for this item
            send_vending_response(request.item_position, result.success, request.order_id, request.oiid, response_code);
            log_vend_operation("Sent immediate response", request.item_position, true, response_code);
        }
    }
}
```

```c
// Don't check if busy - let the queue handle sequential processing
```

```c
// Example: Vending combo product from 3 positions
int positions[] = {23, 34, 45};
int position_count = 3;
const char* order_id = "ORD-12345";
const char* item_position = "23";
const char* oiid = "COMBO-001";
bool is_mqtt = true;

bool queued = send_vending_request_async(
    positions, 
    position_count, 
    order_id, 
    item_position, 
    oiid, 
    is_mqtt
);

if (queued) {
    ESP_LOGI(TAG, "Request queued - will vend from positions 23, 34, 45");
} else {
    ESP_LOGE(TAG, "Failed to queue - system busy or queue full");
}
```

---

**User**

vending_execution_task explain this func 

---

**Cursor**


Reviewing `vending_execution_task` to explain its functionality.



Checking the structure definitions:



# `vending_execution_task()` - Function Explanation

## Function overview

This is the main real-time task that runs on Core 0 (PRO_CPU) and handles all hardware vending operations. It processes queued vending requests and executes them with precise timing.

```752:789:satron-board/main/main.c
static void vending_execution_task(void *pvParameters) {
    
    VendingRequest request;
    
    while (1) {
        // Wait for vending request from queue
        if (xQueueReceive(vending_request_queue, &request, portMAX_DELAY) == pdTRUE) {
            bool sensor_enabled = config_manager_get_sensor_enabled();
            ESP_LOGI(TAG, "Received vending request for %d position(s), sensor: %s (item: %s)", 
                    request.position_count, sensor_enabled ? "enabled" : "disabled", request.item_position);
            
            // Execute the vending cycle
            bool vend_result = request_vend(request.positions, request.position_count);
            
            log_vend_operation("Vending execution completed", request.item_position, vend_result, NULL);
            
            // Send immediate response for this item
            vend_result_t result = get_last_vend_result();
            char response_code_buffer[64];
            
            vend_result_summary_t summary = {
                .success = result.success,
                .nudges_used = get_last_nudges_used(),
                .drops_detected = get_last_drops_detected(),
                .sensor_enabled = sensor_enabled,
                .sensor_blocked = result.sensor_blocked,
                .motor_stopped = result.motor_stopped,
                .timeout_occurred = result.timeout_occurred
            };
            
            const char* response_code = generate_response_code(&summary, response_code_buffer, sizeof(response_code_buffer));
            
            // Send response immediately for this item
            send_vending_response(request.item_position, result.success, request.order_id, request.oiid, response_code);
            log_vend_operation("Sent immediate response", request.item_position, true, response_code);
        }
    }
}
```

---

## Task characteristics

### Core assignment: Core 0 (PRO_CPU)

```302:312:satron-board/main/main.c
    // Create vending execution task on Core 0 (PRO_CPU)
    // This task handles all motor control and sensor operations requiring real-time precision
    xTaskCreatePinnedToCore(
        vending_execution_task,           // Task function
        "vending_exec",                   // Task name for debugging
        8192,                            // Stack size (8KB) - needs space for sensor data
        NULL,                            // Task parameters
        6,                              // Priority 6 (HIGHEST) - hardware operations are critical
        &vending_execution_task_handle,  // Task handle for monitoring
        0                               // Core 0 (PRO_CPU) - dedicated real-time core
    );
```

Why Core 0:
- Real-time hardware control (motors, sensors, ADC)
- Precise timing for shift register operations
- Uninterrupted by network/app tasks on Core 1
- Priority 6 (highest) for critical hardware operations

---

## Step-by-step flow

### Step 1: Infinite loop and queue receive (Lines 756-758)

```c
while (1) {
    if (xQueueReceive(vending_request_queue, &request, portMAX_DELAY) == pdTRUE) {
```

- Infinite loop: task runs continuously
- Blocks on queue: `portMAX_DELAY` waits indefinitely for a request
- Receives `VendingRequest` from Core 1 via FreeRTOS queue
- Thread-safe: queue handles synchronization

VendingRequest structure:
```119:127:satron-board/main/main.c
typedef struct {
    int positions[13];        // Array of positions to vend
    int position_count;       // Number of positions
    // sensor_enabled is now managed through configuration, not per-request
    char order_id[64];        // Order ID for response
    char item_position[8];    // Item position string
    char oiid[64];           // Order item ID
    bool is_mqtt_request;     // True if from MQTT, false if from serial
} VendingRequest;
```

---

### Step 2: Get sensor configuration (Line 759)

```c
bool sensor_enabled = config_manager_get_sensor_enabled();
```

- Reads drop sensor state from NVS configuration
- Used for response code generation
- Can be overridden per-order (handled in `process_vending_request`)

---

### Step 3: Log request received (Lines 760-761)

```c
ESP_LOGI(TAG, "Received vending request for %d position(s), sensor: %s (item: %s)", 
        request.position_count, sensor_enabled ? "enabled" : "disabled", request.item_position);
```

- Logs position count, sensor state, and item position
- Useful for debugging and monitoring

---

### Step 4: Execute vending cycle (Line 764)

```c
bool vend_result = request_vend(request.positions, request.position_count);
```

This is the core hardware operation. `request_vend()`:
- Validates parameters (positions, count)
- Checks if system is busy (rejects if already vending)
- Sets `vending_in_progress = true`
- Calls `execute_vend_cycle()` which:
  - Activates motors via shift registers
  - Waits for motor completion (reads ADC feedback)
  - Monitors drop sensor (if enabled)
  - Handles nudges/retries if needed
- Sets `vending_in_progress = false`
- Updates `last_vend_result` with detailed results
- Returns `true` if successful, `false` if failed

This function blocks until the vend completes (typically 2-10 seconds).

---

### Step 5: Log execution completion (Line 766)

```c
log_vend_operation("Vending execution completed", request.item_position, vend_result, NULL);
```

Helper function:
```199:202:satron-board/main/main.c
static void log_vend_operation(const char* operation, const char* item_position, bool success, const char* details) {
    ESP_LOGI(TAG, "%s for item %s: %s%s%s", operation, item_position, success ? "SUCCESS" : "FAILURE", details ? " - " : "", 
            details ? details : "");
}
```

---

### Step 6: Get detailed results (Line 769)

```c
vend_result_t result = get_last_vend_result();
```

`vend_result_t` structure (from vending.h):
```96:102:satron-board/main/vending.h
typedef struct {
    bool success;           // Whether the vend was successful
    uint32_t items_count;   // Number of items detected by drop sensor
    bool motor_stopped;     // Whether motor was stopped by limit switch
    bool timeout_occurred;  // Whether a timeout occurred during vending
    bool sensor_blocked;    // Whether IR sensors were blocked before vend started
} vend_result_t;
```

---

### Step 7: Build result summary (Lines 772-780)

```c
vend_result_summary_t summary = {
    .success = result.success,
    .nudges_used = get_last_nudges_used(),
    .drops_detected = get_last_drops_detected(),
    .sensor_enabled = sensor_enabled,
    .sensor_blocked = result.sensor_blocked,
    .motor_stopped = result.motor_stopped,
    .timeout_occurred = result.timeout_occurred
};
```

`vend_result_summary_t` structure:
```151:159:satron-board/main/main.c
typedef struct {
    bool success;
    int nudges_used;
    int drops_detected;
    bool sensor_enabled;
    bool sensor_blocked;
    bool motor_stopped;
    bool timeout_occurred;
} vend_result_summary_t;
```

Additional data:
- `nudges_used`: Number of retry attempts (motor nudges)
- `drops_detected`: Items detected by drop sensor
- Other fields from `vend_result_t`

---

### Step 8: Generate response code (Line 782)

```c
const char* response_code = generate_response_code(&summary, response_code_buffer, sizeof(response_code_buffer));
```

`generate_response_code()` creates descriptive response codes:

Success codes:
- `"VEND_SUCCESS"` - Basic success
- `"VEND_SUCCESS_ITEMS_2"` - Multiple items detected
- `"VEND_SUCCESS_NUDGES_3"` - Required nudges
- `"VEND_SUCCESS_ITEMS_2_NUDGES_3"` - Multiple items + nudges

Failure codes:
- `"VEND_FAILED_IR_SENSOR_BLOCKED"` - Sensor blocked before vend
- `"VEND_FAILED_3_NUDGES"` - Failed after nudges
- `"VEND_FAILED_MOTOR_TIMEDOUT"` - Motor didn't stop in time
- `"VEND_FAILED_MOTOR_FAILED"` - Motor didn't stop
- `"VEND_FAILED_TIMEOUT"` - General timeout
- `"VEND_FAILED"` - Generic failure

---

### Step 9: Send response (Line 785)

```c
send_vending_response(request.item_position, result.success, request.order_id, request.oiid, response_code);
```

This function:
- Routes to MQTT or Serial based on communication mode
- Sends JSON response with order details
- Notifies caller (cloud/server) of completion

---

### Step 10: Log response sent (Line 786)

```c
log_vend_operation("Sent immediate response", request.item_position, true, response_code);
```

---

## Architecture diagram

```
┌─────────────────────────────────────────────────────────────┐
│  CORE 1 (APP_CPU) - Network & Application                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ process_vending_request()                             │  │
│  │   └─ send_vending_request_async()                    │  │
│  │       └─ xQueueSend(vending_request_queue, ...) ────┐  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                                                          │
                                    FreeRTOS Queue (50 items)
                                                          │
                                                          ↓
┌─────────────────────────────────────────────────────────────┐
│  CORE 0 (PRO_CPU) - Real-Time Hardware Control             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ vending_execution_task() [Priority 6]                │  │
│  │   └─ xQueueReceive(vending_request_queue, ...)       │  │
│  │       └─ request_vend(positions, count)              │  │
│  │           ├─ execute_vend_cycle()                    │  │
│  │           │   ├─ activateMotor() [shift registers]  │  │
│  │           │   ├─ wait_for_motor_completion() [ADC]   │  │
│  │           │   ├─ clearAllMotors()                   │  │
│  │           │   └─ wait_for_drop_sensor() [GPIO]      │  │
│  │           └─ Updates last_vend_result                │  │
│  │       └─ get_last_vend_result()                     │  │
│  │       └─ generate_response_code()                    │  │
│  │       └─ send_vending_response()                    │  │
│  │           ├─ mqttPublishOrderItemResponse() [MQTT]   │  │
│  │           └─ serialSendResponse() [Serial]         │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Design decisions

### 1. Immediate response (not deferred)
- Response is sent immediately after vend completes
- No separate monitoring task needed for this path
- Lower latency for caller

### 2. Sequential processing
- Queue ensures one vend at a time
- No concurrent motor operations
- Prevents hardware conflicts

### 3. Detailed result tracking
- Captures nudges, drops, timeouts, sensor state
- Enables detailed response codes
- Useful for diagnostics

### 4. Core 0 isolation
- Network tasks on Core 1 don't affect motor timing
- Real-time guarantees for hardware
- Prevents jitter in motor control

---

## Example execution flow

Request:
- Positions: `[23, 34]`
- Order ID: `"ORD-12345"`
- Item Position: `"23"`
- OIID: `"ITEM-001"`

Execution:
1. Task receives request from queue
2. Logs: "Received vending request for 2 position(s), sensor: enabled (item: 23)"
3. Calls `request_vend([23, 34], 2)`
   - Vends position 23 (motor runs, detects drop)
   - Vends position 34 (motor runs, detects drop)
   - Both successful
4. Gets result: `{success: true, items_count: 2, ...}`
5. Builds summary: `{success: true, drops_detected: 2, nudges_used: 0, ...}`
6. Generates code: `"VEND_SUCCESS_ITEMS_2"`
7. Sends response: MQTT/Serial with success status
8. Logs: "Sent immediate response for item 23: SUCCESS - VEND_SUCCESS_ITEMS_2"
9. Loops back to wait for next request

---

## Error handling

| Scenario | Handling |
|----------|----------|
| Queue receive fails | Task blocks indefinitely (shouldn't happen) |
| `request_vend()` fails | `vend_result.success = false`, response sent with failure code |
| Motor timeout | `timeout_occurred = true`, generates `VEND_FAILED_MOTOR_TIMEDOUT` |
| Sensor blocked | `sensor_blocked = true`, generates `VEND_FAILED_IR_SENSOR_BLOCKED` |
| Response send fails | Logged but doesn't crash task |

---

## Performance characteristics

- Priority: 6 (highest)
- Stack: 8KB
- Blocking: Yes (waits for motor completion)
- Typical execution: 2-10 seconds per vend
- Throughput: ~6-30 vends/minute (depends on motor speed)

---

## Summary

`vending_execution_task()` is the real-time hardware control task that:
- Runs on Core 0 with highest priority
- Processes queued vending requests sequentially
- Executes motor control with precise timing
- Monitors sensors and handles errors
- Generates detailed response codes
- Sends immediate responses to callers

It ensures reliable, real-time vending operations isolated from network/app tasks.

```c
static void vending_execution_task(void *pvParameters) {
    
    VendingRequest request;
    
    while (1) {
        // Wait for vending request from queue
        if (xQueueReceive(vending_request_queue, &request, portMAX_DELAY) == pdTRUE) {
            bool sensor_enabled = config_manager_get_sensor_enabled();
            ESP_LOGI(TAG, "Received vending request for %d position(s), sensor: %s (item: %s)", 
                    request.position_count, sensor_enabled ? "enabled" : "disabled", request.item_position);
            
            // Execute the vending cycle
            bool vend_result = request_vend(request.positions, request.position_count);
            
            log_vend_operation("Vending execution completed", request.item_position, vend_result, NULL);
            
            // Send immediate response for this item
            vend_result_t result = get_last_vend_result();
            char response_code_buffer[64];
            
            vend_result_summary_t summary = {
                .success = result.success,
                .nudges_used = get_last_nudges_used(),
                .drops_detected = get_last_drops_detected(),
                .sensor_enabled = sensor_enabled,
                .sensor_blocked = result.sensor_blocked,
                .motor_stopped = result.motor_stopped,
                .timeout_occurred = result.timeout_occurred
            };
            
            const char* response_code = generate_response_code(&summary, response_code_buffer, sizeof(response_code_buffer));
            
            // Send response immediately for this item
            send_vending_response(request.item_position, result.success, request.order_id, request.oiid, response_code);
            log_vend_operation("Sent immediate response", request.item_position, true, response_code);
        }
    }
}
```

```c
    // Create vending execution task on Core 0 (PRO_CPU)
    // This task handles all motor control and sensor operations requiring real-time precision
    xTaskCreatePinnedToCore(
        vending_execution_task,           // Task function
        "vending_exec",                   // Task name for debugging
        8192,                            // Stack size (8KB) - needs space for sensor data
        NULL,                            // Task parameters
        6,                              // Priority 6 (HIGHEST) - hardware operations are critical
        &vending_execution_task_handle,  // Task handle for monitoring
        0                               // Core 0 (PRO_CPU) - dedicated real-time core
    );
```

```c
while (1) {
    if (xQueueReceive(vending_request_queue, &request, portMAX_DELAY) == pdTRUE) {
```

```c
typedef struct {
    int positions[13];        // Array of positions to vend
    int position_count;       // Number of positions
    // sensor_enabled is now managed through configuration, not per-request
    char order_id[64];        // Order ID for response
    char item_position[8];    // Item position string
    char oiid[64];           // Order item ID
    bool is_mqtt_request;     // True if from MQTT, false if from serial
} VendingRequest;
```

```c
bool sensor_enabled = config_manager_get_sensor_enabled();
```

```c
ESP_LOGI(TAG, "Received vending request for %d position(s), sensor: %s (item: %s)", 
        request.position_count, sensor_enabled ? "enabled" : "disabled", request.item_position);
```

```c
bool vend_result = request_vend(request.positions, request.position_count);
```

```c
log_vend_operation("Vending execution completed", request.item_position, vend_result, NULL);
```

```c
static void log_vend_operation(const char* operation, const char* item_position, bool success, const char* details) {
    ESP_LOGI(TAG, "%s for item %s: %s%s%s", operation, item_position, success ? "SUCCESS" : "FAILURE", details ? " - " : "", 
            details ? details : "");
}
```

```c
vend_result_t result = get_last_vend_result();
```

```plaintext
typedef struct {
    bool success;           // Whether the vend was successful
    uint32_t items_count;   // Number of items detected by drop sensor
    bool motor_stopped;     // Whether motor was stopped by limit switch
    bool timeout_occurred;  // Whether a timeout occurred during vending
    bool sensor_blocked;    // Whether IR sensors were blocked before vend started
} vend_result_t;
```

```c
vend_result_summary_t summary = {
    .success = result.success,
    .nudges_used = get_last_nudges_used(),
    .drops_detected = get_last_drops_detected(),
    .sensor_enabled = sensor_enabled,
    .sensor_blocked = result.sensor_blocked,
    .motor_stopped = result.motor_stopped,
    .timeout_occurred = result.timeout_occurred
};
```

```c
typedef struct {
    bool success;
    int nudges_used;
    int drops_detected;
    bool sensor_enabled;
    bool sensor_blocked;
    bool motor_stopped;
    bool timeout_occurred;
} vend_result_summary_t;
```

```c
const char* response_code = generate_response_code(&summary, response_code_buffer, sizeof(response_code_buffer));
```

```c
send_vending_response(request.item_position, result.success, request.order_id, request.oiid, response_code);
```

```c
log_vend_operation("Sent immediate response", request.item_position, true, response_code);
```

```plaintext
┌─────────────────────────────────────────────────────────────┐
│  CORE 1 (APP_CPU) - Network & Application                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ process_vending_request()                             │  │
│  │   └─ send_vending_request_async()                    │  │
│  │       └─ xQueueSend(vending_request_queue, ...) ────┐  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                                                          │
                                    FreeRTOS Queue (50 items)
                                                          │
                                                          ↓
┌─────────────────────────────────────────────────────────────┐
│  CORE 0 (PRO_CPU) - Real-Time Hardware Control             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ vending_execution_task() [Priority 6]                │  │
│  │   └─ xQueueReceive(vending_request_queue, ...)       │  │
│  │       └─ request_vend(positions, count)              │  │
│  │           ├─ execute_vend_cycle()                    │  │
│  │           │   ├─ activateMotor() [shift registers]  │  │
│  │           │   ├─ wait_for_motor_completion() [ADC]   │  │
│  │           │   ├─ clearAllMotors()                   │  │
│  │           │   └─ wait_for_drop_sensor() [GPIO]      │  │
│  │           └─ Updates last_vend_result                │  │
│  │       └─ get_last_vend_result()                     │  │
│  │       └─ generate_response_code()                    │  │
│  │       └─ send_vending_response()                    │  │
│  │           ├─ mqttPublishOrderItemResponse() [MQTT]   │  │
│  │           └─ serialSendResponse() [Serial]         │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

**User**

execute_vend_cycle

---

**Cursor**


Searching for `execute_vend_cycle` in `vending.c` to explain its functionality.



Reading the full function:



Reading the rest of the function to see the final result handling:



# `execute_vend_cycle()` - Function Explanation

## Function overview

This function executes a complete vending cycle for one or more positions. It handles motor control, sensor monitoring, nudges, and result reporting.

```782:1178:satron-board/main/vending.c
static bool execute_vend_cycle(int* positions, int position_count) {
    // ... complete implementation ...
}
```

---

## Function signature

```c
static bool execute_vend_cycle(int* positions, int position_count)
```

Parameters:
- `positions`: Array of motor positions (e.g., `[23, 34, 45]`)
- `position_count`: Number of positions (1-13)

Returns:
- `true`: Vend cycle completed (may still be a failure if sensor blocked)
- `false`: Should not occur (function always returns `true` or exits early)

---

## Step-by-step flow

### STEP 0: Initialization & Pre-Vend Checks (Lines 783-804)

```c
bool sensor_enabled = config_manager_get_sensor_enabled();
init_vend_cycle_state(positions, position_count);

// Pre-vend sensor check
if (!handle_pre_vend_sensors(sensor_enabled)) {
    // Sensor blocked - abort immediately
    return true; // Cycle executed but failed
}
```

What happens:
1. Gets sensor configuration from NVS
2. Initializes state (resets feedback, drop counts, etc.)
3. Checks if IR sensors are blocked before starting
4. Starts global drop sensor monitoring task (if enabled)

If sensors are blocked: Returns `true` immediately with `sensor_blocked = true`

---

### STEP 1: Activate Motors Simultaneously (Lines 806-816)

```c
// Setup shift register data for all positions
uint8_t colData[2];
uint8_t rowData;
setup_motor_shift_data(positions, position_count, colData, &rowData);

// Update shift registers once with ALL motors activated
updateShiftRegisters(rowData, colData);
printOnOled("Rotating Motors", 2);
```

What happens:
- Converts positions to row/column bit patterns
- Updates shift registers to activate all motors at once
- Motors run in parallel (not sequential)

Example: Positions `[23, 34]` → Row 2, Col 3 + Row 3, Col 4 activate together

---

### STEP 2: Monitor Motor & Drop Sensor (Lines 818-879)

```c
TickType_t start_time = xTaskGetTickCount();
uint32_t motor_timeout_ms = get_motor_timeout_ms();

// Main monitoring loop
while ((xTaskGetTickCount() - start_time) < timeout_ticks) {
    // Check motor feedback
    if (!motor_completed && check_all_rows_motor_feedback_complete(...)) {
        motor_completed = true;
        clearAllMotors();
        break;
    }
    
    // Check drop sensor (if enabled)
    if (sensor_enabled) {
        total_drops_detected = get_global_drop_transition_count();
        if (total_drops_detected > 0) {
            drop_detected = true;
            // Display "Item Detected" on OLED
        }
    }
    
    // Yield periodically
    if (main_loop_iteration % 50 == 0) {
        taskYIELD();
    }
    
    // Polling delay (1ms for Atlas, 5ms for others)
    vTaskDelay(...);
}
```

What happens:
- Polls motor feedback (ADC readings) to detect completion
- Monitors drop sensor transitions (if enabled)
- Exits when motor completes or timeout occurs
- Motor continues even if drop detected early (waits for feedback)

Motor timeout values:
- Atlas: 2500ms
- Titan: 2500ms
- Bench: 3500ms
- Wendor: 2500ms (+ 200ms margin)

---

### STEP 3: Handle Timeout (Lines 881-887)

```c
if (!motor_completed) {
    clearAllMotors();
    reset_atlas_motor_feedback_state();
    ESP_LOGW(VENDING_TAG, "Motor operation timed out");
    printOnOled("Motor Timeout", 2);
}
```

What happens:
- Stops motors if timeout occurred
- Resets feedback state
- Logs timeout warning

---

### STEP 4: Nudge System (Lines 889-1046)

```c
int nudges_used = 0;
bool nudges_enabled = config_manager_get_nudges_enabled();
uint8_t max_nudges = config_manager_get_nudge_count();

if (sensor_enabled && nudges_enabled && !drop_detected && motor_completed) {
    // Perform nudges
    for (int nudge = 1; nudge <= max_nudges; nudge++) {
        // Check if drop detected before nudge
        if (get_global_drop_transition_count() > 0) {
            drop_detected = true;
            break; // Stop nudging
        }
        
        // Reactivate motors
        updateShiftRegisters(rowData, colData);
        
        // Rotate for nudge duration
        // Check feedback during rotation
        // Check drop sensor during rotation
        
        // Stop motors
        clearAllMotors();
        
        // Wait between nudges
        vTaskDelay(pdMS_TO_TICKS(NUDGE_WAIT_TIME_MS));
        
        nudges_used = nudge;
    }
}
```

What happens:
- Runs only if: sensor enabled, nudges enabled, no drop detected, motor completed
- Performs up to `max_nudges` (configurable, typically 1-5)
- Each nudge:
  1. Checks drop sensor before starting
  2. Reactivates motors
  3. Rotates for nudge duration (360-500ms depending on motor type)
  4. Monitors feedback and drop sensor during rotation
  5. Stops motors
  6. Waits 500ms before next nudge
- Stops early if drop detected or motor feedback indicates completion

Nudge rotation times:
- Atlas: 360ms
- Titan: 400ms
- Bench: 500ms
- Wendor: 400ms

---

### STEP 4.5: Late Drop Detection Wait (Lines 1048-1089)

```c
if (sensor_enabled) {
    // Wait for late drop sensor detection
    TickType_t wait_start = xTaskGetTickCount();
    while ((xTaskGetTickCount() - wait_start) < wait_ticks) {
        total_drops_detected = get_global_drop_transition_count();
        if (total_drops_detected > 0) {
            drop_detected = true;
            // Display "Late Item Detected"
        }
        vTaskDelay(50 / portTICK_PERIOD_MS); // Check every 50ms
    }
}
```

What happens:
- Waits additional time (typically 2 seconds) for late drops
- Catches items that fall after motor stops
- Continues monitoring global drop sensor transitions

---

### STEP 5: Determine Success/Failure (Lines 1095-1128)

```c
if (sensor_enabled) {
    // Success only if drop sensor detected transitions
    int final_transition_count = get_global_drop_transition_count();
    if (drop_detected && final_transition_count > 0) {
        total_vended_count += final_transition_count;
        vend_successful = true;
    } else {
        vend_successful = false;
    }
} else {
    // Sensor disabled: success based on motor completion
    if (motor_completed) {
        if (is_wendor_motor()) {
            // Wendor: timeout-based completion is OK
            vend_successful = true;
        } else {
            // Non-Wendor: timeout completion = failure
            if (last_motor_completion_was_timeout) {
                vend_successful = false;
            } else {
                vend_successful = true;
            }
        }
    }
}
```

Success criteria:

| Sensor Enabled | Motor Completed | Drop Detected | Result |
|----------------|-----------------|---------------|--------|
| ✅ Yes | ✅ Yes | ✅ Yes | ✅ **SUCCESS** |
| ✅ Yes | ✅ Yes | ❌ No | ❌ **FAILURE** |
| ✅ Yes | ❌ No (timeout) | ❌ No | ❌ **FAILURE** |
| ❌ No | ✅ Yes (feedback) | N/A | ✅ **SUCCESS** |
| ❌ No | ✅ Yes (timeout) | N/A | ❌ **FAILURE** (except Wendor) |
| ❌ No | ❌ No | N/A | ❌ **FAILURE** |

---

### STEP 6: Update Result & Cleanup (Lines 1131-1177)

```c
// Update result structure
last_vend_result.success = vend_successful;
last_vend_result.items_count = total_drops_detected;
last_vend_result.motor_stopped = motor_completed;
last_vend_result.timeout_occurred = !motor_completed;

// Store nudges and drops for response
last_nudges_used = nudges_used;
last_drops_detected = total_drops_detected;

// Final logging
ESP_LOGI(VENDING_TAG, "========== VEND CYCLE END ==========");
ESP_LOGI(VENDING_TAG, "Result: %s", vend_successful ? "SUCCESS" : "FAILURE");

// Display final result on OLED
format_vend_result_message(final_msg, ...);
printOnOled(final_msg, 1);

// Stop drop sensor monitoring
if (sensor_enabled) {
    stop_global_drop_sensor_monitoring();
}

// Reset state for next cycle
current_vend_position = -1;
reset_atlas_motor_feedback_state();
resetMotorFeedbackStateForRow(active_row);

return vend_successful;
```

What happens:
- Updates `last_vend_result` with final status
- Stores nudges used and drops detected
- Logs detailed summary
- Displays result on OLED
- Stops background monitoring tasks
- Resets all state variables
- Returns success/failure

---

## Complete flow diagram

```
┌─────────────────────────────────────────────────────────────┐
│ execute_vend_cycle(positions, count)                        │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 0: Pre-Vend Checks                                     │
│ • Get sensor config                                         │
│ • Initialize state                                          │
│ • Check if sensors blocked                                  │
│ • Start drop sensor monitoring                              │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Activate Motors                                      │
│ • Convert positions → shift register data                  │
│ • Activate ALL motors simultaneously                        │
│ • Display "Rotating Motors"                                │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Monitor Loop (until timeout or completion)          │
│ • Poll motor feedback (ADC)                                 │
│ • Monitor drop sensor transitions                           │
│ • Exit when motor completes or timeout                      │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Handle Timeout (if motor didn't complete)          │
│ • Stop motors                                               │
│ • Reset feedback state                                      │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Nudge System (if needed)                            │
│ • Check conditions: sensor enabled, nudges enabled,          │
│   no drop detected, motor completed                         │
│ • For each nudge (1 to max_nudges):                         │
│   ├─ Check drop before nudge                                │
│   ├─ Reactivate motors                                      │
│   ├─ Rotate for nudge duration                             │
│   ├─ Monitor feedback & drop sensor                        │
│   ├─ Stop motors                                            │
│   └─ Wait between nudges                                    │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 4.5: Late Drop Detection Wait                          │
│ • Wait additional time (2 seconds)                           │
│ • Monitor for late drops                                    │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: Determine Success/Failure                            │
│ • Sensor enabled: success = drop detected                   │
│ • Sensor disabled: success = motor completed (not timeout)  │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 6: Update Result & Cleanup                             │
│ • Update last_vend_result                                    │
│ • Store nudges & drops                                      │
│ • Log final summary                                          │
│ • Display on OLED                                            │
│ • Stop monitoring tasks                                      │
│ • Reset state                                                │
│ • Return success/failure                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Features

### 1. Multi-position support
- Activates multiple motors simultaneously
- All positions vend in parallel

### 2. Motor type awareness
- Different timeouts per motor type
- Motor-specific feedback handling
- Wendor-specific timeout margins

### 3. Robust nudge system
- Configurable nudge count
- Stops early on drop detection
- Monitors feedback during nudges

### 4. Global drop sensor monitoring
- Background task monitors transitions
- Counts actual transitions (not just state)
- Reduces false positives from vibration

### 5. Late drop detection
- Additional wait period after motor stops
- Catches slow-falling items

### 6. Detailed result tracking
- Success/failure with reasons
- Nudges used count
- Drops detected count
- Motor completion status
- Timeout tracking

---

## Example execution

Input: `positions = [23, 34]`, `position_count = 2`, `sensor_enabled = true`

Execution:
1. Pre-check: Sensors clear ✓
2. Activate: Motors at positions 23 & 34 start simultaneously
3. Monitor: Motor feedback detected after 1.2 seconds
4. Drop sensor: Detects 1 transition during rotation
5. Motor stops: Feedback indicates completion
6. Nudges: Not needed (drop already detected)
7. Late wait: No additional drops
8. Result: `SUCCESS` - 1 item detected, 0 nudges used

Final state:
- `vend_successful = true`
- `total_drops_detected = 1`
- `nudges_used = 0`
- `motor_completed = true`
- `timeout_occurred = false`

---

## Summary

`execute_vend_cycle()` is the core vending execution function that:
- Handles multi-position vending
- Monitors motor feedback and drop sensors
- Implements a nudge system for stuck items
- Provides detailed success/failure reporting
- Supports different motor types with specific behaviors
- Includes robust error handling and state management

This function ensures reliable vending operations with comprehensive monitoring and recovery mechanisms.

```c
static bool execute_vend_cycle(int* positions, int position_count) {
    // ... complete implementation ...
}
```

```c
static bool execute_vend_cycle(int* positions, int position_count)
```

```c
bool sensor_enabled = config_manager_get_sensor_enabled();
init_vend_cycle_state(positions, position_count);

// Pre-vend sensor check
if (!handle_pre_vend_sensors(sensor_enabled)) {
    // Sensor blocked - abort immediately
    return true; // Cycle executed but failed
}
```

```c
// Setup shift register data for all positions
uint8_t colData[2];
uint8_t rowData;
setup_motor_shift_data(positions, position_count, colData, &rowData);

// Update shift registers once with ALL motors activated
updateShiftRegisters(rowData, colData);
printOnOled("Rotating Motors", 2);
```

```c
TickType_t start_time = xTaskGetTickCount();
uint32_t motor_timeout_ms = get_motor_timeout_ms();

// Main monitoring loop
while ((xTaskGetTickCount() - start_time) < timeout_ticks) {
    // Check motor feedback
    if (!motor_completed && check_all_rows_motor_feedback_complete(...)) {
        motor_completed = true;
        clearAllMotors();
        break;
    }
    
    // Check drop sensor (if enabled)
    if (sensor_enabled) {
        total_drops_detected = get_global_drop_transition_count();
        if (total_drops_detected > 0) {
            drop_detected = true;
            // Display "Item Detected" on OLED
        }
    }
    
    // Yield periodically
    if (main_loop_iteration % 50 == 0) {
        taskYIELD();
    }
    
    // Polling delay (1ms for Atlas, 5ms for others)
    vTaskDelay(...);
}
```

```c
if (!motor_completed) {
    clearAllMotors();
    reset_atlas_motor_feedback_state();
    ESP_LOGW(VENDING_TAG, "Motor operation timed out");
    printOnOled("Motor Timeout", 2);
}
```

```c
int nudges_used = 0;
bool nudges_enabled = config_manager_get_nudges_enabled();
uint8_t max_nudges = config_manager_get_nudge_count();

if (sensor_enabled && nudges_enabled && !drop_detected && motor_completed) {
    // Perform nudges
    for (int nudge = 1; nudge <= max_nudges; nudge++) {
        // Check if drop detected before nudge
        if (get_global_drop_transition_count() > 0) {
            drop_detected = true;
            break; // Stop nudging
        }
        
        // Reactivate motors
        updateShiftRegisters(rowData, colData);
        
        // Rotate for nudge duration
        // Check feedback during rotation
        // Check drop sensor during rotation
        
        // Stop motors
        clearAllMotors();
        
        // Wait between nudges
        vTaskDelay(pdMS_TO_TICKS(NUDGE_WAIT_TIME_MS));
        
        nudges_used = nudge;
    }
}
```

```c
if (sensor_enabled) {
    // Wait for late drop sensor detection
    TickType_t wait_start = xTaskGetTickCount();
    while ((xTaskGetTickCount() - wait_start) < wait_ticks) {
        total_drops_detected = get_global_drop_transition_count();
        if (total_drops_detected > 0) {
            drop_detected = true;
            // Display "Late Item Detected"
        }
        vTaskDelay(50 / portTICK_PERIOD_MS); // Check every 50ms
    }
}
```

```c
if (sensor_enabled) {
    // Success only if drop sensor detected transitions
    int final_transition_count = get_global_drop_transition_count();
    if (drop_detected && final_transition_count > 0) {
        total_vended_count += final_transition_count;
        vend_successful = true;
    } else {
        vend_successful = false;
    }
} else {
    // Sensor disabled: success based on motor completion
    if (motor_completed) {
        if (is_wendor_motor()) {
            // Wendor: timeout-based completion is OK
            vend_successful = true;
        } else {
            // Non-Wendor: timeout completion = failure
            if (last_motor_completion_was_timeout) {
                vend_successful = false;
            } else {
                vend_successful = true;
            }
        }
    }
}
```

```c
// Update result structure
last_vend_result.success = vend_successful;
last_vend_result.items_count = total_drops_detected;
last_vend_result.motor_stopped = motor_completed;
last_vend_result.timeout_occurred = !motor_completed;

// Store nudges and drops for response
last_nudges_used = nudges_used;
last_drops_detected = total_drops_detected;

// Final logging
ESP_LOGI(VENDING_TAG, "========== VEND CYCLE END ==========");
ESP_LOGI(VENDING_TAG, "Result: %s", vend_successful ? "SUCCESS" : "FAILURE");

// Display final result on OLED
format_vend_result_message(final_msg, ...);
printOnOled(final_msg, 1);

// Stop drop sensor monitoring
if (sensor_enabled) {
    stop_global_drop_sensor_monitoring();
}

// Reset state for next cycle
current_vend_position = -1;
reset_atlas_motor_feedback_state();
resetMotorFeedbackStateForRow(active_row);

return vend_successful;
```

```plaintext
┌─────────────────────────────────────────────────────────────┐
│ execute_vend_cycle(positions, count)                        │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 0: Pre-Vend Checks                                     │
│ • Get sensor config                                         │
│ • Initialize state                                          │
│ • Check if sensors blocked                                  │
│ • Start drop sensor monitoring                              │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Activate Motors                                      │
│ • Convert positions → shift register data                  │
│ • Activate ALL motors simultaneously                        │
│ • Display "Rotating Motors"                                │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Monitor Loop (until timeout or completion)          │
│ • Poll motor feedback (ADC)                                 │
│ • Monitor drop sensor transitions                           │
│ • Exit when motor completes or timeout                      │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Handle Timeout (if motor didn't complete)          │
│ • Stop motors                                               │
│ • Reset feedback state                                      │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Nudge System (if needed)                            │
│ • Check conditions: sensor enabled, nudges enabled,          │
│   no drop detected, motor completed                         │
│ • For each nudge (1 to max_nudges):                         │
│   ├─ Check drop before nudge                                │
│   ├─ Reactivate motors                                      │
│   ├─ Rotate for nudge duration                             │
│   ├─ Monitor feedback & drop sensor                        │
│   ├─ Stop motors                                            │
│   └─ Wait between nudges                                    │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 4.5: Late Drop Detection Wait                          │
│ • Wait additional time (2 seconds)                           │
│ • Monitor for late drops                                    │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: Determine Success/Failure                            │
│ • Sensor enabled: success = drop detected                   │
│ • Sensor disabled: success = motor completed (not timeout)  │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 6: Update Result & Cleanup                             │
│ • Update last_vend_result                                    │
│ • Store nudges & drops                                      │
│ • Log final summary                                          │
│ • Display on OLED                                            │
│ • Stop monitoring tasks                                      │
│ • Reset state                                                │
│ • Return success/failure                                     │
└─────────────────────────────────────────────────────────────┘
```

---

**User**

@vending.c (789-804) 



explaing this flow deep down what is happning line by line 

---

**Cursor**


Reviewing helper functions to explain lines 789-804 line by line.



Checking `resetMotorFeedbackStateForRow` to complete the explanation:



# Line-by-line explanation: Lines 789-804

## Context

This section initializes the vend cycle state, sets up tracking variables, and performs a pre-vend sensor check before starting motors.

---

## Line 789: Initialize vend cycle state

```c
init_vend_cycle_state(positions, position_count);
```

What happens:
- Calls `init_vend_cycle_state()` to reset state for a new vend cycle.

Inside `init_vend_cycle_state()` (lines 696-713):

```696:713:satron-board/main/vending.c
static void init_vend_cycle_state(int* positions, int position_count) {
    current_vend_position = positions[0];
    int active_row = positions[0] / 100;
    
    resetMotorFeedbackStateForRow(active_row);
    
    if (is_atlas_motor()) {
        atlasFeedbackWasHigh = false;
        atlasFeedbackLastClickTime = 0;
        atlasFeedbackStartTime = xTaskGetTickCount() * portTICK_PERIOD_MS;
        atlasFeedbackPulseLatched = false;
    }
    
    memset(&last_vend_result, 0, sizeof(last_vend_result));
    last_motor_completion_was_timeout = false;
    drop_sensor_previous_state = false;
    drop_transition_count = 0;
}
```

Details:
1. `current_vend_position = positions[0]` — Stores the first position (e.g., `23`).
2. `int active_row = positions[0] / 100` — Extracts row (e.g., `23 / 100 = 0` → row 0, but typically stored as row 1-8, so `23` → row 2).
3. `resetMotorFeedbackStateForRow(active_row)` — Resets motor feedback state for the row:
   - `first_click_detected = false`
   - `was_clicked = false`
   - `motor_cycle_started = false`
4. Atlas-specific reset (if Atlas motor):
   - `atlasFeedbackWasHigh = false`
   - `atlasFeedbackLastClickTime = 0`
   - `atlasFeedbackStartTime = xTaskGetTickCount() * portTICK_PERIOD_MS`
   - `atlasFeedbackPulseLatched = false`
5. `memset(&last_vend_result, 0, sizeof(last_vend_result))` — Zeros the result struct.
6. `last_motor_completion_was_timeout = false`
7. `drop_sensor_previous_state = false`
8. `drop_transition_count = 0`

Why: Ensures a clean state for the new vend cycle.

---

## Line 790: Empty line

```c

```

Purpose: Visual separation.

---

## Line 791: Initialize vend success flag

```c
bool vend_successful = false;
```

What happens:
- Declares and initializes `vend_successful` to `false`.

Purpose:
- Tracks final success/failure.
- Updated later based on sensor detection and motor completion.

---

## Line 792: Initialize motor completion flag

```c
bool motor_completed = false;
```

What happens:
- Declares and initializes `motor_completed` to `false`.

Purpose:
- Tracks whether motor feedback indicates completion.
- Set to `true` when feedback detects completion.

---

## Line 793: Initialize drop detection flag

```c
bool drop_detected = false;
```

What happens:
- Declares and initializes `drop_detected` to `false`.

Purpose:
- Tracks whether the drop sensor detected an item.
- Set to `true` when transitions are detected.

---

## Line 794: Initialize drop counter

```c
int total_drops_detected = 0;
```

What happens:
- Declares and initializes `total_drops_detected` to `0`.

Purpose:
- Counts drop sensor transitions.
- Updated by the global drop sensor monitoring task.

---

## Line 795: Extract active row number

```c
int active_row = positions[0] / 100;  // Extract row number from first position
```

What happens:
- Extracts the row from the first position using integer division.

Example:
- Position `23` → `23 / 100 = 0` (but positions are typically 1-indexed, so `23` means row 2, column 3).
- Position `234` → `234 / 100 = 2` (row 2).

Position encoding:
- Format: `RRCC` (row-row-col-col)
- `23` = row 2, column 3
- `234` = row 2, column 34

Purpose:
- Identifies which row to monitor for motor feedback.
- Used for row-specific feedback state management.

Note: If multiple positions are in different rows, only the first row is used for feedback monitoring.

---

## Line 796: Empty line

```c

```

Purpose: Visual separation before STEP 0.

---

## Line 797: Comment - STEP 0

```c
// STEP 0: Pre-vend sensor check and setup
```

Purpose: Marks the pre-vend sensor check step.

---

## Line 798: Pre-vend sensor check

```c
if (!handle_pre_vend_sensors(sensor_enabled)) {
```

What happens:
- Calls `handle_pre_vend_sensors(sensor_enabled)` and checks if it returns `false`.

Inside `handle_pre_vend_sensors()` (lines 752-772):

```752:772:satron-board/main/vending.c
static bool handle_pre_vend_sensors(bool sensor_enabled) {
    if (sensor_enabled) {
        if (check_sensors_blocked_pre_vend()) {
            last_vend_result.success = false;
            last_vend_result.items_count = 0;
            last_vend_result.motor_stopped = false;
            last_vend_result.timeout_occurred = false;
            last_vend_result.sensor_blocked = true;
            
            ESP_LOGE(VENDING_TAG, "VEND FAILED: IR sensors are blocked - aborting vend cycle");
            printOnOled("Sensor Blocked", 2);
            current_vend_position = -1;
            return false;
        }
        start_global_drop_sensor_monitoring();
    } else {
        printOnOled("Sensor Disabled", 2);
        vTaskDelay(pdMS_TO_TICKS(1000));
    }
    return true;
}
```

Flow:
1. If `sensor_enabled == true`:
   - Calls `check_sensors_blocked_pre_vend()`:
     - Performs 15 ADC reads (50ms apart).
     - Counts how many indicate blocked.
     - If >50% blocked, returns `true`.
   - If blocked:
     - Sets `last_vend_result.sensor_blocked = true`.
     - Logs error, shows "Sensor Blocked" on OLED.
     - Returns `false`.
   - If not blocked:
     - Calls `start_global_drop_sensor_monitoring()`:
       - Resets drop detection flags.
       - Creates/activates the background monitoring task.
     - Returns `true`.
2. If `sensor_enabled == false`:
   - Shows "Sensor Disabled" on OLED.
   - Waits 1 second.
   - Returns `true`.

Return values:
- `true`: Sensors clear (or disabled) — proceed.
- `false`: Sensors blocked — abort.

---

## Line 799: Log sensor blocked

```c
ESP_LOGI(VENDING_TAG, "========== VEND CYCLE END (SENSOR BLOCKED) ==========");
```

What happens:
- Logs a separator line indicating the cycle ended due to blocked sensors.

Purpose:
- Clear log marker for debugging.

---

## Line 800: Log detailed failure info

```c
ESP_LOGI(VENDING_TAG, "Position%s: %d | Motor Type: %s | Sensor: %s | Result: SENSOR_BLOCKED", 
        position_count == 1 ? "" : "s", position_count, motor_type_str, sensor_enabled ? "ENABLED" : "DISABLED");
```

What happens:
- Logs a formatted line with cycle details.

Breakdown:
- `"Position%s: %d"` — Uses "Position" or "Positions" based on count.
- `position_count == 1 ? "" : "s"` — Adds "s" if count > 1.
- `position_count` — Number of positions.
- `motor_type_str` — "Atlas", "Titan", "Bench", or "Wendor".
- `sensor_enabled ? "ENABLED" : "DISABLED"` — Sensor state.

Example output:
```
Position: 1 | Motor Type: Atlas | Sensor: ENABLED | Result: SENSOR_BLOCKED
```

---

## Line 801: Log separator

```c
ESP_LOGI(VENDING_TAG, "==========================================");
```

What happens:
- Logs a separator line.

Purpose:
- Visual separator in logs.

---

## Line 802: Empty line

```c

```

Purpose: Visual separation.

---

## Line 803: Return true (cycle executed but failed)

```c
return true; // Vend cycle executed successfully, but failed due to blocked sensors
```

What happens:
- Returns `true` even though the vend failed.

Why:
- The cycle executed (pre-check ran), but failed due to blocked sensors.
- `last_vend_result.sensor_blocked = true` indicates the failure reason.
- Caller checks `last_vend_result` for actual success.

Return value semantics:
- `true`: Cycle executed (may have failed).
- `false`: Should not occur here.

---

## Line 804: End of if block

```c
}
```

What happens:
- Closes the `if (!handle_pre_vend_sensors(sensor_enabled))` block.

Flow:
- If sensors blocked → logs and returns `true`.
- If sensors clear → continues to STEP 1 (line 806).

---

## Complete flow diagram

```
Line 789: init_vend_cycle_state(positions, position_count)
    │
    ├─→ Sets current_vend_position = positions[0]
    ├─→ Calculates active_row = positions[0] / 100
    ├─→ Resets motor feedback state for active_row
    ├─→ Resets Atlas-specific variables (if Atlas motor)
    ├─→ Zeros last_vend_result structure
    └─→ Resets drop sensor tracking variables
    │
Line 790: (empty line)
    │
Line 791: bool vend_successful = false
    │
Line 792: bool motor_completed = false
    │
Line 793: bool drop_detected = false
    │
Line 794: int total_drops_detected = 0
    │
Line 795: int active_row = positions[0] / 100
    │
Line 796: (empty line)
    │
Line 797: // STEP 0: Pre-vend sensor check and setup
    │
Line 798: if (!handle_pre_vend_sensors(sensor_enabled))
    │       │
    │       ├─→ IF sensor_enabled:
    │       │   ├─→ check_sensors_blocked_pre_vend()
    │       │   │   ├─→ Performs 15 ADC reads (50ms apart)
    │       │   │   ├─→ Counts blocked readings
    │       │   │   └─→ Returns true if >50% blocked
    │       │   │
    │       │   ├─→ IF blocked:
    │       │   │   ├─→ Sets last_vend_result.sensor_blocked = true
    │       │   │   ├─→ Logs error
    │       │   │   ├─→ Shows "Sensor Blocked" on OLED
    │       │   │   └─→ Returns false
    │       │   │
    │       │   └─→ IF NOT blocked:
    │       │       ├─→ start_global_drop_sensor_monitoring()
    │       │       │   ├─→ Resets drop detection flags
    │       │       │   └─→ Creates background monitoring task
    │       │       └─→ Returns true
    │       │
    │       └─→ IF NOT sensor_enabled:
    │           ├─→ Shows "Sensor Disabled" on OLED
    │           ├─→ Waits 1 second
    │           └─→ Returns true
    │
    │       └─→ IF handle_pre_vend_sensors() returned false:
    │           │
    │           Line 799: Log "VEND CYCLE END (SENSOR BLOCKED)"
    │           │
    │           Line 800: Log detailed failure info
    │           │
    │           Line 801: Log separator
    │           │
    │           Line 802: (empty line)
    │           │
    │           Line 803: return true (cycle executed but failed)
    │           │
    │           └─→ EXIT FUNCTION
    │
    └─→ IF handle_pre_vend_sensors() returned true:
        └─→ CONTINUE TO STEP 1 (line 806)
```

---

## Summary

- Line 789: Resets all state for a new vend cycle.
- Lines 791-794: Initialize tracking flags and counters.
- Line 795: Extracts the active row from the first position.
- Line 798: Pre-vend sensor check:
  - If sensors blocked → abort and return `true` (with `sensor_blocked = true`).
  - If sensors clear → start drop sensor monitoring and continue.
- Lines 799-803: Handle blocked sensor case (log and return).

This section ensures a clean state and prevents vending if sensors are blocked before motors start.

```c
init_vend_cycle_state(positions, position_count);
```

```c
static void init_vend_cycle_state(int* positions, int position_count) {
    current_vend_position = positions[0];
    int active_row = positions[0] / 100;
    
    resetMotorFeedbackStateForRow(active_row);
    
    if (is_atlas_motor()) {
        atlasFeedbackWasHigh = false;
        atlasFeedbackLastClickTime = 0;
        atlasFeedbackStartTime = xTaskGetTickCount() * portTICK_PERIOD_MS;
        atlasFeedbackPulseLatched = false;
    }
    
    memset(&last_vend_result, 0, sizeof(last_vend_result));
    last_motor_completion_was_timeout = false;
    drop_sensor_previous_state = false;
    drop_transition_count = 0;
}
```

```c
bool vend_successful = false;
```

```c
bool motor_completed = false;
```

```c
bool drop_detected = false;
```

```c
int total_drops_detected = 0;
```

```c
int active_row = positions[0] / 100;  // Extract row number from first position
```

```c
// STEP 0: Pre-vend sensor check and setup
```

```c
if (!handle_pre_vend_sensors(sensor_enabled)) {
```

```c
static bool handle_pre_vend_sensors(bool sensor_enabled) {
    if (sensor_enabled) {
        if (check_sensors_blocked_pre_vend()) {
            last_vend_result.success = false;
            last_vend_result.items_count = 0;
            last_vend_result.motor_stopped = false;
            last_vend_result.timeout_occurred = false;
            last_vend_result.sensor_blocked = true;
            
            ESP_LOGE(VENDING_TAG, "VEND FAILED: IR sensors are blocked - aborting vend cycle");
            printOnOled("Sensor Blocked", 2);
            current_vend_position = -1;
            return false;
        }
        start_global_drop_sensor_monitoring();
    } else {
        printOnOled("Sensor Disabled", 2);
        vTaskDelay(pdMS_TO_TICKS(1000));
    }
    return true;
}
```

```c
ESP_LOGI(VENDING_TAG, "========== VEND CYCLE END (SENSOR BLOCKED) ==========");
```

```c
ESP_LOGI(VENDING_TAG, "Position%s: %d | Motor Type: %s | Sensor: %s | Result: SENSOR_BLOCKED", 
        position_count == 1 ? "" : "s", position_count, motor_type_str, sensor_enabled ? "ENABLED" : "DISABLED");
```

```plaintext
Position: 1 | Motor Type: Atlas | Sensor: ENABLED | Result: SENSOR_BLOCKED
```

```c
ESP_LOGI(VENDING_TAG, "==========================================");
```

```c
return true; // Vend cycle executed successfully, but failed due to blocked sensors
```

```c
}
```

```plaintext
Line 789: init_vend_cycle_state(positions, position_count)
    │
    ├─→ Sets current_vend_position = positions[0]
    ├─→ Calculates active_row = positions[0] / 100
    ├─→ Resets motor feedback state for active_row
    ├─→ Resets Atlas-specific variables (if Atlas motor)
    ├─→ Zeros last_vend_result structure
    └─→ Resets drop sensor tracking variables
    │
Line 790: (empty line)
    │
Line 791: bool vend_successful = false
    │
Line 792: bool motor_completed = false
    │
Line 793: bool drop_detected = false
    │
Line 794: int total_drops_detected = 0
    │
Line 795: int active_row = positions[0] / 100
    │
Line 796: (empty line)
    │
Line 797: // STEP 0: Pre-vend sensor check and setup
    │
Line 798: if (!handle_pre_vend_sensors(sensor_enabled))
    │       │
    │       ├─→ IF sensor_enabled:
    │       │   ├─→ check_sensors_blocked_pre_vend()
    │       │   │   ├─→ Performs 15 ADC reads (50ms apart)
    │       │   │   ├─→ Counts blocked readings
    │       │   │   └─→ Returns true if >50% blocked
    │       │   │
    │       │   ├─→ IF blocked:
    │       │   │   ├─→ Sets last_vend_result.sensor_blocked = true
    │       │   │   ├─→ Logs error
    │       │   │   ├─→ Shows "Sensor Blocked" on OLED
    │       │   │   └─→ Returns false
    │       │   │
    │       │   └─→ IF NOT blocked:
    │       │       ├─→ start_global_drop_sensor_monitoring()
    │       │       │   ├─→ Resets drop detection flags
    │       │       │   └─→ Creates background monitoring task
    │       │       └─→ Returns true
    │       │
    │       └─→ IF NOT sensor_enabled:
    │           ├─→ Shows "Sensor Disabled" on OLED
    │           ├─→ Waits 1 second
    │           └─→ Returns true
    │
    │       └─→ IF handle_pre_vend_sensors() returned false:
    │           │
    │           Line 799: Log "VEND CYCLE END (SENSOR BLOCKED)"
    │           │
    │           Line 800: Log detailed failure info
    │           │
    │           Line 801: Log separator
    │           │
    │           Line 802: (empty line)
    │           │
    │           Line 803: return true (cycle executed but failed)
    │           │
    │           └─→ EXIT FUNCTION
    │
    └─→ IF handle_pre_vend_sensors() returned true:
        └─→ CONTINUE TO STEP 1 (line 806)
```

---

**User**

@vending.c (772-775) 



what is this for delay 

---

**Cursor**


Reviewing the surrounding code to understand the delay's purpose.



# Purpose of the 1-second delay (Lines 772-775)

## Code context

```757:777:satron-board/main/vending.c
static bool handle_pre_vend_sensors(bool sensor_enabled) {
    if (sensor_enabled) {
        if (check_sensors_blocked_pre_vend()) {
            last_vend_result.success = false;
            last_vend_result.items_count = 0;
            last_vend_result.motor_stopped = false;
            last_vend_result.timeout_occurred = false;
            last_vend_result.sensor_blocked = true;
            
            ESP_LOGE(VENDING_TAG, "VEND FAILED: IR sensors are blocked - aborting vend cycle");
            printOnOled("Sensor Blocked", 2);
            current_vend_position = -1;
            return false;
        }
        start_global_drop_sensor_monitoring();
    } else {
        printOnOled("Sensor Disabled", 2);
        vTaskDelay(pdMS_TO_TICKS(1000));
    }
    return true;
}
```

## Purpose of the delay

The 1-second delay gives the user time to see the "Sensor Disabled" message on the OLED before the vend cycle continues.

### Why it's needed

1. OLED display timing
   - Without the delay, the message appears briefly and is quickly replaced by "Rotating Motors" (line 821).
   - The delay ensures the message is visible.

2. User feedback
   - Indicates that the sensor is disabled and the system is proceeding without sensor validation.

3. Consistency with sensor-enabled path
   - When enabled, `check_sensors_blocked_pre_vend()` takes ~750ms (15 checks × 50ms).
   - The delay roughly matches that timing.

## What happens

```
┌─────────────────────────────────────────────────────────────┐
│ handle_pre_vend_sensors(sensor_enabled = false)             │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ Line 773: printOnOled("Sensor Disabled", 2)                │
│ • OLED displays "Sensor Disabled" on line 2                 │
│ • Message appears immediately                                │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ Line 774: vTaskDelay(pdMS_TO_TICKS(1000))                   │
│ • Task yields CPU for 1000 milliseconds (1 second)          │
│ • OLED continues displaying "Sensor Disabled"                │
│ • User can read the message                                 │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ Line 776: return true                                        │
│ • Function returns, vend cycle continues                     │
│ • Next step: Activate motors (line 811)                     │
│ • OLED will change to "Rotating Motors" (line 821)         │
└─────────────────────────────────────────────────────────────┘
```

## Timing comparison

| Path | Action | Time Taken |
|------|--------|------------|
| **Sensor Enabled** | `check_sensors_blocked_pre_vend()` | ~750ms (15 checks × 50ms) |
| **Sensor Disabled** | Display message + delay | 1000ms (1 second) |

The delay is slightly longer to ensure visibility.

## What `pdMS_TO_TICKS(1000)` does

```c
vTaskDelay(pdMS_TO_TICKS(1000));
```

- Converts 1000 milliseconds to FreeRTOS tick count.
- Yields the CPU so other tasks can run.
- The task resumes after ~1 second.

## Alternative approaches (not implemented)

1. No delay: Message flashes too quickly.
2. Shorter delay (e.g., 500ms): May be too short to read.
3. Longer delay (e.g., 2000ms): Slows the vend cycle unnecessarily.

## Summary

The 1-second delay ensures the "Sensor Disabled" message is visible before the vend cycle proceeds. It provides user feedback and maintains consistent timing with the sensor-enabled path.

```c
static bool handle_pre_vend_sensors(bool sensor_enabled) {
    if (sensor_enabled) {
        if (check_sensors_blocked_pre_vend()) {
            last_vend_result.success = false;
            last_vend_result.items_count = 0;
            last_vend_result.motor_stopped = false;
            last_vend_result.timeout_occurred = false;
            last_vend_result.sensor_blocked = true;
            
            ESP_LOGE(VENDING_TAG, "VEND FAILED: IR sensors are blocked - aborting vend cycle");
            printOnOled("Sensor Blocked", 2);
            current_vend_position = -1;
            return false;
        }
        start_global_drop_sensor_monitoring();
    } else {
        printOnOled("Sensor Disabled", 2);
        vTaskDelay(pdMS_TO_TICKS(1000));
    }
    return true;
}
```

```plaintext
┌─────────────────────────────────────────────────────────────┐
│ handle_pre_vend_sensors(sensor_enabled = false)             │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ Line 773: printOnOled("Sensor Disabled", 2)                │
│ • OLED displays "Sensor Disabled" on line 2                 │
│ • Message appears immediately                                │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ Line 774: vTaskDelay(pdMS_TO_TICKS(1000))                   │
│ • Task yields CPU for 1000 milliseconds (1 second)          │
│ • OLED continues displaying "Sensor Disabled"                │
│ • User can read the message                                 │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ Line 776: return true                                        │
│ • Function returns, vend cycle continues                     │
│ • Next step: Activate motors (line 811)                     │
│ • OLED will change to "Rotating Motors" (line 821)         │
└─────────────────────────────────────────────────────────────┘
```

```c
vTaskDelay(pdMS_TO_TICKS(1000));
```

---

**User**

/explain this flow @vending.c (814-1182) 

if possiable with block diagram or flow chart 

---

**Cursor**


Explaining the flow from lines 814-1182 with block diagrams and flowcharts.



# Complete flow explanation: Lines 814-1182

## Overview

This section covers the main vending cycle: motor activation, monitoring, nudges, late detection, and result determination.

---

## High-level flow diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXECUTE_VEND_CYCLE                            │
│              (Lines 814-1182)                                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Setup & Activate Motors (814-821)                      │
│ • Convert positions → shift register data                      │
│ • Activate ALL motors simultaneously                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Monitor Loop (823-884)                                  │
│ • Poll motor feedback (ADC)                                    │
│ • Monitor drop sensor transitions                              │
│ • Exit on completion or timeout                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Handle Timeout (886-892)                               │
│ • Stop motors if timeout occurred                               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Nudge System (894-1051)                                 │
│ • If no drop detected & motor completed                        │
│ • Perform up to max_nudges attempts                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4.5: Late Drop Detection (1053-1094)                      │
│ • Wait 2.5 seconds for late drops                              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: Determine Success/Failure (1100-1133)                   │
│ • Sensor enabled: success = drop detected                      │
│ • Sensor disabled: success = motor completed                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 6: Update Results & Cleanup (1136-1182)                    │
│ • Update last_vend_result                                       │
│ • Log final summary                                             │
│ • Stop monitoring tasks                                          │
│ • Reset state                                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Detailed step-by-step flow

### STEP 1: Setup & Activate Motors (Lines 814-821)

```
┌─────────────────────────────────────────────────────────────┐
│ Line 814-815: Declare shift register data arrays           │
│   uint8_t colData[2];  // 16 columns (2 × 8 bits)          │
│   uint8_t rowData;     // 8 rows (1 × 8 bits)               │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ Line 816: setup_motor_shift_data()                          │
│   • For each position in array:                             │
│     - Extract row = position / 100                          │
│     - Extract col = position % 100                          │
│     - Convert to bit patterns based on motor type           │
│     - Set bits in colData[0], colData[1], rowData           │
│   • Result: Bit patterns ready for shift registers         │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ Line 819: updateShiftRegisters(rowData, colData)           │
│   • Shift 24 bits to 3 cascaded 74HC595 chips              │
│   • All motors activate SIMULTANEOUSLY                      │
│   • Motors start rotating                                   │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ Line 820-821: Log & Display                                 │
│   • Log: "All N motors activated simultaneously"            │
│   • OLED: "Rotating Motors"                                 │
└─────────────────────────────────────────────────────────────┘
```

Example: Positions `[23, 34]`
- Position 23 → Row 2, Col 3 → Set bit in rowData[1], colData[0][2]
- Position 34 → Row 3, Col 4 → Set bit in rowData[2], colData[0][3]
- Both motors activate at the same time

---

### STEP 2: Monitor Loop (Lines 823-884)

```
┌─────────────────────────────────────────────────────────────┐
│ Line 824-833: Setup Timeout                                 │
│   start_time = current tick count                           │
│   motor_timeout_ms = get_motor_timeout_ms()                │
│   • Atlas/Titan: 2500ms                                     │
│   • Bench: 3500ms                                           │
│   • Wendor: 2500ms + 200ms margin = 2700ms                  │
│   timeout_ticks = convert to FreeRTOS ticks                │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ Line 838: WHILE LOOP (until timeout or completion)         │
│   Condition: (current_time - start_time) < timeout_ticks   │
└─────────────────────────────────────────────────────────────┘
                    ↓
        ┌───────────────────────────┐
        │  Loop Iteration           │
        └───────────────────────────┘
                    ↓
    ┌───────────────────────────────────────────────┐
    │ Line 842: Check Motor Feedback                 │
    │   if (!motor_completed &&                     │
    │       check_all_rows_motor_feedback_complete())│
    │   • Reads ADC (MCP3208 or GPIO34)             │
    │   • Detects click pattern (2-click detection)│
    │   • Returns true when motor completes         │
    └───────────────────────────────────────────────┘
                    ↓
        ┌───────────────────────────┐
        │  Motor Completed?        │
        └───────────────────────────┘
            YES ↓              NO ↓
    ┌──────────────┐    ┌──────────────────────────┐
    │ Line 843-848 │    │ Line 853-870: Check Drop  │
    │ • Set motor_ │    │   Sensor (if enabled)     │
    │   completed  │    │ • Get transition count    │
    │   = true     │    │ • If > 0: drop_detected   │
    │ • Clear      │    │   = true                  │
    │   motors     │    │ • Display "Item Detected" │
    │ • Reset      │    │ • Continue motor (don't   │
    │   feedback   │    │   stop yet)               │
    │ • BREAK loop │    └──────────────────────────┘
    └──────────────┘                    ↓
                    ┌──────────────────────────┐
                    │ Line 874-876: Yield CPU  │
                    │ • Every 50 iterations    │
                    │ • Allow other tasks       │
                    └──────────────────────────┘
                                ↓
                    ┌──────────────────────────┐
                    │ Line 879-883: Delay      │
                    │ • Atlas: 1ms delay      │
                    │ • Others: 5ms delay      │
                    │ • Prevents CPU overload  │
                    └──────────────────────────┘
                                ↓
                    ┌──────────────────────────┐
                    │ Loop continues...        │
                    └──────────────────────────┘
```

Key points:
- Polls motor feedback every 1-5ms
- Monitors drop sensor transitions (background task)
- Exits early if motor completes
- Times out if no completion within limit

---

### STEP 3: Handle Timeout (Lines 886-892)

```
┌─────────────────────────────────────────────────────────────┐
│ Line 887: IF (!motor_completed)                             │
│   • Motor didn't complete within timeout                    │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ Line 888-891: Emergency Stop                                │
│   • clearAllMotors() - Stop all motors immediately         │
│   • reset_atlas_motor_feedback_state()                      │
│   • Log warning: "Motor operation timed out"               │
│   • OLED: "Motor Timeout"                                   │
└─────────────────────────────────────────────────────────────┘
```

---

### STEP 4: Nudge System (Lines 894-1051)

```
┌─────────────────────────────────────────────────────────────┐
│ Line 895-897: Get Nudge Configuration                      │
│   nudges_used = 0                                           │
│   nudges_enabled = config_manager_get_nudges_enabled()     │
│   max_nudges = config_manager_get_nudge_count()            │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ Line 899: IF Conditions Check                               │
│   sensor_enabled && nudges_enabled &&                       │
│   !drop_detected && motor_completed                         │
│   • All must be true to perform nudges                      │
└─────────────────────────────────────────────────────────────┘
                    ↓
        ┌───────────────────────────┐
        │  Conditions Met?          │
        └───────────────────────────┘
    YES ↓                      NO ↓
┌──────────────┐    ┌──────────────────────────┐
│ NUDGE        │    │ Skip nudges              │
│ SEQUENCE     │    │ (Lines 1045-1051)        │
│              │    │ • Log reason              │
└──────────────┘    └──────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────┐
│ Line 900-904: Pre-Nudge Setup                               │
│   • Get nudge rotation time (360-500ms)                     │
│   • Log: "Starting nudge sequence"                         │
│   • OLED: "Performing Nudge"                                │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ Line 907-918: Atlas Pre-Nudge Wait (if Atlas motor)        │
│   • Wait 1 second for potential click                       │
│   • Check if motor already completed                        │
│   • If click detected, log it                               │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ Line 920: Initial Delay                                      │
│   vTaskDelay(nudge_rotation_time)                           │
│   • Wait before starting nudges                             │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ Line 923: FOR LOOP (nudge = 1 to max_nudges)               │
└─────────────────────────────────────────────────────────────┘
                    ↓
        ┌───────────────────────────┐
        │  NUDGE ITERATION          │
        └───────────────────────────┘
                    ↓
    ┌───────────────────────────────────────────────┐
    │ Line 925-940: Check Drop Before Nudge         │
    │   total_drops = get_global_drop_transition_   │
    │                count()                        │
    │   if (total_drops > 0):                       │
    │     • drop_detected = true                    │
    │     • Display "Item Detected!"                │
    │     • BREAK nudge loop                        │
    └───────────────────────────────────────────────┘
                    ↓
    ┌───────────────────────────────────────────────┐
    │ Line 942-947: Start Nudge                     │
    │   • Log: "Nudge N/max: Starting rotation"     │
    │   • OLED: "Nudge N/max"                       │
    └───────────────────────────────────────────────┘
                    ↓
    ┌───────────────────────────────────────────────┐
    │ Line 950: Reactivate Motors                    │
    │   updateShiftRegisters(rowData, colData)     │
    │   • Motors start rotating again               │
    └───────────────────────────────────────────────┘
                    ↓
    ┌───────────────────────────────────────────────┐
    │ Line 953-1008: Nudge Rotation Loop            │
    │   • Wendor: Just delay (no feedback check)    │
    │   • Others: Check feedback & drop sensor      │
    │   • Poll every 1-5ms                          │
    │   • Exit if feedback or drop detected         │
    └───────────────────────────────────────────────┘
                    ↓
    ┌───────────────────────────────────────────────┐
    │ Line 1012-1015: Stop Motors                    │
    │   clearAllMotors()                            │
    │   reset_atlas_motor_feedback_state()          │
    └───────────────────────────────────────────────┘
                    ↓
    ┌───────────────────────────────────────────────┐
    │ Line 1018-1026: Check Exit Conditions         │
    │   if (motor_feedback_detected): BREAK          │
    │   if (drop_detected): BREAK                    │
    └───────────────────────────────────────────────┘
                    ↓
    ┌───────────────────────────────────────────────┐
    │ Line 1029-1030: Wait Between Nudges            │
    │   vTaskDelay(NUDGE_WAIT_TIME_MS)              │
    │   • 500ms wait before next nudge              │
    └───────────────────────────────────────────────┘
                    ↓
    ┌───────────────────────────────────────────────┐
    │ Line 1033: Update Counter                      │
    │   nudges_used = nudge                          │
    └───────────────────────────────────────────────┘
                    ↓
        ┌───────────────────────────┐
        │  More nudges?             │
        └───────────────────────────┘
    YES ↓              NO ↓
    ┌──────┐    ┌──────────────────────────┐
    │ Loop │    │ Line 1037-1044:          │
    │      │    │ • Reset Atlas feedback    │
    │      │    │ • If no drop: Log failure│
    │      │    │ • OLED: "All N Nudges    │
    │      │    │   Failed"                │
    └──────┘    └──────────────────────────┘
```

Nudge timing:
- Rotation: 360-500ms (motor-dependent)
- Wait between nudges: 500ms
- Max nudges: Configurable (typically 1-5)

---

### STEP 4.5: Late Drop Detection (Lines 1053-1094)

```
┌─────────────────────────────────────────────────────────────┐
│ Line 1054: IF (sensor_enabled)                               │
│   • Only wait if sensor is enabled                           │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ Line 1055-1058: Setup Wait Period                           │
│   • Wait time: VEND_DROP_SENSOR_WAIT_MS = 2500ms            │
│   • Convert to FreeRTOS ticks                               │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ Line 1061: WHILE LOOP (wait for late drops)                  │
│   Condition: elapsed_time < 2500ms                          │
└─────────────────────────────────────────────────────────────┘
                    ↓
        ┌───────────────────────────┐
        │  Loop Iteration            │
        └───────────────────────────┘
                    ↓
    ┌───────────────────────────────────────────────┐
    │ Line 1064-1077: Check Drop Sensor              │
    │   total_drops = get_global_drop_transition_   │
    │                count()                         │
    │   if (total_drops > 0):                        │
    │     • drop_detected = true                     │
    │     • Display "Late Item Detected"             │
    └───────────────────────────────────────────────┘
                    ↓
    ┌───────────────────────────────────────────────┐
    │ Line 1082-1088: Periodic Logging               │
    │   • Every 20 checks (~1 second)              │
    │   • Log elapsed/remaining time                 │
    │   • Yield CPU                                 │
    └───────────────────────────────────────────────┘
                    ↓
    ┌───────────────────────────────────────────────┐
    │ Line 1090: Delay                               │
    │   vTaskDelay(50ms)                             │
    │   • Check every 50ms                           │
    └───────────────────────────────────────────────┘
                    ↓
        ┌───────────────────────────┐
        │  Time elapsed?            │
        └───────────────────────────┘
    NO ↓              YES ↓
    ┌──────┐    ┌──────────────────────────┐
    │ Loop │    │ Line 1093: Complete      │
    │      │    │ • Log completion         │
    └──────┘    └──────────────────────────┘
```

Purpose: Catches items that fall after the motor stops (slow-falling items).

---

### STEP 5: Determine Success/Failure (Lines 1100-1133)

```
┌─────────────────────────────────────────────────────────────┐
│ Line 1097-1098: Store Intermediate Results                   │
│   last_nudges_used = nudges_used                            │
│   last_drops_detected = total_drops_detected               │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ Line 1101: IF (sensor_enabled)                               │
│   • Sensor-based success determination                      │
└─────────────────────────────────────────────────────────────┘
                    ↓
        ┌───────────────────────────┐
        │  Sensor Enabled?           │
        └───────────────────────────┘
    YES ↓                      NO ↓
┌──────────────┐    ┌──────────────────────────┐
│ Line 1103-   │    │ Line 1114-1132:          │
│ 1112:        │    │ Sensor Disabled Logic    │
│              │    │                          │
│ final_count =│    │ IF (motor_completed):     │
│ get_global_  │    │   IF (is_wendor_motor):  │
│ drop_        │    │     • Success (timeout OK)│
│ transition_  │    │   ELSE:                  │
│ count()      │    │     IF (timeout):        │
│              │    │       • Failure          │
│ IF (drop_    │    │     ELSE:                │
│ detected &&  │    │       • Success          │
│ final_count  │    │                          │
│ > 0):        │    │                          │
│   • Success  │    │                          │
│   • Update   │    │                          │
│     total_   │    │                          │
│     vended_  │    │                          │
│     count    │    │                          │
│ ELSE:        │    │                          │
│   • Failure  │    │                          │
└──────────────┘    └──────────────────────────┘
```

Success criteria summary:

| Sensor | Motor Completed | Drop Detected | Timeout | Result |
|--------|------------------|---------------|---------|--------|
| ✅ Enabled | ✅ Yes | ✅ Yes | ❌ No | ✅ **SUCCESS** |
| ✅ Enabled | ✅ Yes | ❌ No | ❌ No | ❌ **FAILURE** |
| ✅ Enabled | ❌ No | ❌ No | ✅ Yes | ❌ **FAILURE** |
| ❌ Disabled | ✅ Yes (feedback) | N/A | ❌ No | ✅ **SUCCESS** |
| ❌ Disabled | ✅ Yes (timeout) | N/A | ✅ Yes | ❌ **FAILURE** (except Wendor) |
| ❌ Disabled | ✅ Yes (timeout) | N/A | ✅ Yes | ✅ **SUCCESS** (Wendor only) |
| ❌ Disabled | ❌ No | N/A | ✅ Yes | ❌ **FAILURE** |

---

### STEP 6: Update Results & Cleanup (Lines 1136-1182)

```
┌─────────────────────────────────────────────────────────────┐
│ Line 1136-1140: Update Result Structure                     │
│   last_vend_result.success = vend_successful               │
│   last_vend_result.items_count = total_drops_detected      │
│   last_vend_result.motor_stopped = motor_completed         │
│   last_vend_result.timeout_occurred = !motor_completed     │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ Line 1143-1151: Final Logging                                │
│   • Log separator line                                       │
│   • Log position count, motor type, sensor state            │
│   • Log result (SUCCESS/FAILURE)                            │
│   • Log motor completion, drop detection, transitions        │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ Line 1154-1158: Display Final Result on OLED               │
│   format_vend_result_message()                              │
│   • Creates formatted message with details                   │
│   • Displays on OLED line 1                                 │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ Line 1161-1163: Stop Monitoring Tasks                       │
│   IF (sensor_enabled):                                       │
│     stop_global_drop_sensor_monitoring()                     │
│     • Stops background drop sensor task                      │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ Line 1166: Clear Current Position                           │
│   current_vend_position = -1                                │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ Line 1169-1177: Reset Motor Feedback State                   │
│   IF (is_atlas_motor()):                                     │
│     • Reset Atlas-specific variables                         │
│   resetMotorFeedbackStateForRow(active_row)                  │
│     • Reset state for the active row                         │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ Line 1182: Return Result                                    │
│   return vend_successful                                    │
│   • true = success, false = failure                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Complete flow diagram

```
                    START
                     │
                     ↓
    ┌────────────────────────────────────┐
    │ STEP 1: Setup & Activate Motors    │
    │ • Convert positions → bit patterns │
    │ • Activate ALL motors              │
    └────────────────────────────────────┘
                     │
                     ↓
    ┌────────────────────────────────────┐
    │ STEP 2: Monitor Loop               │
    │ • Poll motor feedback (1-5ms)      │
    │ • Monitor drop sensor              │
    └────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
    Motor Complete?          Timeout?
        │                         │
    YES ↓                    YES ↓
        │                         │
    ┌─────────────┐      ┌─────────────────┐
    │ Clear Motors│      │ Emergency Stop   │
    └─────────────┘      └─────────────────┘
        │                         │
        └────────────┬────────────┘
                     │
                     ↓
    ┌────────────────────────────────────┐
    │ STEP 4: Nudge System?             │
    │ Conditions:                        │
    │ • sensor_enabled                   │
    │ • nudges_enabled                   │
    │ • !drop_detected                   │
    │ • motor_completed                  │
    └────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
    YES ↓                      NO ↓
        │                         │
    ┌─────────────────┐    ┌──────────────┐
    │ FOR each nudge: │    │ Skip nudges  │
    │ • Check drop    │    └──────────────┘
    │ • Reactivate    │           │
    │ • Rotate        │           │
    │ • Check feedback│           │
    │ • Stop motors   │           │
    │ • Wait 500ms    │           │
    └─────────────────┘           │
        │                         │
        └────────────┬────────────┘
                     │
                     ↓
    ┌────────────────────────────────────┐
    │ STEP 4.5: Late Drop Detection       │
    │ • Wait 2.5 seconds                  │
    │ • Monitor for late drops            │
    └────────────────────────────────────┘
                     │
                     ↓
    ┌────────────────────────────────────┐
    │ STEP 5: Determine Success/Failure  │
    │ • Sensor enabled: drop = success   │
    │ • Sensor disabled: motor = success │
    └────────────────────────────────────┘
                     │
                     ↓
    ┌────────────────────────────────────┐
    │ STEP 6: Update Results & Cleanup   │
    │ • Update last_vend_result           │
    │ • Log final summary                │
    │ • Display on OLED                  │
    │ • Stop monitoring tasks             │
    │ • Reset state                       │
    └────────────────────────────────────┘
                     │
                     ↓
                   RETURN
```

---

## Timing summary

| Phase | Duration | Notes |
|-------|----------|-------|
| Motor Activation | ~10ms | Shift register update |
| Motor Monitoring | 0-3500ms | Until feedback or timeout |
| Nudge Sequence | 360-500ms × N | Per nudge rotation |
| Nudge Wait | 500ms × (N-1) | Between nudges |
| Late Detection | 2500ms | Fixed wait period |
| Total Cycle | 2-15 seconds | Depends on motor speed, nudges |

---

## Summary

This flow:
1. Activates motors simultaneously for all positions
2. Monitors motor feedback and drop sensor in real time
3. Handles timeouts
4. Performs nudges if needed
5. Waits for late drops
6. Determines success/failure based on sensor state
7. Updates results and cleans up

The system supports multiple motor types, configurable nudges, and robust error handling.

```plaintext
┌─────────────────────────────────────────────────────────────────┐
│                    EXECUTE_VEND_CYCLE                            │
│              (Lines 814-1182)                                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Setup & Activate Motors (814-821)                      │
│ • Convert positions → shift register data                      │
│ • Activate ALL motors simultaneously                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Monitor Loop (823-884)                                  │
│ • Poll motor feedback (ADC)                                    │
│ • Monitor drop sensor transitions                              │
│ • Exit on completion or timeout                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Handle Timeout (886-892)                               │
│ • Stop motors if timeout occurred                               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Nudge System (894-1051)                                 │
│ • If no drop detected & motor completed                        │
│ • Perform up to max_nudges attempts                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4.5: Late Drop Detection (1053-1094)                      │
│ • Wait 2.5 seconds for late drops                              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: Determine Success/Failure (1100-1133)                   │
│ • Sensor enabled: success = drop detected                      │
│ • Sensor disabled: success = motor completed                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 6: Update Results & Cleanup (1136-1182)                    │
│ • Update last_vend_result                                       │
│ • Log final summary                                             │
│ • Stop monitoring tasks                                          │
│ • Reset state                                                    │
└─────────────────────────────────────────────────────────────────┘
```

```plaintext
┌─────────────────────────────────────────────────────────────┐
│ Line 814-815: Declare shift register data arrays           │
│   uint8_t colData[2];  // 16 columns (2 × 8 bits)          │
│   uint8_t rowData;     // 8 rows (1 × 8 bits)               │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ Line 816: setup_motor_shift_data()                          │
│   • For each position in array:                             │
│     - Extract row = position / 100                          │
│     - Extract col = position % 100                          │
│     - Convert to bit patterns based on motor type           │
│     - Set bits in colData[0], colData[1], rowData           │
│   • Result: Bit patterns ready for shift registers         │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ Line 819: updateShiftRegisters(rowData, colData)           │
│   • Shift 24 bits to 3 cascaded 74HC595 chips              │
│   • All motors activate SIMULTANEOUSLY                      │
│   • Motors start rotating                                   │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ Line 820-821: Log & Display                                 │
│   • Log: "All N motors activated simultaneously"            │
│   • OLED: "Rotating Motors"                                 │
└─────────────────────────────────────────────────────────────┘
```

```plaintext
┌─────────────────────────────────────────────────────────────┐
│ Line 824-833: Setup Timeout                                 │
│   start_time = current tick count                           │
│   motor_timeout_ms = get_motor_timeout_ms()                │
│   • Atlas/Titan: 2500ms                                     │
│   • Bench: 3500ms                                           │
│   • Wendor: 2500ms + 200ms margin = 2700ms                  │
│   timeout_ticks = convert to FreeRTOS ticks                │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ Line 838: WHILE LOOP (until timeout or completion)         │
│   Condition: (current_time - start_time) < timeout_ticks   │
└─────────────────────────────────────────────────────────────┘
                    ↓
        ┌───────────────────────────┐
        │  Loop Iteration           │
        └───────────────────────────┘
                    ↓
    ┌───────────────────────────────────────────────┐
    │ Line 842: Check Motor Feedback                 │
    │   if (!motor_completed &&                     │
    │       check_all_rows_motor_feedback_complete())│
    │   • Reads ADC (MCP3208 or GPIO34)             │
    │   • Detects click pattern (2-click detection)│
    │   • Returns true when motor completes         │
    └───────────────────────────────────────────────┘
                    ↓
        ┌───────────────────────────┐
        │  Motor Completed?        │
        └───────────────────────────┘
            YES ↓              NO ↓
    ┌──────────────┐    ┌──────────────────────────┐
    │ Line 843-848 │    │ Line 853-870: Check Drop  │
    │ • Set motor_ │    │   Sensor (if enabled)     │
    │   completed  │    │ • Get transition count    │
    │   = true     │    │ • If > 0: drop_detected   │
    │ • Clear      │    │   = true                  │
    │   motors     │    │ • Display "Item Detected" │
    │ • Reset      │    │ • Continue motor (don't   │
    │   feedback   │    │   stop yet)               │
    │ • BREAK loop │    └──────────────────────────┘
    └──────────────┘                    ↓
                    ┌──────────────────────────┐
                    │ Line 874-876: Yield CPU  │
                    │ • Every 50 iterations    │
                    │ • Allow other tasks       │
                    └──────────────────────────┘
                                ↓
                    ┌──────────────────────────┐
                    │ Line 879-883: Delay      │
                    │ • Atlas: 1ms delay      │
                    │ • Others: 5ms delay      │
                    │ • Prevents CPU overload  │
                    └──────────────────────────┘
                                ↓
                    ┌──────────────────────────┐
                    │ Loop continues...        │
                    └──────────────────────────┘
```

```plaintext
┌─────────────────────────────────────────────────────────────┐
│ Line 887: IF (!motor_completed)                             │
│   • Motor didn't complete within timeout                    │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ Line 888-891: Emergency Stop                                │
│   • clearAllMotors() - Stop all motors immediately         │
│   • reset_atlas_motor_feedback_state()                      │
│   • Log warning: "Motor operation timed out"               │
│   • OLED: "Motor Timeout"                                   │
└─────────────────────────────────────────────────────────────┘
```

```plaintext
┌─────────────────────────────────────────────────────────────┐
│ Line 895-897: Get Nudge Configuration                      │
│   nudges_used = 0                                           │
│   nudges_enabled = config_manager_get_nudges_enabled()     │
│   max_nudges = config_manager_get_nudge_count()            │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ Line 899: IF Conditions Check                               │
│   sensor_enabled && nudges_enabled &&                       │
│   !drop_detected && motor_completed                         │
│   • All must be true to perform nudges                      │
└─────────────────────────────────────────────────────────────┘
                    ↓
        ┌───────────────────────────┐
        │  Conditions Met?          │
        └───────────────────────────┘
    YES ↓                      NO ↓
┌──────────────┐    ┌──────────────────────────┐
│ NUDGE        │    │ Skip nudges              │
│ SEQUENCE     │    │ (Lines 1045-1051)        │
│              │    │ • Log reason              │
└──────────────┘    └──────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────┐
│ Line 900-904: Pre-Nudge Setup                               │
│   • Get nudge rotation time (360-500ms)                     │
│   • Log: "Starting nudge sequence"                         │
│   • OLED: "Performing Nudge"                                │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ Line 907-918: Atlas Pre-Nudge Wait (if Atlas motor)        │
│   • Wait 1 second for potential click                       │
│   • Check if motor already completed                        │
│   • If click detected, log it                               │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ Line 920: Initial Delay                                      │
│   vTaskDelay(nudge_rotation_time)                           │
│   • Wait before starting nudges                             │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ Line 923: FOR LOOP (nudge = 1 to max_nudges)               │
└─────────────────────────────────────────────────────────────┘
                    ↓
        ┌───────────────────────────┐
        │  NUDGE ITERATION          │
        └───────────────────────────┘
                    ↓
    ┌───────────────────────────────────────────────┐
    │ Line 925-940: Check Drop Before Nudge         │
    │   total_drops = get_global_drop_transition_   │
    │                count()                        │
    │   if (total_drops > 0):                       │
    │     • drop_detected = true                    │
    │     • Display "Item Detected!"                │
    │     • BREAK nudge loop                        │
    └───────────────────────────────────────────────┘
                    ↓
    ┌───────────────────────────────────────────────┐
    │ Line 942-947: Start Nudge                     │
    │   • Log: "Nudge N/max: Starting rotation"     │
    │   • OLED: "Nudge N/max"                       │
    └───────────────────────────────────────────────┘
                    ↓
    ┌───────────────────────────────────────────────┐
    │ Line 950: Reactivate Motors                    │
    │   updateShiftRegisters(rowData, colData)     │
    │   • Motors start rotating again               │
    └───────────────────────────────────────────────┘
                    ↓
    ┌───────────────────────────────────────────────┐
    │ Line 953-1008: Nudge Rotation Loop            │
    │   • Wendor: Just delay (no feedback check)    │
    │   • Others: Check feedback & drop sensor      │
    │   • Poll every 1-5ms                          │
    │   • Exit if feedback or drop detected         │
    └───────────────────────────────────────────────┘
                    ↓
    ┌───────────────────────────────────────────────┐
    │ Line 1012-1015: Stop Motors                    │
    │   clearAllMotors()                            │
    │   reset_atlas_motor_feedback_state()          │
    └───────────────────────────────────────────────┘
                    ↓
    ┌───────────────────────────────────────────────┐
    │ Line 1018-1026: Check Exit Conditions         │
    │   if (motor_feedback_detected): BREAK          │
    │   if (drop_detected): BREAK                    │
    └───────────────────────────────────────────────┘
                    ↓
    ┌───────────────────────────────────────────────┐
    │ Line 1029-1030: Wait Between Nudges            │
    │   vTaskDelay(NUDGE_WAIT_TIME_MS)              │
    │   • 500ms wait before next nudge              │
    └───────────────────────────────────────────────┘
                    ↓
    ┌───────────────────────────────────────────────┐
    │ Line 1033: Update Counter                      │
    │   nudges_used = nudge                          │
    └───────────────────────────────────────────────┘
                    ↓
        ┌───────────────────────────┐
        │  More nudges?             │
        └───────────────────────────┘
    YES ↓              NO ↓
    ┌──────┐    ┌──────────────────────────┐
    │ Loop │    │ Line 1037-1044:          │
    │      │    │ • Reset Atlas feedback    │
    │      │    │ • If no drop: Log failure│
    │      │    │ • OLED: "All N Nudges    │
    │      │    │   Failed"                │
    └──────┘    └──────────────────────────┘
```

```plaintext
┌─────────────────────────────────────────────────────────────┐
│ Line 1054: IF (sensor_enabled)                               │
│   • Only wait if sensor is enabled                           │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ Line 1055-1058: Setup Wait Period                           │
│   • Wait time: VEND_DROP_SENSOR_WAIT_MS = 2500ms            │
│   • Convert to FreeRTOS ticks                               │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ Line 1061: WHILE LOOP (wait for late drops)                  │
│   Condition: elapsed_time < 2500ms                          │
└─────────────────────────────────────────────────────────────┘
                    ↓
        ┌───────────────────────────┐
        │  Loop Iteration            │
        └───────────────────────────┘
                    ↓
    ┌───────────────────────────────────────────────┐
    │ Line 1064-1077: Check Drop Sensor              │
    │   total_drops = get_global_drop_transition_   │
    │                count()                         │
    │   if (total_drops > 0):                        │
    │     • drop_detected = true                     │
    │     • Display "Late Item Detected"             │
    └───────────────────────────────────────────────┘
                    ↓
    ┌───────────────────────────────────────────────┐
    │ Line 1082-1088: Periodic Logging               │
    │   • Every 20 checks (~1 second)              │
    │   • Log elapsed/remaining time                 │
    │   • Yield CPU                                 │
    └───────────────────────────────────────────────┘
                    ↓
    ┌───────────────────────────────────────────────┐
    │ Line 1090: Delay                               │
    │   vTaskDelay(50ms)                             │
    │   • Check every 50ms                           │
    └───────────────────────────────────────────────┘
                    ↓
        ┌───────────────────────────┐
        │  Time elapsed?            │
        └───────────────────────────┘
    NO ↓              YES ↓
    ┌──────┐    ┌──────────────────────────┐
    │ Loop │    │ Line 1093: Complete      │
    │      │    │ • Log completion         │
    └──────┘    └──────────────────────────┘
```

```plaintext
┌─────────────────────────────────────────────────────────────┐
│ Line 1097-1098: Store Intermediate Results                   │
│   last_nudges_used = nudges_used                            │
│   last_drops_detected = total_drops_detected               │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ Line 1101: IF (sensor_enabled)                               │
│   • Sensor-based success determination                      │
└─────────────────────────────────────────────────────────────┘
                    ↓
        ┌───────────────────────────┐
        │  Sensor Enabled?           │
        └───────────────────────────┘
    YES ↓                      NO ↓
┌──────────────┐    ┌──────────────────────────┐
│ Line 1103-   │    │ Line 1114-1132:          │
│ 1112:        │    │ Sensor Disabled Logic    │
│              │    │                          │
│ final_count =│    │ IF (motor_completed):     │
│ get_global_  │    │   IF (is_wendor_motor):  │
│ drop_        │    │     • Success (timeout OK)│
│ transition_  │    │   ELSE:                  │
│ count()      │    │     IF (timeout):        │
│              │    │       • Failure          │
│ IF (drop_    │    │     ELSE:                │
│ detected &&  │    │       • Success          │
│ final_count  │    │                          │
│ > 0):        │    │                          │
│   • Success  │    │                          │
│   • Update   │    │                          │
│     total_   │    │                          │
│     vended_  │    │                          │
│     count    │    │                          │
│ ELSE:        │    │                          │
│   • Failure  │    │                          │
└──────────────┘    └──────────────────────────┘
```

```plaintext
┌─────────────────────────────────────────────────────────────┐
│ Line 1136-1140: Update Result Structure                     │
│   last_vend_result.success = vend_successful               │
│   last_vend_result.items_count = total_drops_detected      │
│   last_vend_result.motor_stopped = motor_completed         │
│   last_vend_result.timeout_occurred = !motor_completed     │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ Line 1143-1151: Final Logging                                │
│   • Log separator line                                       │
│   • Log position count, motor type, sensor state            │
│   • Log result (SUCCESS/FAILURE)                            │
│   • Log motor completion, drop detection, transitions        │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ Line 1154-1158: Display Final Result on OLED               │
│   format_vend_result_message()                              │
│   • Creates formatted message with details                   │
│   • Displays on OLED line 1                                 │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ Line 1161-1163: Stop Monitoring Tasks                       │
│   IF (sensor_enabled):                                       │
│     stop_global_drop_sensor_monitoring()                     │
│     • Stops background drop sensor task                      │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ Line 1166: Clear Current Position                           │
│   current_vend_position = -1                                │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ Line 1169-1177: Reset Motor Feedback State                   │
│   IF (is_atlas_motor()):                                     │
│     • Reset Atlas-specific variables                         │
│   resetMotorFeedbackStateForRow(active_row)                  │
│     • Reset state for the active row                         │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ Line 1182: Return Result                                    │
│   return vend_successful                                    │
│   • true = success, false = failure                         │
└─────────────────────────────────────────────────────────────┘
```

```plaintext
                    START
                     │
                     ↓
    ┌────────────────────────────────────┐
    │ STEP 1: Setup & Activate Motors    │
    │ • Convert positions → bit patterns │
    │ • Activate ALL motors              │
    └────────────────────────────────────┘
                     │
                     ↓
    ┌────────────────────────────────────┐
    │ STEP 2: Monitor Loop               │
    │ • Poll motor feedback (1-5ms)      │
    │ • Monitor drop sensor              │
    └────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
    Motor Complete?          Timeout?
        │                         │
    YES ↓                    YES ↓
        │                         │
    ┌─────────────┐      ┌─────────────────┐
    │ Clear Motors│      │ Emergency Stop   │
    └─────────────┘      └─────────────────┘
        │                         │
        └────────────┬────────────┘
                     │
                     ↓
    ┌────────────────────────────────────┐
    │ STEP 4: Nudge System?             │
    │ Conditions:                        │
    │ • sensor_enabled                   │
    │ • nudges_enabled                   │
    │ • !drop_detected                   │
    │ • motor_completed                  │
    └────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
    YES ↓                      NO ↓
        │                         │
    ┌─────────────────┐    ┌──────────────┐
    │ FOR each nudge: │    │ Skip nudges  │
    │ • Check drop    │    └──────────────┘
    │ • Reactivate    │           │
    │ • Rotate        │           │
    │ • Check feedback│           │
    │ • Stop motors   │           │
    │ • Wait 500ms    │           │
    └─────────────────┘           │
        │                         │
        └────────────┬────────────┘
                     │
                     ↓
    ┌────────────────────────────────────┐
    │ STEP 4.5: Late Drop Detection       │
    │ • Wait 2.5 seconds                  │
    │ • Monitor for late drops            │
    └────────────────────────────────────┘
                     │
                     ↓
    ┌────────────────────────────────────┐
    │ STEP 5: Determine Success/Failure  │
    │ • Sensor enabled: drop = success   │
    │ • Sensor disabled: motor = success │
    └────────────────────────────────────┘
                     │
                     ↓
    ┌────────────────────────────────────┐
    │ STEP 6: Update Results & Cleanup   │
    │ • Update last_vend_result           │
    │ • Log final summary                │
    │ • Display on OLED                  │
    │ • Stop monitoring tasks             │
    │ • Reset state                       │
    └────────────────────────────────────┘
                     │
                     ↓
                   RETURN
```

---

**User**

@hardware_manager.c (680-695) 



explain this with input example 

---

**Cursor**


Reviewing `shift_out` and related code to explain `updateShiftRegisters` with examples.



# `updateShiftRegisters()` - Explanation with examples

## Function overview

This function controls 3 cascaded 74HC595 shift registers to drive an 8×16 motor matrix. It shifts 24 bits serially (8 row + 16 column bits) and then latches them to the outputs.

```680:695:satron-board/main/hardware_manager.c
void updateShiftRegisters(uint8_t rowData, uint8_t* colData) {
    gpio_set_level((gpio_num_t)LATCH_PIN, 0);
    
    // Shift out row data (8 bits) - IC_C
    shift_out((gpio_num_t)DATA_PIN, (gpio_num_t)CLOCK_PIN, rowData);
    
    // Shift out column data [1] (8 bits) - IC_B
    shift_out((gpio_num_t)DATA_PIN, (gpio_num_t)CLOCK_PIN, colData[1]);
    
    // Shift out column data [0] (8 bits) - IC_A
    shift_out((gpio_num_t)DATA_PIN, (gpio_num_t)CLOCK_PIN, colData[0]);
    
    gpio_set_level((gpio_num_t)LATCH_PIN, 1);
    ESP_LOGI(HARDWARE_TAG, "Shift registers updated - Row: 0x%02X, Col[0]: 0x%02X, Col[1]: 0x%02X", 
            rowData, colData[0], colData[1]);
}
```

---

## Hardware setup

```
┌─────────────────────────────────────────────────────────────┐
│              ESP32 GPIO Pins                                │
│  GPIO5 (DATA) ──┐                                           │
│  GPIO18 (CLOCK)─┼──┐                                        │
│  GPIO19 (LATCH)─┼──┼──┐                                     │
└─────────────────┼──┼──┼─────────────────────────────────────┘
                  │  │  │
                  ↓  ↓  ↓
┌─────────────────────────────────────────────────────────────┐
│        3 Cascaded 74HC595 Shift Registers                   │
│                                                             │
│  IC_A (Columns 0-7)  →  IC_B (Columns 8-15)  →  IC_C (Rows)│
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐ │
│  │ Q0-Q7       │      │ Q0-Q7       │      │ Q0-Q7       │ │
│  │ (Col 0-7)   │      │ (Col 8-15)  │      │ (Row 1-8)   │ │
│  └─────────────┘      └─────────────┘      └─────────────┘ │
│       ↑                    ↑                    ↑          │
│       └────────────────────┴────────────────────┘          │
│                    Serial Data Chain                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Step-by-step explanation

### Step 1: Latch LOW (Line 681)

```c
gpio_set_level((gpio_num_t)LATCH_PIN, 0);
```

- Sets LATCH (GPIO19) LOW
- Disconnects outputs from shift register contents
- Prepares to load new data

---

### Step 2: Shift out row data (IC_C) - Line 684

```c
shift_out((gpio_num_t)DATA_PIN, (gpio_num_t)CLOCK_PIN, rowData);
```

What `shift_out()` does:
```665:673:satron-board/main/hardware_manager.c
static void shift_out(gpio_num_t data_pin, gpio_num_t clock_pin, uint8_t val) {
    for (int i = 7; i >= 0; i--) {  // Always MSBFIRST (bit 7 to bit 0)
        uint8_t bit = val & (1 << i);
        
        gpio_set_level(data_pin, bit ? 1 : 0);
        gpio_set_level(clock_pin, 1);
        gpio_set_level(clock_pin, 0);
    }
}
```

- Shifts bits MSB first (bit 7 → bit 0)
- For each bit: set DATA, pulse CLOCK high then low

Example: `rowData = 0x04` (binary: `00000100`)
- Bit 7 (0) → DATA=0, CLOCK pulse
- Bit 6 (0) → DATA=0, CLOCK pulse
- Bit 5 (0) → DATA=0, CLOCK pulse
- Bit 4 (0) → DATA=0, CLOCK pulse
- Bit 3 (0) → DATA=0, CLOCK pulse
- Bit 2 (1) → DATA=1, CLOCK pulse
- Bit 1 (0) → DATA=0, CLOCK pulse
- Bit 0 (0) → DATA=0, CLOCK pulse

Result: Row data enters IC_C (last in chain).

---

### Step 3: Shift out column data [1] (IC_B) - Line 687

```c
shift_out((gpio_num_t)DATA_PIN, (gpio_num_t)CLOCK_PIN, colData[1]);
```

- Shifts 8 bits for columns 8-15
- Data pushes into IC_B and shifts IC_C’s data forward

---

### Step 4: Shift out column data [0] (IC_A) - Line 690

```c
shift_out((gpio_num_t)DATA_PIN, (gpio_num_t)CLOCK_PIN, colData[0]);
```

- Shifts 8 bits for columns 0-7
- Data enters IC_A and pushes previous data through the chain

---

### Step 5: Latch HIGH (Line 692)

```c
gpio_set_level((gpio_num_t)LATCH_PIN, 1);
```

- Sets LATCH HIGH
- Transfers shift register contents to outputs
- Motors activate based on the bit pattern

---

## Example 1: Single position (Row 2, Column 3)

Input:
- Position: 23 (Row 2, Column 3)
- `rowData = 0x02` (binary: `00000010` - Row 2 active)
- `colData[0] = 0x04` (binary: `00000100` - Column 3 active)
- `colData[1] = 0x00` (binary: `00000000` - No columns 8-15)

Execution:

```
LATCH = LOW (prepare to load)
    ↓
Shift Row Data (IC_C):
    rowData = 0x02 = 00000010
    → Shifts: 0,0,0,0,0,0,1,0 (MSB first)
    → IC_C now has: Row 2 = HIGH
    ↓
Shift Col[1] (IC_B):
    colData[1] = 0x00 = 00000000
    → Shifts: 0,0,0,0,0,0,0,0
    → IC_B now has: All columns 8-15 = LOW
    → IC_C data pushed forward
    ↓
Shift Col[0] (IC_A):
    colData[0] = 0x04 = 00000100
    → Shifts: 0,0,0,0,0,1,0,0
    → IC_A now has: Column 3 = HIGH
    → IC_B and IC_C data pushed forward
    ↓
LATCH = HIGH (transfer to outputs)
    ↓
Result:
    IC_A: Column 3 = HIGH (others LOW)
    IC_B: All columns 8-15 = LOW
    IC_C: Row 2 = HIGH (others LOW)
    → Motor at Row 2, Column 3 ACTIVATED
```

Log output:
```
Shift registers updated - Row: 0x02, Col[0]: 0x04, Col[1]: 0x00
```

---

## Example 2: Multiple positions (Row 2, Col 3 + Row 3, Col 4)

Input:
- Positions: 23, 34
- `rowData = 0x06` (binary: `00000110` - Rows 2 & 3 active)
- `colData[0] = 0x0C` (binary: `00001100` - Columns 3 & 4 active)
- `colData[1] = 0x00`

Execution:

```
LATCH = LOW
    ↓
Shift Row Data (IC_C):
    rowData = 0x06 = 00000110
    → IC_C: Rows 2 & 3 = HIGH
    ↓
Shift Col[1] (IC_B):
    colData[1] = 0x00
    → IC_B: All LOW
    ↓
Shift Col[0] (IC_A):
    colData[0] = 0x0C = 00001100
    → IC_A: Columns 3 & 4 = HIGH
    ↓
LATCH = HIGH
    ↓
Result:
    IC_A: Columns 3 & 4 = HIGH
    IC_B: All LOW
    IC_C: Rows 2 & 3 = HIGH
    → Motors at (Row 2, Col 3) AND (Row 3, Col 4) ACTIVATED SIMULTANEOUSLY
```

Log output:
```
Shift registers updated - Row: 0x06, Col[0]: 0x0C, Col[1]: 0x00
```

---

## Example 3: Position in second column register (Row 1, Column 10)

Input:
- Position: 110 (Row 1, Column 10)
- `rowData = 0x01` (binary: `00000001` - Row 1 active)
- `colData[0] = 0x00` (binary: `00000000`)
- `colData[1] = 0x04` (binary: `00000100` - Column 10 active, bit 2)

Execution:

```
LATCH = LOW
    ↓
Shift Row Data (IC_C):
    rowData = 0x01 = 00000001
    → IC_C: Row 1 = HIGH
    ↓
Shift Col[1] (IC_B):
    colData[1] = 0x04 = 00000100
    → IC_B: Column 10 (bit 2) = HIGH
    ↓
Shift Col[0] (IC_A):
    colData[0] = 0x00
    → IC_A: All LOW
    ↓
LATCH = HIGH
    ↓
Result:
    IC_A: All columns 0-7 = LOW
    IC_B: Column 10 = HIGH (others LOW)
    IC_C: Row 1 = HIGH
    → Motor at Row 1, Column 10 ACTIVATED
```

Log output:
```
Shift registers updated - Row: 0x01, Col[0]: 0x00, Col[1]: 0x04
```

---

## Bit pattern visualization

Example: `rowData = 0x06`, `colData[0] = 0x0C`, `colData[1] = 0x00`

```
Row Data (IC_C):    0x06 = 00000110
                    └─┬─┘
                      │
        Bit positions: 7 6 5 4 3 2 1 0
        Row mapping:  8 7 6 5 4 3 2 1
                      └─┬─┘ └─┬─┘
                    Row 3  Row 2
                    (bit 1) (bit 2)

Col[0] Data (IC_A): 0x0C = 00001100
                    └─┬─┘ └─┬─┘
                      │     │
        Bit positions: 7 6 5 4 3 2 1 0
        Col mapping:  7 6 5 4 3 2 1 0
                      └─┬─┘ └─┬─┘
                    Col 4  Col 3
                    (bit 2) (bit 3)

Col[1] Data (IC_B): 0x00 = 00000000
                    (All columns 8-15 inactive)
```

---

## Shift register chain flow

```
Data Flow Direction (Serial):
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  DATA_PIN (GPIO5)                                           │
│      │                                                       │
│      ↓                                                       │
│  ┌─────────┐  Serial Out  ┌─────────┐  Serial Out  ┌─────────┐│
│  │  IC_A   │──────────────→│  IC_B   │──────────────→│  IC_C   ││
│  │ Col 0-7 │               │ Col 8-15│               │ Row 1-8 ││
│  └─────────┘               └─────────┘               └─────────┘│
│      ↑                           ↑                           ↑  │
│      │                           │                           │  │
│  First to receive            Middle                    Last to receive│
│  (Last shifted)            (Middle shifted)         (First shifted)│
│                                                             │
└─────────────────────────────────────────────────────────────┘

Shifting Order (what we send):
1. Row Data (IC_C) - goes to end of chain
2. Col[1] (IC_B) - pushes IC_C forward
3. Col[0] (IC_A) - pushes IC_B and IC_C forward

Final State After Latch:
IC_A: Columns 0-7
IC_B: Columns 8-15  
IC_C: Rows 1-8
```

---

## Timing diagram

```
CLOCK_PIN:  _┌─┐_┌─┐_┌─┐_┌─┐_┌─┐_┌─┐_┌─┐_┌─┐_  (8 pulses per byte)
            │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │
DATA_PIN:   ──┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─  (bit pattern)
            [Row Data] [Col[1]] [Col[0]]
            
LATCH_PIN:  ────────────────────────────────┐
            (LOW during shift)              │ (HIGH to latch)
                                            └───────────────
```

---

## Summary

1. Latch LOW: Disconnect outputs
2. Shift 24 bits serially (MSB first):
   - 8 bits row → IC_C
   - 8 bits col[1] → IC_B
   - 8 bits col[0] → IC_A
3. Latch HIGH: Transfer to outputs

This controls which motors are active in the 8×16 matrix by setting row and column bits in the cascaded shift registers.

```c
void updateShiftRegisters(uint8_t rowData, uint8_t* colData) {
    gpio_set_level((gpio_num_t)LATCH_PIN, 0);
    
    // Shift out row data (8 bits) - IC_C
    shift_out((gpio_num_t)DATA_PIN, (gpio_num_t)CLOCK_PIN, rowData);
    
    // Shift out column data [1] (8 bits) - IC_B
    shift_out((gpio_num_t)DATA_PIN, (gpio_num_t)CLOCK_PIN, colData[1]);
    
    // Shift out column data [0] (8 bits) - IC_A
    shift_out((gpio_num_t)DATA_PIN, (gpio_num_t)CLOCK_PIN, colData[0]);
    
    gpio_set_level((gpio_num_t)LATCH_PIN, 1);
    ESP_LOGI(HARDWARE_TAG, "Shift registers updated - Row: 0x%02X, Col[0]: 0x%02X, Col[1]: 0x%02X", 
            rowData, colData[0], colData[1]);
}
```

```plaintext
┌─────────────────────────────────────────────────────────────┐
│              ESP32 GPIO Pins                                │
│  GPIO5 (DATA) ──┐                                           │
│  GPIO18 (CLOCK)─┼──┐                                        │
│  GPIO19 (LATCH)─┼──┼──┐                                     │
└─────────────────┼──┼──┼─────────────────────────────────────┘
                  │  │  │
                  ↓  ↓  ↓
┌─────────────────────────────────────────────────────────────┐
│        3 Cascaded 74HC595 Shift Registers                   │
│                                                             │
│  IC_A (Columns 0-7)  →  IC_B (Columns 8-15)  →  IC_C (Rows)│
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐ │
│  │ Q0-Q7       │      │ Q0-Q7       │      │ Q0-Q7       │ │
│  │ (Col 0-7)   │      │ (Col 8-15)  │      │ (Row 1-8)   │ │
│  └─────────────┘      └─────────────┘      └─────────────┘ │
│       ↑                    ↑                    ↑          │
│       └────────────────────┴────────────────────┘          │
│                    Serial Data Chain                        │
└─────────────────────────────────────────────────────────────┘
```

```c
gpio_set_level((gpio_num_t)LATCH_PIN, 0);
```

```c
shift_out((gpio_num_t)DATA_PIN, (gpio_num_t)CLOCK_PIN, rowData);
```

```c
static void shift_out(gpio_num_t data_pin, gpio_num_t clock_pin, uint8_t val) {
    for (int i = 7; i >= 0; i--) {  // Always MSBFIRST (bit 7 to bit 0)
        uint8_t bit = val & (1 << i);
        
        gpio_set_level(data_pin, bit ? 1 : 0);
        gpio_set_level(clock_pin, 1);
        gpio_set_level(clock_pin, 0);
    }
}
```

```c
shift_out((gpio_num_t)DATA_PIN, (gpio_num_t)CLOCK_PIN, colData[1]);
```

```c
shift_out((gpio_num_t)DATA_PIN, (gpio_num_t)CLOCK_PIN, colData[0]);
```

```c
gpio_set_level((gpio_num_t)LATCH_PIN, 1);
```

```plaintext
LATCH = LOW (prepare to load)
    ↓
Shift Row Data (IC_C):
    rowData = 0x02 = 00000010
    → Shifts: 0,0,0,0,0,0,1,0 (MSB first)
    → IC_C now has: Row 2 = HIGH
    ↓
Shift Col[1] (IC_B):
    colData[1] = 0x00 = 00000000
    → Shifts: 0,0,0,0,0,0,0,0
    → IC_B now has: All columns 8-15 = LOW
    → IC_C data pushed forward
    ↓
Shift Col[0] (IC_A):
    colData[0] = 0x04 = 00000100
    → Shifts: 0,0,0,0,0,1,0,0
    → IC_A now has: Column 3 = HIGH
    → IC_B and IC_C data pushed forward
    ↓
LATCH = HIGH (transfer to outputs)
    ↓
Result:
    IC_A: Column 3 = HIGH (others LOW)
    IC_B: All columns 8-15 = LOW
    IC_C: Row 2 = HIGH (others LOW)
    → Motor at Row 2, Column 3 ACTIVATED
```

```plaintext
Shift registers updated - Row: 0x02, Col[0]: 0x04, Col[1]: 0x00
```

```plaintext
LATCH = LOW
    ↓
Shift Row Data (IC_C):
    rowData = 0x06 = 00000110
    → IC_C: Rows 2 & 3 = HIGH
    ↓
Shift Col[1] (IC_B):
    colData[1] = 0x00
    → IC_B: All LOW
    ↓
Shift Col[0] (IC_A):
    colData[0] = 0x0C = 00001100
    → IC_A: Columns 3 & 4 = HIGH
    ↓
LATCH = HIGH
    ↓
Result:
    IC_A: Columns 3 & 4 = HIGH
    IC_B: All LOW
    IC_C: Rows 2 & 3 = HIGH
    → Motors at (Row 2, Col 3) AND (Row 3, Col 4) ACTIVATED SIMULTANEOUSLY
```

```plaintext
Shift registers updated - Row: 0x06, Col[0]: 0x0C, Col[1]: 0x00
```

```plaintext
LATCH = LOW
    ↓
Shift Row Data (IC_C):
    rowData = 0x01 = 00000001
    → IC_C: Row 1 = HIGH
    ↓
Shift Col[1] (IC_B):
    colData[1] = 0x04 = 00000100
    → IC_B: Column 10 (bit 2) = HIGH
    ↓
Shift Col[0] (IC_A):
    colData[0] = 0x00
    → IC_A: All LOW
    ↓
LATCH = HIGH
    ↓
Result:
    IC_A: All columns 0-7 = LOW
    IC_B: Column 10 = HIGH (others LOW)
    IC_C: Row 1 = HIGH
    → Motor at Row 1, Column 10 ACTIVATED
```

```plaintext
Shift registers updated - Row: 0x01, Col[0]: 0x00, Col[1]: 0x04
```

```plaintext
Row Data (IC_C):    0x06 = 00000110
                    └─┬─┘
                      │
        Bit positions: 7 6 5 4 3 2 1 0
        Row mapping:  8 7 6 5 4 3 2 1
                      └─┬─┘ └─┬─┘
                    Row 3  Row 2
                    (bit 1) (bit 2)

Col[0] Data (IC_A): 0x0C = 00001100
                    └─┬─┘ └─┬─┘
                      │     │
        Bit positions: 7 6 5 4 3 2 1 0
        Col mapping:  7 6 5 4 3 2 1 0
                      └─┬─┘ └─┬─┘
                    Col 4  Col 3
                    (bit 2) (bit 3)

Col[1] Data (IC_B): 0x00 = 00000000
                    (All columns 8-15 inactive)
```

```plaintext
Data Flow Direction (Serial):
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  DATA_PIN (GPIO5)                                           │
│      │                                                       │
│      ↓                                                       │
│  ┌─────────┐  Serial Out  ┌─────────┐  Serial Out  ┌─────────┐│
│  │  IC_A   │──────────────→│  IC_B   │──────────────→│  IC_C   ││
│  │ Col 0-7 │               │ Col 8-15│               │ Row 1-8 ││
│  └─────────┘               └─────────┘               └─────────┘│
│      ↑                           ↑                           ↑  │
│      │                           │                           │  │
│  First to receive            Middle                    Last to receive│
│  (Last shifted)            (Middle shifted)         (First shifted)│
│                                                             │
└─────────────────────────────────────────────────────────────┘

Shifting Order (what we send):
1. Row Data (IC_C) - goes to end of chain
2. Col[1] (IC_B) - pushes IC_C forward
3. Col[0] (IC_A) - pushes IC_B and IC_C forward

Final State After Latch:
IC_A: Columns 0-7
IC_B: Columns 8-15  
IC_C: Rows 1-8
```

```plaintext
CLOCK_PIN:  _┌─┐_┌─┐_┌─┐_┌─┐_┌─┐_┌─┐_┌─┐_┌─┐_  (8 pulses per byte)
            │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │
DATA_PIN:   ──┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─  (bit pattern)
            [Row Data] [Col[1]] [Col[0]]
            
LATCH_PIN:  ────────────────────────────────┐
            (LOW during shift)              │ (HIGH to latch)
                                            └───────────────
```

---

**User**

@vending.c (839-885) 



explain this in deep with exmaple data 

---

**Cursor**


Reviewing related functions to explain the monitoring loop with example data.



# Monitoring loop explanation (Lines 839-885)

## Overview

This loop monitors motor feedback and drop sensor while motors run. It exits when the motor completes or a timeout occurs.

---

## Initial setup (before loop)

```c
// Line 825: Record start time
TickType_t start_time = xTaskGetTickCount();
// Example: start_time = 1000 (FreeRTOS ticks)

// Line 826: Get motor timeout
uint32_t motor_timeout_ms = get_motor_timeout_ms();
// Example: motor_timeout_ms = 2500 (Atlas motor)

// Line 829-834: Adjust timeout for Wendor motors
uint32_t main_loop_timeout_ms = motor_timeout_ms;
// Example: main_loop_timeout_ms = 2500 (or 2700 for Wendor)

// Line 836: Convert to FreeRTOS ticks
TickType_t timeout_ticks = main_loop_timeout_ms / portTICK_PERIOD_MS;
// Example: timeout_ticks = 2500 / 10 = 250 ticks (assuming 10ms/tick)

// Line 838: Initialize iteration counter
int main_loop_iteration = 0;
```

---

## Loop structure

### Line 839: While loop condition

```c
while ((xTaskGetTickCount() - start_time) < timeout_ticks)
```

What it does:
- Gets current tick count
- Computes elapsed time
- Continues while elapsed < timeout

Example timeline (assuming 10ms per tick):

| Time (ms) | Current Tick | start_time | Elapsed Ticks | Condition | Status |
|-----------|--------------|------------|---------------|-----------|--------|
| 0 | 1000 | 1000 | 0 | 0 < 250 | Continue |
| 100 | 1010 | 1000 | 10 | 10 < 250 | Continue |
| 1000 | 1100 | 1000 | 100 | 100 < 250 | Continue |
| 2000 | 1200 | 1000 | 200 | 200 < 250 | Continue |
| 2500 | 1250 | 1000 | 250 | 250 < 250 | Exit |

---

## Loop body — iteration-by-iteration

### Example: Atlas motor, sensor enabled, position 23

Initial state:
- `motor_completed = false`
- `drop_detected = false`
- `total_drops_detected = 0`
- `active_row = 2`
- `sensor_enabled = true`
- `main_loop_iteration = 0`

---

### Iteration 1 (t=0ms, iteration=1)

```c
// Line 840: Increment counter
main_loop_iteration++;  // Now = 1

// Line 843: Check motor feedback
if (!motor_completed && check_all_rows_motor_feedback_complete(...)) {
    // motor_completed = false, so condition is true
    // check_all_rows_motor_feedback_complete() reads ADC
    // Example: ADC value = 500 (below threshold)
    // Returns: false (motor not complete)
}
// Result: Condition false, skip block

// Line 854: Check if sensor enabled
if (sensor_enabled) {  // true
    // Line 855: Get drop transition count
    total_drops_detected = get_global_drop_transition_count();
    // Example: Returns 0 (no drops yet)
    
    // Line 856: Check if drops detected
    if (total_drops_detected > 0) {  // 0 > 0 = false
        // Skip block
    }
}
// Result: No drops detected yet

// Line 875: Check if should yield
if (main_loop_iteration % 50 == 0) {  // 1 % 50 = 1, not 0
    // Skip yield
}

// Line 880: Check motor type for delay
if (is_atlas_motor()) {  // true
    // Line 881: Delay 1ms
    vTaskDelay(1 / portTICK_PERIOD_MS);  // Delay ~1ms
}
```

State after iteration 1:
- `motor_completed = false`
- `drop_detected = false`
- `total_drops_detected = 0`
- Loop continues

---

### Iteration 50 (t=50ms, iteration=50)

```c
// Line 840: Increment counter
main_loop_iteration++;  // Now = 50

// Line 843: Check motor feedback
if (!motor_completed && check_all_rows_motor_feedback_complete(...)) {
    // ADC value = 800 (still below threshold)
    // Returns: false
}
// Result: Motor still running

// Line 854-870: Check drop sensor
if (sensor_enabled) {
    total_drops_detected = get_global_drop_transition_count();
    // Example: Returns 0 (still no drops)
}
// Result: No drops yet

// Line 875: Check if should yield
if (main_loop_iteration % 50 == 0) {  // 50 % 50 = 0, TRUE!
    // Line 876: Yield CPU to other tasks
    taskYIELD();
    // Allows other FreeRTOS tasks to run
}
// Result: CPU yielded

// Line 881: Delay 1ms
vTaskDelay(1 / portTICK_PERIOD_MS);
```

State after iteration 50:
- `motor_completed = false`
- `drop_detected = false`
- CPU yielded to other tasks
- Loop continues

---

### Iteration 200 (t=200ms, iteration=200) — drop detected

```c
// Line 840: Increment counter
main_loop_iteration++;  // Now = 200

// Line 843: Check motor feedback
if (!motor_completed && check_all_rows_motor_feedback_complete(...)) {
    // ADC value = 1200 (still below threshold)
    // Returns: false
}
// Result: Motor still running

// Line 854-870: Check drop sensor
if (sensor_enabled) {
    total_drops_detected = get_global_drop_transition_count();
    // Example: Returns 1 (item fell through sensor!)
    
    if (total_drops_detected > 0) {  // 1 > 0 = TRUE!
        drop_detected = true;  // Set flag
        
        // Line 858: Log detection
        ESP_LOGI(VENDING_TAG, "Global drop sensor detected during motor operation - 1 transitions detected!");
        // Log output: "Global drop sensor detected during motor operation - 1 transitions detected!"
        
        // Line 861-866: Format message
        char item_msg[32];
        if (total_drops_detected == 1) {  // true
            snprintf(item_msg, sizeof(item_msg), "Item Detected");
            // item_msg = "Item Detected"
        }
        
        // Line 867: Display on OLED
        printOnOled(item_msg, 2);
        // OLED shows: "Item Detected"
        
        // Line 869: Note - motor continues running
        // Motor doesn't stop here, waits for feedback
    }
}
// Result: Drop detected, but motor continues

// Line 875: Check yield (200 % 50 = 0)
if (main_loop_iteration % 50 == 0) {  // TRUE
    taskYIELD();
}

// Line 881: Delay 1ms
vTaskDelay(1 / portTICK_PERIOD_MS);
```

State after iteration 200:
- `motor_completed = false`
- `drop_detected = true`
- `total_drops_detected = 1`
- OLED: "Item Detected"
- Motor still running

---

### Iteration 1200 (t=1200ms, iteration=1200) — motor completes

```c
// Line 840: Increment counter
main_loop_iteration++;  // Now = 1200

// Line 843: Check motor feedback
if (!motor_completed && check_all_rows_motor_feedback_complete(...)) {
    // check_all_rows_motor_feedback_complete() calls:
    //   - check_atlas_motor_feedback() for Atlas motors
    //   - Reads ADC from GPIO34
    //   - Detects second click pattern (unclick after click)
    // Example: ADC value = 3500 (above threshold)
    // State machine detects: first_click_detected && unclicked
    // Returns: true (motor completed!)
    
    // Line 844: Set completion flag
    motor_completed = true;
    
    // Line 845: Log completion
    ESP_LOGI(VENDING_TAG, "Atlas motor feedback indicates active row 2 has completed");
    // Log output: "Atlas motor feedback indicates active row 2 has completed"
    
    // Line 846: Display on OLED
    printOnOled("Motor Feedback Detected", 2);
    // OLED shows: "Motor Feedback Detected"
    
    // Line 847: Stop all motors
    clearAllMotors();
    // Shift registers cleared, all motors stop
    
    // Line 848: Reset feedback state
    reset_atlas_motor_feedback_state();
    // Reset state machine for next cycle
    
    // Line 849: Exit loop
    break;
    // Loop terminates immediately
}
// Result: Motor completed, loop exited

// Lines 854-884: NOT EXECUTED (break occurred)
```

State after iteration 1200:
- `motor_completed = true`
- `drop_detected = true`
- `total_drops_detected = 1`
- All motors stopped
- Loop exited

---

### Alternative: Timeout scenario (t=2500ms, iteration=2500)

```c
// Line 840: Increment counter
main_loop_iteration++;  // Now = 2500

// Line 839: Check loop condition
while ((xTaskGetTickCount() - start_time) < timeout_ticks) {
    // Current tick = 1250
    // start_time = 1000
    // Elapsed = 1250 - 1000 = 250 ticks
    // timeout_ticks = 250
    // Condition: 250 < 250 = FALSE
    // Loop exits naturally
}
// Result: Loop exits due to timeout

// Execution continues to line 887 (timeout handling)
```

State after timeout:
- `motor_completed = false` (still false)
- Loop exited due to timeout
- Execution continues to timeout handling code

---

## Detailed data flow

### Example: Complete cycle with timing

Scenario: Atlas motor, position 23, sensor enabled, item detected at 200ms, motor completes at 1200ms

```
Time    Iteration  Motor ADC  Drop Count  Motor Complete  Actions
─────────────────────────────────────────────────────────────────────
0ms     1          500        0           false           Loop starts
1ms     2          550        0           false           Polling...
2ms     3          600        0           false           Polling...
...
50ms    50         800        0           false           Yield CPU
51ms    51         850        0           false           Polling...
...
200ms   200        1200       1           false           DROP DETECTED!
                                                          OLED: "Item Detected"
                                                          drop_detected = true
201ms   201        1250       1           false           Motor continues
...
250ms   250        1400       1           false           Yield CPU
...
1200ms  1200       3500       1           true            MOTOR COMPLETE!
                                                          clearAllMotors()
                                                          OLED: "Motor Feedback Detected"
                                                          BREAK loop
```

---

## Function calls explained

### `check_all_rows_motor_feedback_complete()`

```c
// Line 843
check_all_rows_motor_feedback_complete(start_time, &active_row, 1)
```

What it does (for Atlas motor):
1. Calls `check_atlas_motor_feedback()`
2. Reads ADC from GPIO34
3. Checks state machine for click pattern
4. Returns `true` when second unclick detected

Example ADC readings:
```
Time    ADC Value  State Machine          Result
─────────────────────────────────────────────────
0ms     500        Waiting for click     false
500ms   3500       First click detected  false
600ms   3000       Still clicked         false
1200ms  500        Unclicked (second)     true ← Motor complete!
```

---

### `get_global_drop_transition_count()`

```c
// Line 855
total_drops_detected = get_global_drop_transition_count();
```

What it does:
- Returns count of drop sensor transitions from background task
- Counts actual edges (not just state)
- Reduces false positives from vibration

Example transitions:
```
Time    Sensor State  Transition  Count  Result
─────────────────────────────────────────────────
0ms     CLEAR         -           0      0
200ms   BLOCKED       CLEAR→BLOCK 1      1 ← Item detected!
250ms   CLEAR         BLOCK→CLEAR 2      2 (if item passes through)
```

---

## CPU yielding (Lines 874-877)

```c
if (main_loop_iteration % 50 == 0) {
    taskYIELD();
}
```

Purpose:
- Prevents this task from starving others
- Yields every 50 iterations

Timing:
- Atlas: ~50ms between yields (50 × 1ms)
- Others: ~250ms between yields (50 × 5ms)

Example:
```
Iteration  Action
─────────────────
1-49        No yield
50          YIELD ← Other tasks run
51-99       No yield
100         YIELD ← Other tasks run
...
```

---

## Polling delays (Lines 879-884)

```c
if (is_atlas_motor()) {
    vTaskDelay(1 / portTICK_PERIOD_MS);  // 1ms delay
} else {
    vTaskDelay(5 / portTICK_PERIOD_MS);  // 5ms delay
}
```

Why different delays:
- Atlas: Faster polling (1ms) to catch brief pulses
- Others: Slower polling (5ms) to reduce CPU load

Polling rates:
- Atlas: 1000 checks/second
- Others: 200 checks/second

Example timing (Atlas):
```
Iteration  Time    Delay    Next Check
─────────────────────────────────────
1          0ms     1ms      1ms
2          1ms     1ms      2ms
3          2ms     1ms      3ms
...
```

---

## Complete execution trace

Example: Atlas motor, position 23, sensor enabled, successful vend

```
┌─────────────────────────────────────────────────────────────┐
│ INITIALIZATION                                              │
│ start_time = 1000 ticks                                     │
│ timeout_ticks = 250 ticks (2500ms)                          │
│ motor_completed = false                                     │
│ drop_detected = false                                       │
│ main_loop_iteration = 0                                    │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ ITERATION 1-199 (0-199ms)                                   │
│ • Motor ADC: 500-1200 (below threshold)                    │
│ • Drop count: 0                                             │
│ • Motor: Still running                                      │
│ • Drop: Not detected                                        │
│ • Loop: Continues                                           │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ ITERATION 200 (200ms) - DROP DETECTED                       │
│ • Motor ADC: 1200 (still running)                           │
│ • Drop count: 1 ← TRANSITION DETECTED                       │
│ • drop_detected = true                                      │
│ • OLED: "Item Detected"                                     │
│ • Motor: Continues (doesn't stop)                           │
│ • Loop: Continues                                           │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ ITERATION 201-1199 (201-1199ms)                             │
│ • Motor ADC: 1200-3500 (approaching threshold)              │
│ • Drop count: 1 (unchanged)                                 │
│ • Motor: Still running, waiting for feedback                │
│ • Drop: Already detected                                    │
│ • Loop: Continues                                           │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ ITERATION 1200 (1200ms) - MOTOR COMPLETE                    │
│ • Motor ADC: 3500 (above threshold)                         │
│ • State machine: Second unclick detected                    │
│ • motor_completed = true                                    │
│ • clearAllMotors() ← MOTORS STOP                            │
│ • OLED: "Motor Feedback Detected"                           │
│ • BREAK ← LOOP EXITS                                        │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ FINAL STATE                                                  │
│ motor_completed = true                                      │
│ drop_detected = true                                         │
│ total_drops_detected = 1                                     │
│ Result: SUCCESS                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Summary

This loop:
1. Monitors motor feedback every 1-5ms
2. Checks drop sensor transitions continuously
3. Yields CPU every 50 iterations
4. Exits when motor completes or timeout occurs
5. Does not stop motor on drop detection (waits for feedback)

Key points:
- Non-blocking: Yields CPU periodically
- Real-time: Fast polling for motor feedback
- Robust: Uses transition counting for drop detection
- Safe: Timeout prevents infinite loops

The loop ensures reliable motor control while monitoring for item drops in real time.

```c
// Line 825: Record start time
TickType_t start_time = xTaskGetTickCount();
// Example: start_time = 1000 (FreeRTOS ticks)

// Line 826: Get motor timeout
uint32_t motor_timeout_ms = get_motor_timeout_ms();
// Example: motor_timeout_ms = 2500 (Atlas motor)

// Line 829-834: Adjust timeout for Wendor motors
uint32_t main_loop_timeout_ms = motor_timeout_ms;
// Example: main_loop_timeout_ms = 2500 (or 2700 for Wendor)

// Line 836: Convert to FreeRTOS ticks
TickType_t timeout_ticks = main_loop_timeout_ms / portTICK_PERIOD_MS;
// Example: timeout_ticks = 2500 / 10 = 250 ticks (assuming 10ms/tick)

// Line 838: Initialize iteration counter
int main_loop_iteration = 0;
```

```c
while ((xTaskGetTickCount() - start_time) < timeout_ticks)
```

```c
// Line 840: Increment counter
main_loop_iteration++;  // Now = 1

// Line 843: Check motor feedback
if (!motor_completed && check_all_rows_motor_feedback_complete(...)) {
    // motor_completed = false, so condition is true
    // check_all_rows_motor_feedback_complete() reads ADC
    // Example: ADC value = 500 (below threshold)
    // Returns: false (motor not complete)
}
// Result: Condition false, skip block

// Line 854: Check if sensor enabled
if (sensor_enabled) {  // true
    // Line 855: Get drop transition count
    total_drops_detected = get_global_drop_transition_count();
    // Example: Returns 0 (no drops yet)
    
    // Line 856: Check if drops detected
    if (total_drops_detected > 0) {  // 0 > 0 = false
        // Skip block
    }
}
// Result: No drops detected yet

// Line 875: Check if should yield
if (main_loop_iteration % 50 == 0) {  // 1 % 50 = 1, not 0
    // Skip yield
}

// Line 880: Check motor type for delay
if (is_atlas_motor()) {  // true
    // Line 881: Delay 1ms
    vTaskDelay(1 / portTICK_PERIOD_MS);  // Delay ~1ms
}
```

```c
// Line 840: Increment counter
main_loop_iteration++;  // Now = 50

// Line 843: Check motor feedback
if (!motor_completed && check_all_rows_motor_feedback_complete(...)) {
    // ADC value = 800 (still below threshold)
    // Returns: false
}
// Result: Motor still running

// Line 854-870: Check drop sensor
if (sensor_enabled) {
    total_drops_detected = get_global_drop_transition_count();
    // Example: Returns 0 (still no drops)
}
// Result: No drops yet

// Line 875: Check if should yield
if (main_loop_iteration % 50 == 0) {  // 50 % 50 = 0, TRUE!
    // Line 876: Yield CPU to other tasks
    taskYIELD();
    // Allows other FreeRTOS tasks to run
}
// Result: CPU yielded

// Line 881: Delay 1ms
vTaskDelay(1 / portTICK_PERIOD_MS);
```

```c
// Line 840: Increment counter
main_loop_iteration++;  // Now = 200

// Line 843: Check motor feedback
if (!motor_completed && check_all_rows_motor_feedback_complete(...)) {
    // ADC value = 1200 (still below threshold)
    // Returns: false
}
// Result: Motor still running

// Line 854-870: Check drop sensor
if (sensor_enabled) {
    total_drops_detected = get_global_drop_transition_count();
    // Example: Returns 1 (item fell through sensor!)
    
    if (total_drops_detected > 0) {  // 1 > 0 = TRUE!
        drop_detected = true;  // Set flag
        
        // Line 858: Log detection
        ESP_LOGI(VENDING_TAG, "Global drop sensor detected during motor operation - 1 transitions detected!");
        // Log output: "Global drop sensor detected during motor operation - 1 transitions detected!"
        
        // Line 861-866: Format message
        char item_msg[32];
        if (total_drops_detected == 1) {  // true
            snprintf(item_msg, sizeof(item_msg), "Item Detected");
            // item_msg = "Item Detected"
        }
        
        // Line 867: Display on OLED
        printOnOled(item_msg, 2);
        // OLED shows: "Item Detected"
        
        // Line 869: Note - motor continues running
        // Motor doesn't stop here, waits for feedback
    }
}
// Result: Drop detected, but motor continues

// Line 875: Check yield (200 % 50 = 0)
if (main_loop_iteration % 50 == 0) {  // TRUE
    taskYIELD();
}

// Line 881: Delay 1ms
vTaskDelay(1 / portTICK_PERIOD_MS);
```

```c
// Line 840: Increment counter
main_loop_iteration++;  // Now = 1200

// Line 843: Check motor feedback
if (!motor_completed && check_all_rows_motor_feedback_complete(...)) {
    // check_all_rows_motor_feedback_complete() calls:
    //   - check_atlas_motor_feedback() for Atlas motors
    //   - Reads ADC from GPIO34
    //   - Detects second click pattern (unclick after click)
    // Example: ADC value = 3500 (above threshold)
    // State machine detects: first_click_detected && unclicked
    // Returns: true (motor completed!)
    
    // Line 844: Set completion flag
    motor_completed = true;
    
    // Line 845: Log completion
    ESP_LOGI(VENDING_TAG, "Atlas motor feedback indicates active row 2 has completed");
    // Log output: "Atlas motor feedback indicates active row 2 has completed"
    
    // Line 846: Display on OLED
    printOnOled("Motor Feedback Detected", 2);
    // OLED shows: "Motor Feedback Detected"
    
    // Line 847: Stop all motors
    clearAllMotors();
    // Shift registers cleared, all motors stop
    
    // Line 848: Reset feedback state
    reset_atlas_motor_feedback_state();
    // Reset state machine for next cycle
    
    // Line 849: Exit loop
    break;
    // Loop terminates immediately
}
// Result: Motor completed, loop exited

// Lines 854-884: NOT EXECUTED (break occurred)
```

```c
// Line 840: Increment counter
main_loop_iteration++;  // Now = 2500

// Line 839: Check loop condition
while ((xTaskGetTickCount() - start_time) < timeout_ticks) {
    // Current tick = 1250
    // start_time = 1000
    // Elapsed = 1250 - 1000 = 250 ticks
    // timeout_ticks = 250
    // Condition: 250 < 250 = FALSE
    // Loop exits naturally
}
// Result: Loop exits due to timeout

// Execution continues to line 887 (timeout handling)
```

```plaintext
Time    Iteration  Motor ADC  Drop Count  Motor Complete  Actions
─────────────────────────────────────────────────────────────────────
0ms     1          500        0           false           Loop starts
1ms     2          550        0           false           Polling...
2ms     3          600        0           false           Polling...
...
50ms    50         800        0           false           Yield CPU
51ms    51         850        0           false           Polling...
...
200ms   200        1200       1           false           DROP DETECTED!
                                                          OLED: "Item Detected"
                                                          drop_detected = true
201ms   201        1250       1           false           Motor continues
...
250ms   250        1400       1           false           Yield CPU
...
1200ms  1200       3500       1           true            MOTOR COMPLETE!
                                                          clearAllMotors()
                                                          OLED: "Motor Feedback Detected"
                                                          BREAK loop
```

```c
// Line 843
check_all_rows_motor_feedback_complete(start_time, &active_row, 1)
```

```plaintext
Time    ADC Value  State Machine          Result
─────────────────────────────────────────────────
0ms     500        Waiting for click     false
500ms   3500       First click detected  false
600ms   3000       Still clicked         false
1200ms  500        Unclicked (second)     true ← Motor complete!
```

```c
// Line 855
total_drops_detected = get_global_drop_transition_count();
```

```plaintext
Time    Sensor State  Transition  Count  Result
─────────────────────────────────────────────────
0ms     CLEAR         -           0      0
200ms   BLOCKED       CLEAR→BLOCK 1      1 ← Item detected!
250ms   CLEAR         BLOCK→CLEAR 2      2 (if item passes through)
```

```c
if (main_loop_iteration % 50 == 0) {
    taskYIELD();
}
```

```plaintext
Iteration  Action
─────────────────
1-49        No yield
50          YIELD ← Other tasks run
51-99       No yield
100         YIELD ← Other tasks run
...
```

```c
if (is_atlas_motor()) {
    vTaskDelay(1 / portTICK_PERIOD_MS);  // 1ms delay
} else {
    vTaskDelay(5 / portTICK_PERIOD_MS);  // 5ms delay
}
```

```plaintext
Iteration  Time    Delay    Next Check
─────────────────────────────────────
1          0ms     1ms      1ms
2          1ms     1ms      2ms
3          2ms     1ms      3ms
...
```

```plaintext
┌─────────────────────────────────────────────────────────────┐
│ INITIALIZATION                                              │
│ start_time = 1000 ticks                                     │
│ timeout_ticks = 250 ticks (2500ms)                          │
│ motor_completed = false                                     │
│ drop_detected = false                                       │
│ main_loop_iteration = 0                                    │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ ITERATION 1-199 (0-199ms)                                   │
│ • Motor ADC: 500-1200 (below threshold)                    │
│ • Drop count: 0                                             │
│ • Motor: Still running                                      │
│ • Drop: Not detected                                        │
│ • Loop: Continues                                           │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ ITERATION 200 (200ms) - DROP DETECTED                       │
│ • Motor ADC: 1200 (still running)                           │
│ • Drop count: 1 ← TRANSITION DETECTED                       │
│ • drop_detected = true                                      │
│ • OLED: "Item Detected"                                     │
│ • Motor: Continues (doesn't stop)                           │
│ • Loop: Continues                                           │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ ITERATION 201-1199 (201-1199ms)                             │
│ • Motor ADC: 1200-3500 (approaching threshold)              │
│ • Drop count: 1 (unchanged)                                 │
│ • Motor: Still running, waiting for feedback                │
│ • Drop: Already detected                                    │
│ • Loop: Continues                                           │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ ITERATION 1200 (1200ms) - MOTOR COMPLETE                    │
│ • Motor ADC: 3500 (above threshold)                         │
│ • State machine: Second unclick detected                    │
│ • motor_completed = true                                    │
│ • clearAllMotors() ← MOTORS STOP                            │
│ • OLED: "Motor Feedback Detected"                           │
│ • BREAK ← LOOP EXITS                                        │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ FINAL STATE                                                  │
│ motor_completed = true                                      │
│ drop_detected = true                                         │
│ total_drops_detected = 1                                     │
│ Result: SUCCESS                                              │
└─────────────────────────────────────────────────────────────┘
```

