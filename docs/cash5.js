function CS5Frequency() {
  var ss = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Cash5");
  var lastRow = ss.getLastRow();
  var srchNmbrAry = ss.getRange(2, 2, lastRow - 2, 5).getValues();
  var fullList = ss.getRange(2, 2, lastRow - 1, 5).getValues();
  var newArray = ss.getRange(2, 8, lastRow - 2, 5).getValues();
  for (k = 0; k < srchNmbrAry.length; k++) {
    for (i = 0; i < srchNmbrAry[0].length; i++) {
      for (j = (k + 1); j < fullList.length; j++) {
        if (fullList[j].includes(srchNmbrAry[k][i])) {
          newArray[k][i] = j - k - 1;
          break;
        }
      }
    }
  }
  // console.log(newArray)
  ss.getRange(2, 8, lastRow - 2, 5).setValues(newArray);

  CS5Match();
  CS5ProcessArray();
}

function CS5Search_Simplified() {
  let ss = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Cash5");
  let lastRow = ss.getLastRow();

  for (let rowNum = 2; rowNum < 3; rowNum++) {
    let fullList = ss.getRange(rowNum, 2, lastRow - 1, 5).getValues();
    let searchNum = ss.getRange(rowNum, 2, lastRow - 2, 5).getValues();
    let newSet4 = [];
    let num_1_10 = 0;
    let num_1_25 = 0;
    let num_1_50 = 0;
    let num_50_99 = 0;
    let num_1_99 = 0;
    let num_100_199 = 0;
    

    for (let i = 0; i < 200; i++) {
      let num_1_10_count = 0;
      let num_1_25_count = 0;
      let num_1_50_count = 0;
      let num_50_99_count = 0;
      let num_1_99_count = 0;
      let num_100_199_count = 0;
      for (let j = i + 1; j < fullList.length; j++) {
        let count = 1;
        for (let k = 0; k < 5; k++) {
          if (searchNum[i].includes(fullList[j][k])) {
            // if (count === 5) {
            //   console.log(i, "distance from i to j", j-i, j, searchNum[i], fullList[j], count);
            //   newSet4.push(fullList[j]);
            //   let num_j_i = j - i;
            //   if (_.inRange(num_j_i, 0, 10) && num_1_10_count == 0) {
            //     num_1_10++
            //     num_1_10_count++
            //   }
            //   if (_.inRange(num_j_i, 0, 25) && num_1_25_count == 0) {
            //     num_1_25++
            //     num_1_25_count++
            //   }
            //   if (_.inRange(num_j_i, 0, 50) && num_1_50_count == 0) {
            //     num_1_50++
            //     num_1_50_count++
            //   }
            //   if (_.inRange(num_j_i, 50, 100) && num_50_99_count === 0) {
            //     num_50_99++
            //     num_50_99_count++
            //   }
            //   if (_.inRange(num_j_i, 0, 100) && num_1_99_count === 0) {
            //     num_1_99++
            //     num_1_99_count++
            //   }
            //   if (_.inRange(num_j_i, 100, 200) && num_100_199_count === 0) {
            //     num_100_199++
            //     num_100_199_count++
            //   }
            // }
            // if (count === 4) {
            //   console.log(i, "distance from i to j", j-i, j, searchNum[i], fullList[j], count);
            //   newSet4.push(fullList[j]);
            //   let num_j_i = j - i;
            //   if (_.inRange(num_j_i, 0, 10) && num_1_10_count == 0) {
            //     num_1_10++
            //     num_1_10_count++
            //   }
            //   if (_.inRange(num_j_i, 0, 25) && num_1_25_count == 0) {
            //     num_1_25++
            //     num_1_25_count++
            //   }
            //   if (_.inRange(num_j_i, 0, 50) && num_1_50_count == 0) {
            //     num_1_50++
            //     num_1_50_count++
            //   }
            //   if (_.inRange(num_j_i, 50, 100) && num_50_99_count === 0) {
            //     num_50_99++
            //     num_50_99_count++
            //   }
            //   if (_.inRange(num_j_i, 0, 100) && num_1_99_count === 0) {
            //     num_1_99++
            //     num_1_99_count++
            //   }
            //   if (_.inRange(num_j_i, 100, 200) && num_100_199_count === 0) {
            //     num_100_199++
            //     num_100_199_count++
            //   }
            // }
            if (count === 3) {
              console.log(i, "distance from i to j", j-i, j, searchNum[i], fullList[j], count);
              newSet4.push(fullList[j]);
              let num_j_i = j - i;
              if (_.inRange(num_j_i, 0, 10) && num_1_10_count == 0) {
                num_1_10++
                num_1_10_count++
              }
              if (_.inRange(num_j_i, 0, 25) && num_1_25_count == 0) {
                num_1_25++
                num_1_25_count++
              }
              if (_.inRange(num_j_i, 0, 50) && num_1_50_count == 0) {
                num_1_50++
                num_1_50_count++
              }
              if (_.inRange(num_j_i, 50, 100) && num_50_99_count === 0) {
                num_50_99++
                num_50_99_count++
              }
              if (_.inRange(num_j_i, 0, 100) && num_1_99_count === 0) {
                num_1_99++
                num_1_99_count++
              }
              if (_.inRange(num_j_i, 100, 200) && num_100_199_count === 0) {
                num_100_199++
                num_100_199_count++
              }
            }
            // if (count === 2) {
            //   console.log(i, "distance from i to j", j-i, j, searchNum[i], fullList[j], count);
            //   newSet4.push(fullList[j]);
            //   let num_j_i = j - i;
            //   if (_.inRange(num_j_i, 0, 10) && num_1_10_count == 0) {
            //     num_1_10++
            //     num_1_10_count++
            //   }
            //   if (_.inRange(num_j_i, 0, 25) && num_1_25_count == 0) {
            //     num_1_25++
            //     num_1_25_count++
            //   }
            //   if (_.inRange(num_j_i, 0, 50) && num_1_50_count == 0) {
            //     num_1_50++
            //     num_1_50_count++
            //   }
            //   if (_.inRange(num_j_i, 50, 100) && num_50_99_count === 0) {
            //     num_50_99++
            //     num_50_99_count++
            //   }
            //   if (_.inRange(num_j_i, 0, 100) && num_1_99_count === 0) {
            //     num_1_99++
            //     num_1_99_count++
            //   }
            //   if (_.inRange(num_j_i, 100, 200) && num_100_199_count === 0) {
            //     num_100_199++
            //     num_100_199_count++
            //   }
            // }
            count++;
          }
        }
      }
      num_1_10_count = 0;
      num_1_25_count = 0;
      num_1_50_count = 0;
      num_50_99_count = 0;
      num_1_99_count = 0;
      num_100_199_count = 0;
      console.log("=====================================", i);
      console.log("===================================== num_1_10", num_1_10);
      console.log("===================================== num_1_25", num_1_25);
      console.log("===================================== num_1_50", num_1_50);
      console.log("===================================== num_50_99", num_50_99);
      console.log("===================================== num_1_99", num_1_99);
      console.log("===================================== num_100_199", num_100_199);
    }
  }
}

