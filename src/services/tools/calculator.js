// src/services/tools/calculator.js

export const calculator = ({ operation, a, b, decimals, numbers }) => {
  // Validate inputs
  if (operation === 'average') {
    if (!Array.isArray(numbers) || numbers.length === 0) {
      return { error: "Tham số 'numbers' phải là mảng khác rỗng" };
    }
    const valid = numbers.filter(n => !Number.isNaN(Number(n)));
    if (valid.length === 0) return { error: "Mảng 'numbers' không chứa số hợp lệ" };
    const sum = valid.reduce((acc, n) => acc + Number(n), 0);
    return { result: sum / valid.length };
  }

  if (operation === 'percentage') {
    const numA = Number(a);
    const numB = Number(b);
    if (Number.isNaN(numA) || Number.isNaN(numB)) {
      return { error: "Tham số 'a' và 'b' phải là số hợp lệ" };
    }
    return { result: (numA / 100) * numB };
  }

  if (operation === 'gcd' || operation === 'lcm') {
    const intA = Math.trunc(Number(a));
    const intB = Math.trunc(Number(b));
    if (Number.isNaN(intA) || Number.isNaN(intB)) {
      return { error: "Tham số 'a' và 'b' phải là số hợp lệ" };
    }
    const absA = Math.abs(intA);
    const absB = Math.abs(intB);

    const gcd = (x, y) => {
      while (y !== 0) {
        [x, y] = [y, x % y];
      }
      return x;
    };

    if (operation === 'gcd') {
      return { result: absA === 0 && absB === 0 ? 0 : gcd(absA, absB) };
    }
    // lcm
    const product = absA === 0 || absB === 0 ? 0 : (absA * absB) / gcd(absA, absB);
    return { result: product };
  }

  if (operation === 'min' || operation === 'max') {
    const numA = Number(a);
    const numB = Number(b);
    if (Number.isNaN(numA) || Number.isNaN(numB)) {
      return { error: "Tham số 'a' và 'b' phải là số hợp lệ" };
    }
    return { result: operation === 'min' ? Math.min(numA, numB) : Math.max(numA, numB) };
  }

  if (operation === 'sqrtN') {
    const numA = Number(a);
    const numB = Number(b);
    if (numA < 0) return { error: "Không thể căn bậc N của số âm" };
    if (numB === 0) return { error: "Bậc căn không thể bằng 0" };
    return { result: Math.pow(numA, 1 / numB) };
  }

  // Helper: round to decimals
  const roundTo = (value, dec) => {
    const d = typeof dec === 'number' && !Number.isNaN(dec) ? dec : 0;
    const factor = Math.pow(10, d);
    return Math.round(value * factor) / factor;
  };

  // Binary operations with NaN guard
  const numA = Number(a);
  const numB = Number(b);

  if (Number.isNaN(numA) || Number.isNaN(numB)) {
    return { error: "Tham số 'a' hoặc 'b' không phải số hợp lệ" };
  }

  switch (operation) {
    case 'add':
      return { result: numA + numB };
    case 'subtract':
      return { result: numA - numB };
    case 'multiply':
      return { result: numA * numB };
    case 'divide':
      if (numB === 0) return { error: "Không thể chia cho 0" };
      return { result: roundTo(numA / numB, decimals) };
    case 'power':
      return { result: Math.pow(numA, numB) };
    case 'mod':
    case 'modulo':
      return { result: numA % numB };
    case 'sqrt':
      if (numA < 0) return { error: "Không thể căn bậc hai số âm" };
      return { result: roundTo(Math.sqrt(numA), decimals) };
    case 'abs':
      return { result: Math.abs(numA) };
    case 'floor':
      return { result: Math.floor(numA) };
    case 'ceil':
      return { result: Math.ceil(numA) };
    case 'round':
      return { result: roundTo(numA, decimals) };
    case 'log':
      if (numA <= 0) return { error: "Đối số phải > 0" };
      return { result: Math.log(numA) };
    case 'exp':
      return { result: Math.exp(numA) };
    case 'sin':
      return { result: roundTo(Math.sin(numA), decimals) };
    case 'cos':
      return { result: roundTo(Math.cos(numA), decimals) };
    case 'tan':
      return { result: roundTo(Math.tan(numA), decimals) };
    case 'square':
      return { result: numA * numA };
    case 'cube':
      return { result: numA * numA * numA };
    case 'factorial': {
      const n = Math.trunc(numA);
      if (n < 0) return { error: "Giai thừa chỉ áp dụng cho số nguyên không âm" };
      if (n > 170) return { error: "Giai thừa quá lớn (n > 170)" };
      let result = 1;
      for (let i = 2; i <= n; i++) result *= i;
      return { result };
    }
    default:
      return { error: "Phép toán không hợp lệ" };
  }
};

export const calculatorSchema = {
  type: "function",
  function: {
    name: "calculator",
    description: "Thực hiện các phép tính toán học (cộng, trừ, nhân, chia, lũy thừa, căn bậc hai/N, lượng giác, logarit, làm tròn, trung bình, phần trăm, GCD/LCM...). Dùng tool này khi cần tính toán số học chính xác.",
    parameters: {
      type: "object",
      properties: {
        operation: {
          type: "string",
          enum: [
            "add", "subtract", "multiply", "divide",
            "power", "mod", "modulo", "sqrt", "sqrtN",
            "abs", "floor", "ceil", "round",
            "log", "exp",
            "sin", "cos", "tan",
            "square", "cube", "factorial",
            "percentage", "average",
            "min", "max", "gcd", "lcm"
          ],
          description: "Phép toán cần thực hiện."
        },
        a: { type: "number", description: "Tham số thứ nhất (toán hạng trái)." },
        b: { type: "number", description: "Tham số thứ hai (toán hạng phải)." },
        decimals: {
          type: "integer",
          minimum: 0,
          maximum: 20,
          description: "Số chữ số thập phân làm tròn kết quả (áp dụng cho divide, sqrt, round, sin, cos, tan). Mặc định: 0."
        },
        numbers: {
          type: "array",
          items: { type: "number" },
          minItems: 1,
          description: "Mảng số để tính trung bình (dùng với operation='average')."
        }
      },
      required: ["operation"]
    }
  }
};
