import connectToDatabase from '@/lib/mongodb';
import { MilkEntry } from '@/models/MilkEntry';
import { ProductionEntry } from '@/models/ProductionEntry';

export async function GET(request: Request) {
    try {
        await connectToDatabase();
        const url = new URL(request.url);
        const source = url.searchParams.get('source');
        const fatType = url.searchParams.get('fatType');

        if (!source || !fatType) {
            return new Response(JSON.stringify({ message: 'Source and Fat Type are required' }), { status: 400 });
        }

        const collectedMilk = await MilkEntry.aggregate([
            { $match: { source, fatType } },
            { $group: { _id: null, total: { $sum: '$quantity' } } }
        ]);
        const totalCollected = collectedMilk.length > 0 ? collectedMilk[0].total : 0;

        const usedMilk = await ProductionEntry.aggregate([
            { $match: { source, fatType } },
            { $group: { _id: null, total: { $sum: '$milkUsedLiters' } } }
        ]);
        const totalUsed = usedMilk.length > 0 ? usedMilk[0].total : 0;

        return new Response(JSON.stringify({ availableStock: totalCollected - totalUsed }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ message: 'Error checking stock' }), { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await connectToDatabase();
        const body = await request.json();

        const { userId, date, productType, source, fatType, milkUsedLiters, quantityProduced } = body;

        // Better validation to allow 0 values and log exact missing parts
        const missingFields = [];
        if (!userId) missingFields.push('userId');
        if (!date) missingFields.push('date');
        if (!productType) missingFields.push('productType');
        if (!source) missingFields.push('source');
        if (!fatType) missingFields.push('fatType');
        if (milkUsedLiters === undefined || isNaN(milkUsedLiters)) missingFields.push('milkUsedLiters');
        if (quantityProduced === undefined || isNaN(quantityProduced)) missingFields.push('quantityProduced');

        if (missingFields.length > 0) {
            console.error("Missing fields:", missingFields, "Body:", body);
            return new Response(JSON.stringify({ message: `Missing required fields: ${missingFields.join(', ')}` }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // 1. Calculate Total Milk Collected for this source & fatType
        const collectedMilk = await MilkEntry.aggregate([
            { $match: { source, fatType } },
            { $group: { _id: null, total: { $sum: '$quantity' } } }
        ]);
        const totalCollected = collectedMilk.length > 0 ? collectedMilk[0].total : 0;

        // 2. Calculate Total Milk Already Used in Production for this source & fatType
        const usedMilk = await ProductionEntry.aggregate([
            { $match: { source, fatType } },
            { $group: { _id: null, total: { $sum: '$milkUsedLiters' } } }
        ]);
        const totalUsed = usedMilk.length > 0 ? usedMilk[0].total : 0;

        // 3. Check Available Stock
        const availableStock = totalCollected - totalUsed;
        console.log(`[Stock Check] Source: ${source}, Fat: ${fatType} | Collected: ${totalCollected}, Used: ${totalUsed} => Available: ${availableStock} | Requested: ${milkUsedLiters}`);

        if (milkUsedLiters > availableStock) {
            console.error(`[Stock Check Failed] User requested ${milkUsedLiters}L but only ${availableStock}L is available.`);
            return new Response(JSON.stringify({
                message: `Insufficient milk stock. You only have ${availableStock.toFixed(2)}L of ${fatType} ${source} milk available.`
            }), {
                status: 422,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // 4. Save the Production Entry
        const newEntry = new ProductionEntry({
            userId,
            date,
            productType,
            source,
            fatType,
            milkUsedLiters,
            quantityProduced,
        });

        await newEntry.save();

        return new Response(JSON.stringify({
            message: 'Production entry saved successfully!',
            entry: newEntry,
            remainingStock: availableStock - milkUsedLiters
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('Save Production Entry Error:', error);
        return new Response(JSON.stringify({ message: error.message || 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
