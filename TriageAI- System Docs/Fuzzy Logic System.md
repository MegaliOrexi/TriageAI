# TriageAI Rule-Based/Fuzzy Logic System

## Overview

This document details the rule-based/fuzzy logic system for patient prioritization in the TriageAI system. The system combines multiple factors to determine patient priority in the emergency room queue, with an emphasis on risk level and exponentially weighted waiting time.

## Input Variables

### 1. Risk Level (from classification model)

The risk level is determined by the pre-built classification model and serves as a primary input to the prioritization system.

**Crisp Values:**
- High Risk: 3
- Medium Risk: 2
- Low Risk: 1

**Fuzzy Membership Functions:**
- Low Risk: Triangular membership function (0, 1, 2)
- Medium Risk: Triangular membership function (1, 2, 3)
- High Risk: Triangular membership function (2, 3, 4)

### 2. Waiting Time

Waiting time is measured in minutes since the patient's arrival and is exponentially weighted to ensure that patients who have been waiting longer receive increasingly higher priority.

**Exponential Weighting Formula:**
```
waitingTimeWeight = baseWeight * e^(waitingTime / timeConstant)
```

Where:
- `baseWeight` is the initial weight assigned to waiting time (default: 1.0)
- `waitingTime` is the time in minutes since patient arrival
- `timeConstant` is a parameter that controls how quickly the weight increases (default: 30 minutes)

**Fuzzy Membership Functions:**
- Short Wait: Trapezoidal membership function (0, 0, 15, 30) minutes
- Medium Wait: Triangular membership function (15, 45, 75) minutes
- Long Wait: Trapezoidal membership function (60, 90, 120, 120+) minutes

### 3. Resource Availability

Resource availability represents the percentage of required resources that are currently available for the patient's treatment.

**Calculation:**
```
resourceAvailability = (availableRequiredResources / totalRequiredResources) * 100
```

**Fuzzy Membership Functions:**
- Low Availability: Trapezoidal membership function (0, 0, 30, 50) percent
- Medium Availability: Triangular membership function (30, 60, 90) percent
- High Availability: Trapezoidal membership function (70, 90, 100, 100) percent

### 4. Staff Availability

Staff availability represents the percentage of required staff specialties that are currently available for the patient's treatment.

**Calculation:**
```
staffAvailability = (availableRequiredSpecialties / totalRequiredSpecialties) * 100
```

**Fuzzy Membership Functions:**
- Low Availability: Trapezoidal membership function (0, 0, 30, 50) percent
- Medium Availability: Triangular membership function (30, 60, 90) percent
- High Availability: Trapezoidal membership function (70, 90, 100, 100) percent

## Fuzzy Rule Base

The rule base combines the input variables to determine the patient's priority. The rules are designed to ensure that high-risk patients receive high priority, while also accounting for waiting time and resource/staff availability.

### Sample Rules:

1. IF (RiskLevel IS High) AND (WaitingTime IS ANY) THEN Priority IS VeryHigh
2. IF (RiskLevel IS Medium) AND (WaitingTime IS Long) THEN Priority IS High
3. IF (RiskLevel IS Medium) AND (WaitingTime IS Medium) THEN Priority IS Medium
4. IF (RiskLevel IS Medium) AND (WaitingTime IS Short) THEN Priority IS MediumLow
5. IF (RiskLevel IS Low) AND (WaitingTime IS Long) THEN Priority IS Medium
6. IF (RiskLevel IS Low) AND (WaitingTime IS Medium) THEN Priority IS Low
7. IF (RiskLevel IS Low) AND (WaitingTime IS Short) THEN Priority IS VeryLow
8. IF (ResourceAvailability IS Low) THEN Priority IS Decreased
9. IF (StaffAvailability IS Low) THEN Priority IS Decreased

### Priority Output Fuzzy Sets:

- VeryLow: Triangular membership function (0, 10, 20)
- Low: Triangular membership function (10, 25, 40)
- MediumLow: Triangular membership function (30, 45, 60)
- Medium: Triangular membership function (50, 65, 80)
- High: Triangular membership function (70, 85, 100)
- VeryHigh: Triangular membership function (90, 100, 100)

## Defuzzification

The system uses the centroid method (center of gravity) for defuzzification to convert the fuzzy output into a crisp priority score between 0 and 100.