function CS5_generateTriplets(array, skipArray = []) {
  let tripletsSet = new Set();
  for (let i = 0; i < array.length; i++) {
    for (let j = 0; j < array[i].length - 2; j++) {
      for (let k = j + 1; k < array[i].length - 1; k++) {
        for (let l = k + 1; l < array[i].length; l++) {
          let triplet = [array[i][j], array[i][k], array[i][l]].sort((a, b) => a - b);
          if (skipArray.length == 0) {
            tripletsSet.add(JSON.stringify(triplet));
          } else {
            if (!CS5_checkTripletExists(skipArray, triplet)) {
              tripletsSet.add(JSON.stringify(triplet));
            }
          }
        }
      }
    }
  }
  return Array.from(tripletsSet, JSON.parse);
}

function CS5_checkTripletExists(tripletsArray, givenTriplet) {
  const tripletStr = JSON.stringify(givenTriplet.sort());

  for (let i = 0; i < tripletsArray.length; i++) {
    if (JSON.stringify(tripletsArray[i].sort()) === tripletStr) {
      return true;
    }
  }

  return false;
}

function CS5_hasExactCommonNumbers(arr1, arr2, count) {
    const set1 = new Set(arr1);
    const commonNumbers = [];

    for (let num of arr2) {
        if (set1.has(num)) {
            commonNumbers.push(num);
        }
    }

    return commonNumbers.length === count;
}

function CS5_No_4s_No_3s_under100_2s_under25_Process(arr, doubles, triples, qudraples, all_5s, lastDraw) {
  let array = arr.map(el => [el])
  let resultArray = [];
  let randomSetArray = [];
  let doubleArray = [];
  let tripleArray = [];
  while (resultArray.length < 50) {
    let randomNumbers = CS5_getRandomUniqueSets(array, 5);
    if (!TS_arrayExistsIn2DArray(randomSetArray, randomNumbers) && CS5_hasExactCommonNumbers(randomNumbers, lastDraw, 1)) {
      randomSetArray.push(randomNumbers)
      for (let double of doubles) {
        if (double.every(num => randomNumbers.includes(num))) {
          for (let triplet of triples) { 
            if (triplet.every(num => randomNumbers.includes(num))) {
              for (let quadraple of qudraples) {
                if (quadraple.every(num => randomNumbers.includes(num))) {
                  for (let all5 of all_5s) {
                    if (!all5.every(num => randomNumbers.includes(num))) {
                      if (resultArray.length > 0) {
                        for (let result of resultArray) {
                          if (!TS_arrayExistsIn2DArray(resultArray, randomNumbers)) {
                            console.log("resultArray: ", resultArray, resultArray.length)
                            console.log("randomSetArray length", randomSetArray.length)
                            resultArray.push(randomNumbers);
                            doubleArray.push(double);
                            tripleArray.push(triplet);
                          }
                        }
                      } else {
                        resultArray.push(randomNumbers);
                        doubleArray.push(double);
                        tripleArray.push(triplet);
                      }
                    }
                  }
                }
              }
              break;
            }
          }
        }
      }

    }
  }
  // newSet = [...new Set(resultArray)];
  return resultArray
}

function CS5_Triplets_Process(c6, triple) {
  let ss = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Cash5");
  let lastRow = ss.getLastRow();
  let fullList = ss.getRange(2, 2, lastRow - 1, 5).getValues();
  let startRow = 2;
  let endRow = 100;
  let array_2_100 = ss.getRange(2, 2, 100, 5).getValues();
  let tripletsSet_2_100 = CS5_generateTriplets(array_2_100)
  let array_1502_2000 = ss.getRange(1502, 2, 500, 5).getValues();
  let tripletsSet_1500_2000 = CS5_generateTriplets(array_1502_2000, tripletsSet_2_100);
  let newSet = [];

  let Number_Frequency = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("C5Analysis");
  let freqLastRow = Number_Frequency.getLastRow();

  let c6Array = Number_Frequency.getRange(1, 1, freqLastRow - 1, 1).getValues();

  let c6filtered = c6Array.filter((el) => {
    return el[0] != '';
  });

  if (c6 !== undefined) {
    c6filtered = c6.map(el => [el]);
    tripletsSet_1500_2000 = triple;
  }
  let resultArray = [];

  while (resultArray.length < 20) {
    let randomNumbers = CS5_getRandomUniqueNumbers(c6filtered, 5).sort((a, b) => a - b);
    let found = false;

    for (let triplet of tripletsSet_1500_2000) {
      if (triplet.every(num => randomNumbers.includes(num))) {
        found = true;
        break;
      }
    }

    if (!found) {
      resultArray.push(randomNumbers);
    }
  }
  newSet = [...new Set(resultArray)];
  if (c6 !== undefined) {
    return newSet
  } else {
    console.log("newSet:", newSet)
  }


}


