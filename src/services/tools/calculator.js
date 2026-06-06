// src/services/tools/calculator.js

export const calculator = ({ operation, a, b }) => {
  const numA = Number(a);
  const numB = Number(b);

  switch (operation) {
    case 'add':
      return { result: numA + numB };
    case 'subtract':
      return { result: numA - numB };
    case 'multiply':
      return { result: numA * numB };
    case 'divide':
      if (numB === 0) return { error: "Không thể chia cho 0" };
      return { result: numA / numB };
    case 'power':
      return { result: Math.pow(numA, numB) };
    case 'mod':
      return { result: numA % numB };
    case 'sqrt':
      if (numA < 0) return { error: "Không thể căn bậc hai số âm" };
      return { result: Math.sqrt(numA) };
    case 'abs':
      return { result: Math.abs(numA) };
    case 'floor':
      return { result: Math.floor(numA) };
    case 'ceil':
      return { result: Math.ceil(numA) };
    case 'round':
      return { result: Math.round(numA) };
    case 'log':
      if (numA <= 0) return { error: "Đối số phải > 0" };
      return { result: Math.log(numA) };
    case 'exp':
      return { result: Math.exp(numA) };
    case 'sin':
      return { result: Math.sin(numA) };
    case 'cos':
      return { result: Math.cos(numA) };
    case 'tan':
      return { result: Math.tan(numA) };
    case 'square':
      return { result: numA * numA };
    case 'cube':
      return { result: numA * numA * numA };
    default:
      return { error: "Phép toán không hợp lệ" };
  }
};

export const calculatorSchema = {
  type: "function",
  function: {
    name: "calculator",
    description: "Thực hiện các phép tính toán học (cộng, trừ, nhân, chia, lũy thừa, căn bậc hai, lượng giác, logarit, làm tròn...). Dùng tool này khi cần tính toán số học chính xác.",
    parameters: {
      type: "object",
      properties: {
        operation: {
          type: "string",
          enum: [
            "add", "subtract", "multiply", "divide",
            "power", "mod", "sqrt", "abs",
            "floor", "ceil", "round",
            "log", "exp",
            "sin", "cos", "tan",
            "square", "cube"
          ],
          description: "Phép toán cần thực hiện."
        },
        a: { type: "number", description: "Số hạng thứ nhất (toán hạng trái)." },
        b: { type: "number", description: "Số hạng thứ hai (toán hạng phải)." }
      },
      required: ["operation", "a", "b"]
    }
  }
};
