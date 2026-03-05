import connectToDatabase from '@/lib/mongodb';
import { Expense } from '@/models/Expense';
import { MilkEntry } from '@/models/MilkEntry';
import { SaleEntry } from '@/models/SaleEntry';

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

        // 1. Calculate Total Revenue (Sales)
        const salesResult = await SaleEntry.aggregate([
            { $match: dateQuery },
            { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
        ]);
        const totalRevenue = salesResult[0]?.totalRevenue || 0;

        // 2. Calculate Milk Cost (Raw materials)
        const milkResult = await MilkEntry.aggregate([
            { $match: dateQuery },
            { $group: { _id: null, totalCost: { $sum: '$totalCost' } } }
        ]);
        const totalMilkCost = milkResult[0]?.totalCost || 0;

        // 3. Calculate Expenses (Overhead)
        const expensesResult = await Expense.aggregate([
            { $match: dateQuery },
            { $group: { _id: null, totalExpenses: { $sum: '$amount' } } }
        ]);
        const totalExpenses = expensesResult[0]?.totalExpenses || 0;

        // 4. Calculate Net Profit
        const netProfit = totalRevenue - (totalMilkCost + totalExpenses);

        return new Response(JSON.stringify({
            totalRevenue,
            totalMilkCost,
            totalExpenses,
            netProfit,
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('Fetch Reports Error:', error);
        return new Response(JSON.stringify({ message: error.message || 'Internal Server Error' }), { status: 500 });
    }
}