function CS5_getRandomUniqueNumbers(c6filtered, count) {
  let numbers = [];
  let availableNumbers = [...c6filtered];

  for (let i = 0; i < count; i++) {
    let randomIndex = Math.floor(Math.random() * availableNumbers.length);
    let randomNumber = availableNumbers[randomIndex][0];
    numbers.push(randomNumber);
    availableNumbers.splice(randomIndex, 1);
  }

  return numbers;
}

function CS5Sort() {
  let ss = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Cash5");
  let lastRow = ss.getLastRow();
  let fullList = ss.getRange(2, 2, lastRow - 1, 5).getValues();
  let srchAry = [];

  for (let i = 0; i < lastRow - 1; i++) {
    let array = fullList[i]
    array = array.slice(0, 5).sort((a, b) => a - b);
    srchAry.push(array);
  }
  // console.log(srchAry)
  ss.getRange(2, 2, lastRow - 1, 5).setValues(srchAry);
}

function CS5ProcessArray() {
  // Get the active spreadsheet and sheet
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sourceSheet = spreadsheet.getSheetByName('Cash5'); // Change to your source sheet name
  var targetSheet = spreadsheet.getSheetByName('C5Analysis'); // Change to your target sheet name

  // Get the range containing the 10x5 array of numbers
  var sourceRange = sourceSheet.getRange('B2:F11');
  var sourceValues = sourceRange.getValues();
  var lastRow = sourceSheet.getLastRow();
  var fullList = sourceSheet.getRange(2, 2, lastRow - 1, 5).getValues();

  // Create a new array to store all the numbers
  var allNumbers = [];

  // Loop through the source array and add numbers to the 'allNumbers' array
  for (var row = 0; row < sourceValues.length; row++) {
    for (var col = 0; col < sourceValues[row].length; col++) {
      allNumbers.push(sourceValues[row][col]);
    }
  }

  // Remove duplicates and sort the numbers in ascending order
  var uniqueNumbers = Array.from(new Set(allNumbers)).sort(function (a, b) {
    return a - b;
  });

  // Write the unique numbers to the target sheet in a single column
  var repeat10 = targetSheet.getRange(1, 1, targetSheet.getLastRow(), 1).clearContent();
  Utilities.sleep(3000)
  repeat10.offset(0, 0, uniqueNumbers.length, 1).setValues(uniqueNumbers.map(function (number) {
    return [number];
  }));
  Utilities.sleep(3000)
  var targetValues = repeat10.getValues();
  var existingNumbers = targetValues.flat();

  // Create an array of missing numbers up to the given number
  var missingNumbers = [];
  for (var i = 1; i <= 35; i++) {
    if (!uniqueNumbers.includes(i)) {
      missingNumbers.push(i);
    }
  }

  // the missing numbers and sort them
  var updatedNumbers = missingNumbers.sort(function (a, b) {
    return a - b;
  });

  // Write the updated numbers to the target sheet in the specified column
  var skip10 = targetSheet.getRange(1, 2, targetSheet.getLastRow(), 1).clearContent();
  Utilities.sleep(3000)
  skip10.offset(0, 0, updatedNumbers.length, 1).setValues(updatedNumbers.map(function (number) {
    return [number];
  }));
  var lastDraw = targetSheet.getRange(1, 3, targetSheet.getLastRow(), 1).clearContent();
  Utilities.sleep(3000)
  lastDraw.offset(0, 0, sourceValues[0].length, 1).setValues(sourceValues[0].map(function (number) {
    return [number];
  }));
  let freqList = sourceSheet.getRange(2, 8, 1, 5).getValues()[0];
  let freqList2 = sourceSheet.getRange(3, 8, 1, 5).getValues()[0];
  let freqList3 = sourceSheet.getRange(4, 8, 1, 5).getValues()[0];
  let matchingArray = [];
  let matchingArray2 = [];
  let matchingArray3 = [];
  for (let i = 0; i < freqList.length; i++) {
    let findingArr = fullList[freqList[i] + 1] || []
    for (let j = 0; j < findingArr.length; j++) {
      if (fullList[0][i] !== findingArr[j] && !matchingArray.includes(findingArr[j])) {
        matchingArray.push(findingArr[j])
      }
    }
  }
  let updatedMatchingArray = matchingArray.sort((a, b) => a - b);
  var matchingList = targetSheet.getRange(1, 4, targetSheet.getLastRow(), 1).clearContent();
  Utilities.sleep(3000)
  matchingList.offset(0, 0, updatedMatchingArray.length, 1).setValues(updatedMatchingArray.map(function (number) {
    return [number];
  }));

  for (let i = 0; i < freqList2.length; i++) {
    let findingArr = fullList[freqList2[i] + 2] || []
    for (let j = 0; j < findingArr.length; j++) {
      if (fullList[1][i] !== findingArr[j] && !matchingArray2.includes(findingArr[j])) {
        matchingArray2.push(findingArr[j])
      }
    }
  }
  let updatedMatchingArray2 = matchingArray2.sort((a, b) => a - b);
  var matchingList2 = targetSheet.getRange(1, 5, targetSheet.getLastRow(), 1).clearContent();
  Utilities.sleep(3000)
  matchingList2.offset(0, 0, updatedMatchingArray2.length, 1).setValues(updatedMatchingArray2.map(function (number) {
    return [number];
  }));

  // for (let i = 0; i < freqList3.length; i++) {
  //   let findingArr = fullList[freqList3[i] + 3] || []
  //   for (let j = 0; j < findingArr.length; j++) {
  //     if (fullList[2][i] !== findingArr[j] && !matchingArray3.includes(findingArr[j])) {
  //       matchingArray3.push(findingArr[j])
  //     }
  //   }
  // }
  // let updatedMatchingArray3 = matchingArray3.sort((a, b) => a - b);
  // var matchingList3 = targetSheet.getRange(1, 6, targetSheet.getLastRow(), 1).clearContent();
  // Utilities.sleep(3000)
  // matchingList3.offset(0, 0, updatedMatchingArray3.length, 1).setValues(updatedMatchingArray3.map(function (number) {
  //   return [number];
  // }));

  // let lastDrawArr = sourceValues[0];
  // let mixArr = [...new Set([...lastDrawArr, ...updatedMatchingArray, ...updatedMatchingArray2])].sort((a, b) => a - b);
  // var mixArr2 = targetSheet.getRange(1, 7, targetSheet.getLastRow(), 1).clearContent();
  // Utilities.sleep(3000)
  // mixArr2.offset(0, 0, mixArr.length, 1).setValues(mixArr.map(function (number) {
  //   return [number];
  // }));

  // let unmixArr = [];
  // for (let i = 1; i <= 35; i++) {
  //   if (!mixArr.includes(i)) {
  //     unmixArr.push(i)
  //   }
  // }
  // var unmixArr2 = targetSheet.getRange(1, 8, targetSheet.getLastRow(), 1).clearContent();
  // Utilities.sleep(3000)
  // unmixArr2.offset(0, 0, unmixArr.length, 1).setValues(unmixArr.map(function (number) {
  //   return [number];
  // }));

}

