import { getDatabase } from './index'
import { users, categories, parts } from './schema'
import { eq } from 'drizzle-orm'
import { createHash, randomBytes } from 'crypto'

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

// Add missing categories to existing database
export async function ensureCategories(): Promise<void> {
  const db = getDatabase()
  
  const requiredCategories = [
    // Mechanical
    { name: 'Bolts', type: 'mechanical' as const, description: 'Various bolt sizes and types' },
    { name: 'Nuts', type: 'mechanical' as const, description: 'Hex nuts, lock nuts, wing nuts' },
    { name: 'Washers', type: 'mechanical' as const, description: 'Flat, spring, and lock washers' },
    { name: 'Screws', type: 'mechanical' as const, description: 'Machine screws, wood screws, self-tapping' },
    { name: 'Bearings', type: 'mechanical' as const, description: 'Ball bearings, roller bearings' },
    { name: 'Gears', type: 'mechanical' as const, description: 'Spur gears, helical gears' },
    { name: 'Springs', type: 'mechanical' as const, description: 'Compression, tension, torsion springs' },
    { name: 'Seals', type: 'mechanical' as const, description: 'O-rings, gaskets, oil seals' },
    { name: 'Pins', type: 'mechanical' as const, description: 'Dowel pins, roll pins, cotter pins' },
    { name: 'Clips', type: 'mechanical' as const, description: 'Retaining clips, circlips, snap rings' },
    { name: 'Chains', type: 'mechanical' as const, description: 'Roller chains, drive chains, chain links' },
    
    // Piping
    { name: 'Pipes', type: 'piping' as const, description: 'Steel, PVC, copper pipes' },
    { name: 'Valves', type: 'piping' as const, description: 'Ball valves, gate valves, check valves' },
    { name: 'Fittings', type: 'piping' as const, description: 'Elbows, tees, couplings' },
    { name: 'Clamps', type: 'piping' as const, description: 'Pipe clamps, hose clamps' },
    { name: 'Hoses', type: 'piping' as const, description: 'Hydraulic, pneumatic, water hoses' },
    { name: 'Flanges', type: 'piping' as const, description: 'Weld neck, slip-on, blind flanges' },
    
    // Electrical
    { name: 'Electrical', type: 'electrical' as const, description: 'General electrical components and parts' },
    { name: 'Wires', type: 'electrical' as const, description: 'Copper wires, cables' },
    { name: 'Circuit Breakers', type: 'electrical' as const, description: 'MCBs, MCCBs, RCCBs' },
    { name: 'Switches', type: 'electrical' as const, description: 'Toggle, push button, limit switches' },
    { name: 'Relays', type: 'electrical' as const, description: 'Control relays, contactors' },
    { name: 'Connectors', type: 'electrical' as const, description: 'Terminal blocks, wire connectors' },
    { name: 'Fuses', type: 'electrical' as const, description: 'Cartridge, blade, resettable fuses' },
    { name: 'Motors', type: 'electrical' as const, description: 'AC motors, DC motors, servo motors' },
    
    // Specialty
    { name: 'General', type: 'specialty' as const, description: 'General purpose and miscellaneous parts' },
    { name: 'Pumps', type: 'specialty' as const, description: 'Centrifugal, positive displacement pumps' },
    { name: 'Hydraulics', type: 'specialty' as const, description: 'Hydraulic cylinders, power units' },
    { name: 'Pneumatics', type: 'specialty' as const, description: 'Air cylinders, valves, FRLs' },
    { name: 'Filters', type: 'specialty' as const, description: 'Oil, air, water filters' },
    { name: 'Sensors', type: 'specialty' as const, description: 'Proximity, temperature, pressure sensors' },
    { name: 'PLCs', type: 'specialty' as const, description: 'Programmable logic controllers' },
    { name: 'Drives', type: 'specialty' as const, description: 'VFDs, servo drives' }
  ]
  
  // Get existing categories
  const existingCategories = await db.select().from(categories)
  const existingNames = new Set(existingCategories.map(c => c.name.toLowerCase()))
  
  // Find missing categories
  const missingCategories = requiredCategories.filter(
    c => !existingNames.has(c.name.toLowerCase())
  )
  
  if (missingCategories.length > 0) {
    console.log(`Adding ${missingCategories.length} missing categories...`)
    await db.insert(categories).values(missingCategories)
    console.log(`Added categories: ${missingCategories.map(c => c.name).join(', ')}`)
  }
}