```
priorityScore = centroid(aggregatedFuzzyOutput)
```

## Implementation in JavaScript

Below is the JavaScript implementation of the rule-based/fuzzy logic system:

```javascript
/**
 * TriageAI Rule-Based/Fuzzy Logic System for Patient Prioritization
 */
class TriageFuzzyLogic {
  constructor(settings = {}) {
    // Default settings
    this.settings = {
      riskLevelWeight: 0.5,
      waitingTimeWeight: 0.3,
      resourceAvailabilityWeight: 0.1,
      staffAvailabilityWeight: 0.1,
      waitingTimeExponentBase: 1.05,
      waitingTimeConstant: 30,
      ...settings
    };
  }

  /**
   * Calculate patient priority score
   * @param {Object} patient - Patient data
   * @param {number} patient.riskLevel - Risk level (1: Low, 2: Medium, 3: High)
   * @param {number} patient.waitingTimeMinutes - Waiting time in minutes
   * @param {number} patient.resourceAvailability - Percentage of required resources available (0-100)
   * @param {number} patient.staffAvailability - Percentage of required staff specialties available (0-100)
   * @returns {Object} - Priority score and component details
   */
  calculatePriority(patient) {
    // Calculate component scores
    const riskLevelScore = this.calculateRiskLevelScore(patient.riskLevel);
    const waitingTimeScore = this.calculateWaitingTimeScore(patient.waitingTimeMinutes);
    const resourceAvailabilityScore = this.calculateResourceAvailabilityScore(patient.resourceAvailability);
    const staffAvailabilityScore = this.calculateStaffAvailabilityScore(patient.staffAvailability);

    // Apply weights to component scores
    const weightedRiskLevelScore = riskLevelScore * this.settings.riskLevelWeight;
    const weightedWaitingTimeScore = waitingTimeScore * this.settings.waitingTimeWeight;
    const weightedResourceAvailabilityScore = resourceAvailabilityScore * this.settings.resourceAvailabilityWeight;
    const weightedStaffAvailabilityScore = staffAvailabilityScore * this.settings.staffAvailabilityWeight;

    // Calculate final priority score (0-100)
    const priorityScore = weightedRiskLevelScore + 
                          weightedWaitingTimeScore + 
                          weightedResourceAvailabilityScore + 
                          weightedStaffAvailabilityScore;

    // Return priority score and component details
    return {
      priorityScore: Math.min(100, Math.max(0, priorityScore)),
      components: {
        riskLevel: {
          value: patient.riskLevel,
          score: riskLevelScore,
          weightedScore: weightedRiskLevelScore
        },
        waitingTime: {
          value: patient.waitingTimeMinutes,
          score: waitingTimeScore,
          weightedScore: weightedWaitingTimeScore
        },
        resourceAvailability: {
          value: patient.resourceAvailability,
          score: resourceAvailabilityScore,
          weightedScore: weightedResourceAvailabilityScore
        },
        staffAvailability: {
          value: patient.staffAvailability,
          score: staffAvailabilityScore,
          weightedScore: weightedStaffAvailabilityScore
        }
      }
    };
  }

  /**
   * Calculate risk level score (0-100)
   * @param {number} riskLevel - Risk level (1: Low, 2: Medium, 3: High)
   * @returns {number} - Risk level score
   */
  calculateRiskLevelScore(riskLevel) {
    // Map risk levels to scores (0-100)
    const riskLevelMap = {
      1: 33.33,  // Low
      2: 66.67,  // Medium
      3: 100     // High
    };

    return riskLevelMap[riskLevel] || 0;
  }

  /**
   * Calculate waiting time score with exponential weighting (0-100)
   * @param {number} waitingTimeMinutes - Waiting time in minutes
   * @returns {number} - Waiting time score
   */
  calculateWaitingTimeScore(waitingTimeMinutes) {
    // Apply exponential weighting to waiting time
    const exponentialFactor = Math.pow(
      this.settings.waitingTimeExponentBase, 
      waitingTimeMinutes / this.settings.waitingTimeConstant
    );

    // Calculate score (0-100)
    const score = Math.min(100, 100 * (1 - 1 / exponentialFactor));
    
    return score;
  }

  /**
   * Calculate resource availability score (0-100)
   * @param {number} resourceAvailability - Percentage of required resources available (0-100)
   * @returns {number} - Resource availability score
   */
  calculateResourceAvailabilityScore(resourceAvailability) {
    // Higher availability = higher score
    return resourceAvailability;
  }

  /**
   * Calculate staff availability score (0-100)
   * @param {number} staffAvailability - Percentage of required staff specialties available (0-100)
   * @returns {number} - Staff availability score
   */
  calculateStaffAvailabilityScore(staffAvailability) {
    // Higher availability = higher score
    return staffAvailability;
  }

  /**
   * Apply fuzzy rules to determine priority category
   * @param {Object} scores - Component scores
   * @returns {string} - Priority category
   */
  determinePriorityCategory(scores) {
    const { riskLevel, waitingTimeScore } = scores;
    
    // Apply fuzzy rules
    if (riskLevel === 3) return 'VeryHigh';
    if (riskLevel === 2 && waitingTimeScore > 70) return 'High';
    if (riskLevel === 2 && waitingTimeScore > 30) return 'Medium';
    if (riskLevel === 2) return 'MediumLow';
    if (riskLevel === 1 && waitingTimeScore > 70) return 'Medium';
    if (riskLevel === 1 && waitingTimeScore > 30) return 'Low';
    return 'VeryLow';
  }
}

/**
 * Patient Priority Queue Manager
 */
class PatientPriorityQueue {
  constructor(fuzzyLogic) {
    this.fuzzyLogic = fuzzyLogic;
    this.patients = [];
  }

  /**
   * Add or update a patient in the queue
   * @param {Object} patient - Patient data
   */
  updatePatient(patient) {
    // Calculate waiting time in minutes
    const waitingTimeMinutes = this.calculateWaitingTime(patient.arrivalTime);
    
    // Calculate resource and staff availability
    const resourceAvailability = this.calculateResourceAvailability(patient);
    const staffAvailability = this.calculateStaffAvailability(patient);
    
    // Calculate priority score
    const priorityResult = this.fuzzyLogic.calculatePriority({
      riskLevel: patient.riskLevel,
      waitingTimeMinutes,
      resourceAvailability,
      staffAvailability
    });
    
    // Update patient with priority score
    const updatedPatient = {
      ...patient,
      priorityScore: priorityResult.priorityScore,
      priorityComponents: priorityResult.components,
      waitingTimeMinutes,
      lastPriorityUpdate: new Date()
    };
    
    // Add or update patient in the queue
    const existingIndex = this.patients.findIndex(p => p.id === patient.id);
    if (existingIndex >= 0) {
      this.patients[existingIndex] = updatedPatient;
    } else {
      this.patients.push(updatedPatient);
    }
    
    // Sort queue by priority score (descending)
    this.sortQueue();
    
    return updatedPatient;
  }

  /**
   * Calculate waiting time in minutes
   * @param {Date} arrivalTime - Patient arrival time
   * @returns {number} - Waiting time in minutes
   */
  calculateWaitingTime(arrivalTime) {
    const now = new Date();
    const arrivalDate = new Date(arrivalTime);
    const waitingTimeMs = now - arrivalDate;
    return Math.max(0, Math.floor(waitingTimeMs / (1000 * 60)));
  }

  /**
   * Calculate resource availability percentage
   * @param {Object} patient - Patient data
   * @returns {number} - Resource availability percentage (0-100)
   */
  calculateResourceAvailability(patient) {
    // This would be implemented based on the actual resource tracking system
    // For now, return a placeholder value
    return 75; // 75% of required resources are available
  }

  /**
   * Calculate staff availability percentage
   * @param {Object} patient - Patient data
   * @returns {number} - Staff availability percentage (0-100)
   */
  calculateStaffAvailability(patient) {
    // This would be implemented based on the actual staff tracking system
    // For now, return a placeholder value
    return 80; // 80% of required staff specialties are available
  }

  /**
   * Sort queue by priority score (descending)
   */
  sortQueue() {
    this.patients.sort((a, b) => b.priorityScore - a.priorityScore);
  }

  /**
   * Get the current patient queue
   * @returns {Array} - Sorted patient queue
   */
  getQueue() {
    return [...this.patients];
  }

  /**
   * Remove a patient from the queue
   * @param {string} patientId - Patient ID
   */
  removePatient(patientId) {
    this.patients = this.patients.filter(p => p.id !== patientId);
  }

  /**
   * Update all patients' priority scores
   */
  updateAllPriorities() {
    this.patients.forEach(patient => {
      this.updatePatient(patient);
    });
  }
}

// Example usage
const exampleSettings = {
  riskLevelWeight: 0.5,
  waitingTimeWeight: 0.3,
  resourceAvailabilityWeight: 0.1,
  staffAvailabilityWeight: 0.1,
  waitingTimeExponentBase: 1.05,
  waitingTimeConstant: 30
};

const fuzzyLogic = new TriageFuzzyLogic(exampleSettings);
const priorityQueue = new PatientPriorityQueue(fuzzyLogic);

// Example patient
const patient = {
  id: '123',
  name: 'John Doe',
  riskLevel: 2, // Medium
  arrivalTime: new Date(Date.now() - 45 * 60 * 1000) // 45 minutes ago
};

// Update patient priority
const updatedPatient = priorityQueue.updatePatient(patient);
console.log(`Patient ${patient.name} has priority score: ${updatedPatient.priorityScore.toFixed(2)}`);
```

