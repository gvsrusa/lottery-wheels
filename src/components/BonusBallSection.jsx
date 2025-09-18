import NumberGrid from './NumberGrid';

function BonusBallSection({
  enabled,
  onToggle,
  selectedBonusNumbers,
  onBonusNumbersChange,
  min = 1,
  max = 35,
  maxSelections = 3
}) {
  return (
    <div className="my-8 p-5 bg-blue-50 rounded-lg border border-blue-200">
      <div className="text-center mb-5">
        <label className="flex items-center justify-center gap-2.5 text-base font-bold text-blue-600 cursor-pointer">
          <input
            type="checkbox"
            className="w-4.5 h-4.5 cursor-pointer"
            checked={enabled}
            onChange={(e) => onToggle(e.target.checked)}
          />
          <span className="select-none">Include Bonus Ball Numbers</span>
        </label>
        {enabled && (
          <p className="mt-2.5 text-gray-600 text-sm italic">
            Select up to {maxSelections} bonus numbers to include in your wheel
          </p>
        )}
      </div>

      {enabled && (
        <div className="mt-5 p-4 bg-white rounded-md border border-gray-200">
          <NumberGrid
            min={min}
            max={max}
            selectedNumbers={selectedBonusNumbers}
            onNumberToggle={onBonusNumbersChange}
            title="Bonus Ball Numbers (1-35)"
            maxSelections={maxSelections}
            variant="bonus"
          />
        </div>
      )}
    </div>
  );
}

export default BonusBallSection;