function CS5Match() {
  var ss = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Cash5");
  var lastRow = ss.getLastRow();
  let fullList = ss.getRange(2, 2, lastRow - 1, 5).getValues();
  let freqList = ss.getRange(2, 8, lastRow - 200, 5).getValues();
  let freqList2 = ss.getRange(3, 8, lastRow - 200, 5).getValues();
  var newArray = ss.getRange(1, 14, 300, 5).getValues();
  var newArray2 = ss.getRange(1, 20, 300, 5).getValues();
  for (i = 1; i < 300; i++) {
    let aboveArr = fullList[i - 1];
    let freqArr = freqList[i];
    let freqArr2 = freqList[i + 1];
    for (j = 0; j < freqArr.length; j++) {
      let findingArr = fullList[freqArr[j] + i + 1] || []
      let findingArr2 = fullList[freqArr2[j] + i + 2] || []
      if (findingArr.length > 0) {
        for (k = 0; k < findingArr.length; k++) {
          if (fullList[i][j] !== findingArr[k] && aboveArr.includes(findingArr[k]) && !newArray[i].includes(findingArr[k])) {
            let arr = newArray[i]
            arr.push(findingArr[k]);

            function modifyArray(inputArray) {
              const numbers = inputArray.filter(item => typeof item === 'number').sort((a, b) => a - b);
              const resultArray = [...numbers, ...Array(5 - numbers.length).fill("")];
              return resultArray;
            }

            arr = modifyArray(arr)
            newArray[i] = [...arr]
          }
        }

      }
      if (findingArr2.length > 0) {
        for (k = 0; k < findingArr2.length; k++) {
          if (fullList[i+1][j] !== findingArr2[k] && aboveArr.includes(findingArr2[k]) && !newArray2[i].includes(findingArr2[k])) {
            let arr = newArray2[i]
            arr.push(findingArr2[k]);

            function modifyArray(inputArray) {
              const numbers = inputArray.filter(item => typeof item === 'number').sort((a, b) => a - b);
              const resultArray = [...numbers, ...Array(5 - numbers.length).fill("")];
              return resultArray;
            }

            arr = modifyArray(arr)
            newArray2[i] = [...arr]
          }
        }

      }
    }
  }
  ss.getRange(1, 14, 300, 5).setValues(newArray);
  ss.getRange(1, 20, 300, 5).setValues(newArray2);
}
function SearchCS5() {
  let ss = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Cash5");
  let lastRow = ss.getLastRow();
  let fullList = ss.getRange(2, 2, lastRow - 1, 5).getValues();
  let searchNum = ss.getRange(2, 2, lastRow - 2, 5).getValues();

  for (let i = 0; i < searchNum.length; i++) {
    let loopCount = 0;
    for (let j = i + 1; j < 500; j++) {
      // console.log(i, searchNum[i])

      let count = 1;
      let skip = false;
      for (let k = 0; k < 5; k++) {
        if (searchNum[i].includes(fullList[j][k])) {
          // if(count===6){
          //   console.log(i,j, searchNum[i], fullList[j], count);
          //   // count++;
          // }
          // if(count===5){
          //   console.log(i,j, searchNum[i], fullList[j], count);
          //   // count++;
          // }
          // if(count===4){
          //   console.log(i,j, searchNum[i], fullList[j], count);
          // }
          if (count === 3) {
            console.log(i, j, { diff: j - 1 - i }, searchNum[i], fullList[j], count);
            loopCount++
            if (loopCount === 9) {
              skip = true
              loopCount = 0
            }
          }
          // if(count===2){
          //   console.log(i,j, {diff: j-1-i}, searchNum[i], fullList[j], count);
          //   loopCount++
          //   if(loopCount === 2) {
          //     skip = true
          //     loopCount = 0
          //   }
          // }
          count++;
        }
      }
      if (skip) {
        break
      }
    }
  }
}