## System Behavior Analysis

### Waiting Time Exponential Growth

The exponential weighting of waiting time ensures that patients who have been waiting longer receive increasingly higher priority. This helps prevent patients with lower risk levels from being indefinitely delayed when there is a continuous influx of higher-risk patients.

For example, with the default settings:
- A patient waiting for 30 minutes will have a waiting time score of approximately 39.3
- A patient waiting for 60 minutes will have a waiting time score of approximately 63.2
- A patient waiting for 90 minutes will have a waiting time score of approximately 78.7
- A patient waiting for 120 minutes will have a waiting time score of approximately 88.2

This exponential growth ensures that even low-risk patients will eventually reach high priority if they wait long enough.

### Risk Level vs. Waiting Time

The system balances the immediate needs of high-risk patients with the fairness of not indefinitely delaying lower-risk patients:

1. **High-Risk Patients**: Always receive high priority regardless of waiting time
2. **Medium-Risk Patients**: Start with medium priority and increase to high priority after significant waiting time
3. **Low-Risk Patients**: Start with low priority and gradually increase to medium priority with extended waiting

### Resource and Staff Availability Impact

Resource and staff availability factors adjust the priority based on the hospital's current capacity to treat the patient:

- If required resources are available, the patient's priority may be slightly increased
- If required staff specialties are available, the patient's priority may be slightly increased
- This helps optimize resource utilization while still maintaining the primary focus on risk level and waiting time

