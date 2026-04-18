import mongoose from 'mongoose';

const uri = 'mongodb+srv://admin:admin123@cluster0.0vixq.mongodb.net/milk_accounting?retryWrites=true&w=majority';

async function checkDB() {
    try {
        await mongoose.connect(uri);
        const MilkEntry = mongoose.models.MilkEntry || mongoose.model('MilkEntry', new mongoose.Schema({}, { strict: false }));
        const ProductionEntry = mongoose.models.ProductionEntry || mongoose.model('ProductionEntry', new mongoose.Schema({}, { strict: false }));

        const milk = await MilkEntry.find({}).lean();
        const prod = await ProductionEntry.find({}).lean();

        console.log('--- MILK ENTRIES ---');
        console.log(JSON.stringify(milk, null, 2));
        console.log('--- PROD ENTRIES ---');
        console.log(JSON.stringify(prod, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkDB();
