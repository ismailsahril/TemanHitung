import { Question, SessionConfig, Operation } from '../types';

// Constants for number generation to avoid magic numbers
const EASY_ADD_MIN_A = 10;
const EASY_ADD_MAX_A = 50;
const EASY_ADD_MIN_B = 1;
const EASY_ADD_MAX_B = 20;

const EASY_SUB_MIN_A = 10;
const EASY_SUB_MAX_A = 50;


const EASY_MULT_MIN_OTHER = 2;
const EASY_MULT_MAX_OTHER = 12;
const EASY_MULT_DIVISORS_TRIES = [2, 3, 4, 5];

const EASY_DIV_MIN_RESULT = 2;
const EASY_DIV_MAX_RESULT = 10;
const EASY_DIV_DIVISORS = [2, 3, 4, 5];

const MEDIUM_ADD_MIN_A = 50;
const MEDIUM_ADD_MAX_A = 200;
const MEDIUM_ADD_MIN_B = 10;
const MEDIUM_ADD_MAX_B = 100;

const MEDIUM_SUB_MIN_A = 50;
const MEDIUM_SUB_MAX_A = 300;

const MEDIUM_MULT_MIN = 6;
const MEDIUM_MULT_MAX = 15;

const MEDIUM_DIV_DIVISOR_MIN = 6;
const MEDIUM_DIV_DIVISOR_MAX = 12;
const MEDIUM_DIV_RESULT_MIN = 3;
const MEDIUM_DIV_RESULT_MAX = 15;

const HARD_ADD_MIN_A = 100;
const HARD_ADD_MAX_A = 999;
const HARD_ADD_MIN_B = 100;
const HARD_ADD_MAX_B = 999;

const HARD_SUB_MIN_A = 200;
const HARD_SUB_MAX_A = 999;

const HARD_MULT_MIN = 12;
const HARD_MULT_MAX = 25;

const HARD_DIV_DIVISOR_MIN = 7;
const HARD_DIV_DIVISOR_MAX = 20;
const HARD_DIV_RESULT_MIN = 5;
const HARD_DIV_RESULT_MAX = 30;

// Helper to generate a random integer within range [min, max]
function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper to generate a random float with 1 decimal place within [min, max]
function getRandomFloat1Dec(min: number, max: number): number {
  const val = Math.random() * (max - min) + min;
  return Math.round(val * 10) / 10;
}

// Helper to compute correct answer securely
function computeAnswer(operandA: number, operandB: number, operation: Operation): number {
  switch (operation) {
    case 'addition':
      return operandA + operandB;
    case 'subtraction':
      return operandA - operandB;
    case 'multiplication':
      return operandA * operandB;
    case 'division':
      return operandA / operandB;
  }
}

// Format numbers according to Indonesian (1.000,5) or English (1,000.5) separators
export function formatNumber(n: number, format: 'id' | 'en'): string {
  // If integer, standard display. Otherwise, check decimal length
  const isDecimal = n % 1 !== 0;
  const decimalStr = isDecimal ? n.toString().split('.')[1] || '' : '';
  const decimalPlaces = isDecimal ? Math.min(decimalStr.length, 2) : 0;

  if (format === 'id') {
    return n.toLocaleString('id-ID', {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    });
  } else {
    return n.toLocaleString('en-US', {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    });
  }
}

// Generates the expression string for display (e.g. "24 × 5 = ?")
function getDisplayExpression(operandA: number, operandB: number, operation: Operation, format: 'id' | 'en' = 'id'): string {
  const formattedA = formatNumber(operandA, format);
  const formattedB = formatNumber(operandB, format);

  switch (operation) {
    case 'addition':
      return `${formattedA} + ${formattedB} = ?`;
    case 'subtraction':
      return `${formattedA} − ${formattedB} = ?`;
    case 'multiplication':
      return `${formattedA} × ${formattedB} = ?`;
    case 'division':
      return `${formattedA} ÷ ${formattedB} = ?`;
  }
}

