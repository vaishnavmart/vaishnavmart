'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { MapPin, Phone, Mail, MessageSquare, Check, ArrowRight } from 'lucide-react'

export default function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [purpose, setPurpose] = useState('Order Inquiry')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => {
      setName('')
      setEmail('')
      setPhone('')
      setMessage('')
      setSubmitted(false)
    }, 4000)
  }

  return (
    <div className="bg-ivory min-h-screen py-12 sm:py-20 border-b border-sand">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs uppercase tracking-widest text-copper font-semibold">
            Dedicated Customer Care
          </span>
          <h1 className="font-serif text-4xl sm:text-6xl text-cocoa font-normal leading-tight">
            Connect With Vaishnava Mart
          </h1>
          <p className="text-base text-taupe leading-relaxed font-sans">
            Whether you have questions regarding batch certifications, custom temple supplies, or tracking an active order, our team is at your service.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-14 items-start">
          {/* Contact Details & WhatsApp (5 cols) */}
          <div className="lg:col-span-5 space-y-8 bg-porcelain p-8 rounded-3xl border border-sand shadow-sm">
            <h2 className="font-serif text-2xl text-cocoa font-medium">Headquarters & Support</h2>

            <div className="space-y-6 text-sm text-taupe font-sans">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-ivory border border-sand text-burgundy flex-shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-cocoa text-sm">Company & Operations</p>
                  <p className="text-xs font-semibold text-burgundy mt-0.5">NIMAI TRADE</p>
                  <p className="text-xs leading-relaxed mt-1">
                    23/76 Tilak Nagar, New Delhi 110018, India
                  </p>
                  <p className="text-[11px] text-copper mt-1">Vaishnava Mart • Ras Kan Foods</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-ivory border border-sand text-copper flex-shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-cocoa text-sm">Customer Helpline</p>
                  <p className="text-xs mt-1">+91 85952 68400 (10 AM - 7 PM IST)</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-ivory border border-sand text-gold flex-shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-cocoa text-sm">Official Correspondence</p>
                  <p className="text-xs mt-1">
                    <a href="mailto:nimaitrade55@gmail.com" className="hover:text-burgundy transition-colors block">
                      nimaitrade55@gmail.com
                    </a>
                    <a href="mailto:raskanfood@gmail.com" className="hover:text-burgundy transition-colors block mt-0.5">
                      raskanfood@gmail.com
                    </a>
                  </p>
                </div>
              </div>
            </div>

            {/* Direct WhatsApp Callout */}
            <div className="p-6 bg-cream/70 rounded-2xl border border-sand space-y-3">
              <div className="flex items-center gap-2 text-burgundy font-semibold text-xs uppercase tracking-wider">
                <MessageSquare className="w-4 h-4 text-copper" />
                <span>Instant WhatsApp Concierge</span>
              </div>
              <p className="text-xs text-taupe leading-relaxed">
                Need quick advice on an upcoming Ekadashi feast or prasad order? Chat live with our Satvik coordinator.
              </p>
              <a
                href="https://wa.me/918595268400"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full h-11 text-xs justify-center"
              >
                <span>Open WhatsApp Chat (+91 85952 68400)</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Contact Inquiry Form (7 cols) */}
          <div className="lg:col-span-7 bg-porcelain p-8 sm:p-10 rounded-3xl border border-sand shadow-sm">
            <h2 className="font-serif text-2xl text-cocoa font-medium mb-2">Send a Direct Message</h2>
            <p className="text-xs text-taupe mb-6">We respond to all inquiries within 24 business hours.</p>

            {submitted ? (
              <div className="p-6 bg-botanical/15 border border-botanical/30 rounded-2xl text-botanical text-center space-y-2">
                <Check className="w-8 h-8 mx-auto" />
                <p className="font-serif text-xl">Thank You for Reaching Out</p>
                <p className="text-xs text-taupe">Your message has been received. Our team will contact you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-taupe block mb-1">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full p-3 bg-ivory border border-sand rounded-xl text-xs text-cocoa focus:border-burgundy outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-taupe block mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="yourname@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-3 bg-ivory border border-sand rounded-xl text-xs text-cocoa focus:border-burgundy outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-taupe block mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full p-3 bg-ivory border border-sand rounded-xl text-xs text-cocoa focus:border-burgundy outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-taupe block mb-1">
                      Inquiry Subject
                    </label>
                    <select
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      className="w-full p-3 bg-ivory border border-sand rounded-xl text-xs text-cocoa focus:border-burgundy outline-none"
                    >
                      <option value="Order Inquiry">Order Inquiry</option>
                      <option value="Temple / Ashram Wholesale">Temple / Ashram Wholesale</option>
                      <option value="Purity & Certification Question">Purity & Certification Question</option>
                      <option value="General Feedback">General Feedback</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-taupe block mb-1">
                    Your Message *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Tell us how we can assist your sacred kitchen..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full p-3 bg-ivory border border-sand rounded-xl text-xs text-cocoa focus:border-burgundy outline-none resize-none"
                  />
                </div>

                <button type="submit" className="btn-primary w-full h-12 text-sm justify-center">
                  <span>Send Message</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
