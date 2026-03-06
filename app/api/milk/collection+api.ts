import connectToDatabase from '@/lib/mongodb';
import { MilkEntry } from '@/models/MilkEntry';

export async function GET(request: Request) {
    try {
        await connectToDatabase();

        // Fetch all milk entries, sorted newest first
        const entries = await MilkEntry.find({}).sort({ date: -1, createdAt: -1 });

        return new Response(JSON.stringify(entries), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        console.error('Fetch Milk Entries Error:', error);
        return new Response(JSON.stringify({ message: error.message || 'Internal Server Error' }), { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await connectToDatabase();
        const body = await request.json();

        const { userId, supplier, date, shift, source, customSource, fatType, snf, clr, quantity, costPerLiter, totalCost } = body;

        if (!userId || !supplier || !date || !shift || !source || !fatType || !quantity || !costPerLiter || !totalCost) {
            return new Response(JSON.stringify({ message: 'Missing required fields' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const newEntry = new MilkEntry({
            userId,
            supplier,
            date,
            shift,
            source,
            customSource,
            fatType,
            snf,
            clr,
            quantity,
            costPerLiter,
            totalCost,
        });

        await newEntry.save();

        return new Response(JSON.stringify({ message: 'Milk entry saved successfully', entry: newEntry }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('Save Milk Entry Error:', error);
        return new Response(JSON.stringify({ message: error.message || 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
