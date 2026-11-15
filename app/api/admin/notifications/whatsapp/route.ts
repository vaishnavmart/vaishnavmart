import { NextRequest, NextResponse } from 'next/server'
import { OrderRepository, AuditLogRepository } from '@/lib/data/repositories'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { orderId, type = 'order_confirmed', customMessage } = body

    if (!orderId) {
      return NextResponse.json({ success: false, message: 'orderId is required.' }, { status: 400 })
    }

    const order = await OrderRepository.getOrderById(orderId)
    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found.' }, { status: 404 })
    }

    // Clean phone number (Standardize Indian 10-digit to 91XXXXXXXXXX)
    const rawPhone = order.deliveryAddressSnapshot.phone || order.customerSnapshot.phone || ''
    const digitsOnly = rawPhone.replace(/\D/g, '')
    const cleanPhone =
      digitsOnly.length === 10
        ? `91${digitsOnly}`
        : digitsOnly.startsWith('91')
        ? digitsOnly
        : `91${digitsOnly}`

    const customerName = order.deliveryAddressSnapshot.fullName || order.customerSnapshot.name || 'Respected Devotee'
    const itemsSummary = order.items.map((i) => `${i.productNameSnapshot} (Qty: ${i.quantity})`).join(', ')
    const courier = order.courierPartner || 'Express Courier'
    const awb = order.trackingNumber || 'Pending AWB'
    const trackingLink = order.trackingUrl || `https://vaishnavamart.com/track?order=${order.orderNumber}`

    let messageText = ''

    switch (type) {
      case 'order_confirmed':
        messageText =
          `Radhe Radhe! 🙏\n\n` +
          `Dear ${customerName},\n` +
          `Thank you for patronizing Vaishnava Mart (Ras Kan). Your devotional order #${order.orderNumber} for ₹${order.finalTotal} is confirmed!\n\n` +
          `📦 Items: ${itemsSummary}\n` +
          `🌿 Standard: 100% Satvik, No Onion, No Garlic, Cleanroom Packed.\n\n` +
          `We are preparing your package with utmost sacred care. You will receive tracking details once dispatched.\n\n` +
          `Warm regards,\nVaishnava Mart Care Team`
        break

      case 'shipped':
        messageText =
          `Radhe Radhe! 🙏\n\n` +
          `Dear ${customerName},\n` +
          `Your Vaishnava Mart parcel #${order.orderNumber} has been dispatched with devotional care!\n\n` +
          `🚚 Courier: ${courier}\n` +
          `🔖 AWB Tracking Number: ${awb}\n` +
          `🌐 Track Live: ${trackingLink}\n\n` +
          `Thank you for keeping your kitchen pure with Ras Kan Satvik spices.`
        break

      case 'out_for_delivery':
        messageText =
          `Radhe Radhe! 🙏\n\n` +
          `Dear ${customerName},\n` +
          `Your Vaishnava Mart order #${order.orderNumber} is OUT FOR DELIVERY today!\n\n` +
          `${order.paymentMethod === 'cod' ? `💵 Payment: Cash on Delivery (Please keep exact Rs. ${order.finalTotal} ready)\n` : `✅ Payment: Fully Prepaid - Do NOT pay courier cash\n`}` +
          `Our delivery partner will reach your address shortly. Please ensure someone is available to receive it with reverence.`
        break

      case 'delivered':
        messageText =
          `Radhe Radhe! 🙏\n\n` +
          `Dear ${customerName},\n` +
          `Your order #${order.orderNumber} has been successfully delivered!\n\n` +
          `May the sacred purity of our stone-ground spices bring health and spiritual joy to your home and temple offerings.\n\n` +
          `If you have any feedback or recipe questions, reply directly to this chat.\n\n` +
          `Jai Shri Krishna!`
        break

      case 'custom':
        messageText =
          `Radhe Radhe! 🙏\n\n` +
          `Dear ${customerName},\n\n` +
          `${customMessage || 'Update regarding your Vaishnava Mart order.'}\n\n` +
          `Regarding Order #${order.orderNumber}\nVaishnava Mart Care Team`
        break

      default:
        messageText = customMessage || `Radhe Radhe! Update regarding order #${order.orderNumber}`
    }

    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`

    // Outbound Meta Cloud API Dispatch (If environment variables are configured on Vercel)
    let dispatchedViaApi = false
    const metaPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID
    const metaAccessToken = process.env.WHATSAPP_ACCESS_TOKEN

    if (metaPhoneId && metaAccessToken) {
      try {
        const metaRes = await fetch(`https://graph.facebook.com/v19.0/${metaPhoneId}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${metaAccessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: cleanPhone,
            type: 'text',
            text: { preview_url: true, body: messageText },
          }),
        })
        if (metaRes.ok) {
          dispatchedViaApi = true
        }
      } catch (metaErr) {
        console.warn('Meta WhatsApp API dispatch notice (fallback to wa.me link):', metaErr)
      }
    }

    // Log immutable audit entry
    await AuditLogRepository.addLog(
      'WhatsApp Notification',
      `Sent ${type.toUpperCase()} WhatsApp notification to ${customerName} (${cleanPhone}) for Order #${order.orderNumber}`,
      'Owner'
    )

    return NextResponse.json({
      success: true,
      whatsappUrl,
      message: messageText,
      phone: cleanPhone,
      dispatchedViaApi,
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Error generating WhatsApp notification.' },
      { status: 500 }
    )
  }
}
