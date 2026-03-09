import connectToDatabase from '@/lib/mongodb';
import { MilkEntry } from '@/models/MilkEntry';
import { ProductionEntry } from '@/models/ProductionEntry';
import { SaleEntry } from '@/models/SaleEntry';

export async function GET(request: Request) {
    try {
        await connectToDatabase();

        // 1. Fetch data from all modules
        // In a real production app, we would filter by userId from auth context/session
        const [milkEntries, saleEntries, productionEntries] = await Promise.all([
            MilkEntry.find({}).lean(),
            SaleEntry.find({}).lean(),
            ProductionEntry.find({}).lean(),
        ]);

        // 2. Map into a unified format
        const unifiedData: any[] = [];

        // Map Milk Entries
        milkEntries.forEach((entry: any) => {
            unifiedData.push({
                _id: entry._id.toString(),
                date: entry.date,
                type: 'Milk Collection',
                category: entry.source === 'Other' ? (entry.customSource || 'Other') : entry.source,
                details: `Supplier: ${entry.supplier} (${entry.shift})`,
                quantity: entry.quantity,
                amount: entry.totalCost,
                currency: '₹',
                unit: 'L'
            });
        });

        // Map Sale Entries
        saleEntries.forEach((entry: any) => {
            unifiedData.push({
                _id: entry._id.toString(),
                date: entry.date,
                type: 'Sale',
                category: entry.productType,
                details: entry.customerName ? `Customer: ${entry.customerName}` : 'Retail',
                quantity: entry.quantity,
                amount: entry.totalAmount,
                currency: '₹',
                unit: 'Units'
            });
        });

        // Map Production Entries
        productionEntries.forEach((entry: any) => {
            unifiedData.push({
                _id: entry._id.toString(),
                date: entry.date,
                type: 'Production',
                category: entry.productType,
                details: `Source: ${entry.source}`,
                quantity: entry.quantityProduced,
                amount: 0, // No direct amount for production in this model
                currency: '₹',
                unit: 'Units'
            });
        });

        // 3. Sort by date (descending)
        unifiedData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return new Response(JSON.stringify(unifiedData), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('Fetch Detailed Reports Error:', error);
        return new Response(JSON.stringify({ message: error.message || 'Internal Server Error' }), { status: 500 });
    }
}
