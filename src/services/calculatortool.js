// src/services/calculatortool.js

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
    default:
      return { error: "Phép toán không hợp lệ" };
  }
};

export const calculatorSchema = {
  type: "function",
  function: {
    name: "calculator",
    description: "Thực hiện phép tính toán học cơ bản (cộng, trừ, nhân, chia). Dùng tool này khi cần tính toán số học chính xác.",
    parameters: {
      type: "object",
      properties: {
        operation: {
          type: "string",
          enum: ["add", "subtract", "multiply", "divide"],
          description: "Phép toán cần thực hiện."
        },
        a: { type: "number", description: "Số hạng thứ nhất (toán hạng trái)." },
        b: { type: "number", description: "Số hạng thứ hai (toán hạng phải)." }
      },
      required: ["operation", "a", "b"]
    }
  }
};