function CS5LSearch() {
  let ss = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Cash5");
  let lastRow = ss.getLastRow();
  let rowNum = 2
  while (rowNum < 50) {
    let fullList = ss.getRange(rowNum, 2, lastRow - 1, 5).getValues();
    let searchNum = ss.getRange(rowNum, 2, lastRow - 2, 5).getValues();
    let newSet = [];
    let newSet2 = [];
    let newSet4 = [];
    let newSet5 = [];
    let countSet = [];
    let countSet2 = [];
    let countSet4 = [];
    let countSet5 = [];
    let z = 0;
    for (let i = z; i < z + 1; i++) {
      // for(let i=0; i<searchNum.length; i++){
      for (let j = i + 1; j < fullList.length; j++) {
        // console.log(i, searchNum[i])

        let count = 1;
        for (let k = 0; k < 5; k++) {
          if (searchNum[i].includes(fullList[j][k])) {
            // if(count===4){
            //   // console.log(i,j, searchNum[i], fullList[j], count);
            //   newSet5.push(fullList[j])
            //   // count++;
            // }
            // if(count===4){
            //   console.log(i,j, searchNum[i], fullList[j], count);
            //     newSet4.push(fullList[j])
            //   // count++;
            // }
            if (count === 3) {
              console.log(i, j, searchNum[i], fullList[j], count);
              newSet.push(fullList[j])
            }
            // if(count===2){
            //   console.log(i,j, searchNum[i], fullList[j], count);
            //   newSet2.push(fullList[j])
            // }
            count++;

          }

        }
      }
    }
    function loop(newSetNumber, countSetNumber) {
      for (let i = 1; i <= 35; i++) {
        let count = 0;
        for (let j = 0; j < newSetNumber.length; j++) {
          if (newSetNumber[j].includes(i)) {
            count++;
          }
        }
        countSetNumber.push([i, count])
      }
    }
    loop(newSet, countSet);
    loop(newSet2, countSet2);
    loop(newSet4, countSet4);
    loop(newSet5, countSet5);
    console.log("=====================================", rowNum)
    rowNum++
  }

  // ss.getRange(2, 13, lastRow-1, 2).clearContent();
  // ss.getRange(2, 13, countSet.length, 2).setValues(countSet);

  // ss.getRange(2, 13, lastRow-1, 2).clearContent();
  // ss.getRange(2, 13, countSet2.length, 2).setValues(countSet2);

  // ss.getRange(2, 26, lastRow-1, 2).clearContent();
  // ss.getRange(2, 26, countSet4.length, 2).setValues(countSet4);

  // ss.getRange(2, 29, lastRow-1, 2).clearContent();
  // ss.getRange(2, 29, countSet4.length, 2).setValues(countSet5);
}

function CS5Combinations() {
  let L2Set = [];
  let L3Set = [];

  let NF = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("CS5Sort");
  let freqLastRow = NF.getLastRow();

  let c5Array = NF.getRange(2, 1, 36, 1).getValues();
  let last25 = NF.getRange(2, 4, 21, 4).getValues();
  let L2C = L2Combinations();
  let L3C = L3Combinations();

  L3C.map(arr =>
    last25.map(arr2 => {
      if (arr.every(el => arr2.indexOf(el) >= 0)) {
        L3Set.push(arr);
      }
    }
    )
  )

  L2C.map(arr =>
    last25.map(arr2 => {
      if (arr.every(el => arr2.indexOf(el) >= 0)) {
        L2Set.push(arr);
      }
    }
    )
  )


  const l2c = _.map(_.groupBy(L2Set), (value, key) => {
    return {
      id: JSON.parse("[" + key + "]"),
      count: value.length
    }
  })
    .sort((a, b) => b.count - a.count)
    .map(arr => arr.count ? [...arr.id, arr.count] : null)

  // console.log(l2c)

  const l3c = _.map(_.groupBy(L3Set), (value, key) => {
    return {
      id: JSON.parse("[" + key + "]"),
      count: value.length
    }
  })
    .sort((a, b) => b.count - a.count)
    .map(arr => arr.count ? [...arr.id, arr.count] : null)

  console.log(l3c)

  NF.getRange(2, 10, L2Set.length, 2).clearContent();
  NF.getRange(2, 10, L2Set.length, 2).setValues(L2Set);
  NF.getRange(2, 10, freqLastRow - 1, 3).clearContent();
  NF.getRange(2, 10, l2c.length, 3).setValues(l2c);
  NF.getRange(2, 18, L3Set.length, 3).clearContent();
  NF.getRange(2, 18, L3Set.length, 3).setValues(L3Set);
  NF.getRange(2, 18, freqLastRow - 1, 4).clearContent();
  NF.getRange(2, 18, l3c.length, 4).setValues(l3c);
  // console.log(L3Set)

  function L2Combinations() {
    let c5filtered = c5Array.filter(function (el) {
      return el != '';
    });

    let random5 = [];
    for (let i = 0; i < c5filtered.length; i++) {
      random5.push(c5filtered[i][0]);
    }
    function recursive(cross, s, a) {
      for (var i = s; i < random5.length; i++) {
        if (!cross) {
          var b = a.slice(0);
          b.push(random5[i]);
          set.push(b);
        }
        else {
          a.push(random5[i]);
          recursive(cross - 1, i + 1, a);
          a.splice(-1, 1);
        }
      }
    }

    var set = [];
    recursive(1, 0, []);
    // console.log(set)
    NF.getRange(2, 2, set.length, 2).clearContent();
    NF.getRange(2, 2, set.length, 2).setValues(set);
    return set
  }

  function L3Combinations() {
    let c5filtered = c5Array.filter(function (el) {
      return el != '';
    });

    let random5 = [];
    for (let i = 0; i < c5filtered.length; i++) {
      random5.push(c5filtered[i][0]);
    }
    function recursive(cross, s, a) {
      for (var i = s; i < random5.length; i++) {
        if (!cross) {
          var b = a.slice(0);
          b.push(random5[i]);
          set.push(b);
        }
        else {
          a.push(random5[i]);
          recursive(cross - 1, i + 1, a);
          a.splice(-1, 1);
        }
      }
    }

    var set = [];
    recursive(2, 0, []);
    // console.log(set)
    NF.getRange(2, 14, set.length, 3).clearContent();
    NF.getRange(2, 14, set.length, 3).setValues(set);
    return set
  }
}

function CS5Search() {
  let ss = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Cash5");
  let lastRow = ss.getLastRow();
  let fullList = ss.getRange(2, 2, lastRow - 1, 5).getValues();
  // let searchNum = ss.getRange(2,2,lastRow-2,5).getValues();

  // let searchNum = ss.getRange(2,14,lastRow-2,5).getValues();
  let searchNum = ss.getRange(2, 20, lastRow - 2, 5).getValues();

  for (let i = 0; i < searchNum.length; i++) {
    for (let j = i + 1; j < fullList.length; j++) {

      let count = 1;
      for (let k = 0; k < 5; k++) {
        if (searchNum[i].includes(fullList[j][k])) {
          if (count === 4) {
            console.log(i, j, searchNum[i], fullList[j], count);
            // count++;
          }
          if (count === 3) {
            console.log(i, j, searchNum[i], fullList[j], count);
            // count++;
          }
          // if(count===2){
          //   console.log(i,j, searchNum[i], fullList[j], count);
          // }
          count++;

        }

      }

      // L2C.map(arr=>
      //   last25.map(arr2 => {
      //     }
      //   )
      // )
      // if(JSON.stringify(searchNum[i])==JSON.stringify(fullList[j])){
      //     console.log(i, a1, a2);
      // }
    }
  }
}