// Bilingual step-by-step strategy tip specific to the actual numbers in the question
export function getQuickTip(question: Omit<Question, 'quickTip'>, language: 'id' | 'en' = 'id'): string {
  const { operandA, operandB, operation } = question;
  const isDecimal = operandA % 1 !== 0 || operandB % 1 !== 0;
  const isEn = language === 'en';

  if (isDecimal) {
    if (operation === 'addition') {
      return isEn 
        ? `Split numbers before & after decimal: ${Math.floor(operandA)} + ${Math.floor(operandB)} = ${Math.floor(operandA) + Math.floor(operandB)}, then ${Math.round((operandA % 1) * 10) / 10} + ${Math.round((operandB % 1) * 10) / 10} = ${Math.round(((operandA % 1) + (operandB % 1)) * 10) / 10} → final result: ${formatNumber(operandA + operandB, 'en')}`
        : `Pisahkan angka sebelum & sesudah koma: ${Math.floor(operandA)} + ${Math.floor(operandB)} = ${Math.floor(operandA) + Math.floor(operandB)}, lalu ${Math.round((operandA % 1) * 10) / 10} + ${Math.round((operandB % 1) * 10) / 10} = ${Math.round(((operandA % 1) + (operandB % 1)) * 10) / 10} → hasil akhir: ${formatNumber(operandA + operandB, 'id')}`;
    }
    if (operation === 'subtraction') {
      return isEn 
        ? `Subtract the integer parts: ${Math.floor(operandA)} - ${Math.floor(operandB)} = ${Math.floor(operandA) - Math.floor(operandB)}, then adjust decimals: ${formatNumber(operandA, 'en')} minus ${formatNumber(operandB, 'en')} → final result: ${formatNumber(operandA - operandB, 'en')}`
        : `Kurangi bagian bulat: ${Math.floor(operandA)} - ${Math.floor(operandB)} = ${Math.floor(operandA) - Math.floor(operandB)}, lalu sesuaikan desimalnya: ${formatNumber(operandA, 'id')} dikurang ${formatNumber(operandB, 'id')} → hasil akhir: ${formatNumber(operandA - operandB, 'id')}`;
    }
    if (operation === 'multiplication') {
      const scaleA = operandA * 10;
      const scaleB = operandB * 10;
      return isEn
        ? `Ignore decimals temporarily: Multiply ${Math.round(scaleA)} × ${Math.round(scaleB)} = ${Math.round(scaleA * scaleB)}, then divide by 100 for two decimal places → result: ${formatNumber(operandA * operandB, 'en')}`
        : `Abaikan koma sementara: Kalikan ${Math.round(scaleA)} × ${Math.round(scaleB)} = ${Math.round(scaleA * scaleB)}, lalu bagi dengan 100 karena ada dua desimal → hasilnya ${formatNumber(operandA * operandB, 'id')}`;
    }
    if (operation === 'division') {
      const scaleA = operandA * 10;
      const scaleB = operandB * 10;
      return isEn
        ? `Multiply both numbers by 10 to make them integers: ${Math.round(scaleA)} ÷ ${Math.round(scaleB)} = ${formatNumber((scaleA) / (scaleB), 'en')}`
        : `Kalikan kedua angka dengan 10 agar bulat: ${Math.round(scaleA)} ÷ ${Math.round(scaleB)} = ${formatNumber((scaleA) / (scaleB), 'id')}`;
    }
  }

  // Integer mode strategies
  if (operation === 'addition') {
    // Rounding strategy (e.g. operandB close to 10, 20, 50, 100)
    const nextTenB = Math.ceil(operandB / 10) * 10;
    const diffB = nextTenB - operandB;
    if (diffB <= 2 && operandB > 5) {
      return isEn
        ? `Round ${operandB} → ${nextTenB}, then ${operandA} + ${nextTenB} = ${operandA + nextTenB}, subtract ${diffB} → result: ${operandA + operandB}`
        : `Bulatkan ${operandB} → ${nextTenB}, lalu ${operandA} + ${nextTenB} = ${operandA + nextTenB}, kurangi ${diffB} → hasilnya ${operandA + operandB}`;
    }
    const nextTenA = Math.ceil(operandA / 10) * 10;
    const diffA = nextTenA - operandA;
    if (diffA <= 2 && operandA > 5) {
      return isEn
        ? `Round ${operandA} → ${nextTenA}, then ${nextTenA} + ${operandB} = ${nextTenA + operandB}, subtract ${diffA} → result: ${operandA + operandB}`
        : `Bulatkan ${operandA} → ${nextTenA}, lalu ${nextTenA} + ${operandB} = ${nextTenA + operandB}, kurangi ${diffA} → hasilnya ${operandA + operandB}`;
    }
    // General strategy: split by tens & ones
    const tensA = Math.floor(operandA / 10) * 10;
    const onesA = operandA % 10;
    const tensB = Math.floor(operandB / 10) * 10;
    const onesB = operandB % 10;
    if (tensA > 0 && tensB > 0) {
      return isEn
        ? `Add tens: ${tensA} + ${tensB} = ${tensA + tensB}. Add ones: ${onesA} + ${onesB} = ${onesA + onesB}. Combine: ${tensA + tensB} + ${onesA + onesB} = ${operandA + operandB}`
        : `Jumlahkan puluhan: ${tensA} + ${tensB} = ${tensA + tensB}. Jumlahkan satuan: ${onesA} + ${onesB} = ${onesA + onesB}. Gabungkan: ${tensA + tensB} + ${onesA + onesB} = ${operandA + operandB}`;
    }
    return isEn
      ? `Add directly: ${operandA} + ${operandB} = ${operandA + operandB}`
      : `Tambahkan langsung: ${operandA} + ${operandB} = ${operandA + operandB}`;
  }

  if (operation === 'subtraction') {
    // Rounding strategy for subtrahend (operandB)
    const nextTenB = Math.ceil(operandB / 10) * 10;
    const diffB = nextTenB - operandB;
    if (diffB <= 2 && operandB > 5) {
      return isEn
        ? `Round subtrahend up: Subtract ${operandA} − ${nextTenB} = ${operandA - nextTenB}, then add back difference ${diffB} → result: ${operandA - operandB}`
        : `Bulatkan pembagi ke atas: Kurangi ${operandA} − ${nextTenB} = ${operandA - nextTenB}, lalu tambahkan kembali selisih ${diffB} → hasilnya ${operandA - operandB}`;
    }
    // Split by place values
    const tensA = Math.floor(operandA / 10) * 10;
    const onesA = operandA % 10;
    const tensB = Math.floor(operandB / 10) * 10;
    const onesB = operandB % 10;
    if (tensA > 0 && tensB > 0 && onesA >= onesB) {
      return isEn
        ? `Subtract tens: ${tensA} − ${tensB} = ${tensA - tensB}. Subtract ones: ${onesA} − ${onesB} = ${onesA - onesB}. Combine results: ${tensA - tensB} + ${onesA - onesB} = ${operandA - operandB}`
        : `Kurangi puluhan: ${tensA} − ${tensB} = ${tensA - tensB}. Kurangi satuan: ${onesA} − ${onesB} = ${onesA - onesB}. Jumlahkan hasil: ${tensA - tensB} + ${onesA - onesB} = ${operandA - operandB}`;
    }
    return isEn
      ? `Subtract in stages: Subtract tens first, then subtract ones. ${operandA} - ${tensB} = ${operandA - tensB}, then - ${onesB} = ${operandA - operandB}`
      : `Kurangi bertahap: Kurangi puluhan lebih dulu, baru kurangi satuannya. ${operandA} - ${tensB} = ${operandA - tensB}, lalu - ${onesB} = ${operandA - operandB}`;
  }

  if (operation === 'multiplication') {
    // Multiply by 5
    if (operandB === 5) {
      return isEn
        ? `Multiply by 5 trick: Multiply ${operandA} × 10 = ${operandA * 10}, then divide by 2 → result: ${operandA * 10} ÷ 2 = ${operandA * operandB}`
        : `Trik perkalian 5: Kalikan ${operandA} × 10 = ${operandA * 10}, lalu bagi 2 → hasilnya ${operandA * 10} ÷ 2 = ${operandA * operandB}`;
    }
    if (operandA === 5) {
      return isEn
        ? `Multiply by 5 trick: Multiply ${operandB} × 10 = ${operandB * 10}, then divide by 2 → result: ${operandB * 10} ÷ 2 = ${operandA * operandB}`
        : `Trik perkalian 5: Kalikan ${operandB} × 10 = ${operandB * 10}, lalu bagi 2 → hasilnya ${operandB * 10} ÷ 2 = ${operandA * operandB}`;
    }
    // Multiply by 9
    if (operandB === 9) {
      return isEn
        ? `Multiply by 9 trick: Multiply ${operandA} × 10 = ${operandA * 10}, then subtract ${operandA} → result: ${operandA * 10} − ${operandA} = ${operandA * operandB}`
        : `Trik perkalian 9: Kalikan ${operandA} × 10 = ${operandA * 10}, lalu kurangi ${operandA} → hasilnya ${operandA * 10} − ${operandA} = ${operandA * operandB}`;
    }
    if (operandA === 9) {
      return isEn
        ? `Multiply by 9 trick: Multiply ${operandB} × 10 = ${operandB * 10}, then subtract ${operandB} → result: ${operandB * 10} − ${operandB} = ${operandA * operandB}`
        : `Trik perkalian 9: Kalikan ${operandB} × 10 = ${operandB * 10}, lalu kurangi ${operandB} → hasilnya ${operandB * 10} − ${operandB} = ${operandA * operandB}`;
    }
    // Multiply by 11 (two digits)
    if (operandB === 11 && operandA >= 10 && operandA <= 99) {
      const first = Math.floor(operandA / 10);
      const second = operandA % 10;
      const sum = first + second;
      if (sum < 10) {
        return isEn
          ? `Multiply by 11 trick: Insert the sum of digits (${first} + ${second} = ${sum}) between ${first} and ${second} → result: ${first}${sum}${second}`
          : `Trik angka 11: Sisipkan penjumlahan digit (${first} + ${second} = ${sum}) di antara ${first} dan ${second} → hasilnya ${first}${sum}${second}`;
      } else {
        return isEn
          ? `Multiply by 11 trick: Add ${first} + ${second} = ${sum}. Add 1 to ${first} (making it ${first + 1}) and place ${sum % 10} in the middle → result: ${first + 1}${sum % 10}${second}`
          : `Trik angka 11: Jumlahkan ${first} + ${second} = ${sum}. Menjadi ${first + 1} dan letakkan ${sum % 10} di tengah → hasilnya ${first + 1}${sum % 10}${second}`;
      }
    }
    // General doubling/splitting
    if (operandB % 2 === 0 && operandB <= 10) {
      const halfB = operandB / 2;
      return isEn
        ? `Use doubling: Multiply ${operandA} × ${halfB} = ${operandA * halfB}, then double it → result: ${operandA * halfB * 2}`
        : `Gunakan kelipatan dua: Kalikan ${operandA} × ${halfB} = ${operandA * halfB}, lalu kalikan dua → hasilnya ${operandA * halfB * 2}`;
    }
    // Standard splitting
    const tensB = Math.floor(operandB / 10) * 10;
    const onesB = operandB % 10;
    if (tensB > 0) {
      return isEn
        ? `Split the multiplier: ${operandA} × ${tensB} = ${operandA * tensB}, and ${operandA} × ${onesB} = ${operandA * onesB}. Add them: ${operandA * tensB} + ${operandA * onesB} = ${operandA * operandB}`
        : `Pecah pengali: ${operandA} × ${tensB} = ${operandA * tensB}, dan ${operandA} × ${onesB} = ${operandA * onesB}. Jumlahkan: ${operandA * tensB} + ${operandA * onesB} = ${operandA * operandB}`;
    }
    return isEn
      ? `Multiply directly: ${operandA} × ${operandB} = ${operandA * operandB}`
      : `Kalikan langsung: ${operandA} × ${operandB} = ${operandA * operandB}`;
  }

  if (operation === 'division') {
    // Divisor is 5
    if (operandB === 5) {
      return isEn
        ? `Divide by 5 trick: Multiply ${operandA} × 2 = ${operandA * 2}, then divide by 10 (shift decimal point 1 digit) → result: ${operandA * 2} ÷ 10 = ${operandA / operandB}`
        : `Trik pembagian 5: Kalikan ${operandA} × 2 = ${operandA * 2}, lalu bagi 10 (geser koma 1 digit) → hasilnya ${operandA * 2} ÷ 10 = ${operandA / operandB}`;
    }
    // Derived fact
    const divisionFact = operandA / operandB;
    return isEn
      ? `Use the inverse of multiplication: Since we know ${operandB} × ${divisionFact} = ${operandA}, then ${operandA} ÷ ${operandB} = ${divisionFact}`
      : `Gunakan kebalikan perkalian: Kita tahu bahwa ${operandB} × ${divisionFact} = ${operandA}, maka ${operandA} ÷ ${operandB} = ${divisionFact}`;
  }

  return isEn
    ? `Calculate carefully: ${operandA} ${operation} ${operandB}`
    : `Hitung dengan teliti: ${operandA} ${operation} ${operandB}`;
}

