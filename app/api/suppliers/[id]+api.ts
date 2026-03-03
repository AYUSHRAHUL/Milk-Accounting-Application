import connectToDatabase from '@/lib/mongodb';
import { Supplier } from '@/models/Supplier';

// GET single supplier
export async function GET(request: Request, context: { params: { id: string } }) {
    try {
        await connectToDatabase();
        const { id } = context.params;

        if (!id) {
            return new Response(JSON.stringify({ message: 'Supplier ID is required' }), { status: 400 });
        }

        const supplier = await Supplier.findById(id);

        if (!supplier) {
            return new Response(JSON.stringify({ message: 'Supplier not found' }), { status: 404 });
        }

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
        const { id } = context.params;
        const body = await request.json();

        if (!id) {
            return new Response(JSON.stringify({ message: 'Supplier ID is required' }), { status: 400 });
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
        const { id } = context.params;

        if (!id) {
            return new Response(JSON.stringify({ message: 'Supplier ID is required' }), { status: 400 });
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
