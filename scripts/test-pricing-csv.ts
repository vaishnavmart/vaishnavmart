import { ProductRepository, CategoryRepository, AuditLogRepository } from '../lib/data/repositories'
import {
  buildPriceDiscountMasterCSVContent,
  buildPricingTemplateCSVContent,
} from '../lib/utils/invoiceGenerator'
import { Product } from '../types'

async function runTests() {
  console.log('=================================================================')
  console.log('🧪 RUNNING CSV PRICE & STOCK EDITING AUDIT & TEST SUITE')
  console.log('=================================================================\n')

  let passed = 0
  let failed = 0

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${msg}`)
      passed++
    } else {
      console.error(`  ❌ FAIL: ${msg}`)
      failed++
    }
  }

  // TEST 1: CSV Export Generation
  console.log('👉 [Test 1] Price & Discount Master CSV Export Format & Calculation')
  const initialProds = await ProductRepository.getAllProducts()
  assert(initialProds.length > 0, `Loaded ${initialProds.length} products from repository`)

  const categories = await CategoryRepository.getAllCategories()
  const categoryMap: Record<string, string> = {}
  categories.forEach((c) => {
    categoryMap[c.id] = c.name
  })

  const exportCSV = buildPriceDiscountMasterCSVContent(initialProds, categoryMap)
  assert(exportCSV.startsWith('\uFEFF'), 'CSV starts with UTF-8 BOM byte for Excel compatibility')
  const exportLines = exportCSV.split('\r\n')
  const headerClean = exportLines[0].replace(/^\uFEFF/, '')
  assert(
    headerClean === 'Product ID,SKU,Name,MRP,Price,Discount %,Stock,Category,Status',
    `CSV Header row matches expected specification: "${headerClean}"`
  )
  assert(
    exportLines.length === initialProds.length + 1,
    `Exported all ${initialProds.length} products + 1 header row (Total lines: ${exportLines.length})`
  )

  // Test discount calculation in exported row
  const sampleProd = initialProds.find((p) => p.mrp > p.price)
  if (sampleProd) {
    const expectedDiscount = Math.round(((sampleProd.mrp - sampleProd.price) / sampleProd.mrp) * 100)
    const matchingRow = exportLines.find((l) => l.includes(sampleProd.id))
    assert(
      matchingRow !== undefined && matchingRow.includes(String(expectedDiscount)),
      `Discount % calculated correctly for product "${sampleProd.name}": ${expectedDiscount}% (MRP: ${sampleProd.mrp}, Price: ${sampleProd.price})`
    )
  }

  // TEST 2: Pricing Template CSV Generation
  console.log('\n👉 [Test 2] Pricing Update Template Download Generation')
  const templateCSV = buildPricingTemplateCSVContent()
  const templateLines = templateCSV.split('\r\n')
  const templateHeaderClean = templateLines[0].replace(/^\uFEFF/, '')
  assert(
    templateHeaderClean === 'Product ID,SKU,Name,MRP,Price,Discount %,Stock,Category,Status',
    `Pricing template has standard header row: "${templateHeaderClean}"`
  )
  assert(templateLines.length >= 4, `Template contains sample rows demonstrating existing and new product structures (Lines: ${templateLines.length})`)

  // TEST 3: Bulk Price Update for Existing Products (Matched by ID & SKU)
  console.log('\n👉 [Test 3] Bulk Price Update - Match by ID and SKU')
  const targetProd1 = initialProds[0]
  const targetProd2 = initialProds[1]

  const updatedPrice1 = targetProd1.price + 25
  const updatedMrp1 = targetProd1.mrp + 50
  const updatedStock1 = targetProd1.stock + 10

  const updatedPrice2 = targetProd2.price - 15
  const updatedStock2 = targetProd2.stock + 20

  const updateList: Product[] = [
    // Matched by ID
    {
      ...targetProd1,
      price: updatedPrice1,
      mrp: updatedMrp1,
      stock: updatedStock1,
    },
    // Matched by SKU (with dummy/blank ID to verify SKU match fallback)
    {
      ...targetProd2,
      id: '',
      sku: targetProd2.sku,
      price: updatedPrice2,
      stock: updatedStock2,
    },
  ]

  const updateResult = await ProductRepository.bulkUpdatePricing(
    updateList,
    'Audit Test: Verified price and stock updates for existing catalog items'
  )

  assert(updateResult.updatedCount === 2, `Updated count is 2 (actual: ${updateResult.updatedCount})`)
  assert(updateResult.createdCount === 0, `Created count is 0 (actual: ${updateResult.createdCount})`)

  // Verify persistence
  const reloadedProd1 = await ProductRepository.getProductById(targetProd1.id)
  assert(
    reloadedProd1?.price === updatedPrice1 && reloadedProd1?.stock === updatedStock1,
    `Product 1 price (${reloadedProd1?.price}) and stock (${reloadedProd1?.stock}) updated correctly in repository`
  )
  assert(
    reloadedProd1?.id === targetProd1.id,
    `Product 1 ID preserved without accidental duplication (${reloadedProd1?.id})`
  )

  const reloadedProd2 = await ProductRepository.getProductById(targetProd2.id)
  assert(
    reloadedProd2?.price === updatedPrice2 && reloadedProd2?.stock === updatedStock2,
    `Product 2 (matched by SKU "${targetProd2.sku}") price (${reloadedProd2?.price}) updated correctly`
  )
  assert(
    reloadedProd2?.id === targetProd2.id,
    `Product 2 ID preserved even when imported row had blank ID (${reloadedProd2?.id})`
  )

  // TEST 4: Onboard New Product via CSV
  console.log('\n👉 [Test 4] Onboard New Product via CSV Flow')
  const newProdTimestamp = Date.now()
  const newProductToCreate: Product = {
    id: `prod-new-test-${newProdTimestamp}`,
    name: `Satvik Organic Cardamom Pods (${newProdTimestamp})`,
    slug: `satvik-organic-cardamom-${newProdTimestamp}`,
    description: 'Fresh aromatic green cardamom pods handpicked from Idukki satvik orchards.',
    images: [
      '/images/generated/prod-shahi-masala.jpg',
      '/images/generated/story-purity.jpg',
      '/images/generated/hero-bg.jpg',
      '/images/generated/story-why-exists.jpg',
    ],
    mainImage: '/images/generated/prod-shahi-masala.jpg',
    mrp: 350,
    price: 299,
    stock: 65,
    lowStockThreshold: 10,
    sku: `VM-CRD-${newProdTimestamp.toString().slice(-4)}`,
    weight: 100,
    unit: 'g',
    categoryIds: ['cat-1'],
    features: [
      { id: 'f-1', name: 'No Onion', visualType: 'icon', iconValue: 'shield', sortOrder: 1 },
      { id: 'f-2', name: 'No Garlic', visualType: 'icon', iconValue: 'shield', sortOrder: 2 },
      { id: 'f-3', name: 'Jain Friendly', visualType: 'icon', iconValue: 'check', sortOrder: 3 },
    ],
    similarProductIds: [],
    status: 'active',
    seo: {
      metaTitle: `Satvik Organic Cardamom Pods | Vaishnava Mart`,
      metaDescription: 'Fresh aromatic green cardamom pods.',
      slug: `satvik-organic-cardamom-${newProdTimestamp}`,
    },
    batchNumber: 'LOT-CRD-2026',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const createResult = await ProductRepository.bulkUpdatePricing(
    [newProductToCreate],
    'Audit Test: New product onboarding via CSV'
  )

  assert(createResult.createdCount === 1, `Created count is 1 (actual: ${createResult.createdCount})`)
  const fetchedNewProd = await ProductRepository.getProductById(newProductToCreate.id)
  assert(fetchedNewProd !== null, `New product found in repository by ID (${fetchedNewProd?.id})`)
  assert(
    fetchedNewProd?.name === newProductToCreate.name && fetchedNewProd?.price === 299,
    `New product name ("${fetchedNewProd?.name}") and price (₹${fetchedNewProd?.price}) match specifications`
  )

  // TEST 5: Verify Superadmin Audit Trail Entry
  console.log('\n👉 [Test 5] Cloud Firestore Audit Trail Verification')
  const logs = await AuditLogRepository.getLogs()
  const recentCsvLog = logs.find((l) => l.action === 'Price & Catalog CSV Update')
  assert(recentCsvLog !== undefined, 'Audit trail entry created with action "Price & Catalog CSV Update"')
  assert(
    recentCsvLog?.actor === 'Superadmin',
    `Audit trail actor recorded as "Superadmin" (actual: "${recentCsvLog?.actor}")`
  )
  assert(
    Boolean(recentCsvLog?.details.includes('Audit Test') || recentCsvLog?.details.includes('products')),
    `Audit trail log details are meaningful: "${recentCsvLog?.details}"`
  )

  console.log('\n=================================================================')
  console.log(`📊 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`)
  console.log('=================================================================')

  process.exit(failed > 0 ? 1 : 0)
}

runTests().catch((err) => {
  console.error('Fatal test error:', err)
  process.exit(1)
})
