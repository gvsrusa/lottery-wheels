
function WinGuaranteeTable({ selectedGuarantee, wheelSize }) {
  // Calculate win guarantees for Texas Two-Step (4 numbers drawn)
  const getWinGuarantees = () => {
    const guarantees = {};

    // Texas Two-Step guarantees based on how many of your pool numbers match the 4 drawn
    if (selectedGuarantee === '3if4') {
      guarantees['4 w/o Bonus'] = { min: 1, max: 1 }; // If all 4 match, guaranteed 1 ticket with 4 matches
      guarantees['4'] = { min: 1, max: 1 }; // If all 4 match, guaranteed 1 ticket with 4 matches
      guarantees['3'] = { min: 1, max: 1 }; // If 3 match, guaranteed 1 ticket with 3 matches
      guarantees['2'] = { min: 0, max: 1 }; // If 2 match, may have tickets with 2 matches
    } else if (selectedGuarantee === '2if4') {
      guarantees['4 w/o Bonus'] = { min: 1, max: 1 }; // If all 4 match, guaranteed 1 ticket with 4 matches
      guarantees['4'] = { min: 1, max: 1 }; // If all 4 match, guaranteed 1 ticket with 4 matches
      guarantees['3'] = { min: 0, max: 1 }; // If 3 match, may have tickets with 3 matches
      guarantees['2'] = { min: 1, max: 1 }; // If 2 match, guaranteed 1 ticket with 2 matches
    } else if (selectedGuarantee === '2if3') {
      guarantees['4 w/o Bonus'] = { min: 1, max: 1 }; // If all 4 match, guaranteed 1 ticket with 4 matches
      guarantees['4'] = { min: 1, max: 1 }; // If all 4 match, guaranteed 1 ticket with 4 matches
      guarantees['3'] = { min: 1, max: 1 }; // If 3 match, guaranteed 1 ticket with 2 matches (minimum)
      guarantees['2'] = { min: 0, max: 1 }; // If 2 match, may have tickets with 2 matches
    }

    return guarantees;
  };

  const guarantees = getWinGuarantees();

  return (
    <div className="bg-white border border-gray-200 rounded p-4 my-5 shadow-sm">
      <h3 className="text-blue-700 text-base font-bold m-0 mb-1 text-center">Win Guarantees</h3>
      <p className="text-gray-600 text-sm text-center m-0 mb-4">
        Minimum Winnings with {selectedGuarantee.toUpperCase()} Guarantee ({wheelSize} combinations)
      </p>

      <div className="border border-gray-300 rounded-sm overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr] bg-blue-700 text-white">
          <span className="py-2.5 px-2 font-bold text-xs text-center border-r border-white border-opacity-20 last:border-r-0">Correct Numbers</span>
          <span className="py-2.5 px-2 font-bold text-xs text-center border-r border-white border-opacity-20 last:border-r-0">Maximum Winnings</span>
          <span className="py-2.5 px-2 font-bold text-xs text-center border-r border-white border-opacity-20 last:border-r-0">Minimum Winnings</span>
        </div>

        {Object.entries(guarantees).map(([key, value]) => (
          <div key={key} className="grid grid-cols-[2fr_1fr_1fr] border-b border-gray-200 last:border-b-0 even:bg-gray-50">
            <span className="py-2 px-2 text-xs text-left border-r border-gray-200 last:border-r-0 font-semibold text-blue-700">{key}</span>
            <span className="py-2 px-2 text-xs text-center border-r border-gray-200 last:border-r-0 font-bold text-green-600">{value.max}</span>
            <span className="py-2 px-2 text-xs text-center border-r border-gray-200 last:border-r-0 font-bold text-red-600">{value.min}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 p-2.5 bg-yellow-100 border border-yellow-300 rounded-sm">
        <p className="m-0 text-xs text-yellow-800 leading-relaxed">
          <strong>Note:</strong> This wheel guarantees that if {selectedGuarantee.charAt(0)} of your
          selected numbers match the drawn numbers, you will have at least {selectedGuarantee.charAt(2)}
          matching numbers on one or more of your tickets.
        </p>
      </div>
    </div>
  );
}

export default WinGuaranteeTable;