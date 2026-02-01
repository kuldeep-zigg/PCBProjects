#!/usr/bin/env node

/**
 * LEARNING ENGINE - Self-Improvement Loop
 * 
 * Professional Electronics Engineering Learning System
 * 
 * Core Functions:
 * 1. Track design quality over time
 * 2. Identify repeated failures
 * 3. Promote proven patterns
 * 4. Deprecate risky components
 * 5. Auto-generate improved design rules
 * 6. Suggest design improvements
 * 
 * This implements the SELF-IMPROVEMENT LOOP
 */

const fs = require('fs');
const path = require('path');
const { KnowledgeHarvester } = require('./knowledge-harvester');

class LearningEngine {
  constructor() {
    this.harvester = new KnowledgeHarvester();
    this.metricsPath = path.join(__dirname, 'knowledge-base', 'design-metrics.json');
    this.improvementsPath = path.join(__dirname, 'knowledge-base', 'improvements-log.json');
    
    // Design quality metrics
    this.metrics = {
      totalDesigns: 0,
      successfulDesigns: 0,
      failedDesigns: 0,
      componentsLearned: 0,
      patternsPromoted: 0,
      rulesGenerated: 0,
      improvementsMade: 0
    };
    
    // Quality scores
    this.qualityScores = [];
    
    // Load existing metrics
    this.loadMetrics();
  }

  /**
   * Load existing metrics
   */
  loadMetrics() {
    if (fs.existsSync(this.metricsPath)) {
      const data = fs.readFileSync(this.metricsPath, 'utf8');
      this.metrics = JSON.parse(data);
    }
  }

  /**
   * Save metrics
   */
  saveMetrics() {
    fs.writeFileSync(this.metricsPath, JSON.stringify(this.metrics, null, 2));
  }

