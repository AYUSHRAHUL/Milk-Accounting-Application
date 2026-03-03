import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, password } = body;

        if (!name || !email || !password) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await connectToDatabase();

        // Check if user exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return Response.json({ error: 'User already exists' }, { status: 409 });
        }

        // Create a new user 
        // SECURITY NOTE: In production, always hash the password using bcrypt.
        const newUser = await User.create({
            name,
            email: email.toLowerCase(),
            password, // Store as plain text only for learning/demo purposes
        });

        return Response.json({
            message: 'User registered successfully',
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
            }
        }, { status: 201 });

    } catch (error: any) {
        console.error('Registration Error:', error);
        return Response.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