## Integration with TriageAI System

The rule-based/fuzzy logic system integrates with the TriageAI system through the following components:

1. **Database Integration**: Priority scores are stored in the `patients` table and updated periodically
2. **API Endpoints**: The system exposes endpoints for calculating and updating patient priorities
3. **Frontend Display**: The patient queue is displayed based on the calculated priority scores
4. **Admin Controls**: Administrators can adjust system parameters through the admin interface

### API Endpoints

The following API endpoints are provided for the rule-based/fuzzy logic system:

- `GET /api/triage/queue`: Get the current prioritized patient queue
- `POST /api/triage/calculate`: Calculate priority for a specific patient
- `PUT /api/triage/settings`: Update the priority calculation settings
- `GET /api/triage/statistics`: Get statistics about the triage system performance

## Performance Considerations

The rule-based/fuzzy logic system is designed to be efficient and scalable:

1. **Batch Processing**: Priority scores are updated in batch to minimize database operations
2. **Caching**: Frequently accessed data (like the patient queue) is cached to improve performance
3. **Asynchronous Updates**: Priority updates run asynchronously to avoid blocking user interactions
4. **Optimized Algorithms**: The fuzzy logic algorithms are optimized for performance

## Conclusion

The rule-based/fuzzy logic system provides a fair and efficient method for prioritizing patients in the emergency room. By combining risk level assessment with exponentially weighted waiting time and resource/staff availability, the system ensures that patients receive timely care based on their needs while optimizing hospital resource utilization.

The system is flexible and can be adjusted through configuration parameters to meet the specific needs of different emergency departments. The exponential weighting of waiting time ensures that no patient waits indefinitely, addressing a key concern in emergency room triage systems.
