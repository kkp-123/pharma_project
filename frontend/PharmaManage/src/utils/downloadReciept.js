import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const downloadReceipt = (sale) => {

  const doc = new jsPDF();



doc.setFontSize(20);
doc.setTextColor(79, 70, 229); 

doc.text("PharmaSys", 14, 18);


// Company Details

doc.setTextColor(0, 0, 0);

doc.setFontSize(10);

doc.text(
  "PharmaSys Pvt Ltd",
  14,
  25
);

doc.text(
  "Naroda, GIDC, Ahmedabad",
  14,
  30
);

doc.text(
  "Phone : +91 9999999999",
  14,
  35
);

doc.text(
  "Email : info@pharmasys.com",
  14,
  40
);



// Right Side ni  information chhe



  // Divider

  doc.line(14, 40, 196, 40);


  //Receipt Title

  doc.setFontSize(14);

  doc.text(
    "Sales Receipt",
    14,
    50
  );

doc.setFontSize(11);

  doc.text(
    `Receipt ID : ${sale._id}`,
    14,
    55
  );


  //Customer Info

  doc.setFontSize(11);

  doc.text(
    `Customer : ${sale.customerName}`,
    14,
    60
  );

  doc.text(
    `Company : ${sale.companyName || "-"}`,
    14,
    67
  );

  doc.text(
    `Phone : ${sale.phone || "-"}`,
    14,
    74
  );

  doc.text(
    `Date : ${new Date(
      sale.createdAt
    ).toLocaleDateString()}`,
    140,
    60
  );

  doc.text(
    `Status : ${sale.status}`,
    140,
    67
  );


  const rows = [];

  sale.items?.forEach(item => {
    if (item.batchAllocations && item.batchAllocations.length > 0) {
      item.batchAllocations.forEach(batch => {
        rows.push([
          item.product?.name || "Product",
          batch.batch?.batchNumber || (typeof batch.batch === "string" ? batch.batch : "-"),
          batch.batch?.manufactureDate
            ? new Date(batch.batch.manufactureDate).toLocaleDateString()
            : "-",
          batch.batch?.expiryDate
            ? new Date(batch.batch.expiryDate).toLocaleDateString()
            : "-",
          batch.quantity,
          `₹${item.price || 0}`,
          `₹${(batch.quantity || 0) * (item.price || 0)}`
        ]);
      });
    } else {
      rows.push([
        item.product?.name || "Product",
        "Pending Stock Allocation",
        "-",
        "-",
        item.quantity,
        `₹${item.price || 0}`,
        `₹${item.total || (item.quantity * item.price)}`
      ]);
    }
  });


  autoTable(doc, {

    startY: 85,

    head: [[
      "Product",
      "Batch",
      "MFG",
      "EXP",
      "Qty",
      "Price",
      "Total"
    ]],

    body: rows

  });


  //Payment History

  autoTable(doc, {

    startY: doc.lastAutoTable.finalY + 10,

    head: [
      [
        "Date",
        "Amount",
        "Method",
        "Note"
      ]
    ],

    body: sale.payments?.map(p => [

      new Date(p.date)
        .toLocaleDateString(),

      `${p.amount}`,

      p.method,

      p.note || "-"

    ])

  });


  //Totals

  const y =
    doc.lastAutoTable.finalY + 15;

  doc.setFontSize(12);

  doc.text(
    `Total : ${sale.totalAmount}`,
    14,
    y
  );

  doc.text(
    `Paid :  ${sale.paidAmount || 0}`,
    14,
    y + 8
  );

  doc.text(
    `Pending :  ${sale.dueAmount || 0}`,
    14,
    y + 16
  );


  //Footer

  doc.setFontSize(10);

  doc.text(
    "Thank you for your business",
    14,
    y + 30
  );

  doc.text(
    "Authorized Signature",
    140,
    y + 30
  );


  doc.save(
    `Receipt_${sale.customerName}_${new Date().toLocaleDateString()}.pdf`
  );

};

export default downloadReceipt;