import { useState } from 'react';

function WheelResults({ wheelResults, bonusEnabled, selectedBonusNumbers, guarantee }) {
  const [showFullResults, setShowFullResults] = useState(false);

  if (!wheelResults || wheelResults.length === 0) {
    return null;
  }

  const displayResults = showFullResults ? wheelResults : wheelResults.slice(0, 10);
  const hasBonus = bonusEnabled && selectedBonusNumbers.length > 0;

  const formatNumbers = (numbers) => {
    return numbers.map(n => n.toString().padStart(2, '0')).join(' - ');
  };

  const formatCombination = (combination) => {
    if (hasBonus && typeof combination === 'object' && combination.main) {
      return {
        main: formatNumbers(combination.main),
        bonus: combination.bonus.toString().padStart(2, '0')
      };
    }
    return {
      main: formatNumbers(combination),
      bonus: null
    };
  };

  const copyToClipboard = () => {
    let text = `Texas Two-Step Wheel - ${guarantee.toUpperCase()} Guarantee\n`;
    text += `Generated ${wheelResults.length} combinations\n\n`;

    wheelResults.forEach((combination, index) => {
      const formatted = formatCombination(combination);
      text += `${(index + 1).toString().padStart(3, ' ')}: ${formatted.main}`;
      if (formatted.bonus) {
        text += ` | Bonus: ${formatted.bonus}`;
      }
      text += '\n';
    });

    navigator.clipboard.writeText(text).then(() => {
      alert('Wheel copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy to clipboard');
    });
  };

  const printResults = () => {
    const printWindow = window.open('', '_blank');
    let content = `
      <html>
        <head>
          <title>Texas Two-Step Wheel Results</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .combination { padding: 5px 0; border-bottom: 1px solid #eee; }
            .numbers { font-family: monospace; font-weight: bold; }
            .bonus { color: #e74c3c; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Texas Two-Step Wheel Results</h1>
            <p>${guarantee.toUpperCase()} Guarantee - ${wheelResults.length} Combinations</p>
          </div>
    `;

    wheelResults.forEach((combination, index) => {
      const formatted = formatCombination(combination);
      content += `
        <div class="combination">
          ${(index + 1).toString().padStart(3, ' ')}:
          <span class="numbers">${formatted.main}</span>
          ${formatted.bonus ? `<span class="bonus"> | Bonus: ${formatted.bonus}</span>` : ''}
        </div>
      `;
    });

    content += '</body></html>';
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="my-8 p-6 bg-white rounded-lg border border-gray-300 shadow-md">
      <div className="text-center mb-6">
        <h2 className="text-blue-700 text-xl mb-4">Generated Wheel Results</h2>
        <div className="flex justify-center gap-4 flex-wrap">
          <span className="px-4 py-2 rounded-full font-bold text-sm bg-blue-100 text-blue-700 border border-blue-200">{guarantee.toUpperCase()} Guarantee</span>
          <span className="px-4 py-2 rounded-full font-bold text-sm bg-purple-100 text-purple-700 border border-purple-200">{wheelResults.length} Combinations</span>
        </div>
      </div>

      <div className="flex justify-center gap-4 mb-6 flex-wrap">
        <button onClick={copyToClipboard} className="px-5 py-2.5 border-none rounded-md font-bold cursor-pointer transition-all duration-200 flex items-center gap-2 bg-green-600 text-white hover:-translate-y-0.5 hover:shadow-lg">
          📋 Copy to Clipboard
        </button>
        <button onClick={printResults} className="px-5 py-2.5 border-none rounded-md font-bold cursor-pointer transition-all duration-200 flex items-center gap-2 bg-gray-600 text-white hover:-translate-y-0.5 hover:shadow-lg">
          🖨️ Print Results
        </button>
      </div>

      <div className="bg-gray-50 rounded-md overflow-hidden border border-gray-300">
        <div className="grid grid-cols-[60px_1fr_auto] bg-blue-700 text-white p-3 font-bold text-center">
          <span>#</span>
          <span>Main Numbers</span>
          {hasBonus && <span>Bonus</span>}
        </div>

        {displayResults.map((combination, index) => {
          const formatted = formatCombination(combination);
          return (
            <div key={index} className={`grid p-3 border-b border-gray-300 items-center last:border-b-0 even:bg-white ${hasBonus ? 'grid-cols-[60px_1fr_80px]' : 'grid-cols-[60px_1fr_auto]'}`}>
              <span className="font-mono font-bold text-gray-600 text-center">
                {(index + 1).toString().padStart(3, ' ')}
              </span>
              <span className="font-mono font-bold text-base text-blue-700 text-center tracking-wide">{formatted.main}</span>
              {hasBonus && (
                <span className="font-mono font-bold text-base text-red-500 text-center">
                  {formatted.bonus || '--'}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {wheelResults.length > 10 && (
        <div className="text-center my-5">
          <button
            onClick={() => setShowFullResults(!showFullResults)}
            className="px-6 py-2.5 bg-gray-50 border border-gray-300 rounded-md text-blue-700 font-bold cursor-pointer transition-all duration-200 hover:bg-gray-200 hover:border-gray-400"
          >
            {showFullResults
              ? `Show Less (showing all ${wheelResults.length})`
              : `Show All ${wheelResults.length} Combinations (showing first 10)`
            }
          </button>
        </div>
      )}

      <div className="mt-6 pt-5 border-t border-gray-300">
        <p className="bg-yellow-100 border border-yellow-300 rounded-md p-4 text-yellow-800 m-0 leading-relaxed">
          <strong>Guarantee:</strong> {getGuaranteeExplanation(guarantee)}
        </p>
      </div>
    </div>
  );
}

function getGuaranteeExplanation(guarantee) {
  switch (guarantee) {
    case '3if4':
      return 'If 4 of your selected numbers are drawn, you are guaranteed to have at least one ticket with 3 matching numbers.';
    case '2if4':
      return 'If 4 of your selected numbers are drawn, you are guaranteed to have at least one ticket with 2 matching numbers.';
    case '2if3':
      return 'If 3 of your selected numbers are drawn, you are guaranteed to have at least one ticket with 2 matching numbers.';
    default:
      return 'This wheel provides optimized coverage for your selected numbers.';
  }
}

export default WheelResults;