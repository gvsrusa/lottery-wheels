import { TEXAS_TWO_STEP } from '../config/gameConfig';

function WheelConfiguration({
  selectedGuarantee,
  onGuaranteeChange,
  selectedNumbers,
  bonusEnabled,
  selectedBonusNumbers,
  onGenerateWheel,
  wheelResults
}) {
  const canGenerate = selectedNumbers.length >= 4;
  const estimatedCombinations = canGenerate ? getEstimatedCombinations(selectedNumbers.length, selectedGuarantee) : 0;
  const totalCost = estimatedCombinations * (bonusEnabled ? TEXAS_TWO_STEP.ticketCost.withBonus : TEXAS_TWO_STEP.ticketCost.base);

  function getEstimatedCombinations(poolSize, guarantee) {
    // Use exact combinations from Texas Two-Step wheel systems
    const wheelSizes = {
      6: { '3if4': 7, '2if4': 3, '2if3': 3 },
      7: { '3if4': 12, '2if4': 7, '2if3': 5 },
      8: { '3if4': 14, '2if4': 8, '2if3': 6 },
      9: { '3if4': 22, '2if4': 11, '2if3': 8 },
      10: { '3if4': 25, '2if4': 14, '2if3': 12 }
    };

    if (wheelSizes[poolSize] && wheelSizes[poolSize][guarantee]) {
      return wheelSizes[poolSize][guarantee];
    }

    // For larger pools, estimate based on patterns
    const totalPossible = poolSize >= 4 ?
      (poolSize * (poolSize - 1) * (poolSize - 2) * (poolSize - 3)) / (4 * 3 * 2 * 1) : 0;

    switch (guarantee) {
      case '3if4':
        return Math.ceil(totalPossible * 0.7);
      case '2if4':
        return Math.ceil(totalPossible * 0.4);
      case '2if3':
        return Math.ceil(totalPossible * 0.3);
      default:
        return totalPossible;
    }
  }

  return (
    <div className="my-5 p-5 bg-white rounded border border-blue-700 shadow-md">
      <h2 className="text-blue-700 text-lg font-bold text-center mb-5">Wheel Configuration</h2>

      <div className="mb-5">
        <label className="block font-bold text-gray-700 mb-2">
          Win Guarantee Level:
          <select
            value={selectedGuarantee}
            onChange={(e) => onGuaranteeChange(e.target.value)}
            className="w-full p-3 border-2 border-gray-300 rounded-md text-sm bg-white cursor-pointer transition-colors duration-200 focus:outline-none focus:border-blue-700"
          >
            {TEXAS_TWO_STEP.guaranteeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label} - {option.description}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="bg-gray-50 p-4 rounded border border-gray-200 my-4">
        <div className="flex justify-between items-center py-1.5 border-b border-gray-200 last:border-b-0 sm:flex-col sm:items-start sm:gap-1">
          <span className="font-semibold text-gray-700 text-sm">Pool Size:</span>
          <span className="font-bold text-blue-700 text-sm">{selectedNumbers.length} numbers</span>
        </div>

        <div className="flex justify-between items-center py-1.5 border-b border-gray-200 last:border-b-0 sm:flex-col sm:items-start sm:gap-1">
          <span className="font-semibold text-gray-700 text-sm">Estimated Combinations:</span>
          <span className="font-bold text-blue-700 text-sm">{estimatedCombinations}</span>
        </div>

        {bonusEnabled && (
          <div className="flex justify-between items-center py-1.5 border-b border-gray-200 last:border-b-0 sm:flex-col sm:items-start sm:gap-1">
            <span className="font-semibold text-gray-700 text-sm">Bonus Numbers:</span>
            <span className="font-bold text-blue-700 text-sm">{selectedBonusNumbers.length} selected</span>
          </div>
        )}

        <div className="flex justify-between items-center py-1.5 border-b border-gray-200 last:border-b-0 sm:flex-col sm:items-start sm:gap-1">
          <span className="font-semibold text-gray-700 text-sm">Estimated Cost:</span>
          <span className="font-bold text-green-600 text-lg">${totalCost.toFixed(2)}</span>
        </div>
      </div>

      <button
        className={`w-full py-4 px-8 text-lg font-bold border-none rounded-md cursor-pointer transition-all duration-300 uppercase ${
          canGenerate
            ? 'bg-blue-700 text-white shadow-md hover:bg-blue-900 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0'
            : 'bg-gray-500 text-gray-400 cursor-not-allowed'
        }`}
        onClick={onGenerateWheel}
        disabled={!canGenerate}
      >
        {canGenerate ? 'Generate Wheel' : 'Select at least 4 numbers'}
      </button>

      {wheelResults && wheelResults.length > 0 && (
        <div className="mt-5 p-4 bg-green-100 border border-green-300 rounded-md text-center">
          <h3 className="text-green-800 mb-2">Wheel Generated Successfully!</h3>
          <p className="text-green-800 font-medium m-0">
            Generated {wheelResults.length} combinations
            {bonusEnabled && selectedBonusNumbers.length > 0
              ? ` with ${selectedBonusNumbers.length} bonus number(s)`
              : ''
            }
          </p>
        </div>
      )}
    </div>
  );
}

export default WheelConfiguration;