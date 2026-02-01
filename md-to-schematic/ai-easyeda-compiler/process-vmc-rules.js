#!/usr/bin/env node

/**
 * VMC RULES PROCESSOR
 * Splits VMC Hardware Edition into individual rules and extracts components
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const vmcRules = `
VMC Hardware Edition

Always use 100nF bypass capacitors near every IC power pin
Understand why bulk capacitors (100–1000µF) are needed near motors
Learn difference between bypass vs bulk capacitors
Always design with a solid ground plane
Learn current return paths (not just signal paths)
Know which traces must be wide (power, motors, ground)
Separate dirty (motors, LEDs) from clean (MCU, sensors) areas
Learn why motors cause resets and how to stop them
Always add flyback protection for motors and coils
Learn what ground bounce is and why it causes randomness
Never power MCU directly from 24V (learn buck → LDO strategy)
Learn brownout reset vs watchdog reset
Always make power connectors keyed and polarity-safe
Never use two identical swappable connectors on the same board
Use different connector families per voltage domain
Learn why silkscreen labels save field support time
Always include test points for every power rail
Learn how test points speed up debugging 10×
Always expose reset, boot, and programming pins
Learn why 0Ω resistors are debugging tools
Design DNP (Do Not Populate) option footprints
Learn why modular boards beat monolithic boards in low volume
Understand why salary cost > BOM cost in startups
Learn how over-rating components improves reliability
Understand motor inrush vs running vs stall current
Design hardware for worst case, enable features in firmware later
Learn why starting motors 100ms apart reduces problems
Learn why ESP32 Wi-Fi causes current spikes
Always give ESP32 a clean, well-decoupled 3.3V rail
Learn antenna keepout rules for ESP32 modules
Prefer ESP32 modules over bare chips as a beginner
Learn why RS485 is better than GPIO spaghetti for trays
Understand bus vs point-to-point wiring
Learn how addressing (jumpers/DIP) simplifies multi-tray systems
Always plan fault isolation per tray or per bank
Learn how protected motor drivers reduce field failures
Understand why current sensing helps jam detection
Learn why analog sensors need RC filters
Learn why digital sensors are more noise-resistant
Always keep LED PWM currents out of sensor ground paths
Learn why EMI/ESD protection matters inside cabinets
Learn why reverse polarity protection is mandatory
Always leave space and headers for future features
Learn why big boards are faster to iterate than tiny boards
Prefer 0805 parts for speed and reworkability
Avoid QFN/BGA until designs are stable
Learn how assembly mistakes happen and how to prevent them
Always design so a mistake is easy to diagnose and fix
Learn to think in "what will fail in the field?"
Optimize for reliability, serviceability, and learning speed — not size
`;

// Extract components from rules
const componentPatterns = [
  // Specific ICs and modules
  /ESP32/gi,
  /RS485/gi,
  /LDO/gi,
  /buck\s+converter/gi,
  /motor\s+driver/gi,
  
  // Generic components
  /capacitor/gi,
  /resistor/gi,
  /LED/gi,
  /connector/gi,
  /sensor/gi,
  /diode/gi,
  /flyback/gi,
  
  // Part numbers (if any)
  /\b\d{3,4}[A-Z]{2,}\d*/gi,
  /[A-Z]{2,}\d{3,}/gi
];

