import connectToDatabase from '@/lib/mongodb';
import { MilkEntry } from '@/models/MilkEntry';
import { ProductionEntry } from '@/models/ProductionEntry';
import { SaleEntry } from '@/models/SaleEntry';
import { Supplier } from '@/models/Supplier';

export async function GET(request: Request) {
    try {
        await connectToDatabase();

        const url = new URL(request.url);
        const filter = url.searchParams.get('filter') || 'all'; // all, month, today

        // Define date boundaries
        const now = new Date();
        let startDate = new Date(0); // Default to beginning of time

        if (filter === 'month') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (filter === 'today') {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        }

        const dateQuery = filter === 'all' ? {} : { createdAt: { $gte: startDate } };
        // Milk collections use 'date' field in the schema instead of implicit createdAt
        const milkDateQuery = filter === 'all' ? {} : { date: { $gte: startDate } };

        // 1. Sales Metrics
        const salesResult = await SaleEntry.aggregate([
            { $match: dateQuery },
            { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' }, totalTransactions: { $sum: 1 } } }
        ]);
        const sales = {
            revenue: salesResult[0]?.totalRevenue || 0,
            transactions: salesResult[0]?.totalTransactions || 0
        };

        // 2. Milk Collection Metrics
        const milkResult = await MilkEntry.aggregate([
            { $match: milkDateQuery },
            { $group: { _id: null, totalCost: { $sum: '$totalCost' }, totalLiters: { $sum: '$quantity' } } }
        ]);
        const milkCollection = {
            cost: milkResult[0]?.totalCost || 0,
            liters: milkResult[0]?.totalLiters || 0
        };

        // 3. Products Metrics
        const productsResult = await ProductionEntry.aggregate([
            { $match: dateQuery },
            { $group: { _id: null, totalProduced: { $sum: '$quantityProduced' }, totalBatches: { $sum: 1 } } }
        ]);
        const products = {
            produced: productsResult[0]?.totalProduced || 0,
            batches: productsResult[0]?.totalBatches || 0
        };

        // 4. Suppliers Metrics (Date query applied to creation date if tracking join date)
        const activeSuppliers = await Supplier.countDocuments(dateQuery);
        const totalSuppliers = await Supplier.countDocuments(); // Fallback for overall context

        return new Response(JSON.stringify({
            sales,
            milkCollection,
            products,
            suppliers: {
                active: activeSuppliers,
                total: totalSuppliers
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('Fetch Reports Error:', error);
        return new Response(JSON.stringify({ message: error.message || 'Internal Server Error' }), { status: 500 });
    }
}
