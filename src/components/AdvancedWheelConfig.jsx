import { TEXAS_TWO_STEP } from '../config/gameConfig';

function AdvancedWheelConfig({
  selectedGuarantee,
  onGuaranteeChange,
  wheelOptions,
  onWheelOptionsChange,
  showAdvanced,
  onToggleAdvanced
}) {

  const handleCoverageChange = (coverage) => {
    onWheelOptionsChange({
      ...wheelOptions,
      coverage
    });
  };

  const handleOptimizationChange = (optimization) => {
    onWheelOptionsChange({
      ...wheelOptions,
      optimization
    });
  };

  const handleCustomGuaranteeChange = (field, value) => {
    onWheelOptionsChange({
      ...wheelOptions,
      customGuarantee: {
        ...wheelOptions.customGuarantee,
        [field]: parseInt(value)
      }
    });
  };

  return (
    <div className="bg-white border border-blue-700 rounded p-5 my-5 shadow-md">
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
            <option value="custom">Custom Guarantee</option>
          </select>
        </label>
      </div>

      <div className="my-4 p-2.5 bg-gray-50 rounded border border-gray-200">
        <label className="flex items-center gap-2 font-semibold text-blue-700 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4"
            checked={showAdvanced}
            onChange={(e) => onToggleAdvanced(e.target.checked)}
          />
          Show Advanced Options
        </label>
      </div>

      {showAdvanced && (
        <div className="border-t border-gray-200 pt-5 mt-4">
          <div className="mb-5">
            <label className="block font-bold text-gray-700 mb-2">Coverage Level:</label>
            <div className="grid gap-2.5 mt-2.5">
              {Object.entries(TEXAS_TWO_STEP.wheelOptions.coverage).map(([key, config]) => (
                <label key={key} className="flex items-start gap-2 p-2.5 border border-gray-200 rounded cursor-pointer transition-all duration-200 hover:bg-gray-50 hover:border-blue-700">
                  <input
                    type="radio"
                    className="mt-0.5"
                    name="coverage"
                    value={key}
                    checked={wheelOptions.coverage === key}
                    onChange={() => handleCoverageChange(key)}
                  />
                  <span className="flex flex-col gap-0.5">
                    <strong className="text-blue-700 text-sm">{key.charAt(0).toUpperCase() + key.slice(1)}</strong>
                    <small className="text-gray-600 text-xs">{config.description}</small>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-5">
            <label className="block font-bold text-gray-700 mb-2">Optimization Goal:</label>
            <div className="grid gap-2.5 mt-2.5">
              {Object.entries(TEXAS_TWO_STEP.wheelOptions.optimization).map(([key, description]) => (
                <label key={key} className="flex items-start gap-2 p-2.5 border border-gray-200 rounded cursor-pointer transition-all duration-200 hover:bg-gray-50 hover:border-blue-700">
                  <input
                    type="radio"
                    className="mt-0.5"
                    name="optimization"
                    value={key}
                    checked={wheelOptions.optimization === key}
                    onChange={() => handleOptimizationChange(key)}
                  />
                  <span className="flex flex-col gap-0.5">{description}</span>
                </label>
              ))}
            </div>
          </div>

          {selectedGuarantee === 'custom' && (
            <div className="mb-5 bg-yellow-100 border border-yellow-300 rounded p-4">
              <label className="block font-bold text-gray-700 mb-2">Custom Guarantee:</label>
              <div className="flex items-center gap-2.5 flex-wrap mt-2.5">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-600">Guarantee</label>
                  <input
                    type="number"
                    min="1"
                    max="4"
                    value={wheelOptions.customGuarantee?.minMatches || 2}
                    className="w-15 p-2 border border-gray-300 rounded text-center font-bold"
                    onChange={(e) => handleCustomGuaranteeChange('minMatches', e.target.value)}
                  />
                </div>
                <span className="font-bold text-blue-700 mx-1">if</span>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-600">Condition</label>
                  <input
                    type="number"
                    min="2"
                    max="4"
                    value={wheelOptions.customGuarantee?.conditionMatches || 3}
                    className="w-15 p-2 border border-gray-300 rounded text-center font-bold"
                    onChange={(e) => handleCustomGuaranteeChange('conditionMatches', e.target.value)}
                  />
                </div>
                <span className="text-xs text-gray-600 italic mt-2 w-full">
                  e.g., "2 if 3" means guarantee 2 matches if 3 of your numbers are drawn
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdvancedWheelConfig;