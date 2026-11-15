import { jsPDF } from 'jspdf'
import { Order, Product } from '@/types'

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
  doc.setFontSize(8)
  doc.text('100% Pure Satvik Pantry & Temple Offerings | FSSAI Lic. 10023011000987', margin + 6, y + 16)

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
 * Helper to render single 4x6 delivery sticker onto a jsPDF document page
 */
function renderStickerPage(doc: jsPDF, order: Order): void {
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

  // Bottom Box
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
}

/**
 * Generate 4x6 inch (100mm x 150mm) Delivery Box Sticker PDF for a single order
 */
export function generateDeliveryStickerPDF(order: Order): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [100, 150],
  })
  renderStickerPage(doc, order)
  doc.save(`DeliverySticker_${order.orderNumber}.pdf`)
}

/**
 * Generate Batch 4x6 inch Delivery Box Stickers PDF for multiple orders in 1 print run
 */
export function generateBatchDeliveryStickersPDF(orders: Order[]): void {
  if (!orders || orders.length === 0) return
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [100, 150],
  })

  orders.forEach((order, index) => {
    if (index > 0) {
      doc.addPage([100, 150], 'portrait')
    }
    renderStickerPage(doc, order)
  })

  doc.save(`Batch_Stickers_${orders.length}_Orders_${new Date().toISOString().slice(0, 10)}.pdf`)
}

/**
 * Helper to render single warehouse packing slip onto a jsPDF A4 page
 */
