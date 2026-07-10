// PRD 統一寫死的房貸試算參數：頭期款 20%、貸款 80%、還款年限 30 年
export const DOWN_PAYMENT_RATE = 0.2;
export const LOAN_RATE = 0.8;
export const LOAN_TERM_YEARS = 30;

// PRD 未指定利率，預設 2.2% 年利率，可由呼叫端覆寫
export const DEFAULT_ANNUAL_INTEREST_RATE = 0.022;

export interface MortgageQuote {
  totalPrice: number;
  downPayment: number;
  loanAmount: number;
  monthlyPayment: number;
}

/** 買家輸入房屋總價，回傳頭期款、貸款金額與本息平均攤還的每月還款額 */
export function calcMortgage(
  totalPrice: number,
  annualInterestRate: number = DEFAULT_ANNUAL_INTEREST_RATE,
): MortgageQuote {
  const downPayment = totalPrice * DOWN_PAYMENT_RATE;
  const loanAmount = totalPrice * LOAN_RATE;
  const months = LOAN_TERM_YEARS * 12;
  const monthlyRate = annualInterestRate / 12;

  const monthlyPayment =
    monthlyRate === 0
      ? loanAmount / months
      : (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));

  return {
    totalPrice,
    downPayment: Math.round(downPayment),
    loanAmount: Math.round(loanAmount),
    monthlyPayment: Math.round(monthlyPayment),
  };
}