function CS5_100_678_301() {

  let ss = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Cash5");
  let lastRow = ss.getLastRow();
  let fullList = ss.getRange(2, 2, lastRow - 1, 5).getValues();
  let newSet = [];

  let Number_Frequency = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("CS5");
  let freqLastRow = Number_Frequency.getLastRow();

  let c8Array = Number_Frequency.getRange(2, 8, 36, 1).getValues();
  let c7Array = Number_Frequency.getRange(2, 7, 36, 1).getValues();
  let c6Array = Number_Frequency.getRange(2, 6, 36, 1).getValues();

  let c4Array = Number_Frequency.getRange(2, 4, 36, 1).getValues();
  let c3Array = Number_Frequency.getRange(2, 3, 36, 1).getValues();
  let c2Array = Number_Frequency.getRange(2, 2, 36, 1).getValues();
  let c1Array = Number_Frequency.getRange(2, 1, 36, 1).getValues();

  let c8filtered = c8Array.filter(function (el) {
    return el != '';
  });
  let c7filtered = c7Array.filter(function (el) {
    return el != '';
  });
  let c6filtered = c6Array.filter(function (el) {
    return el != '';
  });
  let c4filtered = c4Array.filter(function (el) {
    return el != '';
  });
  let c3filtered = c3Array.filter(function (el) {
    return el != '';
  });
  let c2filtered = c2Array.filter(function (el) {
    return el != '';
  });
  let c1filtered = c1Array.filter(function (el) {
    return el != '';
  });

  let random8 = [];
  let random7 = [];
  let random6 = [];

  let random4 = [];
  let random3 = [];
  let random2 = [];
  let random1 = [];

  // console.log(last10RowRepeat);
  //let array10Row = [];

  for (let i = 0; i < c8filtered.length; i++) {
    random8.push(c8filtered[i][0]);
  }
  for (let i = 0; i < c7filtered.length; i++) {
    random7.push(c7filtered[i][0]);
  }

  for (let i = 0; i < c6filtered.length; i++) {
    random6.push(c6filtered[i][0]);
  }

  for (let i = 0; i < c4filtered.length; i++) {
    random4.push(c4filtered[i][0]);
  }
  for (let i = 0; i < c3filtered.length; i++) {
    random3.push(c3filtered[i][0]);
  }

  for (let i = 0; i < c2filtered.length; i++) {
    random2.push(c2filtered[i][0]);
  }

  for (let i = 0; i < c1filtered.length; i++) {
    random1.push(c1filtered[i][0]);
  }

  function RandomSet() {
    let srchAry = [];
    let initial = [];
    // const count = pick; // Considering N numbers
    // const max = maxValue;

    function randomPick(n, array) {
      let randomItems = array.sort(() => .5 - Math.random()).slice(0, n);
      return randomItems;
    }

    let r1 = randomPick(0, random1);
    let r2 = randomPick(0, random2);
    let r3 = randomPick(0, random3);
    let r4 = randomPick(0, random4);
    let r6 = randomPick(3, random6);
    let r7 = randomPick(0, random7);
    let r8 = randomPick(1, random8);

    let r = r8.concat(r7).concat(r6).concat(r4).concat(r3).concat(r2).concat(r1);
    return r.sort((a, b) => a - b);
  }

  function arraysEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;

    for (var i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  for (let i = 0; i < 100; i++) {
    let newSearchSet = RandomSet();
    for (let k = 0; k < fullList.length; k++) {
      let searchSet = fullList[k];
      if (arraysEqual(newSearchSet, searchSet)) {
        break;
      }
      newSet.push(newSearchSet);
    }
  }
  newSet = [...new Set(newSet)];
  console.log("newSet: ", newSet)
  ss.getRange(2, 14, lastRow - 1, 5).clearContent();
  ss.getRange(2, 14, 100, 5).setValues(newSet)
}



function CS5_100_37_13() {

  let ss = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Cash5");
  let lastRow = ss.getLastRow();
  let fullList = ss.getRange(2, 2, lastRow - 1, 5).getValues();
  let newSet = [];

  let Number_Frequency = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("CS5");
  let freqLastRow = Number_Frequency.getLastRow();

  let c8Array = Number_Frequency.getRange(2, 8, 36, 1).getValues();
  let c7Array = Number_Frequency.getRange(2, 7, 36, 1).getValues();
  let c6Array = Number_Frequency.getRange(2, 6, 36, 1).getValues();

  let c4Array = Number_Frequency.getRange(2, 4, 36, 1).getValues();
  let c3Array = Number_Frequency.getRange(2, 3, 36, 1).getValues();
  let c2Array = Number_Frequency.getRange(2, 2, 36, 1).getValues();
  let c1Array = Number_Frequency.getRange(2, 1, 36, 1).getValues();

  let c8filtered = c8Array.filter(function (el) {
    return el != '';
  });
  let c7filtered = c7Array.filter(function (el) {
    return el != '';
  });
  let c6filtered = c6Array.filter(function (el) {
    return el != '';
  });
  let c4filtered = c4Array.filter(function (el) {
    return el != '';
  });
  let c3filtered = c3Array.filter(function (el) {
    return el != '';
  });
  let c2filtered = c2Array.filter(function (el) {
    return el != '';
  });
  let c1filtered = c1Array.filter(function (el) {
    return el != '';
  });

  let random8 = [];
  let random7 = [];
  let random6 = [];

  let random4 = [];
  let random3 = [];
  let random2 = [];
  let random1 = [];

  // console.log(last10RowRepeat);
  //let array10Row = [];

  for (let i = 0; i < c8filtered.length; i++) {
    random8.push(c8filtered[i][0]);
  }
  for (let i = 0; i < c7filtered.length; i++) {
    random7.push(c7filtered[i][0]);
  }

  for (let i = 0; i < c6filtered.length; i++) {
    random6.push(c6filtered[i][0]);
  }

  for (let i = 0; i < c4filtered.length; i++) {
    random4.push(c4filtered[i][0]);
  }
  for (let i = 0; i < c3filtered.length; i++) {
    random3.push(c3filtered[i][0]);
  }

  for (let i = 0; i < c2filtered.length; i++) {
    random2.push(c2filtered[i][0]);
  }

  for (let i = 0; i < c1filtered.length; i++) {
    random1.push(c1filtered[i][0]);
  }

  function RandomSet() {
    let srchAry = [];
    let initial = [];
    // const count = pick; // Considering N numbers
    // const max = maxValue;

    function randomPick(n, array) {
      let randomItems = array.sort(() => .5 - Math.random()).slice(0, n);
      return randomItems;
    }

    let r1 = randomPick(0, random1);
    let r2 = randomPick(0, random2);
    let r3 = randomPick(1, random3);
    let r4 = randomPick(0, random4);
    let r6 = randomPick(0, random6);
    let r7 = randomPick(3, random7);
    let r8 = randomPick(0, random8);

    let r = r8.concat(r7).concat(r6).concat(r4).concat(r3).concat(r2).concat(r1);
    return r.sort((a, b) => a - b);
  }

  function arraysEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;

    for (var i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  for (let i = 0; i < 100; i++) {
    let newSearchSet = RandomSet();
    for (let k = 0; k < fullList.length; k++) {
      let searchSet = fullList[k];
      if (arraysEqual(newSearchSet, searchSet)) {
        break;
      }
      newSet.push(newSearchSet);
    }
  }
  newSet = [...new Set(newSet)];
  console.log("newSet: ", newSet)
  ss.getRange(2, 20, lastRow - 1, 5).clearContent();
  ss.getRange(2, 20, 100, 5).setValues(newSet)
}

function MergeAndFilterArrays(arr1, arr2) {
    // Convert arrays to sets to remove duplicates
    const set1 = new Set(arr1);
    const set2 = new Set(arr2);

    // Find common numbers
    const commonNumbers = [...set1].filter(num => set2.has(num));

    // Merge common numbers with all numbers from arr1
    const resultSet = new Set([...arr1, ...commonNumbers]);

    // Sort the result array in ascending order
    const resultArray = Array.from(resultSet).sort((a, b) => a - b);

    return resultArray;
}

function CS5ProcessArray_Calculate() {
  // Get the active spreadsheet and sheet
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sourceSheet = spreadsheet.getSheetByName('Cash5'); // Change to your source sheet name
  let number = 20
  let rowTest = "B" + number
  let rowEndnumber = "F" + (number + 9)
  // Get the range containing the 10x5 array of numbers
  var sourceRange = sourceSheet.getRange(rowTest + ':' + rowEndnumber);
  var sourceValues = sourceRange.getValues();
  var lastRow = sourceSheet.getLastRow();
  var fullList = sourceSheet.getRange(number, 2, lastRow - 1, 5).getValues();

  // Create a new array to store all the numbers
  var allNumbers = [];

  // Loop through the source array and add numbers to the 'allNumbers' array
  for (var row = 0; row < sourceValues.length; row++) {
    for (var col = 0; col < sourceValues[row].length; col++) {
      allNumbers.push(sourceValues[row][col]);
    }
  }

  // Remove duplicates and sort the numbers in ascending order
  var uniqueNumbers = Array.from(new Set(allNumbers)).sort(function (a, b) {
    return a - b;
  });


  // Create an array of missing numbers up to the given number
  var missingNumbers = [];
  for (var i = 1; i <= 35; i++) {
    if (!uniqueNumbers.includes(i)) {
      missingNumbers.push(i);
    }
  }

  // the missing numbers and sort them
  var updatedNumbers = missingNumbers.sort(function (a, b) {
    return a - b;
  });

  var lastDrawArrVal = sourceValues[0]
  let freqList = sourceSheet.getRange(number, 8, 1, 5).getValues()[0];
  let freqList2 = sourceSheet.getRange(number + 1, 8, 1, 5).getValues()[0];
  let freqList3 = sourceSheet.getRange(number + 2, 8, 1, 5).getValues()[0];
  let matchingArray = [];
  let matchingArray2 = [];
  let matchingArray3 = [];
  for (let i = 0; i < freqList.length; i++) {
    let findingArr = fullList[freqList[i] + 1] || []
    for (let j = 0; j < findingArr.length; j++) {
      if (fullList[0][i] !== findingArr[j] && !matchingArray.includes(findingArr[j])) {
        matchingArray.push(findingArr[j])
      }
    }
  }
  let updatedMatchingArray = matchingArray.sort((a, b) => a - b);

  for (let i = 0; i < freqList2.length; i++) {
    let findingArr = fullList[freqList2[i] + 1 + 1] || []
    for (let j = 0; j < findingArr.length; j++) {
      if (fullList[1][i] !== findingArr[j] && !matchingArray2.includes(findingArr[j])) {
        matchingArray2.push(findingArr[j])
      }
    }
  }

  let updatedMatchingArray2 = matchingArray2.sort((a, b) => a - b);

  for (let i = 0; i < freqList3.length; i++) {
    let findingArr = fullList[freqList3[i] + 1 + 1] || []
    for (let j = 0; j < findingArr.length; j++) {
      if (fullList[3][i] !== findingArr[j] && !matchingArray3.includes(findingArr[j])) {
        matchingArray3.push(findingArr[j])
      }
    }
  }
  let lastDrawArr = sourceValues[0];
  // let updatedMatchingArray3 = matchingArray3.sort((a, b) => a - b);  
  let updatedMatchingArray3 = [...new Set([...updatedMatchingArray, ...updatedMatchingArray2, ...lastDrawArr])].sort((a, b) => a - b);


  let mixArr = [...new Set([...lastDrawArr, ...updatedMatchingArray, ...updatedMatchingArray2])].sort((a, b) => a - b);

  let unmixArr = [];
  for (let i = 1; i <= 35; i++) {
    if (!mixArr.includes(i)) {
      unmixArr.push(i)
    }
  }

  let preSearchSetNums = [];
  for (let rowNum = 2; rowNum < 3; rowNum++) {
    let searchNum = sourceSheet.getRange(rowNum, 2, lastRow - 2, 5).getValues();
    
    for (let i = number-2; i < number-1; i++) {
      for (let j = i + 1; j < fullList.length; j++) {
        let count = 1;
        for (let k = 0; k < 5; k++) {
          if (searchNum[i].includes(fullList[j][k])) {
            // if (count === 4) {
            //   console.log(i, "distance from i to j", j-i, j, searchNum[i], fullList[j], count);
            //   fullList[j].map(el => {
            //     if(!preSearchSetNums.includes(el)) {
            //       preSearchSetNums.push(el)
            //     }
            //   })
            // }
            if (count === 3) {
              console.log(i, "distance from i to j", j-i, j, searchNum[i], fullList[j], count);
              fullList[j].map(el => {
                if(!preSearchSetNums.includes(el)) {
                  preSearchSetNums.push(el)
                }
              })
            }
            // if (count === 2) {
            //   console.log(i, "distance from i to j", j-i, j, searchNum[i], fullList[j], count);
            //   fullList[j].map(el => {
            //     if(!preSearchSetNums.includes(el)) {
            //       preSearchSetNums.push(el)
            //     }
            //   })
            // }
            count++;
          }
        }
      }
    }
  }

  preSearchSetNums.sort((a,b) => a-b)

  let substractedNums = MergeAndFilterArrays(updatedMatchingArray3, preSearchSetNums);
  let col3_col4 = [...new Set([...updatedMatchingArray, ...lastDrawArr])].sort((a, b) => a - b);

  let array_2_50 = sourceSheet.getRange(number, 2, 25, 5).getValues();
  let doublesSet_2_25 = TS_generateDoubles(array_2_50);
  let array_2_200 = sourceSheet.getRange(number, 2, 100, 5).getValues();
  let tripletsSet_2_100 = TS_generateTriplets(array_2_200)
  let array_all_4s = sourceSheet.getRange(number+4000, 2, lastRow-1-4000, 5).getValues();
  let quadraplesSet_all_4s = TS_generateQuadraple(array_all_4s);
  let array_all_5s = sourceSheet.getRange(number, 2, lastRow - 1, 5).getValues();

  let col1_col2_35 = uniqueNumbers.concat(updatedNumbers).sort((a,b) => a-b)
  console.log("col 1:", uniqueNumbers, uniqueNumbers.length)
  console.log("col 2:", updatedNumbers, updatedNumbers.length)
  console.log("col 3:", lastDrawArrVal)
  console.log("col 4:", updatedMatchingArray, updatedMatchingArray.length)
  console.log("col 5:", updatedMatchingArray2, updatedMatchingArray2.length)
  console.log("combined:", updatedMatchingArray3, updatedMatchingArray3.length)
  console.log("triplets nums:", preSearchSetNums, preSearchSetNums.length)
  console.log("substractedNums:", substractedNums, substractedNums.length);
  console.log("col3_col4:", col3_col4, col3_col4.length);

  // console.log("Triplets: ", CS5_Triplets_Process(substractedNums, tripletsSet_2_100))
  console.log("Process Array: ", CS5_No_4s_No_3s_under100_2s_under25_Process(col3_col4, doublesSet_2_25, tripletsSet_2_100, quadraplesSet_all_4s, array_all_5s, lastDrawArrVal))

}
// Additional statistics: generates gaps and frequencies per number
function CS5AdditionalStats() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Cash5');
  if (!sheet) {
    Logger.log('Cash5 sheet not found');
    return;
  }
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  var data = sheet.getRange(2, 2, lastRow - 1, 5).getValues();
  var maxNumber = 35;
  var gaps = {};
  for (var n = 1; n <= maxNumber; n++) {
    gaps[n] = '';
  }
  // compute gap since last appearance
  for (var i = data.length - 1; i >= 0; i--) {
    var draw = data[i];
    for (var j = 0; j < draw.length; j++) {
      var num = parseInt(draw[j], 10);
      if (gaps[num] === '') {
        gaps[num] = data.length - i;
      }
    }
  }
  // frequency counts over various windows
  var freq10 = {}, freq25 = {}, freq50 = {}, freq100 = {};
  for (var m = 1; m <= maxNumber; m++) {
    freq10[m] = 0;
    freq25[m] = 0;
    freq50[m] = 0;
    freq100[m] = 0;
  }
  for (var i = data.length - 1; i >= 0; i--) {
    var idxFromEnd = data.length - i;
    var draw = data[i];
    for (var j = 0; j < draw.length; j++) {
      var num = parseInt(draw[j], 10);
      if (idxFromEnd <= 10) freq10[num]++;
      if (idxFromEnd <= 25) freq25[num]++;
      if (idxFromEnd <= 50) freq50[num]++;
      if (idxFromEnd <= 100) freq100[num]++;
    }
  }
  // create or clear stats sheet
  var statsSheet = ss.getSheetByName('Cash5Stats');
  if (!statsSheet) {
    statsSheet = ss.insertSheet('Cash5Stats');
  }
  statsSheet.clear();
  statsSheet.getRange(1, 1, 1, 6).setValues([
    ['Number', 'LastGap', 'Freq10', 'Freq25', 'Freq50', 'Freq100']
  ]);
  var output = [];
  for (var m = 1; m <= maxNumber; m++) {
    output.push([m, gaps[m] === '' ? '' : gaps[m], freq10[m], freq25[m], freq50[m], freq100[m]]);
  }
  statsSheet.getRange(2, 1, output.length, 6).setValues(output);
}