export async function seedDatabase(): Promise<void> {
  const db = getDatabase()
  
  // Check if already seeded
  const existingUsers = await db.select().from(users).limit(1)
  if (existingUsers.length > 0) {
    console.log('Database already seeded, skipping...')
    return
  }
  
  console.log('Seeding database...')
  
  // Create default admin user
  const adminPassword = hashPassword('admin123')
  const [admin] = await db.insert(users).values({
    serviceNumber: 'ADMIN001',
    name: 'System Administrator',
    passwordHash: adminPassword,
    role: 'admin'
  }).returning()
  
  // Create demo users
  await db.insert(users).values([
    {
      serviceNumber: 'EMP001',
      name: 'John Editor',
      passwordHash: hashPassword('editor123'),
      role: 'editor'
    },
    {
      serviceNumber: 'EMP002',
      name: 'Jane Viewer',
      passwordHash: hashPassword('user123'),
      role: 'user'
    }
  ])
  
  // Seed categories
  const categoryData = [
    // Mechanical
    { name: 'Bolts', type: 'mechanical' as const, description: 'Various bolt sizes and types' },
    { name: 'Nuts', type: 'mechanical' as const, description: 'Hex nuts, lock nuts, wing nuts' },
    { name: 'Washers', type: 'mechanical' as const, description: 'Flat, spring, and lock washers' },
    { name: 'Screws', type: 'mechanical' as const, description: 'Machine screws, wood screws, self-tapping' },
    { name: 'Bearings', type: 'mechanical' as const, description: 'Ball bearings, roller bearings' },
    { name: 'Gears', type: 'mechanical' as const, description: 'Spur gears, helical gears' },
    { name: 'Springs', type: 'mechanical' as const, description: 'Compression, tension, torsion springs' },
    { name: 'Seals', type: 'mechanical' as const, description: 'O-rings, gaskets, oil seals' },
    { name: 'Pins', type: 'mechanical' as const, description: 'Dowel pins, roll pins, cotter pins' },
    { name: 'Clips', type: 'mechanical' as const, description: 'Retaining clips, circlips, snap rings' },
    { name: 'Chains', type: 'mechanical' as const, description: 'Roller chains, drive chains, chain links' },
    
    // Piping
    { name: 'Pipes', type: 'piping' as const, description: 'Steel, PVC, copper pipes' },
    { name: 'Valves', type: 'piping' as const, description: 'Ball valves, gate valves, check valves' },
    { name: 'Fittings', type: 'piping' as const, description: 'Elbows, tees, couplings' },
    { name: 'Clamps', type: 'piping' as const, description: 'Pipe clamps, hose clamps' },
    { name: 'Hoses', type: 'piping' as const, description: 'Hydraulic, pneumatic, water hoses' },
    { name: 'Flanges', type: 'piping' as const, description: 'Weld neck, slip-on, blind flanges' },
    
    // Electrical
    { name: 'Electrical', type: 'electrical' as const, description: 'General electrical components and parts' },
    { name: 'Wires', type: 'electrical' as const, description: 'Copper wires, cables' },
    { name: 'Circuit Breakers', type: 'electrical' as const, description: 'MCBs, MCCBs, RCCBs' },
    { name: 'Switches', type: 'electrical' as const, description: 'Toggle, push button, limit switches' },
    { name: 'Relays', type: 'electrical' as const, description: 'Control relays, contactors' },
    { name: 'Connectors', type: 'electrical' as const, description: 'Terminal blocks, wire connectors' },
    { name: 'Fuses', type: 'electrical' as const, description: 'Cartridge, blade, resettable fuses' },
    { name: 'Motors', type: 'electrical' as const, description: 'AC motors, DC motors, servo motors' },
    
    // Specialty
    { name: 'General', type: 'specialty' as const, description: 'General purpose and miscellaneous parts' },
    { name: 'Pumps', type: 'specialty' as const, description: 'Centrifugal, positive displacement pumps' },
    { name: 'Hydraulics', type: 'specialty' as const, description: 'Hydraulic cylinders, power units' },
    { name: 'Pneumatics', type: 'specialty' as const, description: 'Air cylinders, valves, FRLs' },
    { name: 'Filters', type: 'specialty' as const, description: 'Oil, air, water filters' },
    { name: 'Sensors', type: 'specialty' as const, description: 'Proximity, temperature, pressure sensors' },
    { name: 'PLCs', type: 'specialty' as const, description: 'Programmable logic controllers' },
    { name: 'Drives', type: 'specialty' as const, description: 'VFDs, servo drives' }
  ]
  
  const insertedCategories = await db.insert(categories).values(categoryData).returning()
  
  // Create category lookup
  const categoryMap = new Map(insertedCategories.map(c => [c.name, c.id]))
  
  // Seed sample parts
  const sampleParts = [
    // Mechanical
    { name: 'M8x30 Hex Bolt', partNumber: 'BLT-M8-30', boxNumber: 'A1-01', quantity: 150, categoryId: categoryMap.get('Bolts')!, minQuantity: 50 },
    { name: 'M10x50 Hex Bolt', partNumber: 'BLT-M10-50', boxNumber: 'A1-02', quantity: 80, categoryId: categoryMap.get('Bolts')!, minQuantity: 30 },
    { name: 'M8 Hex Nut', partNumber: 'NUT-M8', boxNumber: 'A2-01', quantity: 200, categoryId: categoryMap.get('Nuts')!, minQuantity: 100 },
    { name: 'M8 Lock Washer', partNumber: 'WSH-M8-LK', boxNumber: 'A3-01', quantity: 3, categoryId: categoryMap.get('Washers')!, minQuantity: 50 },
    { name: '6205 Ball Bearing', partNumber: 'BRG-6205', boxNumber: 'B1-01', quantity: 12, categoryId: categoryMap.get('Bearings')!, minQuantity: 5 },
    { name: '6308 Ball Bearing', partNumber: 'BRG-6308', boxNumber: 'B1-02', quantity: 0, categoryId: categoryMap.get('Bearings')!, minQuantity: 5 },
    
    // Piping
    { name: '1" Ball Valve', partNumber: 'VLV-BL-1', boxNumber: 'C1-01', quantity: 8, categoryId: categoryMap.get('Valves')!, minQuantity: 5 },
    { name: '2" Gate Valve', partNumber: 'VLV-GT-2', boxNumber: 'C1-02', quantity: 4, categoryId: categoryMap.get('Valves')!, minQuantity: 3 },
    { name: '1" 90° Elbow', partNumber: 'FIT-ELB-1', boxNumber: 'C2-01', quantity: 25, categoryId: categoryMap.get('Fittings')!, minQuantity: 10 },
    { name: '1/2" Hydraulic Hose 2m', partNumber: 'HSE-HYD-05-2', boxNumber: 'C3-01', quantity: 6, categoryId: categoryMap.get('Hoses')!, minQuantity: 5 },
    
    // Electrical
    { name: '20A Circuit Breaker', partNumber: 'CB-20A', boxNumber: 'D1-01', quantity: 15, categoryId: categoryMap.get('Circuit Breakers')!, minQuantity: 5 },
    { name: 'Limit Switch', partNumber: 'SW-LMT-01', boxNumber: 'D2-01', quantity: 10, categoryId: categoryMap.get('Switches')!, minQuantity: 5 },
    { name: '24V Control Relay', partNumber: 'RLY-24V', boxNumber: 'D3-01', quantity: 20, categoryId: categoryMap.get('Relays')!, minQuantity: 10 },
    { name: '10A Fuse', partNumber: 'FUS-10A', boxNumber: 'D4-01', quantity: 2, categoryId: categoryMap.get('Fuses')!, minQuantity: 20 },
    
    // Specialty
    { name: 'Oil Filter Element', partNumber: 'FLT-OIL-01', boxNumber: 'E1-01', quantity: 8, categoryId: categoryMap.get('Filters')!, minQuantity: 5 },
    { name: 'Proximity Sensor NPN', partNumber: 'SNS-PRX-NPN', boxNumber: 'E2-01', quantity: 6, categoryId: categoryMap.get('Sensors')!, minQuantity: 5 },
    { name: 'Air Filter 1/4"', partNumber: 'FLT-AIR-025', boxNumber: 'E1-02', quantity: 0, categoryId: categoryMap.get('Filters')!, minQuantity: 5 },
    { name: 'Pneumatic Cylinder 50x100', partNumber: 'CYL-PN-50-100', boxNumber: 'E3-01', quantity: 3, categoryId: categoryMap.get('Pneumatics')!, minQuantity: 2 }
  ]
  
  for (const part of sampleParts) {
    const status = part.quantity === 0 ? 'out_of_stock' : part.quantity < part.minQuantity ? 'low_stock' : 'in_stock'
    await db.insert(parts).values({
      ...part,
      status,
      createdBy: admin.id,
      description: `Sample part: ${part.name}`
    })
  }
  
  console.log('Database seeded successfully!')
  console.log(`- Created ${insertedCategories.length} categories`)
  console.log(`- Created ${sampleParts.length} sample parts`)
  console.log('- Default admin: ADMIN001 / admin123')
}
