import connectToDatabase from '@/lib/mongodb';
import { Supplier } from '@/models/Supplier';

// GET single supplier
export async function GET(request: Request, context: { params: { id: string } }) {
    try {
        await connectToDatabase();
        // Fallback for context.params being undefined in some environments
        const id = context?.params?.id || request.url.split('/').pop()?.split('?')[0];
        console.log('[API] Fetching supplier for ID:', id);

        if (!id || id === 'suppliers') {
            return new Response(JSON.stringify({ message: 'Supplier ID is required or invalid' }), { status: 400 });
        }

        let supplier = await Supplier.findById(id).catch((err) => {
            console.log('[API] findById failed, likely invalid format:', err.message);
            return null;
        });

        // Fallback: try to find by the user-facing supplierId if _id lookup fails
        if (!supplier) {
            console.log('[API] Trying fallback findOne for supplierId:', id);
            supplier = await Supplier.findOne({ supplierId: id, isActive: true });
        }

        if (!supplier) {
            console.log('[API] Supplier NOT found in DB for ID:', id);
            return new Response(JSON.stringify({ message: `Supplier not found for ID: ${id}` }), { status: 404 });
        }

        console.log('[API] Supplier found:', supplier.name);

        return new Response(JSON.stringify(supplier), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        console.error('Fetch Supplier Error:', error);
        return new Response(JSON.stringify({ message: error.message || 'Internal Server Error' }), { status: 500 });
    }
}

// UPDATE supplier
export async function PUT(request: Request, context: { params: { id: string } }) {
    try {
        await connectToDatabase();
        const id = context?.params?.id || request.url.split('/').pop()?.split('?')[0];
        const body = await request.json();

        if (!id || id === 'suppliers') {
            return new Response(JSON.stringify({ message: 'Supplier ID is required or invalid' }), { status: 400 });
        }

        // Check for duplicate supplierId if it's being updated
        if (body.supplierId) {
            const existingWithSameId = await Supplier.findOne({ 
                supplierId: body.supplierId, 
                _id: { $ne: id },
                isActive: true
            });
            if (existingWithSameId) {
                return new Response(JSON.stringify({ message: 'already Exist' }), {
                    status: 409,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
        }

        const updatedSupplier = await Supplier.findByIdAndUpdate(
            id,
            { $set: body },
            { new: true, runValidators: true }
        );

        if (!updatedSupplier) {
            return new Response(JSON.stringify({ message: 'Supplier not found' }), { status: 404 });
        }

        return new Response(JSON.stringify({ message: 'Supplier updated successfully', supplier: updatedSupplier }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        console.error('Update Supplier Error:', error);
        return new Response(JSON.stringify({ message: error.message || 'Internal Server Error' }), { status: 500 });
    }
}

// DELETE supplier (Soft delete by setting isActive to false)
export async function DELETE(request: Request, context: { params: { id: string } }) {
    try {
        await connectToDatabase();
        const id = context?.params?.id || request.url.split('/').pop()?.split('?')[0];

        if (!id || id === 'suppliers') {
            return new Response(JSON.stringify({ message: 'Supplier ID is required or invalid' }), { status: 400 });
        }

        // We use soft delete to maintain referential integrity with past MilkEntries
        const deletedSupplier = await Supplier.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true }
        );

        if (!deletedSupplier) {
            return new Response(JSON.stringify({ message: 'Supplier not found' }), { status: 404 });
        }

        return new Response(JSON.stringify({ message: 'Supplier removed successfully' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        console.error('Delete Supplier Error:', error);
        return new Response(JSON.stringify({ message: error.message || 'Internal Server Error' }), { status: 500 });
    }
}
