/**
 * Predefined Fee Structure Based on Coaching Policy
 */
const FEE_STRUCTURE = {
  'Foundation': {
    '6': 7500,
    '7': 8500,
    '8': 9500,
    '9': 12000,
    '10': 14400
  },
  'Advance': {
    '6': 10000,
    '7': 12000,
    '8': 15000,
    '9': 18000,
    '10': 20000
  },
  'Math-Science': {
    '9': 8400,
    '10': 9600
  },
  'ICSE-Advance': {
    '7': 18000,
    '8': 20000,
    '9': 22000,
    '10': 25000
  }
};

/**
 * Calculate detailed fee breakdown for a student
 * @param {Object} user - The student user document
 * @returns {Object} Fee details
 */
const calculateFeeDetails = (user) => {
  const { feeSnapshot, payments } = user;
  
  if (!feeSnapshot || !feeSnapshot.actualFee) {
    return {
      actualFee: 0,
      payableAmount: 0,
      paidAmount: 0,
      remainingAmount: 0,
      paymentStatus: 'Pending',
      installments: []
    };
  }

  const { actualFee, satPercentage, installmentPlan } = feeSnapshot;

  // 1. SAT Scholarship Logic: discount = satPercentage / 3 %
  const satDiscountPercent = (satPercentage || 0) / 3;
  const afterSat = actualFee - (actualFee * satDiscountPercent / 100);

  // 2. Installment Discount Logic
  // 1 Installment -> 10% extra discount
  // 2 Installments -> 5% extra discount
  // 3-6 Installments -> No discount
  let planDiscountPercent = 0;
  if (installmentPlan === 1) planDiscountPercent = 10;
  else if (installmentPlan === 2) planDiscountPercent = 5;

  const finalPayable = Math.round(afterSat * (1 - planDiscountPercent / 100));

  // 3. Payment Status Logic
  const paidAmount = payments ? payments.reduce((sum, p) => sum + p.amount, 0) : 0;
  const remainingAmount = Math.max(0, finalPayable - paidAmount);

  let status = 'Pending';
  if (paidAmount >= finalPayable && finalPayable > 0) status = 'Paid';
  else if (paidAmount > 0) status = 'Partial';

  // 4. Installment Breakdown Logic
  const installmentAmount = Math.round(finalPayable / (installmentPlan || 1));
  let tempPaid = paidAmount;
  const installments = Array.from({ length: installmentPlan || 1 }, (_, i) => {
    let instStatus = 'Pending';
    if (tempPaid >= installmentAmount) {
      instStatus = 'Paid';
      tempPaid -= installmentAmount;
    } else if (tempPaid > 0) {
      // For visual clarity, even if it's partially covered, we can say Pending or show partial.
      // The prompt says "Paid / Pending". We'll stick to full coverage = Paid.
      instStatus = 'Pending'; 
      tempPaid = 0;
    }
    return {
      number: i + 1,
      amount: installmentAmount,
      status: instStatus
    };
  });

  return {
    actualFee,
    satPercentage,
    installmentPlan,
    satDiscountPercent: satDiscountPercent.toFixed(2),
    planDiscountPercent,
    payableAmount: finalPayable,
    paidAmount,
    remainingAmount,
    paymentStatus: status,
    installments
  };
};

module.exports = {
  FEE_STRUCTURE,
  calculateFeeDetails
};
