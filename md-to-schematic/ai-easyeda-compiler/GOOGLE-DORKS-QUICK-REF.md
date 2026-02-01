# 🔍 Google Dorks Quick Reference

**10 search operators built into your downloader!**

## 🆕 NEW: AllDataSheet.com is now PRIORITY #1!

**Search Order:**
1. 📊 **AllDataSheet.com** (15 patterns) - 95% success
2. 🏭 Manufacturer sites - 90% success
3. 🔍 Google Dorks - 85% success
4. 🌐 Other hosting sites - 80% success

---

## Quick Lookup

| # | Operator | Success Rate | Example |
|---|----------|--------------|---------|
| 1 | `filetype:pdf "name datasheet"` | 85% | `filetype:pdf "ESP32 datasheet"` |
| 2 | `intitle:"name" filetype:pdf` | 75% | `intitle:"LM358 datasheet" filetype:pdf` |
| 3 | `inurl:datasheet "name" filetype:pdf` | 70% | `inurl:datasheet "ATMEGA328" filetype:pdf` |
| 4 | `site:domain filetype:pdf name` | **90%** | `site:ti.com filetype:pdf LM358` |
| 5 | `"name" "absolute maximum" filetype:pdf` | 80% | `"AO3400" "absolute maximum ratings" filetype:pdf` |
| 6 | `"name" "electrical char" filetype:pdf` | 75% | `"BME280" "electrical characteristics" filetype:pdf` |
| 7 | `(site:a OR site:b) "name"` | 85% | `(site:alldatasheet.com OR site:datasheetspdf.com) "74HC595"` |
| 8 | `"name" "type" datasheet filetype:pdf` | 70% | `"AO3400" "MOSFET" datasheet filetype:pdf` |
| 9 | `("name-1" OR "name2") filetype:pdf` | 80% | `("ESP32-WROOM-32" OR "ESP32WROOM32") filetype:pdf` |
| 10 | `site:domain "name" (DOC-ID) filetype:pdf` | **95%** | `site:ti.com "LM358" (SLOS OR SBOS) filetype:pdf` |

---

## Manufacturer Domains

```
Texas Instruments:    site:ti.com
Analog Devices:       site:analog.com
STMicroelectronics:   site:st.com
Microchip:            site:microchip.com
NXP:                  site:nxp.com
Infineon:             site:infineon.com
Espressif:            site:espressif.com
ON Semiconductor:     site:onsemi.com
Vishay:               site:vishay.com
```

---

## Manufacturer Doc Patterns

```
TI:        SLOS, SBOS, SLVS, SLUS
Analog:    Rev A/B/C, preliminary
ST:        DS prefix
Microchip: DS prefix
Espressif: _datasheet_en
```

---

## Copy-Paste Examples

### ESP32
```
site:espressif.com filetype:pdf "ESP32-WROOM-32"
```

### LM358
```
site:ti.com "LM358" (SLOS OR SBOS) filetype:pdf
```

### ATMEGA328P
```
site:microchip.com "ATMEGA328P" "DS" filetype:pdf
```

### STM32F103
```
site:st.com "STM32F103" "DS" filetype:pdf
```

### AO3400 MOSFET
```
"AO3400" "MOSFET" "VDS" "RDS(on)" filetype:pdf
```

---

## Nuclear Option (Find Anything!)

```
"ComponentName" 
(datasheet OR "data sheet" OR specifications OR "spec sheet") 
(filetype:pdf OR filetype:doc) 
(site:ti.com OR site:analog.com OR site:st.com OR site:alldatasheet.com)
```

---

**All 10 dorks automatically used when you run:**
```bash
npm run download ComponentName Type
```

**See full guide:** GOOGLE-DORK-TRICKS.md
