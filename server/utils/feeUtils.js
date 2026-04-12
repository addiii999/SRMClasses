/**
 * Predefined Fee Structure Based on Coaching Policy
 */
const FEE_STRUCTURE = {
  'Foundation': {
    '5': 6500,
    '6': 7500,
    '7': 8500,
    '8': 9500,
    '9': 12000,
    '10': 14400
  },
  'Advance': {
    '5': 7500,
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
    '6': 15000,
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
  const satAmount = Math.round(actualFee * (satDiscountPercent / 100));
  const afterSat = actualFee - satAmount;

  // 2. Installment Discount Logic
  // 1 Installment -> 10% discount
  // 2 Installments -> 5% discount
  // Others -> 0% discount
  let planDiscountPercent = 0;
  if (installmentPlan === 1) planDiscountPercent = 10;
  else if (installmentPlan === 2) planDiscountPercent = 5;

  const instAmount = Math.round(afterSat * (planDiscountPercent / 100));
  
  // 3. Final Calculation including conditional ₹500 Admission Fee
  const admissionFee = user.registrationFeeApplicable !== false ? 500 : 0;
  const finalPayable = (afterSat - instAmount) + admissionFee;

  // 4. Payment Status Logic
  const paidAmount = payments ? payments.reduce((sum, p) => sum + p.amount, 0) : 0;
  const remainingAmount = Math.max(0, finalPayable - paidAmount);

  let status = 'Pending';
  if (paidAmount >= finalPayable && finalPayable > 0) status = 'Paid';
  else if (paidAmount > 0) status = 'Partial';

  // 5. Installment Breakdown Logic
  const installmentAmount = Math.round(finalPayable / (installmentPlan || 1));
  let tempPaid = paidAmount;
  const installments = Array.from({ length: installmentPlan || 1 }, (_, i) => {
    let instStatus = 'Pending';
    if (tempPaid >= installmentAmount) {
      instStatus = 'Paid';
      tempPaid -= installmentAmount;
    } else if (tempPaid > 0) {
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
    registrationFeeApplicable: user.registrationFeeApplicable !== false,
    admissionFee,
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

