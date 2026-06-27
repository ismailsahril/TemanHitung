import { Question, SessionConfig, Operation } from '../types';

// Constants for number generation to avoid magic numbers
// --- EASY (1-digit: 1 to 9) ---
const EASY_MIN = 1;
const EASY_MAX = 9;

// --- MEDIUM (2-digits: 10 to 99) ---
const MEDIUM_MIN = 10;
const MEDIUM_MAX = 99;

// --- HARD (3-digits: 100 to 999) ---
const HARD_MIN = 100;
const HARD_MAX = 999;

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
        ? `Split numbers before & after decimal: ${Math.floor(operandA)} + ${Math.floor(operandB)} = ${Math.floor(operandA) + Math.floor(operandB)}, then add ${Math.round((operandA % 1) * 10) / 10} + ${Math.round((operandB % 1) * 10) / 10} = ${Math.round(((operandA % 1) + (operandB % 1)) * 10) / 10}. Combine both parts!`
        : `Pisahkan angka sebelum & sesudah koma: ${Math.floor(operandA)} + ${Math.floor(operandB)} = ${Math.floor(operandA) + Math.floor(operandB)}, lalu ${Math.round((operandA % 1) * 10) / 10} + ${Math.round((operandB % 1) * 10) / 10} = ${Math.round(((operandA % 1) + (operandB % 1)) * 10) / 10}. Gabungkan keduanya!`;
    }
    if (operation === 'subtraction') {
      return isEn
        ? `Subtract the integer parts first: ${Math.floor(operandA)} - ${Math.floor(operandB)} = ${Math.floor(operandA) - Math.floor(operandB)}, then handle the decimal part of ${formatNumber(operandA, 'en')} minus ${formatNumber(operandB, 'en')}.`
        : `Kurangi bagian bulat lebih dulu: ${Math.floor(operandA)} - ${Math.floor(operandB)} = ${Math.floor(operandA) - Math.floor(operandB)}, lalu sesuaikan desimalnya antara ${formatNumber(operandA, 'id')} dan ${formatNumber(operandB, 'id')}.`;
    }
    if (operation === 'multiplication') {
      const scaleA = operandA * 10;
      const scaleB = operandB * 10;
      return isEn
        ? `Ignore decimals temporarily: Multiply ${Math.round(scaleA)} × ${Math.round(scaleB)} = ${Math.round(scaleA * scaleB)}, then divide by 100 because there are two decimal places.`
        : `Abaikan koma sementara: Kalikan ${Math.round(scaleA)} × ${Math.round(scaleB)} = ${Math.round(scaleA * scaleB)}, lalu bagi dengan 100 karena ada dua desimal.`;
    }
    if (operation === 'division') {
      const scaleA = operandA * 10;
      const scaleB = operandB * 10;
      return isEn
        ? `Multiply both numbers by 10 to make them integers: ${Math.round(scaleA)} ÷ ${Math.round(scaleB)} — then calculate!`
        : `Kalikan kedua angka dengan 10 agar bulat: ${Math.round(scaleA)} ÷ ${Math.round(scaleB)} — lalu hitung hasilnya!`;
    }
  }

  // Integer mode strategies
  if (operation === 'addition') {
    // Rounding strategy (e.g. operandB close to 10, 20, 50, 100)
    const nextTenB = Math.ceil(operandB / 10) * 10;
    const diffB = nextTenB - operandB;
    if (diffB <= 2 && operandB > 5) {
      return isEn
        ? `Round ${operandB} up to ${nextTenB}: ${operandA} + ${nextTenB} = ${operandA + nextTenB}, then subtract ${diffB}.`
        : `Bulatkan ${operandB} ke ${nextTenB}: ${operandA} + ${nextTenB} = ${operandA + nextTenB}, lalu kurangi ${diffB}.`;
    }
    const nextTenA = Math.ceil(operandA / 10) * 10;
    const diffA = nextTenA - operandA;
    if (diffA <= 2 && operandA > 5) {
      return isEn
        ? `Round ${operandA} up to ${nextTenA}: ${nextTenA} + ${operandB} = ${nextTenA + operandB}, then subtract ${diffA}.`
        : `Bulatkan ${operandA} ke ${nextTenA}: ${nextTenA} + ${operandB} = ${nextTenA + operandB}, lalu kurangi ${diffA}.`;
    }
    // General strategy: split by tens & ones
    const tensA = Math.floor(operandA / 10) * 10;
    const onesA = operandA % 10;
    const tensB = Math.floor(operandB / 10) * 10;
    const onesB = operandB % 10;
    if (tensA > 0 && tensB > 0) {
      return isEn
        ? `Add tens: ${tensA} + ${tensB} = ${tensA + tensB}. Add ones: ${onesA} + ${onesB} = ${onesA + onesB}. Now combine both!`
        : `Jumlahkan puluhan: ${tensA} + ${tensB} = ${tensA + tensB}. Jumlahkan satuan: ${onesA} + ${onesB} = ${onesA + onesB}. Gabungkan keduanya!`;
    }
    return isEn
      ? `Add step by step: start with ${operandA}, then count up ${operandB} more.`
      : `Tambahkan bertahap: mulai dari ${operandA}, lalu hitung ${operandB} langkah ke atas.`;
  }

  if (operation === 'subtraction') {
    // Rounding strategy for subtrahend (operandB)
    const nextTenB = Math.ceil(operandB / 10) * 10;
    const diffB = nextTenB - operandB;
    if (diffB <= 2 && operandB > 5) {
      return isEn
        ? `Round subtrahend up: Subtract ${operandA} − ${nextTenB} = ${operandA - nextTenB}, then add back the difference of ${diffB}.`
        : `Bulatkan pengurang ke atas: Kurangi ${operandA} − ${nextTenB} = ${operandA - nextTenB}, lalu tambahkan kembali selisih ${diffB}.`;
    }
    // Split by place values
    const tensA = Math.floor(operandA / 10) * 10;
    const onesA = operandA % 10;
    const tensB = Math.floor(operandB / 10) * 10;
    const onesB = operandB % 10;
    if (tensA > 0 && tensB > 0 && onesA >= onesB) {
      return isEn
        ? `Subtract tens: ${tensA} − ${tensB} = ${tensA - tensB}. Subtract ones: ${onesA} − ${onesB} = ${onesA - onesB}. Now combine both!`
        : `Kurangi puluhan: ${tensA} − ${tensB} = ${tensA - tensB}. Kurangi satuan: ${onesA} − ${onesB} = ${onesA - onesB}. Jumlahkan hasilnya!`;
    }
    return isEn
      ? `Subtract in stages: ${operandA} - ${tensB} = ${operandA - tensB}, then subtract ${onesB} more.`
      : `Kurangi bertahap: ${operandA} - ${tensB} = ${operandA - tensB}, lalu kurangi ${onesB} lagi.`;
  }

  if (operation === 'multiplication') {
    // Multiply by 5
    if (operandB === 5) {
      return isEn
        ? `Multiply by 5 trick: Multiply ${operandA} × 10 = ${operandA * 10}, then divide by 2.`
        : `Trik perkalian 5: Kalikan ${operandA} × 10 = ${operandA * 10}, lalu bagi 2.`;
    }
    if (operandA === 5) {
      return isEn
        ? `Multiply by 5 trick: Multiply ${operandB} × 10 = ${operandB * 10}, then divide by 2.`
        : `Trik perkalian 5: Kalikan ${operandB} × 10 = ${operandB * 10}, lalu bagi 2.`;
    }
    // Multiply by 9
    if (operandB === 9) {
      return isEn
        ? `Multiply by 9 trick: Multiply ${operandA} × 10 = ${operandA * 10}, then subtract ${operandA}.`
        : `Trik perkalian 9: Kalikan ${operandA} × 10 = ${operandA * 10}, lalu kurangi ${operandA}.`;
    }
    if (operandA === 9) {
      return isEn
        ? `Multiply by 9 trick: Multiply ${operandB} × 10 = ${operandB * 10}, then subtract ${operandB}.`
        : `Trik perkalian 9: Kalikan ${operandB} × 10 = ${operandB * 10}, lalu kurangi ${operandB}.`;
    }
    // Multiply by 11 (two digits)
    if (operandB === 11 && operandA >= 10 && operandA <= 99) {
      const first = Math.floor(operandA / 10);
      const second = operandA % 10;
      const sum = first + second;
      if (sum < 10) {
        return isEn
          ? `Multiply by 11 trick: Insert the sum of digits (${first} + ${second} = ${sum}) between ${first} and ${second}.`
          : `Trik angka 11: Sisipkan penjumlahan digit (${first} + ${second} = ${sum}) di antara angka ${first} dan ${second}.`;
      } else {
        return isEn
          ? `Multiply by 11 trick: Add ${first} + ${second} = ${sum}. Add 1 to ${first} (making it ${first + 1}), then place ${sum % 10} in the middle.`
          : `Trik angka 11: Jumlahkan ${first} + ${second} = ${sum}. Jadikan ${first + 1} dan letakkan ${sum % 10} di tengah.`;
      }
    }
    // General doubling/splitting
    if (operandB % 2 === 0 && operandB <= 10) {
      const halfB = operandB / 2;
      return isEn
        ? `Use doubling: Multiply ${operandA} × ${halfB} = ${operandA * halfB}, then double it.`
        : `Gunakan kelipatan dua: Kalikan ${operandA} × ${halfB} = ${operandA * halfB}, lalu kalikan dua.`;
    }
    // Standard splitting
    const tensB = Math.floor(operandB / 10) * 10;
    const onesB = operandB % 10;
    if (tensB > 0) {
      return isEn
        ? `Split the multiplier: ${operandA} × ${tensB} = ${operandA * tensB}, and ${operandA} × ${onesB} = ${operandA * onesB}. Add them together!`
        : `Pecah pengali: ${operandA} × ${tensB} = ${operandA * tensB}, dan ${operandA} × ${onesB} = ${operandA * onesB}. Jumlahkan keduanya!`;
    }
    return isEn
      ? `Calculate ${operandA} × ${operandB} step by step using repeated addition or splitting.`
      : `Hitung ${operandA} × ${operandB} bertahap dengan penjumlahan berulang atau pemecahan angka.`;
  }

  if (operation === 'division') {
    // Divisor is 5
    if (operandB === 5) {
      return isEn
        ? `Divide by 5 trick: Multiply ${operandA} × 2 = ${operandA * 2}, then divide by 10 (shift decimal one place).`
        : `Trik pembagian 5: Kalikan ${operandA} × 2 = ${operandA * 2}, lalu bagi 10 (geser koma 1 digit).`;
    }
    // Derived fact: hint using inverse multiplication
    return isEn
      ? `Think of it as multiplication: What number times ${operandB} equals ${operandA}? (Hint: ${operandB} × ? = ${operandA})`
      : `Gunakan kebalikan perkalian: Berapa dikali ${operandB} sama dengan ${operandA}? (Petunjuk: ${operandB} × ? = ${operandA})`;
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

  // Easy Difficulty: max 1 digit (1 to 9)
  if (difficulty === 'easy') {
    if (operation === 'addition') {
      if (isDecimal) {
        operandA = getRandomFloat1Dec(EASY_MIN, EASY_MAX);
        operandB = getRandomInt(EASY_MIN, EASY_MAX); // Operand B integer per spec
      } else {
        operandA = getRandomInt(EASY_MIN, EASY_MAX);
        operandB = getRandomInt(EASY_MIN, EASY_MAX);
      }
      correctAnswer = operandA + operandB;
    } else if (operation === 'subtraction') {
      if (isDecimal) {
        operandA = getRandomFloat1Dec(EASY_MIN, EASY_MAX);
        operandB = getRandomInt(EASY_MIN, Math.floor(operandA)); // result >= 0
      } else {
        operandA = getRandomInt(EASY_MIN, EASY_MAX);
        operandB = getRandomInt(EASY_MIN, operandA); // result >= 0
      }
      correctAnswer = operandA - operandB;
    } else if (operation === 'multiplication') {
      // Multiplication up to 1-digit x 1-digit
      operandA = getRandomInt(EASY_MIN, EASY_MAX);
      operandB = getRandomInt(EASY_MIN, EASY_MAX);
      if (isDecimal) {
        // Generate decimal for one operand to stay within easy difficulty
        operandA = getRandomFloat1Dec(EASY_MIN, EASY_MAX);
      }
      correctAnswer = operandA * operandB;
    } else {
      // Division: 1-digit divisor and 1-digit quotient
      const divisor = getRandomInt(2, EASY_MAX); // Avoid dividing by 1
      const quotient = getRandomInt(2, EASY_MAX);
      if (isDecimal) {
        operandB = divisor;
        operandA = getRandomFloat1Dec(EASY_MIN, EASY_MAX);
        correctAnswer = Math.round((operandA / operandB) * 100) / 100;
      } else {
        operandA = divisor * quotient;
        operandB = divisor;
        correctAnswer = quotient;
      }
    }
  }

  // Medium Difficulty: max 2 digits (10 to 99)
  else if (difficulty === 'medium') {
    if (operation === 'addition') {
      if (isDecimal) {
        operandA = getRandomFloat1Dec(MEDIUM_MIN, MEDIUM_MAX);
        operandB = getRandomFloat1Dec(MEDIUM_MIN, MEDIUM_MAX);
      } else {
        operandA = getRandomInt(MEDIUM_MIN, MEDIUM_MAX);
        operandB = getRandomInt(MEDIUM_MIN, MEDIUM_MAX);
      }
      correctAnswer = operandA + operandB;
    } else if (operation === 'subtraction') {
      if (isDecimal) {
        operandA = getRandomFloat1Dec(MEDIUM_MIN, MEDIUM_MAX);
        operandB = getRandomFloat1Dec(MEDIUM_MIN, operandA);
      } else {
        operandA = getRandomInt(MEDIUM_MIN, MEDIUM_MAX);
        operandB = getRandomInt(MEDIUM_MIN, operandA);
      }
      correctAnswer = operandA - operandB;
    } else if (operation === 'multiplication') {
      // 2-digit by 1-digit multiplication
      operandA = getRandomInt(MEDIUM_MIN, MEDIUM_MAX);
      operandB = getRandomInt(2, 9);
      if (Math.random() > 0.5) {
        const temp = operandA;
        operandA = operandB;
        operandB = temp;
      }
      if (isDecimal) {
        operandA = getRandomFloat1Dec(MEDIUM_MIN, MEDIUM_MAX);
        operandB = getRandomFloat1Dec(2, 9);
      }
      correctAnswer = operandA * operandB;
    } else {
      // Division: 1-digit divisor and 2-digit quotient
      const divisor = getRandomInt(2, 9);
      const quotient = getRandomInt(MEDIUM_MIN, MEDIUM_MAX);
      if (isDecimal) {
        operandB = divisor;
        operandA = getRandomFloat1Dec(MEDIUM_MIN, MEDIUM_MAX);
        correctAnswer = Math.round((operandA / operandB) * 100) / 100;
      } else {
        operandA = divisor * quotient;
        operandB = divisor;
        correctAnswer = quotient;
      }
    }
  }

  // Hard (Difficult) Difficulty: max 3 digits (100 to 999)
  else {
    if (operation === 'addition') {
      if (isDecimal) {
        operandA = getRandomFloat1Dec(HARD_MIN, HARD_MAX);
        operandB = getRandomFloat1Dec(HARD_MIN, HARD_MAX);
      } else {
        operandA = getRandomInt(HARD_MIN, HARD_MAX);
        operandB = getRandomInt(HARD_MIN, HARD_MAX);
      }
      correctAnswer = operandA + operandB;
    } else if (operation === 'subtraction') {
      if (isDecimal) {
        operandA = getRandomFloat1Dec(HARD_MIN, HARD_MAX);
        operandB = getRandomFloat1Dec(HARD_MIN, operandA);
      } else {
        operandA = getRandomInt(HARD_MIN, HARD_MAX);
        operandB = getRandomInt(HARD_MIN, operandA);
      }
      correctAnswer = operandA - operandB;
    } else if (operation === 'multiplication') {
      // 3-digit by 1-digit or 2-digit, or 2-digit by 2-digit
      operandA = getRandomInt(HARD_MIN, HARD_MAX);
      operandB = getRandomInt(2, 99);
      if (Math.random() > 0.5) {
        const temp = operandA;
        operandA = operandB;
        operandB = temp;
      }
      if (isDecimal) {
        operandA = getRandomFloat1Dec(HARD_MIN, HARD_MAX);
        operandB = getRandomFloat1Dec(2, 99);
      }
      correctAnswer = operandA * operandB;
    } else {
      // Division: 2-digit divisor and 2-digit quotient
      const divisor = getRandomInt(10, 99);
      const quotient = getRandomInt(10, 99);
      if (isDecimal) {
        operandB = divisor;
        operandA = getRandomFloat1Dec(HARD_MIN, HARD_MAX);
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

// Pre-generates the session questions ensuring uniqueness of questions where possible
export function generateSession(config: SessionConfig, language: 'id' | 'en' = 'id'): Question[] {
  const count = config.questionCount || 10;
  const questions: Question[] = [];
  
  for (let i = 0; i < count; i++) {
    let attempts = 0;
    let newQuestion: Question;
    let isDuplicate = false;
    
    do {
      newQuestion = generateQuestion(config, language);
      isDuplicate = questions.some(q => 
        q.operandA === newQuestion.operandA && 
        q.operandB === newQuestion.operandB && 
        q.operation === newQuestion.operation
      );
      attempts++;
    } while (isDuplicate && attempts < 100);
    
    questions.push(newQuestion);
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
