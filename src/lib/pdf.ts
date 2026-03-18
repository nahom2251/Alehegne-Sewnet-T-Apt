import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Apartment, Bill } from '../types';
import { formatCurrency } from './utils';

export const generateBillPDF = (apartment: Apartment, bill: Bill, type: 'pending' | 'paid') => {
  const doc = new jsPDF();
  const title = type === 'pending' ? 'Pending Bill' : 'Payment Receipt';
  const date = new Date().toLocaleDateString();

  // Header
  doc.setFontSize(22);
  doc.setTextColor(212, 175, 55); // Gold
  doc.text('Alehegne Sewnet Apartment (AS Apt.)', 105, 20, { align: 'center' });
  
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(title, 105, 30, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`Date: ${date}`, 190, 30, { align: 'right' });

  // Tenant Info
  doc.setFontSize(12);
  doc.text(`Tenant: ${apartment.tenantName}`, 20, 50);
  doc.text(`Apartment: ${apartment.number} (${apartment.floor} Floor - ${apartment.position})`, 20, 57);
  doc.text(`Phone: ${apartment.tenantPhone}`, 20, 64);

  // Bill Details
  const tableData = [
    ['Description', 'Details', 'Amount'],
    ['Monthly Rent', `${apartment.monthlyRent} ETB`, formatCurrency(apartment.monthlyRent)],
    ['Electricity', bill.kwh ? `${bill.kwh} kWh @ ${bill.rate} ETB` : 'N/A', formatCurrency(bill.type === 'electricity' ? bill.amount : 0)],
    ['Water', bill.type === 'water' ? 'Monthly Charge' : 'N/A', formatCurrency(bill.type === 'water' ? bill.amount : 0)],
    ['Total', '', formatCurrency(bill.amount)]
  ];

  (doc as any).autoTable({
    startY: 80,
    head: [tableData[0]],
    body: tableData.slice(1),
    theme: 'striped',
    headStyles: { fillColor: [212, 175, 55] },
  });

  // Footer
  const finalY = (doc as any).lastAutoTable.finalY + 20;
  doc.setFontSize(10);
  doc.text('Thank you for your payment!', 105, finalY, { align: 'center' });
  doc.text('Powered by NUN Tech', 105, finalY + 10, { align: 'center' });

  doc.save(`${apartment.number}_${bill.month}_${bill.year}_${type}.pdf`);
};
