import { jsPDF } from 'jspdf'
import { Order } from '@/types'

/**
 * Cleanly formats delivery destination address
 */
export function formatDeliveryAddress(order: Order): string {
  const addr = order.deliveryAddressSnapshot
  const parts = [
    addr.line1,
    addr.area,
    addr.landmark ? `Near ${addr.landmark}` : '',
    `${addr.city}, ${addr.state} - ${addr.pin}`,
  ].filter(Boolean)
  return parts.join(', ')
}

/**
 * Export single or multiple orders to CSV
 */
export function exportOrdersToCSV(orders: Order[], filename?: string): void {
  const headers = [
    'Order Number',
    'Date',
    'Customer Name',
    'Customer Phone',
    'Customer Email',
    'Recipient Name',
    'Delivery Phone',
    'Address Line 1',
    'Area',
    'Landmark',
    'City',
    'State',
    'Pincode',
    'Full Delivery Destination',
    'Delivery Instructions/Notes',
    'Payment Method',
    'Payment State',
    'Order Status',
    'Subtotal (INR)',
    'Shipping (INR)',
    'Total Amount (INR)',
    'Total Items Count',
    'Ordered Pantry Items (Summary)',
    'Item Details (SKU x Qty @ Price)',
  ]

  const rows = orders.map((order) => {
    const addr = order.deliveryAddressSnapshot
    const fullDest = formatDeliveryAddress(order)
    const itemsSummary = order.items
      .map((i) => `${i.productNameSnapshot} (Qty: ${i.quantity})`)
      .join('; ')
    const itemsDetailed = order.items
      .map((i) => `${i.productNameSnapshot} x${i.quantity} @ Rs.${i.priceSnapshot}`)
      .join(' | ')

    const values = [
      order.orderNumber,
      new Date(order.createdAt).toLocaleString('en-IN'),
      order.customerSnapshot.name || '',
      order.customerSnapshot.phone || '',
      order.customerSnapshot.email || '',
      addr.fullName || '',
      addr.phone || '',
      addr.line1 || '',
      addr.area || '',
      addr.landmark || '',
      addr.city || '',
      addr.state || '',
      addr.pin || '',
      fullDest,
      order.notes || '',
      order.paymentMethod.toUpperCase(),
      order.paymentState.toUpperCase(),
      order.orderStatus.toUpperCase(),
      order.subtotal,
      order.shipping,
      order.finalTotal,
      order.items.reduce((sum, item) => sum + item.quantity, 0),
      itemsSummary,
      itemsDetailed,
    ]

    return values
      .map((val) => {
        const str = String(val ?? '')
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return `"${str}"`
      })
      .join(',')
  })

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename || `orders_export_${Date.now()}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Generate A4 Full Invoice PDF (Official Vaishnava Mart Bill & Dispatch Receipt)
 */
export function generateOrderInvoicePDF(order: Order): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth() // 210mm
  const margin = 14
  const contentWidth = pageWidth - margin * 2
  let y = 14

  // Brand Header Bar (Burgundy)
  doc.setFillColor(107, 30, 39) // #6B1E27 Burgundy
  doc.rect(margin, y, contentWidth, 22, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('VAISHNAVA MART', margin + 6, y + 10)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.text('100% Pure Satvik Pantry & Temple Offerings', margin + 6, y + 16)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('TAX INVOICE / DISPATCH', pageWidth - margin - 6, y + 10, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, pageWidth - margin - 6, y + 16, { align: 'right' })

  y += 28

  // Two columns: Order Info & Destination
  const colWidth = (contentWidth - 6) / 2

  // Order Details Box
  doc.setDrawColor(220, 215, 205)
  doc.setFillColor(250, 248, 245)
  doc.roundedRect(margin, y, colWidth, 42, 2, 2, 'FD')

  doc.setTextColor(107, 30, 39)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('ORDER & PAYMENT DETAILS', margin + 4, y + 6)

  doc.setTextColor(60, 50, 45)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(`Order Number: #${order.orderNumber}`, margin + 4, y + 13)
  doc.text(`Order Date: ${new Date(order.createdAt).toLocaleString('en-IN')}`, margin + 4, y + 19)
  doc.text(`Payment Method: ${order.paymentMethod.toUpperCase()}`, margin + 4, y + 25)
  doc.text(`Payment Status: ${order.paymentState.toUpperCase()}`, margin + 4, y + 31)
  if (order.paymentId) {
    doc.text(`Txn Ref: ${order.paymentId}`, margin + 4, y + 37)
  }

  // Delivery Destination Box
  const rightColX = margin + colWidth + 6
  doc.setDrawColor(220, 215, 205)
  doc.setFillColor(250, 248, 245)
  doc.roundedRect(rightColX, y, colWidth, 42, 2, 2, 'FD')

  doc.setTextColor(107, 30, 39)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('DELIVERY DESTINATION', rightColX + 4, y + 6)

  doc.setTextColor(30, 30, 30)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text(`${order.deliveryAddressSnapshot.fullName}`, rightColX + 4, y + 13)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.text(`Phone: ${order.deliveryAddressSnapshot.phone}`, rightColX + 4, y + 19)

  doc.setTextColor(70, 65, 60)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  const fullAddress = formatDeliveryAddress(order)
  const addressLines = doc.splitTextToSize(fullAddress, colWidth - 8)
  doc.text(addressLines.slice(0, 3), rightColX + 4, y + 25)

  y += 48

  // Delivery Notes if present
  if (order.notes) {
    doc.setFillColor(254, 243, 199)
    doc.setDrawColor(245, 158, 11)
    doc.roundedRect(margin, y, contentWidth, 11, 1.5, 1.5, 'FD')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(146, 64, 14)
    doc.text(`Special Delivery Note: "${order.notes}"`, margin + 4, y + 7)
    y += 15
  }

  // Items Table Header
  doc.setFillColor(235, 230, 220)
  doc.rect(margin, y, contentWidth, 8, 'F')
  doc.setTextColor(40, 35, 30)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('#', margin + 3, y + 5.5)
  doc.text('ORDERED PANTRY ITEM', margin + 12, y + 5.5)
  doc.text('PRICE', margin + 115, y + 5.5, { align: 'right' })
  doc.text('QTY', margin + 140, y + 5.5, { align: 'center' })
  doc.text('TOTAL', pageWidth - margin - 4, y + 5.5, { align: 'right' })

  y += 8

  // Item Rows
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)

  order.items.forEach((item, index) => {
    // Check if new page needed
    if (y > 255) {
      doc.addPage()
      y = 15
    }

    const rowBg = index % 2 === 0 ? 255 : 250
    doc.setFillColor(rowBg, rowBg, rowBg)
    doc.rect(margin, y, contentWidth, 8, 'F')

    doc.setTextColor(80, 75, 70)
    doc.text(String(index + 1), margin + 3, y + 5.5)

    doc.setTextColor(30, 30, 30)
    const name = item.productNameSnapshot.length > 55
      ? item.productNameSnapshot.substring(0, 52) + '...'
      : item.productNameSnapshot
    doc.text(name, margin + 12, y + 5.5)

    doc.setTextColor(70, 65, 60)
    doc.text(`Rs. ${item.priceSnapshot}`, margin + 115, y + 5.5, { align: 'right' })
    doc.text(String(item.quantity), margin + 140, y + 5.5, { align: 'center' })

    doc.setTextColor(20, 20, 20)
    doc.setFont('helvetica', 'bold')
    doc.text(`Rs. ${item.priceSnapshot * item.quantity}`, pageWidth - margin - 4, y + 5.5, { align: 'right' })
    doc.setFont('helvetica', 'normal')

    // Divider line
    doc.setDrawColor(235, 230, 220)
    doc.line(margin, y + 8, pageWidth - margin, y + 8)

    y += 8
  })

  y += 4

  // Totals Box (Right aligned)
  const totalsBoxWidth = 75
  const totalsBoxX = pageWidth - margin - totalsBoxWidth
  doc.setDrawColor(220, 215, 205)
  doc.setFillColor(252, 250, 247)
  doc.roundedRect(totalsBoxX, y, totalsBoxWidth, 26, 2, 2, 'FD')

  doc.setFontSize(8)
  doc.setTextColor(80, 75, 70)
  doc.text('Items Subtotal:', totalsBoxX + 4, y + 7)
  doc.text(`Rs. ${order.subtotal}`, totalsBoxX + totalsBoxWidth - 4, y + 7, { align: 'right' })

  doc.text('Delivery Charge:', totalsBoxX + 4, y + 13)
  doc.text(order.shipping === 0 ? 'FREE' : `Rs. ${order.shipping}`, totalsBoxX + totalsBoxWidth - 4, y + 13, { align: 'right' })

  doc.setDrawColor(200, 190, 180)
  doc.line(totalsBoxX + 4, y + 17, totalsBoxX + totalsBoxWidth - 4, y + 17)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(107, 30, 39)
  doc.text('Final Total:', totalsBoxX + 4, y + 23)
  doc.text(`Rs. ${order.finalTotal}`, totalsBoxX + totalsBoxWidth - 4, y + 23, { align: 'right' })

  y += 34

  // Devotional Footer
  doc.setDrawColor(220, 215, 205)
  doc.line(margin, y, pageWidth - margin, y)

  y += 6
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(7.5)
  doc.setTextColor(130, 120, 110)
  doc.text('Thank you for patronizing Vaishnava Mart. All items prepared & packed in cleanroom satvik standards.', pageWidth / 2, y, { align: 'center' })
  doc.text('Contact: raskanfood@gmail.com | Phone/WhatsApp: +91 8595268400 | www.vaishnavamart.com', pageWidth / 2, y + 4.5, { align: 'center' })

  doc.save(`Invoice_${order.orderNumber}.pdf`)
}

