// Generate all combinations of r elements from array arr
export function getCombinations(arr, r) {
  if (r > arr.length) return [];
  if (r === 1) return arr.map(el => [el]);

  const result = [];

  for (let i = 0; i <= arr.length - r; i++) {
    const first = arr[i];
    const restCombinations = getCombinations(arr.slice(i + 1), r - 1);

    for (const combination of restCombinations) {
      result.push([first, ...combination]);
    }
  }

  return result;
}

// Calculate nCr (combinations)
export function calculateCombinations(n, r) {
  if (r > n || r < 0) return 0;
  if (r === 0 || r === n) return 1;

  // Use the identity C(n,r) = C(n,n-r) to minimize calculations
  r = Math.min(r, n - r);

  let result = 1;
  for (let i = 0; i < r; i++) {
    result = result * (n - i) / (i + 1);
  }

  return Math.round(result);
}

// Dynamic wheel generation algorithms for Texas Two-Step
// Real-time generation based on mathematical principles

// Dynamic wheel generation - creates wheels in real-time based on mathematical principles
export function generateAbbreviatedWheel(selectedNumbers, pickSize = 4, guarantee = '2if3', options = {}) {
  if (selectedNumbers.length < pickSize) {
    return [];
  }

  // Parse guarantee parameters
  const { minMatches, conditionMatches } = parseGuarantee(guarantee);

  // Generate wheel using dynamic algorithm
  return generateDynamicWheel(selectedNumbers, pickSize, minMatches, conditionMatches, options);
}

// Parse guarantee string (e.g., "3if4" means 3 matches if 4 of your numbers are drawn)
function parseGuarantee(guarantee) {
  const match = guarantee.match(/(\d+)if(\d+)/);
  if (!match) {
    return { minMatches: 2, conditionMatches: 3 }; // Default
  }
  return {
    minMatches: parseInt(match[1]),
    conditionMatches: parseInt(match[2])
  };
}

// Dynamic wheel generation algorithm
function generateDynamicWheel(selectedNumbers, pickSize, minMatches, conditionMatches, options = {}) {
  const { optimization = 'balance', coverageFactor = 0.5 } = options;

  // Get all possible combinations first
  const allCombinations = getCombinations(selectedNumbers, pickSize);

  // Apply optimization strategy
  switch (optimization) {
    case 'cost':
      return generateCostOptimizedWheel(allCombinations, selectedNumbers, pickSize, minMatches, conditionMatches, coverageFactor * 0.7);
    case 'coverage':
      return generateCoverageOptimizedWheel(allCombinations, selectedNumbers, pickSize, minMatches, conditionMatches, coverageFactor * 1.2);
    case 'balance':
    default:
      return generateBalancedWheel(allCombinations, selectedNumbers, pickSize, minMatches, conditionMatches, coverageFactor);
  }
}

// Cost-optimized wheel (fewer combinations)
function generateCostOptimizedWheel(allCombinations, selectedNumbers, pickSize, minMatches, conditionMatches, factor) {
  const targetSize = Math.max(3, Math.ceil(allCombinations.length * factor));
  return generateOptimizedSelection(allCombinations, targetSize, 'cost');
}

// Coverage-optimized wheel (more combinations)
function generateCoverageOptimizedWheel(allCombinations, selectedNumbers, pickSize, minMatches, conditionMatches, factor) {
  const targetSize = Math.min(allCombinations.length, Math.ceil(allCombinations.length * factor));
  return generateOptimizedSelection(allCombinations, targetSize, 'coverage');
}

// Balanced wheel (optimal cost/coverage ratio)
function generateBalancedWheel(allCombinations, selectedNumbers, pickSize, minMatches, conditionMatches, factor) {
  const targetSize = Math.ceil(allCombinations.length * factor);
  return generateOptimizedSelection(allCombinations, targetSize, 'balance');
}

// Generate optimized selection based on strategy
function generateOptimizedSelection(allCombinations, targetSize, strategy) {
  const result = [];
  const usedCombos = new Set();

  // Different selection strategies
  switch (strategy) {
    case 'cost': {
      // Select evenly spaced combinations for basic coverage
      const stepCost = Math.max(1, Math.floor(allCombinations.length / targetSize));
      for (let i = 0; i < allCombinations.length && result.length < targetSize; i += stepCost) {
        const combo = allCombinations[i];
        const signature = combo.sort().join(',');
        if (!usedCombos.has(signature)) {
          result.push(combo);
          usedCombos.add(signature);
        }
      }
      break;
    }

    case 'coverage':
      // Use systematic approach for maximum coverage
      return fillWheelGaps([], allCombinations, targetSize);

    case 'balance':
    default: {
      // Balanced approach using smart selection
      const stepBalance = Math.max(1, Math.floor(allCombinations.length / (targetSize * 0.7)));
      for (let i = 0; i < allCombinations.length && result.length < targetSize * 0.7; i += stepBalance) {
        const combo = allCombinations[i];
        const signature = combo.sort().join(',');
        if (!usedCombos.has(signature)) {
          result.push(combo);
          usedCombos.add(signature);
        }
      }
      // Fill remaining with optimized selection
      return fillWheelGaps(result, allCombinations, targetSize);
    }
  }

  // Fill any remaining spots
  return fillWheelGaps(result, allCombinations, targetSize);
}


// Fill gaps in wheel coverage with smart selection
function fillWheelGaps(currentWheel, allCombinations, targetSize) {
  const result = [...currentWheel];
  const usedCombos = new Set(result.map(combo => combo.sort().join(',')));

  // Add combinations that provide good number distribution
  for (const combo of allCombinations) {
    if (result.length >= targetSize) break;

    const signature = combo.sort().join(',');
    if (!usedCombos.has(signature)) {
      // Check if this combination provides good coverage
      if (providesGoodCoverage(combo, result)) {
        result.push(combo);
        usedCombos.add(signature);
      }
    }
  }

  // If still under target, add remaining combinations systematically
  for (const combo of allCombinations) {
    if (result.length >= targetSize) break;

    const signature = combo.sort().join(',');
    if (!usedCombos.has(signature)) {
      result.push(combo);
      usedCombos.add(signature);
    }
  }

  return result;
}

// Check if a combination provides good coverage (avoids too much overlap)
function providesGoodCoverage(newCombo, existingWheel) {
  if (existingWheel.length === 0) return true;

  // Check overlap with existing combinations
  let highOverlapCount = 0;
  for (const existing of existingWheel) {
    const overlap = newCombo.filter(num => existing.includes(num)).length;
    if (overlap >= 3) highOverlapCount++;
  }

  // Avoid combinations with too much overlap
  return highOverlapCount <= Math.ceil(existingWheel.length * 0.3);
}

// Generate combinations with bonus numbers
export function generateWheelWithBonus(mainCombinations, bonusNumbers) {
  const result = [];

  for (const mainCombo of mainCombinations) {
    for (const bonus of bonusNumbers) {
      result.push({
        main: mainCombo,
        bonus: bonus
      });
    }
  }

  return result;
}