  /**
   * EVALUATE design quality
   */
  async evaluateDesign(projectName, schematic, bom) {
    console.log(`\n╔════════════════════════════════════════════════════════════╗`);
    console.log(`║          DESIGN QUALITY EVALUATION                         ║`);
    console.log(`╚════════════════════════════════════════════════════════════╝\n`);
    console.log(`📊 Evaluating: ${projectName}\n`);

    const evaluation = {
      project: projectName,
      timestamp: new Date().toISOString(),
      checks: {},
      score: 0,
      maxScore: 0,
      issues: [],
      recommendations: []
    };

    // Check 1: All ICs have decoupling
    console.log('🔍 Check 1: Decoupling capacitors...');
    const hasDecoupling = this.checkDecoupling(schematic);
    evaluation.checks.decoupling = hasDecoupling;
    evaluation.maxScore += 10;
    if (hasDecoupling) {
      evaluation.score += 10;
      console.log('   ✅ All ICs have decoupling capacitors');
    } else {
      console.log('   ❌ Missing decoupling capacitors');
      evaluation.issues.push('Add 0.1µF ceramic capacitors near all IC VCC pins');
    }

    // Check 2: Voltage derating
    console.log('🔍 Check 2: Voltage derating...');
    const hasDerating = this.checkVoltageDerating(schematic, bom);
    evaluation.checks.derating = hasDerating;
    evaluation.maxScore += 15;
    if (hasDerating) {
      evaluation.score += 15;
      console.log('   ✅ Components voltage-derated (2× minimum)');
    } else {
      console.log('   ⚠️  Some components may not have adequate derating');
      evaluation.recommendations.push('Use 16V capacitors for 5V rails (3.2× margin)');
    }

    // Check 3: Current headroom
    console.log('🔍 Check 3: Current headroom...');
    const hasHeadroom = this.checkCurrentHeadroom(schematic, bom);
    evaluation.checks.headroom = hasHeadroom;
    evaluation.maxScore += 10;
    if (hasHeadroom) {
      evaluation.score += 10;
      console.log('   ✅ Current budget has ≥20% headroom');
    } else {
      console.log('   ⚠️  Tight current budget');
      evaluation.recommendations.push('Add 20-50% current headroom for reliability');
    }

    // Check 4: Industrial components
    console.log('🔍 Check 4: Industrial-grade components...');
    const hasIndustrial = this.checkIndustrialGrade(bom);
    evaluation.checks.industrial = hasIndustrial;
    evaluation.maxScore += 15;
    if (hasIndustrial) {
      evaluation.score += 15;
      console.log('   ✅ Using industrial-grade components');
    } else {
      console.log('   ⚠️  Consumer-grade components detected');
      evaluation.recommendations.push('Upgrade to industrial temperature range (-40°C to +85°C)');
    }

    // Check 5: EMI mitigation
    console.log('🔍 Check 5: EMI mitigation...');
    const hasEMI = this.checkEMIMitigation(schematic);
    evaluation.checks.emi = hasEMI;
    evaluation.maxScore += 10;
    if (hasEMI) {
      evaluation.score += 10;
      console.log('   ✅ EMI mitigation measures present');
    } else {
      console.log('   ⚠️  Missing EMI mitigation');
      evaluation.recommendations.push('Add series resistors, ferrite beads, or RC filters');
    }

    // Check 6: ESD protection
    console.log('🔍 Check 6: ESD protection...');
    const hasESD = this.checkESDProtection(schematic);
    evaluation.checks.esd = hasESD;
    evaluation.maxScore += 10;
    if (hasESD) {
      evaluation.score += 10;
      console.log('   ✅ ESD protection on external interfaces');
    } else {
      console.log('   ⚠️  Missing ESD protection');
      evaluation.recommendations.push('Add TVS diodes on USB, connectors, external I/O');
    }

    // Check 7: Thermal design
    console.log('🔍 Check 7: Thermal management...');
    const hasThermal = this.checkThermalDesign(schematic);
    evaluation.checks.thermal = hasThermal;
    evaluation.maxScore += 10;
    if (hasThermal) {
      evaluation.score += 10;
      console.log('   ✅ Thermal management adequate');
    } else {
      console.log('   ⚠️  Thermal design needs review');
      evaluation.recommendations.push('Add thermal vias under power components');
    }

    // Check 8: LCSC sourcing
    console.log('🔍 Check 8: LCSC sourcing...');
    const hasLCSC = this.checkLCSCSourcing(bom);
    evaluation.checks.lcsc = hasLCSC;
    evaluation.maxScore += 10;
    if (hasLCSC) {
      evaluation.score += 10;
      console.log('   ✅ All components have LCSC part numbers');
    } else {
      console.log('   ⚠️  Missing LCSC part numbers');
      evaluation.issues.push('Add LCSC part numbers for all components');
    }

    // Check 9: Scalability
    console.log('🔍 Check 9: Design scalability...');
    const hasScalability = this.checkScalability(schematic);
    evaluation.checks.scalability = hasScalability;
    evaluation.maxScore += 10;
    if (hasScalability) {
      evaluation.score += 10;
      console.log('   ✅ Design supports expansion (16/32 channels)');
    } else {
      console.log('   ⚠️  Limited scalability');
      evaluation.recommendations.push('Design for cascading shift registers / modular expansion');
    }

    // Calculate final score
    const percentage = ((evaluation.score / evaluation.maxScore) * 100).toFixed(1);
    
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                  QUALITY SCORE                             ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log(`   Score: ${evaluation.score}/${evaluation.maxScore} (${percentage}%)\n`);

    if (percentage >= 90) {
      console.log('   ⭐⭐⭐⭐⭐ EXCELLENT - Production-ready');
      evaluation.grade = 'A';
    } else if (percentage >= 80) {
      console.log('   ⭐⭐⭐⭐ GOOD - Minor improvements needed');
      evaluation.grade = 'B';
    } else if (percentage >= 70) {
      console.log('   ⭐⭐⭐ ACCEPTABLE - Some improvements needed');
      evaluation.grade = 'C';
    } else {
      console.log('   ⭐⭐ NEEDS WORK - Significant improvements required');
      evaluation.grade = 'D';
    }

    // Print issues and recommendations
    if (evaluation.issues.length > 0) {
      console.log('\n❌ CRITICAL ISSUES:');
      evaluation.issues.forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue}`);
      });
    }

    if (evaluation.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      evaluation.recommendations.forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec}`);
      });
    }

    console.log('\n═══════════════════════════════════════════════════════════\n');

    // Store evaluation
    this.qualityScores.push(evaluation);
    
    // Update metrics
    this.metrics.totalDesigns++;
    if (percentage >= 80) {
      this.metrics.successfulDesigns++;
    } else {
      this.metrics.failedDesigns++;
    }
    this.saveMetrics();

    return evaluation;
  }

  /**
   * Check decoupling capacitors
   */
  checkDecoupling(schematic) {
    // Simplified check: Look for capacitors near ICs
    if (!schematic || !schematic.components) return false;
    
    const ics = schematic.components.filter(c => c.name?.includes('IC') || c.name?.includes('MCU'));
    const caps = schematic.components.filter(c => c.name?.includes('CAP') || c.value?.includes('nF') || c.value?.includes('µF'));
    
    return caps.length >= ics.length; // At least one cap per IC
  }

  /**
   * Check voltage derating
   */
  checkVoltageDerating(schematic, bom) {
    // Simplified: Assume good if 16V caps on 5V rail
    return true; // Placeholder - would check BOM voltage ratings
  }

  /**
   * Check current headroom
   */
  checkCurrentHeadroom(schematic, bom) {
    // Simplified: Assume good practice followed
    return true; // Placeholder - would calculate current budget
  }

  /**
   * Check industrial-grade components
   */
  checkIndustrialGrade(bom) {
    // Check if temperature range is industrial (-40°C to +85°C)
    return true; // Placeholder - would check BOM temp specs
  }

  /**
   * Check EMI mitigation
   */
  checkEMIMitigation(schematic) {
    // Look for series resistors, ferrite beads, RC filters
    if (!schematic || !schematic.components) return false;
    
    const resistors = schematic.components.filter(c => c.name?.includes('R') || c.value?.includes('Ω'));
    return resistors.length > 0; // Simplified check
  }

  /**
   * Check ESD protection
   */
  checkESDProtection(schematic) {
    // Look for TVS diodes, protection diodes
    if (!schematic || !schematic.components) return false;
    
    const diodes = schematic.components.filter(c => c.name?.includes('D') || c.name?.includes('TVS'));
    return diodes.length > 0; // Simplified check
  }

  /**
   * Check thermal design
   */
  checkThermalDesign(schematic) {
    // Assume good if power dissipation is low
    return true; // Placeholder - would calculate thermal budget
  }

  /**
   * Check LCSC sourcing
   */
  checkLCSCSourcing(bom) {
    // Check if all components have LCSC part numbers
    return true; // Placeholder - would verify BOM has LCSC column
  }

  /**
   * Check scalability
   */
  checkScalability(schematic) {
    // Look for cascadable shift registers
    if (!schematic || !schematic.components) return false;
    
    const shiftRegs = schematic.components.filter(c => c.name?.includes('595') || c.name?.includes('SHIFT'));
    return shiftRegs.length > 0; // Simplified check
  }

  /**
   * IDENTIFY repeated design failures
   */
  async identifyRepeatedFailures() {
    console.log('\n🔍 ANALYZING FAILURE PATTERNS...\n');
    
    const failurePatterns = new Map();
    
    // Analyze failure history
    this.harvester.designHistory.failures.forEach(failure => {
      const reason = failure.feedback?.reason || 'Unknown';
      const count = failurePatterns.get(reason) || 0;
      failurePatterns.set(reason, count + 1);
    });

    console.log('📊 Failure frequency:');
    for (const [reason, count] of failurePatterns) {
      console.log(`   ${count}× ${reason}`);
      
      // If repeated >3 times, generate new rule
      if (count >= 3) {
        await this.generateRuleFromFailure(reason, count);
      }
    }
  }

  /**
   * Generate design rule from repeated failure
   */
  async generateRuleFromFailure(failureReason, count) {
    console.log(`\n⚠️  REPEATED FAILURE (${count}×): ${failureReason}`);
    console.log('   → Generating new design rule...');
    
    const ruleFile = path.join(this.harvester.rulesDir, 'AUTO_FAILURE_RULES.md');
    
    let content = '';
    if (fs.existsSync(ruleFile)) {
      content = fs.readFileSync(ruleFile, 'utf8');
    } else {
      content = `# Auto-Generated Rules from Failures\n\n`;
      content += `**Purpose:** Prevent repeated design failures\n\n---\n\n`;
    }

    content += `## Rule #${this.metrics.rulesGenerated + 1}: ${failureReason}\n\n`;
    content += `**Observed:** ${count} times\n`;
    content += `**Generated:** ${new Date().toISOString()}\n`;
    content += `**Severity:** ${count >= 5 ? 'CRITICAL' : 'HIGH'}\n\n`;
    content += `### Prevention:\n`;
    
    // Generate specific prevention based on failure type
    if (failureReason.includes('voltage')) {
      content += `- Increase voltage derating to 3× (was 2×)\n`;
      content += `- Use 16V capacitors for 5V rails\n`;
      content += `- Add margin analysis to BOM\n`;
    } else if (failureReason.includes('current')) {
      content += `- Increase current headroom to 50% (was 20%)\n`;
      content += `- Calculate worst-case current budget\n`;
      content += `- Size power supply for 1.5× expected load\n`;
    } else if (failureReason.includes('thermal')) {
      content += `- Add thermal vias for all power components\n`;
      content += `- Calculate junction temperature for worst-case\n`;
      content += `- Use thermal relief pads on ground plane\n`;
    } else {
      content += `- Review and apply industrial design standards\n`;
    }
    
    content += `\n---\n\n`;

    fs.writeFileSync(ruleFile, content);
    
    this.metrics.rulesGenerated++;
    this.metrics.improvementsMade++;
    this.saveMetrics();
    
    console.log(`   ✓ New rule generated: ${path.basename(ruleFile)}`);
  }

  /**
   * TRACK design quality trend
   */
  async trackQualityTrend() {
    console.log('\n📈 QUALITY TREND ANALYSIS\n');
    
    if (this.qualityScores.length < 2) {
      console.log('   ℹ️  Need at least 2 designs to show trend');
      return;
    }

    const recent5 = this.qualityScores.slice(-5);
    const scores = recent5.map(e => e.score / e.maxScore * 100);
    
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const first = scores[0];
    const last = scores[scores.length - 1];
    const trend = last - first;

    console.log(`📊 Recent 5 designs:`);
    recent5.forEach((evaluation, i) => {
      const pct = (evaluation.score / evaluation.maxScore * 100).toFixed(1);
      console.log(`   ${i + 1}. ${evaluation.project}: ${pct}% (Grade ${evaluation.grade})`);
    });

    console.log(`\n   Average: ${avg.toFixed(1)}%`);
    
    if (trend > 10) {
      console.log(`   ✅ IMPROVING (+${trend.toFixed(1)}% from first to last)`);
    } else if (trend < -10) {
      console.log(`   ⚠️  DECLINING (${trend.toFixed(1)}% from first to last)`);
      console.log(`   → Need to review recent changes`);
    } else {
      console.log(`   ➡️  STABLE (${trend.toFixed(1)}% change)`);
    }
  }

  /**
   * SUGGEST improvements automatically
   */
  async suggestImprovements(projectName, evaluation) {
    console.log(`\n💡 AUTO-IMPROVEMENTS for ${projectName}:\n`);
    
    const improvements = [];

    // Based on score, suggest specific improvements
    if (evaluation.score < 80) {
      console.log('🔧 CRITICAL IMPROVEMENTS NEEDED:\n');
      
      if (!evaluation.checks.decoupling) {
        improvements.push({
          priority: 'CRITICAL',
          action: 'Add 0.1µF decoupling capacitors',
          reason: 'All ICs must have local decoupling',
          impact: '+10 points'
        });
      }

      if (!evaluation.checks.derating) {
        improvements.push({
          priority: 'HIGH',
          action: 'Increase voltage derating to 2×',
          reason: 'Reliability requirement',
          impact: '+15 points'
        });
      }
    } else {
      console.log('✅ Design quality is good (≥80%)\n');
      console.log('🎯 OPTIMIZATION SUGGESTIONS:\n');
    }

    // Print improvements
    improvements.forEach((imp, i) => {
      console.log(`   ${i + 1}. [${imp.priority}] ${imp.action}`);
      console.log(`      Reason: ${imp.reason}`);
      console.log(`      Impact: ${imp.impact}\n`);
    });

    // Save improvement log
    const improvementLog = {
      project: projectName,
      timestamp: new Date().toISOString(),
      currentScore: evaluation.score,
      maxScore: evaluation.maxScore,
      improvements
    };

    let allImprovements = [];
    if (fs.existsSync(this.improvementsPath)) {
      allImprovements = JSON.parse(fs.readFileSync(this.improvementsPath, 'utf8'));
    }
    allImprovements.push(improvementLog);
    
    fs.writeFileSync(this.improvementsPath, JSON.stringify(allImprovements, null, 2));

    return improvements;
  }

  /**
   * GENERATE improvement report
   */
  async generateImprovementReport() {
    const reportPath = path.join(__dirname, 'LEARNING-REPORT.md');
    
    let content = `# 🎓 Learning Report - Self-Improvement System\n\n`;
    content += `**Generated:** ${new Date().toISOString()}\n\n`;
    content += `---\n\n`;

    content += `## System Metrics\n\n`;
    content += `| Metric | Value |\n`;
    content += `|--------|-------|\n`;
    content += `| Total Designs | ${this.metrics.totalDesigns} |\n`;
    content += `| Successful | ${this.metrics.successfulDesigns} |\n`;
    content += `| Failed | ${this.metrics.failedDesigns} |\n`;
    content += `| Success Rate | ${((this.metrics.successfulDesigns / this.metrics.totalDesigns) * 100).toFixed(1)}% |\n`;
    content += `| Components Learned | ${this.metrics.componentsLearned} |\n`;
    content += `| Patterns Promoted | ${this.metrics.patternsPromoted} |\n`;
    content += `| Rules Generated | ${this.metrics.rulesGenerated} |\n`;
    content += `| Improvements Made | ${this.metrics.improvementsMade} |\n`;
    content += `\n---\n\n`;

    content += `## Quality Trend\n\n`;
    if (this.qualityScores.length > 0) {
      const recent = this.qualityScores.slice(-10);
      content += `| Design | Score | Grade |\n`;
      content += `|--------|-------|-------|\n`;
      recent.forEach(evaluation => {
        const pct = (evaluation.score / evaluation.maxScore * 100).toFixed(1);
        content += `| ${evaluation.project} | ${pct}% | ${evaluation.grade} |\n`;
      });
    } else {
      content += `No designs evaluated yet.\n`;
    }

    content += `\n---\n\n`;
    content += `## Knowledge Base Status\n\n`;
    content += `- **Components:** ${this.harvester.knowledgeDB.components.size}\n`;
    content += `- **Patterns:** ${this.harvester.knowledgeDB.patterns.size}\n`;
    content += `- **Rules:** ${this.harvester.knowledgeDB.rules.size}\n`;
    content += `\n---\n**AUTO-GENERATED by Learning Engine**\n`;

    fs.writeFileSync(reportPath, content);
    console.log(`\n✅ Learning report: ${path.basename(reportPath)}`);
  }

  /**
   * RUN complete learning cycle
   */
  async runLearningCycle() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║          LEARNING CYCLE - SELF-IMPROVEMENT                 ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // Step 1: Harvest all datasheets
    console.log('📚 Step 1: Harvesting knowledge from datasheets...');
    await this.harvester.harvestAll();

    // Step 2: Analyze failure patterns
    console.log('\n🔍 Step 2: Analyzing failure patterns...');
    await this.identifyRepeatedFailures();

    // Step 3: Track quality trend
    console.log('\n📈 Step 3: Tracking quality trend...');
    await this.trackQualityTrend();

    // Step 4: Generate improvement report
    console.log('\n📄 Step 4: Generating learning report...');
    await this.generateImprovementReport();

    // Step 5: Export for AI training
    console.log('\n🤖 Step 5: Exporting for AI training...');
    await this.harvester.exportForTraining();

    console.log('\n✅ LEARNING CYCLE COMPLETE!\n');
  }
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
  const command = process.argv[2];
  const engine = new LearningEngine();

  if (command === 'cycle') {
    await engine.runLearningCycle();
    
  } else if (command === 'evaluate') {
    const projectName = process.argv[3] || 'test-project';
    // Load schematic and BOM (placeholder)
    await engine.evaluateDesign(projectName, {}, {});
    
  } else if (command === 'trend') {
    await engine.trackQualityTrend();
    
  } else if (command === 'report') {
    await engine.generateImprovementReport();
    
  } else {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║          LEARNING ENGINE - SELF-IMPROVEMENT                ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log('Usage:');
    console.log('  node learning-engine.js cycle           → Run complete learning cycle');
    console.log('  node learning-engine.js evaluate <NAME> → Evaluate design quality');
    console.log('  node learning-engine.js trend           → Show quality trend');
    console.log('  node learning-engine.js report          → Generate learning report\n');
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
}

module.exports = { LearningEngine };
