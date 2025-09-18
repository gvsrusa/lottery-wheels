
function NumberGrid({ min, max, selectedNumbers, onNumberToggle, title, maxSelections, variant = 'primary' }) {
  const numbers = [];
  for (let i = min; i <= max; i++) {
    numbers.push(i);
  }

  const handleNumberClick = (number) => {
    if (selectedNumbers.includes(number)) {
      // Remove number
      onNumberToggle(selectedNumbers.filter(n => n !== number));
    } else if (!maxSelections || selectedNumbers.length < maxSelections) {
      // Add number if under limit
      onNumberToggle([...selectedNumbers, number]);
    }
  };

  const formatNumber = (num) => {
    return num.toString().padStart(2, '0');
  };

  return (
    <div className="my-5">
      <h3 className={`text-base font-bold mb-2 text-center ${variant === 'bonus' ? 'text-red-500' : 'text-blue-700'}`}>{title}</h3>
      {maxSelections && (
        <p className="text-gray-600 text-sm text-center mb-4">
          Selected: {selectedNumbers.length} / {maxSelections}
        </p>
      )}
      <div className="grid grid-cols-7 gap-2 max-w-md mx-auto p-5 bg-gray-50 rounded-lg border border-gray-300 sm:grid-cols-5 sm:max-w-xs sm:gap-1.5 sm:p-4">
        {numbers.map(number => (
          <button
            key={number}
            className={`w-12 h-10 border-2 font-bold text-sm rounded cursor-pointer transition-all duration-200 flex items-center justify-center hover:-translate-y-0.5 active:translate-y-0 sm:w-11 sm:h-9 sm:text-xs ${
              variant === 'bonus'
                ? selectedNumbers.includes(number)
                  ? 'bg-red-500 text-white border-red-700 shadow-md hover:border-red-500 hover:bg-red-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-red-500 hover:bg-red-50'
                : selectedNumbers.includes(number)
                  ? 'bg-blue-700 text-white border-blue-900 shadow-md hover:border-blue-700 hover:bg-blue-800'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-700 hover:bg-blue-50'
            }`}
            onClick={() => handleNumberClick(number)}
          >
            {formatNumber(number)}
          </button>
        ))}
      </div>
    </div>
  );
}

export default NumberGrid;