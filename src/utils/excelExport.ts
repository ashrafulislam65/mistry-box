import ExcelJS from "exceljs";

interface OrderRow {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  quantity: number;
  totalPrice: any;
  status: string;
  source: string | null;
  note: string | null;
  createdAt: Date;
  package: { name: string; price: any; category: { name: string } };
}

export async function generateOrdersExcel(orders: OrderRow[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Mistry Box Admin";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Orders");

  sheet.columns = [
    { header: "Order ID", key: "id", width: 38 },
    { header: "Date/Time", key: "createdAt", width: 20 },
    { header: "Customer Name", key: "customerName", width: 22 },
    { header: "Phone", key: "phone", width: 16 },
    { header: "Address", key: "address", width: 35 },
    { header: "Category", key: "category", width: 20 },
    { header: "Package", key: "package", width: 25 },
    { header: "Unit Price", key: "unitPrice", width: 12 },
    { header: "Quantity", key: "quantity", width: 10 },
    { header: "Total Price", key: "totalPrice", width: 12 },
    { header: "Status", key: "status", width: 14 },
    { header: "Source", key: "source", width: 12 },
    { header: "Note", key: "note", width: 25 },
  ];

  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFEFEF" } };

  orders.forEach((order) => {
    sheet.addRow({
      id: order.id,
      createdAt: order.createdAt.toLocaleString("en-BD", { timeZone: "Asia/Dhaka" }),
      customerName: order.customerName,
      phone: order.phone,
      address: order.address,
      category: order.package.category.name,
      package: order.package.name,
      unitPrice: Number(order.package.price),
      quantity: order.quantity,
      totalPrice: Number(order.totalPrice),
      status: order.status,
      source: order.source || "-",
      note: order.note || "-",
    });
  });

  const totalRowIndex = orders.length + 2;
  sheet.getCell(`I${totalRowIndex}`).value = "Grand Total:";
  sheet.getCell(`I${totalRowIndex}`).font = { bold: true };
  sheet.getCell(`J${totalRowIndex}`).value = orders.reduce((sum, o) => sum + Number(o.totalPrice), 0);
  sheet.getCell(`J${totalRowIndex}`).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer as ArrayBuffer);
}