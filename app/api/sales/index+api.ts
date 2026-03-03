import connectToDatabase from '@/lib/mongodb';
import { ProductionEntry } from '@/models/ProductionEntry';
import { SaleEntry } from '@/models/SaleEntry';

export async function GET(request: Request) {
    try {
        await connectToDatabase();
        const url = new URL(request.url);
        const productType = url.searchParams.get('productType');

        if (!productType) {
            return new Response(JSON.stringify({ message: 'Product type is required to check stock' }), { status: 400 });
        }

        // Calculate total produced
        const productionResult = await ProductionEntry.aggregate([
            { $match: { productType } },
            { $group: { _id: null, totalProduced: { $sum: '$quantityProduced' } } }
        ]);

        // Calculate total sold
        const salesResult = await SaleEntry.aggregate([
            { $match: { productType } },
            { $group: { _id: null, totalSold: { $sum: '$quantity' } } }
        ]);

        const totalProduced = productionResult[0]?.totalProduced || 0;
        const totalSold = salesResult[0]?.totalSold || 0;
        const availableStock = totalProduced - totalSold;

        return new Response(JSON.stringify({ availableStock }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('Stock Check Error:', error);
        return new Response(JSON.stringify({ message: error.message || 'Internal Server Error' }), { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await connectToDatabase();
        const body = await request.json();

        const { userId, date, customerName, productType, quantity, pricePerUnit, totalAmount, paymentMode } = body;

        // Validation
        if (!userId || !date || !productType || quantity === undefined || pricePerUnit === undefined || totalAmount === undefined || !paymentMode) {
            return new Response(JSON.stringify({ message: 'Missing mandatory fields' }), { status: 400 });
        }

        const parsedQuantity = parseFloat(quantity);

        if (parsedQuantity <= 0) {
            return new Response(JSON.stringify({ message: 'Quantity must be greater than zero' }), { status: 400 });
        }

        // --- Stock Validation ---
        // 1. Calculate how much of this specific product has been produced.
        const productionResult = await ProductionEntry.aggregate([
            { $match: { productType } },
            { $group: { _id: null, totalProduced: { $sum: '$quantityProduced' } } }
        ]);

        // 2. Calculate how much has ALREADY been sold.
        const salesResult = await SaleEntry.aggregate([
            { $match: { productType } },
            { $group: { _id: null, totalSold: { $sum: '$quantity' } } }
        ]);

        const totalProduced = productionResult[0]?.totalProduced || 0;
        const totalSold = salesResult[0]?.totalSold || 0;
        const availableStock = totalProduced - totalSold;

        // 3. Reject if trying to sell more than what exists in stock.
        if (availableStock < parsedQuantity) {
            return new Response(
                JSON.stringify({
                    message: `Insufficient stock! You only have ${availableStock.toFixed(2)} units of ${productType} available.`,
                    availableStock
                }),
                {
                    status: 422,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Save Sale
        const newSale = new SaleEntry({
            userId,
            date,
            customerName,
            productType,
            quantity: parsedQuantity,
            pricePerUnit: parseFloat(pricePerUnit),
            totalAmount: parseFloat(totalAmount),
            paymentMode,
        });

        await newSale.save();

        return new Response(JSON.stringify({
            message: 'Sale recorded successfully',
            sale: newSale,
            remainingStock: availableStock - parsedQuantity
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('Create Sale Error:', error);
        return new Response(JSON.stringify({ message: error.message || 'Internal Server Error' }), { status: 500 });
    }
}
