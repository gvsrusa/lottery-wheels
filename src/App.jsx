import { useState } from 'react';
import NumberGrid from './components/NumberGrid';
import BonusBallSection from './components/BonusBallSection';
import WheelConfiguration from './components/WheelConfiguration';
import AdvancedWheelConfig from './components/AdvancedWheelConfig';
import WheelResults from './components/WheelResults';
import WinGuaranteeTable from './components/WinGuaranteeTable';
import { TEXAS_TWO_STEP } from './config/gameConfig';
import { generateAbbreviatedWheel, generateWheelWithBonus } from './utils/combinations';

function App() {
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [bonusEnabled, setBonusEnabled] = useState(false);
  const [selectedBonusNumbers, setSelectedBonusNumbers] = useState([]);
  const [selectedGuarantee, setSelectedGuarantee] = useState('2if3');
  const [wheelResults, setWheelResults] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [wheelOptions, setWheelOptions] = useState({
    coverage: 'medium',
    optimization: 'balance',
    customGuarantee: {
      minMatches: 2,
      conditionMatches: 3
    }
  });

  const handleGenerateWheel = () => {
    if (selectedNumbers.length < 4) {
      alert('Please select at least 4 numbers');
      return;
    }

    // Determine the guarantee to use
    const guaranteeToUse = selectedGuarantee === 'custom'
      ? `${wheelOptions.customGuarantee.minMatches}if${wheelOptions.customGuarantee.conditionMatches}`
      : selectedGuarantee;

    // Create dynamic options based on user configuration
    const dynamicOptions = {
      coverage: wheelOptions.coverage,
      optimization: wheelOptions.optimization,
      coverageFactor: TEXAS_TWO_STEP.wheelOptions.coverage[wheelOptions.coverage]?.factor || 0.5
    };

    // Generate main number combinations using dynamic algorithm
    const mainCombinations = generateAbbreviatedWheel(selectedNumbers, 4, guaranteeToUse, dynamicOptions);

    // If bonus is enabled and numbers are selected, generate with bonus
    if (bonusEnabled && selectedBonusNumbers.length > 0) {
      const combinationsWithBonus = generateWheelWithBonus(mainCombinations, selectedBonusNumbers);
      setWheelResults(combinationsWithBonus);
    } else {
      setWheelResults(mainCombinations);
    }
  };

  const resetWheel = () => {
    setSelectedNumbers([]);
    setSelectedBonusNumbers([]);
    setBonusEnabled(false);
    setWheelResults([]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-blue-700 text-white py-4 shadow-md border-b-4 border-blue-900">
        <div className="max-w-6xl mx-auto text-center px-5">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 drop-shadow-md">🎰 Lottery Wheel Pro</h1>
          <p className="text-lg mb-3 opacity-95">Texas Two-Step Wheel Generator</p>
          <div className="flex justify-center gap-5 flex-wrap">
            <span className="bg-white bg-opacity-20 px-4 py-2 rounded-full text-sm font-bold border border-white border-opacity-30">Pick 4 from 1-35</span>
            {bonusEnabled && <span className="bg-red-600 bg-opacity-80 px-4 py-2 rounded-full text-sm font-bold border border-white border-opacity-30">+ Bonus Ball</span>}
          </div>
        </div>
      </header>

      <main className="flex-1 py-10">
        <div className="max-w-6xl mx-auto px-5">
          <section className="mb-10">
            <div className="text-center mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-blue-700 text-xl font-semibold mb-2">Choose Your Numbers</h2>
              <p className="text-gray-600 text-base leading-relaxed m-0">Select your favorite numbers to include in your wheel. The more numbers you select, the better your coverage, but the more combinations you'll need to play.</p>
            </div>

            <NumberGrid
              min={TEXAS_TWO_STEP.mainNumbers.min}
              max={TEXAS_TWO_STEP.mainNumbers.max}
              selectedNumbers={selectedNumbers}
              onNumberToggle={setSelectedNumbers}
              title="Main Numbers (1-35)"
            />

            <BonusBallSection
              enabled={bonusEnabled}
              onToggle={setBonusEnabled}
              selectedBonusNumbers={selectedBonusNumbers}
              onBonusNumbersChange={setSelectedBonusNumbers}
              min={TEXAS_TWO_STEP.bonusNumber.min}
              max={TEXAS_TWO_STEP.bonusNumber.max}
              maxSelections={3}
            />
          </section>

          <section className="mb-10">
            <AdvancedWheelConfig
              selectedGuarantee={selectedGuarantee}
              onGuaranteeChange={setSelectedGuarantee}
              wheelOptions={wheelOptions}
              onWheelOptionsChange={setWheelOptions}
              showAdvanced={showAdvanced}
              onToggleAdvanced={setShowAdvanced}
            />

            <WheelConfiguration
              selectedGuarantee={selectedGuarantee}
              onGuaranteeChange={setSelectedGuarantee}
              selectedNumbers={selectedNumbers}
              bonusEnabled={bonusEnabled}
              selectedBonusNumbers={selectedBonusNumbers}
              onGenerateWheel={handleGenerateWheel}
              wheelResults={wheelResults}
              wheelOptions={wheelOptions}
            />

            {selectedNumbers.length >= 4 && (
              <WinGuaranteeTable
                selectedGuarantee={selectedGuarantee === 'custom'
                  ? `${wheelOptions.customGuarantee.minMatches}if${wheelOptions.customGuarantee.conditionMatches}`
                  : selectedGuarantee}
                wheelSize={wheelResults.length || 0}
              />
            )}
          </section>

          {wheelResults.length > 0 && (
            <section className="mb-10">
              <WheelResults
                wheelResults={wheelResults}
                bonusEnabled={bonusEnabled}
                selectedBonusNumbers={selectedBonusNumbers}
                guarantee={selectedGuarantee}
              />
            </section>
          )}

          {(selectedNumbers.length > 0 || wheelResults.length > 0) && (
            <section className="text-center">
              <button onClick={resetWheel} className="px-8 py-3 bg-gradient-to-br from-red-500 to-red-700 text-white border-none rounded-lg text-base font-bold cursor-pointer transition-all duration-300 inline-flex items-center gap-2 hover:transform hover:-translate-y-1 hover:shadow-lg hover:shadow-red-500/30 active:transform active:translate-y-0">
                🔄 Start Over
              </button>
            </section>
          )}
        </div>
      </main>

      <footer className="bg-gray-700 text-white text-center py-5 mt-auto">
        <p className="m-0 text-sm opacity-80">&copy; 2024 Lottery Wheel Pro - Generate optimized lottery wheels for better coverage</p>
      </footer>
    </div>
  );
}

export default App;