// Pure function to generate a single question
export function generateQuestion(config: SessionConfig, language: 'id' | 'en' = 'id'): Question {
  const { operation, difficulty, mode } = config;
  let operandA = 0;
  let operandB = 0;
  let correctAnswer = 0;

  const isDecimal = mode === 'decimal';

  // Easy Difficulty
  if (difficulty === 'easy') {
    if (operation === 'addition') {
      if (isDecimal) {
        operandA = getRandomFloat1Dec(EASY_ADD_MIN_A, EASY_ADD_MAX_A);
        operandB = getRandomInt(EASY_ADD_MIN_B, EASY_ADD_MAX_B); // Operand B integer per spec
      } else {
        operandA = getRandomInt(EASY_ADD_MIN_A, EASY_ADD_MAX_A);
        operandB = getRandomInt(EASY_ADD_MIN_B, EASY_ADD_MAX_B);
      }
      correctAnswer = operandA + operandB;
    } else if (operation === 'subtraction') {
      if (isDecimal) {
        operandA = getRandomFloat1Dec(EASY_SUB_MIN_A, EASY_SUB_MAX_A);
        operandB = getRandomInt(EASY_ADD_MIN_B, Math.floor(operandA)); // result >= 0
      } else {
        operandA = getRandomInt(EASY_SUB_MIN_A, EASY_ADD_MAX_A);
        operandB = getRandomInt(EASY_ADD_MIN_B, operandA); // result >= 0
      }
      correctAnswer = operandA - operandB;
    } else if (operation === 'multiplication') {
      operandA = EASY_MULT_DIVISORS_TRIES[getRandomInt(0, EASY_MULT_DIVISORS_TRIES.length - 1)]; // 2, 3, 4, 5
      operandB = getRandomInt(EASY_MULT_MIN_OTHER, EASY_MULT_MAX_OTHER); // 2-12
      // Randomly swap so it's not always single digit first
      if (Math.random() > 0.5) {
        const temp = operandA;
        operandA = operandB;
        operandB = temp;
      }
      if (isDecimal) {
        // Decimal only in operandA
        operandA = Math.round(operandA * 1.5 * 10) / 10;
      }
      correctAnswer = operandA * operandB;
    } else {
      // Division
      const divisor = EASY_DIV_DIVISORS[getRandomInt(0, EASY_DIV_DIVISORS.length - 1)];
      const quotient = getRandomInt(EASY_DIV_MIN_RESULT, EASY_DIV_MAX_RESULT);
      if (isDecimal) {
        // Generate decimal results and round to 2 decimals
        operandB = divisor;
        operandA = getRandomFloat1Dec(10, 49);
        correctAnswer = Math.round((operandA / operandB) * 100) / 100;
      } else {
        operandA = divisor * quotient;
        operandB = divisor;
        correctAnswer = quotient;
      }
    }
  }

  // Medium Difficulty
  else if (difficulty === 'medium') {
    if (operation === 'addition') {
      if (isDecimal) {
        operandA = getRandomFloat1Dec(MEDIUM_ADD_MIN_A, MEDIUM_ADD_MAX_A);
        operandB = getRandomFloat1Dec(MEDIUM_ADD_MIN_B, MEDIUM_ADD_MAX_B);
      } else {
        operandA = getRandomInt(MEDIUM_ADD_MIN_A, MEDIUM_ADD_MAX_A);
        operandB = getRandomInt(MEDIUM_ADD_MIN_B, MEDIUM_ADD_MAX_B);
      }
      correctAnswer = operandA + operandB;
    } else if (operation === 'subtraction') {
      if (isDecimal) {
        operandA = getRandomFloat1Dec(MEDIUM_SUB_MIN_A, MEDIUM_SUB_MAX_A);
        operandB = getRandomFloat1Dec(MEDIUM_ADD_MIN_B, operandA);
      } else {
        operandA = getRandomInt(MEDIUM_SUB_MIN_A, MEDIUM_SUB_MAX_A);
        operandB = getRandomInt(MEDIUM_ADD_MIN_B, operandA);
      }
      correctAnswer = operandA - operandB;
    } else if (operation === 'multiplication') {
      if (isDecimal) {
        operandA = getRandomFloat1Dec(MEDIUM_MULT_MIN, MEDIUM_MULT_MAX);
        operandB = getRandomFloat1Dec(MEDIUM_MULT_MIN, MEDIUM_MULT_MAX);
      } else {
        operandA = getRandomInt(MEDIUM_MULT_MIN, MEDIUM_MULT_MAX);
        operandB = getRandomInt(MEDIUM_MULT_MIN, MEDIUM_MULT_MAX);
      }
      correctAnswer = operandA * operandB;
    } else {
      // Division
      const divisor = getRandomInt(MEDIUM_DIV_DIVISOR_MIN, MEDIUM_DIV_DIVISOR_MAX);
      const quotient = getRandomInt(MEDIUM_DIV_RESULT_MIN, MEDIUM_DIV_RESULT_MAX);
      if (isDecimal) {
        operandB = divisor;
        operandA = getRandomFloat1Dec(50, 199);
        correctAnswer = Math.round((operandA / operandB) * 100) / 100;
      } else {
        operandA = divisor * quotient;
        operandB = divisor;
        correctAnswer = quotient;
      }
    }
  }

  // Hard Difficulty
  else {
    if (operation === 'addition') {
      if (isDecimal) {
        operandA = getRandomFloat1Dec(HARD_ADD_MIN_A, HARD_ADD_MAX_A);
        operandB = getRandomFloat1Dec(HARD_ADD_MIN_B, HARD_ADD_MAX_B);
      } else {
        operandA = getRandomInt(HARD_ADD_MIN_A, HARD_ADD_MAX_A);
        operandB = getRandomInt(HARD_ADD_MIN_B, HARD_ADD_MAX_B);
      }
      correctAnswer = operandA + operandB;
    } else if (operation === 'subtraction') {
      if (isDecimal) {
        operandA = getRandomFloat1Dec(HARD_SUB_MIN_A, HARD_SUB_MAX_A);
        operandB = getRandomFloat1Dec(HARD_ADD_MIN_B, operandA);
      } else {
        operandA = getRandomInt(HARD_SUB_MIN_A, HARD_SUB_MAX_A);
        operandB = getRandomInt(HARD_ADD_MIN_B, operandA);
      }
      correctAnswer = operandA - operandB;
    } else if (operation === 'multiplication') {
      if (isDecimal) {
        operandA = getRandomFloat1Dec(HARD_MULT_MIN, HARD_MULT_MAX);
        operandB = getRandomFloat1Dec(HARD_MULT_MIN, HARD_MULT_MAX);
      } else {
        operandA = getRandomInt(HARD_MULT_MIN, HARD_MULT_MAX);
        operandB = getRandomInt(HARD_MULT_MIN, HARD_MULT_MAX);
      }
      correctAnswer = operandA * operandB;
    } else {
      // Division
      const divisor = getRandomInt(HARD_DIV_DIVISOR_MIN, HARD_DIV_DIVISOR_MAX);
      const quotient = getRandomInt(HARD_DIV_RESULT_MIN, HARD_DIV_RESULT_MAX);
      if (isDecimal) {
        operandB = divisor;
        operandA = getRandomFloat1Dec(200, 999);
        correctAnswer = Math.round((operandA / operandB) * 100) / 100;
      } else {
        operandA = divisor * quotient;
        operandB = divisor;
        correctAnswer = quotient;
      }
    }
  }

  // Final rounding to fix JS float precision issues (like 7.5 + 3.2 = 10.700000000000001)
  if (isDecimal) {
    if (operation !== 'division') {
      operandA = Math.round(operandA * 10) / 10;
      operandB = Math.round(operandB * 10) / 10;
      correctAnswer = Math.round(computeAnswer(operandA, operandB, operation) * 10) / 10;
    } else {
      // division already handled
    }
  } else {
    operandA = Math.floor(operandA);
    operandB = Math.floor(operandB);
    correctAnswer = Math.floor(correctAnswer);
  }

  const id = `${operation}-${difficulty}-${operandA}-${operandB}-${Date.now()}-${getRandomInt(1000, 9999)}`;
  const displayExpression = getDisplayExpression(operandA, operandB, operation, language);

  const questionWithoutTip = {
    id,
    operandA,
    operandB,
    operation,
    correctAnswer,
    displayExpression
  };

  const quickTip = getQuickTip(questionWithoutTip, language);

  return {
    ...questionWithoutTip,
    quickTip
  };
}

// Pre-generates the session questions
export function generateSession(config: SessionConfig, language: 'id' | 'en' = 'id'): Question[] {
  const count = config.questionCount || 10;
  const questions: Question[] = [];
  for (let i = 0; i < count; i++) {
    questions.push(generateQuestion(config, language));
  }
  return questions;
}

// Security-sensitive verification (Re-compute result to prevent state injection)
export function verifyAnswer(question: Question, userAnswer: number): boolean {
  const recomputed = computeAnswer(question.operandA, question.operandB, question.operation);
  
  // Apply a tolerance of 0.01 for division (due to rounding to 2 decimal places)
  // And 0.001 for other operations to account for floats
  const tolerance = question.operation === 'division' ? 0.015 : 0.005;
  const recomputedRounded = question.operation === 'division' 
    ? Math.round(recomputed * 100) / 100 
    : recomputed;

  return Math.abs(recomputedRounded - userAnswer) <= tolerance;
}