function renderPackingSlipPage(doc: jsPDF, order: Order): void {
  const pageWidth = doc.internal.pageSize.getWidth() // 210mm
  const margin = 14
  const contentWidth = pageWidth - margin * 2
  let y = 14

  // Top Warehouse Header
  doc.setFillColor(45, 55, 72) // Slate #2D3748
  doc.rect(margin, y, contentWidth, 20, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('VAISHNAVA MART — WAREHOUSE PICK & PACK SLIP', margin + 6, y + 9)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text('Satvik Cleanroom Fulfillment Center | FSSAI Lic. 10023011000987', margin + 6, y + 15)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(`ORDER #${order.orderNumber}`, pageWidth - margin - 6, y + 9, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(`Courier: ${(order.courierPartner || 'Shiprocket').toUpperCase()}`, pageWidth - margin - 6, y + 15, { align: 'right' })

  y += 26

  // Sacred Purity Guarantee Ribbon for Picker
  doc.setFillColor(254, 243, 199)
  doc.setDrawColor(245, 158, 11)
  doc.roundedRect(margin, y, contentWidth, 10, 1.5, 1.5, 'FD')
  doc.setTextColor(146, 64, 14)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.text('TEMPLE STANDARD: Handle with washed hands. 100% Satvik, zero allium (no onion/garlic) contact permitted.', margin + 4, y + 6.5)

  y += 15

  // Two columns: Recipient destination & Order details
  const colWidth = (contentWidth - 6) / 2

  doc.setDrawColor(220, 220, 220)
  doc.setFillColor(250, 250, 250)
  doc.roundedRect(margin, y, colWidth, 34, 2, 2, 'FD')

  doc.setTextColor(50, 50, 50)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.text('SHIP TO / DEVOTEE DESTINATION', margin + 4, y + 6)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text(order.deliveryAddressSnapshot.fullName, margin + 4, y + 13)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(`Phone: ${order.deliveryAddressSnapshot.phone}`, margin + 4, y + 19)
  const fullAddress = formatDeliveryAddress(order)
  const addressLines = doc.splitTextToSize(fullAddress, colWidth - 8)
  doc.text(addressLines.slice(0, 2), margin + 4, y + 25)

  // Right Box: Dispatch Details
  const rightX = margin + colWidth + 6
  doc.roundedRect(rightX, y, colWidth, 34, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.text('FULFILLMENT SPECS', rightX + 4, y + 6)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(`Order Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, rightX + 4, y + 13)
  doc.text(`Payment: ${order.paymentMethod.toUpperCase()} (${order.paymentState.toUpperCase()})`, rightX + 4, y + 19)
  doc.text(`AWB / Tracking: ${order.trackingNumber || 'Generate on dispatch'}`, rightX + 4, y + 25)
  if (order.notes) {
    doc.text(`Special Note: "${order.notes}"`, rightX + 4, y + 31)
  }

  y += 40

  // Items Checklist Header
  doc.setFillColor(230, 235, 240)
  doc.rect(margin, y, contentWidth, 8, 'F')
  doc.setTextColor(40, 50, 60)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('CHECK [√]', margin + 3, y + 5.5)
  doc.text('#', margin + 22, y + 5.5)
  doc.text('PANTRY ITEM & SPECIFICATION', margin + 30, y + 5.5)
  doc.text('LOT / BATCH', margin + 125, y + 5.5)
  doc.text('QTY TO PACK', pageWidth - margin - 4, y + 5.5, { align: 'right' })

  y += 8

  // Item Rows with Physical Checkboxes
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)

  order.items.forEach((item, index) => {
    if (y > 250) {
      doc.addPage()
      y = 15
    }

    const rowBg = index % 2 === 0 ? 255 : 248
    doc.setFillColor(rowBg, rowBg, rowBg)
    doc.rect(margin, y, contentWidth, 9, 'F')

    // Physical Picker Checkbox Square [ ]
    doc.setDrawColor(120, 130, 140)
    doc.setLineWidth(0.4)
    doc.rect(margin + 5, y + 2, 5, 5)

    doc.setTextColor(80, 80, 80)
    doc.text(String(index + 1), margin + 22, y + 6)

    doc.setTextColor(20, 20, 20)
    doc.setFont('helvetica', 'bold')
    const name = item.productNameSnapshot.length > 50
      ? item.productNameSnapshot.substring(0, 48) + '...'
      : item.productNameSnapshot
    doc.text(name, margin + 30, y + 6)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(90, 90, 90)
    doc.text('VM-LOT-2026', margin + 125, y + 6)

    doc.setTextColor(10, 10, 10)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text(`${item.quantity} units`, pageWidth - margin - 4, y + 6.2, { align: 'right' })
    doc.setFontSize(8.5)

    doc.setDrawColor(230, 230, 230)
    doc.line(margin, y + 9, pageWidth - margin, y + 9)

    y += 9
  })

  y += 8

  // Quality Inspection & Sign-off Box
  if (y > 240) {
    doc.addPage()
    y = 15
  }

  doc.setDrawColor(200, 205, 210)
  doc.setFillColor(252, 252, 252)
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(60, 70, 80)
  doc.text('WAREHOUSE SANCTITY & QUALITY VERIFICATION SIGN-OFF', margin + 4, y + 6)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.text('Picker Signature: _______________________', margin + 4, y + 14)
  doc.text('Quality Inspector: _______________________', margin + 70, y + 14)
  doc.text('Pack Date / Time: _______________________', margin + 135, y + 14)

  doc.text('Purity Seal Verified: [  ] YES   [  ] NO', margin + 4, y + 20)
  doc.text('Tamper-Evident Tape Applied: [  ] YES', margin + 70, y + 20)
  doc.text('Weight Verified: _______ kg', margin + 135, y + 20)
}

/**
 * Generate A4 Warehouse Packing Slip PDF for an order
 */
export function generatePackingSlipPDF(order: Order): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })
  renderPackingSlipPage(doc, order)
  doc.save(`PackingSlip_${order.orderNumber}.pdf`)
}

/**
 * Generate Batch A4 Warehouse Packing Slips PDF for multiple orders
 */
export function generateBatchPackingSlipsPDF(orders: Order[]): void {
  if (!orders || orders.length === 0) return
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })
  orders.forEach((order, index) => {
    if (index > 0) doc.addPage()
    renderPackingSlipPage(doc, order)
  })
  doc.save(`Batch_PackingSlips_${orders.length}_Orders_${new Date().toISOString().slice(0, 10)}.pdf`)
}

/**
 * Export Low-Stock Raw Spice Mandi & Wholesale Procurement Sheet (CSV)
 */
export function exportMandiProcurementSheetCSV(products: Product[]): void {
  const headers = [
    'SKU',
    'Product Name',
    'Current Finished Units',
    'Low Stock Alert Threshold',
    'Shortfall Units to Mill/Pack',
    'Pack Weight',
    'Unit',
    'Estimated Raw Spice Needed (Kg)',
    'Current Batch Lot #',
    'Expiry Date',
    'Procurement Status',
    'Mandi Sourcing Notes',
  ]

  const rows = products.map((p) => {
    const threshold = p.lowStockThreshold || 10
    const shortfall = Math.max(0, threshold * 2 - p.stock)
    const weightInKg = p.unit === 'g' ? (p.weight / 1000) : p.unit === 'kg' ? p.weight : 0.1
    const rawSpiceKg = (shortfall * weightInKg * 1.08).toFixed(2) // 8% milling & moisture loss allowance
    const status = p.stock <= 0 ? 'CRITICAL - OUT OF STOCK' : p.stock <= threshold ? 'LOW STOCK - RESTOCK NOW' : 'HEALTHY'

    const values = [
      p.sku || '',
      p.name,
      p.stock,
      threshold,
      shortfall,
      p.weight,
      p.unit,
      rawSpiceKg,
      p.batchNumber || 'VM-LOT-2026',
      p.expiryDate || '',
      status,
      'Procure pure grade raw whole spice from authorized mandi. Zero allium processing.',
    ]

    return values
      .map((val) => {
        const str = String(val ?? '')
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
  link.download = `VaishnavaMart_Mandi_Procurement_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
