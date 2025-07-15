import { prisma } from '../lib/prisma'

async function checkTables() {
    try {
        // Execute raw query to show all tables
        const tables = await prisma.$queryRaw`SHOW TABLES`
        console.log('Available tables:', tables)

        // Try to query the temp_carts table
        const carts = await prisma.tempCart.findMany({
            take: 1
        })
        console.log('TempCart query result:', carts)
    } catch (error) {
        console.error('Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

checkTables() 