/**
 * Generate 4x6 inch (100mm x 150mm) Delivery Box Sticker PDF
 * Specifically engineered to peel & stick directly onto courier / delivery packages.
 * Includes:
 *  - Prominent Delivery Destination
 *  - Recipient Name & Phone Number
 *  - Clear Ordered Pantry Items list
 *  - Order # & Payment Method (COD / PREPAID)
 */
export function generateDeliveryStickerPDF(order: Order): void {
  // 100mm wide x 150mm tall (Standard 4" x 6" thermal sticker / package label)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [100, 150],
  })

  const pageWidth = 100
  const margin = 4
  const contentWidth = pageWidth - margin * 2
  let y = 4

  // Outer Border Box
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.6)
  doc.rect(margin, margin, contentWidth, 142)

  // Top Header Banner
  doc.setFillColor(0, 0, 0)
  doc.rect(margin, y, contentWidth, 12, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('VAISHNAVA MART', margin + 3, y + 8)

  doc.setFontSize(8)
  const isCOD = order.paymentMethod === 'cod'
  const payBadge = isCOD ? 'CASH ON DELIVERY (COD)' : 'PREPAID - DO NOT COLLECT'
  doc.text(payBadge, pageWidth - margin - 3, y + 8, { align: 'right' })

  y += 15

  // Order Ref Bar
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text(`ORDER #${order.orderNumber}`, margin + 3, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, pageWidth - margin - 3, y, { align: 'right' })

  y += 4
  doc.setLineWidth(0.3)
  doc.line(margin, y, pageWidth - margin, y)

  y += 3

  // DELIVERY DESTINATION SECTION (HIGH PROMINENCE FOR COURIER)
  doc.setFillColor(240, 240, 240)
  doc.rect(margin, y, contentWidth, 6, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('DELIVERY DESTINATION', margin + 3, y + 4.2)

  y += 8

  // Recipient Name (Large)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text(order.deliveryAddressSnapshot.fullName, margin + 3, y)

  y += 5
  // Phone Number (Large bold with box)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  doc.text(`PHONE: ${order.deliveryAddressSnapshot.phone}`, margin + 3, y)

  y += 4.5
  // Address Lines
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  const addr = order.deliveryAddressSnapshot
  const lineA = `${addr.line1}, ${addr.area}`
  const lineB = addr.landmark ? `Near: ${addr.landmark}` : ''
  const lineC = `${addr.city}, ${addr.state} - PIN: ${addr.pin}`

  doc.text(doc.splitTextToSize(lineA, contentWidth - 6), margin + 3, y)
  y += 4.5
  if (lineB) {
    doc.text(doc.splitTextToSize(lineB, contentWidth - 6), margin + 3, y)
    y += 4
  }
  doc.setFont('helvetica', 'bold')
  doc.text(lineC, margin + 3, y)

  y += 5.5

  // Delivery Notes if present
  if (order.notes) {
    doc.setFillColor(245, 245, 245)
    doc.rect(margin + 2, y, contentWidth - 4, 6, 'F')
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(7.5)
    doc.text(`Note: "${order.notes}"`, margin + 4, y + 4)
    y += 8
  }

  // Divider
  doc.setLineWidth(0.4)
  doc.line(margin, y, pageWidth - margin, y)
  y += 3

  // ORDERED PANTRY ITEMS SECTION
  doc.setFillColor(240, 240, 240)
  doc.rect(margin, y, contentWidth, 6, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('ORDERED PANTRY ITEMS', margin + 3, y + 4.2)
  doc.text(`QTY`, pageWidth - margin - 4, y + 4.2, { align: 'right' })

  y += 8

  // Items List
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  const maxItemsToShow = 7
  const displayItems = order.items.slice(0, maxItemsToShow)

  displayItems.forEach((item, idx) => {
    const itemName = item.productNameSnapshot.length > 36
      ? item.productNameSnapshot.substring(0, 33) + '...'
      : item.productNameSnapshot

    doc.text(`${idx + 1}. ${itemName}`, margin + 3, y)
    doc.setFont('helvetica', 'bold')
    doc.text(`x${item.quantity}`, pageWidth - margin - 4, y, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    y += 4.2
  })

  if (order.items.length > maxItemsToShow) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(7.5)
    doc.text(`+ ${order.items.length - maxItemsToShow} additional items...`, margin + 3, y)
    y += 4
  }

  // COD Collection Box or Total Box at Bottom
  const bottomBoxY = 124
  doc.setLineWidth(0.4)
  doc.line(margin, bottomBoxY, pageWidth - margin, bottomBoxY)

  if (isCOD) {
    doc.setFillColor(255, 245, 245)
    doc.rect(margin + 1, bottomBoxY + 1, contentWidth - 2, 18, 'F')
    doc.setTextColor(180, 20, 20)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('CASH TO COLLECT (COD):', margin + 4, bottomBoxY + 7)
    doc.setFontSize(13)
    doc.text(`Rs. ${order.finalTotal}`, pageWidth - margin - 4, bottomBoxY + 8, { align: 'right' })
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.text('Please collect exact cash from customer before handing over package.', margin + 4, bottomBoxY + 14)
  } else {
    doc.setFillColor(245, 255, 245)
    doc.rect(margin + 1, bottomBoxY + 1, contentWidth - 2, 18, 'F')
    doc.setTextColor(0, 100, 0)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('PREPAID PARCEL - DO NOT COLLECT', margin + 4, bottomBoxY + 7)
    doc.setFontSize(11)
    doc.text(`Rs. ${order.finalTotal}`, pageWidth - margin - 4, bottomBoxY + 8, { align: 'right' })
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.text('Full payment verified via Razorpay. Hand over to devotee directly.', margin + 4, bottomBoxY + 14)
  }

  doc.save(`DeliverySticker_${order.orderNumber}.pdf`)
}
