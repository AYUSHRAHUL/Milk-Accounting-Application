import connectToDatabase from '@/lib/mongodb';
import { Supplier } from '@/models/Supplier';

// GET all suppliers
export async function GET(request: Request) {
    try {
        await connectToDatabase();

        // In a real app, you'd extract userId from session/token
        // const userId = getUserIdFromToken(request);
        const suppliers = await Supplier.find({ isActive: true }).sort({ createdAt: -1 });

        return new Response(JSON.stringify(suppliers), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        console.error('Fetch Suppliers Error:', error);
        return new Response(JSON.stringify({ message: error.message || 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

// CREATE new supplier
export async function POST(request: Request) {
    try {
        await connectToDatabase();
        const body = await request.json();

        const { userId, supplierId, name, phone, address, animalType, bankDetails } = body;

        if (!userId || !supplierId || !name || !phone || !address || !animalType) {
            return new Response(JSON.stringify({ message: 'Missing required fields' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const newSupplier = new Supplier({
            userId,
            supplierId,
            name,
            phone,
            address,
            animalType,
            bankDetails,
        });

        await newSupplier.save();

        return new Response(JSON.stringify({ message: 'Supplier created successfully', supplier: newSupplier }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        console.error('Create Supplier Error:', error);
        return new Response(JSON.stringify({ message: error.message || 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