async function processVMCRules() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         VMC RULES PROCESSOR                                ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Step 1: Split rules into individual lines
  const rules = vmcRules
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.includes('VMC Hardware Edition'));

  console.log(`📋 Found ${rules.length} individual rules\n`);

  // Step 2: Extract components
  const components = new Set();
  const componentContext = new Map(); // Component -> rules mentioning it

  rules.forEach(rule => {
    componentPatterns.forEach(pattern => {
      const matches = rule.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const normalized = match.toLowerCase().trim();
          if (normalized.length > 2) {
            components.add(normalized);
            if (!componentContext.has(normalized)) {
              componentContext.set(normalized, []);
            }
            componentContext.get(normalized).push(rule);
          }
        });
      }
    });
  });

  console.log(`🔍 Extracted ${components.size} unique components:\n`);
  Array.from(components).forEach(comp => {
    console.log(`   • ${comp}`);
  });

  // Step 3: Process each rule through smart-learn
  console.log('\n┌─────────────────────────────────────────────────────────┐');
  console.log('│ Processing individual rules...');
  console.log('└─────────────────────────────────────────────────────────┘\n');

  let processed = 0;
  let failed = 0;

  for (const rule of rules) {
    try {
      console.log(`[${processed + 1}/${rules.length}] Processing: "${rule.substring(0, 60)}..."`);
      
      // Escape quotes for shell
      const escapedRule = rule.replace(/"/g, '\\"');
      await execAsync(`npm run smart-learn "${escapedRule}"`, {
        cwd: __dirname,
        timeout: 30000
      });
      
      processed++;
      await sleep(500); // Brief delay to avoid overwhelming the system
    } catch (error) {
      console.log(`   ⚠️  Failed: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n✅ Processed: ${processed}/${rules.length} rules`);
  if (failed > 0) {
    console.log(`⚠️  Failed: ${failed} rules`);
  }

  // Step 4: Process components
  console.log('\n┌─────────────────────────────────────────────────────────┐');
  console.log('│ Processing components...');
  console.log('└─────────────────────────────────────────────────────────┘\n');

  const componentsToSearch = Array.from(components).filter(comp => {
    // Filter to likely real components
    return (
      comp.includes('esp32') ||
      comp.includes('rs485') ||
      comp.includes('ldo') ||
      comp.includes('buck') ||
      comp.includes('capacitor') ||
      comp.includes('motor driver') ||
      comp.includes('sensor')
    );
  });

  console.log(`🔍 Processing ${componentsToSearch.length} components:\n`);

  let compProcessed = 0;
  let compFailed = 0;

  for (const component of componentsToSearch) {
    try {
      console.log(`[${compProcessed + 1}/${componentsToSearch.length}] Gathering data: ${component}`);
      
      const escapedComp = component.replace(/"/g, '\\"');
      await execAsync(`npm run smart-learn "${escapedComp}"`, {
        cwd: __dirname,
        timeout: 60000 // Longer timeout for component searches
      });
      
      compProcessed++;
      await sleep(1000); // Delay between component searches
    } catch (error) {
      console.log(`   ⚠️  Failed: ${error.message}`);
      compFailed++;
    }
  }

  console.log(`\n✅ Processed: ${compProcessed}/${componentsToSearch.length} components`);
  if (compFailed > 0) {
    console.log(`⚠️  Failed: ${compFailed} components`);
  }

  // Step 5: Summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                   PROCESSING COMPLETE                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log('📊 Summary:');
  console.log(`   Rules processed: ${processed}/${rules.length}`);
  console.log(`   Components processed: ${compProcessed}/${componentsToSearch.length}`);
  console.log(`   Total components identified: ${components.size}`);
  console.log('\n📁 Outputs:');
  console.log('   • Rules: rules-md/AUTO_GENERATED_RULES.md');
  console.log('   • Component data: knowledge-base/web-scraped/*.json\n');

  // Save component context
  const contextData = {
    totalRules: rules.length,
    totalComponents: components.size,
    componentContext: Array.from(componentContext.entries()).map(([comp, rules]) => ({
      component: comp,
      mentionedInRules: rules,
      count: rules.length
    })),
    timestamp: new Date().toISOString()
  };

  await fs.writeFile(
    path.join(__dirname, 'knowledge-base', 'vmc-component-context.json'),
    JSON.stringify(contextData, null, 2)
  );

  console.log('💾 Component context saved: knowledge-base/vmc-component-context.json\n');

  return {
    rulesProcessed: processed,
    componentProcessed: compProcessed,
    totalComponents: components.size
  };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run if called directly
if (require.main === module) {
  processVMCRules()
    .then(result => {
      console.log('✅ All done!\n');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Error:', error.message);
      process.exit(1);
    });
}

module.exports = { processVMCRules };
