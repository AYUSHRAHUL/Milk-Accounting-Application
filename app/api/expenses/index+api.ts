import connectToDatabase from '@/lib/mongodb';
import { Expense } from '@/models/Expense';

export async function GET(request: Request) {
    try {
        await connectToDatabase();

        // Fetch all expenses, sorted newest first
        const expenses = await Expense.find({}).sort({ date: -1, createdAt: -1 });

        return new Response(JSON.stringify(expenses), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        console.error('Fetch Expenses Error:', error);
        return new Response(JSON.stringify({ message: error.message || 'Internal Server Error' }), { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await connectToDatabase();
        const body = await request.json();

        const { userId, date, category, description, amount, paymentMode } = body;

        // Validation
        if (!userId || !date || !category || !description || amount === undefined || !paymentMode) {
            return new Response(JSON.stringify({ message: 'Missing mandatory fields' }), { status: 400 });
        }

        const parsedAmount = parseFloat(amount);

        if (parsedAmount <= 0) {
            return new Response(JSON.stringify({ message: 'Amount must be greater than zero' }), { status: 400 });
        }

        // Save Expense
        const newExpense = new Expense({
            userId,
            date,
            category,
            description,
            amount: parsedAmount,
            paymentMode,
        });

        await newExpense.save();

        return new Response(JSON.stringify({
            message: 'Expense recorded successfully',
            expense: newExpense
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('Create Expense Error:', error);
        return new Response(JSON.stringify({ message: error.message || 'Internal Server Error' }), { status: 500 });
    }
}
