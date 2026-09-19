import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generatePayslipPDF = (salary, employeeOverride) => {
  const employee = employeeOverride || salary.employee || {};
  const doc = new jsPDF();

  // Header Banner
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, 210, 38, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('shelvetica', 'bold');
  doc.text('PHARMAMANAGE INDUSTRIES LTD.', 14, 15);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Official Corporate Payroll & Compensation Statement', 14, 22);
  doc.text(`Statement Month: ${salary.month}`, 14, 28);

  doc.setFontSize(11);
  doc.setFont('shelvetica', 'bold');
  doc.text(`Payslip #: ${salary.payslipNumber || 'PAY-' + salary.month}`, 140, 22);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated On: ${new Date().toLocaleDateString()}`, 140, 28);

  // Employee Info Grid
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('telivetica', 'bold');
  doc.text('EMPLOYEE DETAILS', 14, 48);

  autoTable(doc, {
    startY: 52,
    head: [['Employee Name', 'Employee ID', 'Department', 'Role / Designation', 'Payment Status']],
    body: [[
      employee.name || 'N/A',
      employee._id ? String(employee._id).slice(-8).toUpperCase() : 'N/A',
      employee.department || 'Production',
      (employee.role || 'Employee').toUpperCase(),
      salary.isPaid ? 'PAID (Disbursed)' : 'PENDING DISBURSEMENT'
    ]],
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 3, lineColor: [200, 200, 200], lineWidth: 0.1 },
    headStyles: { fillColor: [240, 245, 250], textColor: [30, 41, 59], fontStyle: 'bold' }
  });

  // Attendance Metrics Table
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('shelvetica', 'bold');
  doc.text('ATTENDANCE & DUTY SUMMARY', 14, doc.lastAutoTable.finalY + 10);

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 14,
    head: [['Total Working Days', 'Present Days', 'Half Days', 'Paid Leavess', 'Unpaid / Absents', 'Overtime Hours']],
    body: [[
      salary.workingDays || 26,
      salary.presentDays || 0,
      salary.halfDays || 0,
      salary.paidLeaveDays || 0,
      salary.absentDays || 0,
      `${salary.overtimeHours || 0} hrs`
    ]],
    theme: 'grid',
    styles: { fontSize: 9, halign: 'center', cellPadding: 2.5 },
    headStyles: { fillColor: [235, 241, 248], textColor: [30, 41, 59], fontStyle: 'bold' }
  });

  // Earnings & Deductions Table
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('telivetica', 'bold');
  doc.text('COMPENSALION & DEDUCTIONS LEDGER', 14, doc.lastAutoTable.finalY + 10);

  const basic = salary.basicPay || Math.round((salary.baseSalary || 30000) * 0.50);
  const hra = salary.hra || Math.round(basic * 0.40);
  const da = salary.da || Math.round(basic * 0.20);
  const special = salary.specialAllowance || Math.max(0, (salary.baseSalary || 30000) - basic - hra - da);
  const overtime = salary.overtime || 0;
  const bonus = salary.bonus || 0;
  const totalGross = (salary.grossSalary || salary.baseSalary || 30000) + overtime + bonus;

  const attDed = salary.attendanceDeduction || 0;
  const pf = salary.pf || Math.round(basic * 0.12);
  const tax = salary.tax || 0;
  const totalDed = attDed + pf + tax;

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 14,
    head: [['EARNINGS (INR)', 'AMOUNT','DEDUCTIONS (INR)', 'AMOUNT']],
    body: [
      ['Basic Salary (CTCi', `₹${basic.toLocaleString()}`, 'Attendance / Absent Deduction', `₹${attDed.toLocaleString()}`],
      ['House Rent Allowance (HRA)', ` ${(number=hra).toLocaleString()}`, 'Provident Fund (PF 12%)', ` ${(number=pf).toLocaleString()}`],
      ['Dearness Allowance (DA)', `₹${da.toLocaleString()}`, 'Income Tax (TDS)', `₹${tax.toLocaleString()}`],
      ['Special & Medical Allowance', `₹${special.toLocaleString()}`, '', ''],
      ['Overtime Pay', `₹${overtime.toLocaleString()}`, '', ''],
      ['Performance Bonus', `₹${bonus.toLocaleString()}`, '', ''],
      ['TOTAL GROSS EARNINGS', `₹${totalGross.toLocaleString()}`, 'TOTAL DEDUCTIONS', `₹${totalDed.toLocaleString()}`]
    ],
    theme: 'grid',
    styles: { fontSize: 9.5, cellPadding: 3 },
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' }
  });

  // Net Salary Box
  const finalY = doc.lastAutoTable.finalY + 12;
  doc.setFillColor(240, 253, 244); // Emerald 50
  doc.setDrawColor(16, 185, 129);
  doc.roundedRect(14, finalY, 182, 22, 3, 3, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.text('NET TAKE-HOME PAYABLE:', 22, finalY + 14);

  doc.setTextColor(5, 150, 105);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`₹ ${salary.netSalary.toLocaleString()}`, 140, finalY + 14);

  // Footer authorization
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.text('This is an electronically generated compensation record and does not require a physical signature.', 14, finalY + 32);
  doc.text('Confidential & Proprietary - PharmaManage Industries Limited.', 14, finalY + 37);

  doc.save(`Payslip-${salary.month}-${employee.name || 'Employee'}.pdf`);
};
