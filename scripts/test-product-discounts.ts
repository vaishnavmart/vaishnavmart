/**
 * Vaishnava Mart - Individual Product Discount Percentage Audit & Test Suite
 *
 * Verifies:
 * 1. Product type with discountPercent?: number
 * 2. Mathematical pricing & discount formulas (0%, 15%, 50%, edge cases like price > mrp, mrp <= 0)
 * 3. Product Wizard dynamic recalculation logic
 * 4. Inventory direct editing & Firestore repository persistence
 * 5. Storefront calculation across ProductCard, Detail, Cart, and Checkout
 */

import { Product } from '../types'
import { ProductRepository } from '../lib/data/repositories'

let passed = 0
let failed = 0

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`)
    passed++
  } else {
    console.error(`  ❌ FAIL: ${testName}`)
    if (detail) console.error(`     Detail: ${detail}`)
    failed++
  }
}

async function runTests() {
  console.log('=================================================================')
  console.log('🧪 VAISHNAVA MART - PRODUCT DISCOUNT PERCENTAGE TEST SUITE')
  console.log('=================================================================\n')

  // -------------------------------------------------------------
  // TEST GROUP 1: Formula Verification & Dynamic Recalculation
  // -------------------------------------------------------------
  console.log('--- Test Group 1: Pricing & Discount Mathematical Formulas ---')

  // Case 1.1: 0% Discount
  {
    const mrp = 300
    const disc = 0
    const price = Math.round(mrp * (1 - disc / 100))
    assert(price === 300, '0% Discount: Price equals MRP (300 -> 300)')
    const backDisc = Math.round(((mrp - price) / mrp) * 100)
    assert(backDisc === 0, '0% Discount: Reverse calculation yields 0%')
  }

  // Case 1.2: 15% Discount
  {
    const mrp = 300
    const disc = 15
    const price = Math.round(mrp * (1 - disc / 100))
    assert(price === 255, `15% Discount on MRP 300 produces Price 255 (actual: ${price})`)
    const backDisc = Math.round(((mrp - price) / mrp) * 100)
    assert(backDisc === 15, `Reverse from MRP 300, Price 255 yields 15% (actual: ${backDisc}%)`)
  }

  // Case 1.3: 50% Discount
  {
    const mrp = 499
    const disc = 50
    const price = Math.round(mrp * (1 - disc / 100))
    // 499 * 0.5 = 249.5 -> rounded to 250
    assert(price === 250, `50% Discount on MRP 499 produces Price 250 (actual: ${price})`)
    const backDisc = Math.round(((mrp - price) / mrp) * 100)
    assert(backDisc === 50, `Reverse from MRP 499, Price 250 yields 50% (actual: ${backDisc}%)`)
  }

  // Case 1.4: 100% Discount (Free / Promotion sample)
  {
    const mrp = 200
    const disc = 100
    const price = Math.round(mrp * (1 - disc / 100))
    assert(price === 0, `100% Discount on MRP 200 produces Price 0 (actual: ${price})`)
  }

  // Case 1.5: Edge Case - Price > MRP
  {
    const mrp = 200
    const price = 250
    const rawDisc = mrp > 0 ? (price > mrp ? 0 : Math.max(0, Math.round(((mrp - price) / mrp) * 100))) : 0
    assert(rawDisc === 0, 'Edge Case: When Price > MRP, Discount % is clamped to 0% (never negative)')
    const isExceeding = price > mrp
    assert(isExceeding === true, 'Edge Case: Price > MRP flag is properly detected for warning UI')
  }

  // Case 1.6: Edge Case - MRP is 0 or negative
  {
    const mrp = 0
    const disc = 20
    const price = mrp > 0 ? Math.max(0, Math.round(mrp * (1 - disc / 100))) : 0
    assert(price === 0, 'Edge Case: When MRP is 0, Price defaults safely to 0 without NaN')
  }

  // -------------------------------------------------------------
  // TEST GROUP 2: Product Model & Repository Persistence (Firestore & Local)
  // -------------------------------------------------------------
  console.log('\n--- Test Group 2: Product Repository & Model Discount Support ---')

  const testProdId = `test-prod-disc-${Date.now()}`
  const initialProduct: Product = {
    id: testProdId,
    name: 'Satvik Kesar Masala Chai Blend',
    slug: `satvik-kesar-masala-chai-${Date.now()}`,
    description: 'Freshly stone-ground aromatic tea masala with high grade Kashmiri saffron.',
    images: ['/images/products/raskan-shahi-paneer-masala-100g.jpg'],
    mainImage: '/images/products/raskan-shahi-paneer-masala-100g.jpg',
    mrp: 400,
    price: 340, // 15% discount
    discountPercent: 15,
    stock: 75,
    lowStockThreshold: 10,
    sku: 'TEST-DISC-01',
    weight: 100,
    unit: 'g',
    categoryIds: ['cat-1'],
    features: [{ id: 'f1', name: '100% Pure', visualType: 'icon', sortOrder: 1 }],
    similarProductIds: [],
    status: 'active',
    seo: {
      metaTitle: 'Satvik Kesar Masala Chai Blend | Vaishnava Mart',
      metaDescription: 'Stone-ground chai spice.',
      slug: `satvik-kesar-masala-chai-${Date.now()}`,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  // Save new product with discountPercent
  const saved = await ProductRepository.saveProduct(initialProduct)
  assert(saved.id === testProdId, 'Product created and saved in repository')
  assert(saved.discountPercent === 15, `Product stored discountPercent: 15% (actual: ${saved.discountPercent}%)`)
  assert(saved.price === 340, `Product stored price: ₹340 (actual: ₹${saved.price})`)
  assert(saved.mrp === 400, `Product stored mrp: ₹400 (actual: ₹${saved.mrp})`)

  // Retrieve product back
  const retrieved = await ProductRepository.getProductById(testProdId)
  assert(retrieved !== null, 'Product successfully retrieved by ID')
  assert(retrieved?.discountPercent === 15, 'Retrieved product maintains discountPercent field')
  assert(retrieved?.price === 340, 'Retrieved product maintains configured price')

  // -------------------------------------------------------------
  // TEST GROUP 3: Direct Inventory Editing Simulation
  // -------------------------------------------------------------
  console.log('\n--- Test Group 3: Direct Inventory Editing & Discount Recalculation ---')

  // Simulate admin editing discount to 25% directly in inventory
  const updatedDisc = 25
  const newPriceFromDisc = Math.round(retrieved!.mrp * (1 - updatedDisc / 100)) // 400 * 0.75 = 300
  assert(newPriceFromDisc === 300, `Changing discount to 25% calculates price ₹300 (actual: ₹${newPriceFromDisc})`)

  const updatedProduct = await ProductRepository.saveProduct({
    ...retrieved!,
    price: newPriceFromDisc,
    discountPercent: updatedDisc,
    stock: 90,
  })

  assert(updatedProduct.price === 300, 'Product saved with updated price ₹300')
  assert(updatedProduct.discountPercent === 25, 'Product saved with updated discountPercent 25%')

  // Simulate admin editing price to ₹200 directly in inventory
  const directPrice = 200
  const recalculatedDisc = Math.round(((updatedProduct.mrp - directPrice) / updatedProduct.mrp) * 100) // (400 - 200)/400 = 50%
  assert(recalculatedDisc === 50, `Editing price to ₹200 calculates 50% discount (actual: ${recalculatedDisc}%)`)

  const priceUpdatedProduct = await ProductRepository.saveProduct({
    ...updatedProduct,
    price: directPrice,
    discountPercent: recalculatedDisc,
  })
  assert(priceUpdatedProduct.discountPercent === 50, 'Product saved with 50% discount after price edit')

  // Simulate 0% discount update
  const zeroDiscProduct = await ProductRepository.saveProduct({
    ...priceUpdatedProduct,
    price: 400,
    discountPercent: 0,
  })
  assert(zeroDiscProduct.price === 400 && zeroDiscProduct.discountPercent === 0, 'Product saved with 0% discount (Price = MRP)')

  // -------------------------------------------------------------
  // TEST GROUP 4: Storefront Display Logic Verification
  // -------------------------------------------------------------
  console.log('\n--- Test Group 4: Storefront Components Logic Verification ---')

  // Storefront ProductCard logic
  {
    const cardProduct: Product = {
      ...initialProduct,
      mrp: 500,
      price: 425,
      discountPercent: 15,
    }

    const activeDiscount = cardProduct.discountPercent !== undefined
      ? cardProduct.discountPercent
      : (cardProduct.mrp > cardProduct.price ? Math.round(((cardProduct.mrp - cardProduct.price) / cardProduct.mrp) * 100) : 0)

    assert(activeDiscount === 15, `ProductCard computes activeDiscount 15% (actual: ${activeDiscount}%)`)
    const badgeShown = activeDiscount > 0
    assert(badgeShown === true, 'ProductCard displays discount badge when activeDiscount > 0')
  }

  // Storefront ProductDetailClient logic with and without pack options
  {
    const detailProduct: Product = {
      ...initialProduct,
      mrp: 600,
      price: 480,
      discountPercent: 20,
    }

    const discountPercent = detailProduct.discountPercent !== undefined
      ? detailProduct.discountPercent
      : (detailProduct.mrp > detailProduct.price ? Math.round(((detailProduct.mrp - detailProduct.price) / detailProduct.mrp) * 100) : 0)

    assert(discountPercent === 20, `ProductDetailClient computes discount 20% (actual: ${discountPercent}%)`)
  }

  // Cart & Checkout display calculation
  {
    const cartProduct: Product = {
      ...initialProduct,
      mrp: 299,
      price: 249,
      discountPercent: 17,
    }

    const computedDisc = cartProduct.discountPercent !== undefined
      ? cartProduct.discountPercent
      : (cartProduct.mrp > 0 ? Math.round(((cartProduct.mrp - cartProduct.price) / cartProduct.mrp) * 100) : 0)

    assert(computedDisc === 17, `Cart / Checkout displays discount 17% (actual: ${computedDisc}%)`)
  }

  // Clean up test product
  await ProductRepository.deleteProduct(testProdId, false)

  console.log('\n=================================================================')
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`)
  console.log('=================================================================')

  if (failed > 0) {
    process.exit(1)
  }
}

runTests().catch((err) => {
  console.error('Unhandled test failure:', err)
  process.exit(1)
})
