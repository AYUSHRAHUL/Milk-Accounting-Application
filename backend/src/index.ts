import 'dotenv/config';
import mongoose from 'mongoose';
import cors from 'cors';
import express from 'express';
import bcrypt from 'bcryptjs';

import { connectToDatabase } from './db';
import { User } from './models/User';
import { Supplier } from './models/Supplier';
import { MilkEntry } from './models/MilkEntry';
import { ProductionEntry } from './models/ProductionEntry';
import { SaleEntry } from './models/SaleEntry';
import { MilkProduction } from './models/MilkProduction';

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// --- Auth ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body ?? {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await connectToDatabase();

    const existingUser = await User.findOne({ email: String(email).toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: 'already existed' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(String(password), salt);

    const newUser = await User.create({
      name,
      email: String(email).toLowerCase(),
      passwordHash,
    });

    return res.status(201).json({
      message: 'User registered successfully',
      user: { id: newUser._id, name: newUser.name, email: newUser.email },
    });
  } catch (error: any) {
    console.error('Registration Error:', error);
    return res.status(500).json({ error: error?.message || 'Internal Server Error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    await connectToDatabase();

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    let isMatch = false;
    if (user.passwordHash) {
      isMatch = await bcrypt.compare(String(password), user.passwordHash);
    } else if ((user as any).password) {
      isMatch = (user as any).password === password;
    }

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    return res.status(200).json({
      message: 'Login successful',
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error: any) {
    console.error('Login Error:', error);
    return res.status(500).json({ error: error?.message || 'Internal Server Error' });
  }
});

// --- Suppliers ---
app.get('/api/suppliers', async (_req, res) => {
  try {
    await connectToDatabase();
    const suppliers = await Supplier.find({ isActive: true }).sort({ createdAt: -1 });
    return res.status(200).json(suppliers);
  } catch (error: any) {
    console.error('Fetch Suppliers Error:', error);
    return res.status(500).json({ message: error?.message || 'Internal Server Error' });
  }
});

app.post('/api/suppliers', async (req, res) => {
  try {
    await connectToDatabase();
    const { userId, supplierId, name, phone, address, animalType, bankDetails } = req.body ?? {};

    if (!userId || !supplierId || !name || !phone || !address || !animalType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existingSupplier = await Supplier.findOne({ supplierId, isActive: true });
    if (existingSupplier) {
      return res.status(409).json({ message: 'already Exist' });
    }

    const newSupplier = new Supplier({ userId, supplierId, name, phone, address, animalType, bankDetails });
    await newSupplier.save();
    return res.status(201).json({ message: 'Supplier created successfully', supplier: newSupplier });
  } catch (error: any) {
    console.error('Create Supplier Error:', error);
    return res.status(500).json({ message: error?.message || 'Internal Server Error' });
  }
});

app.get('/api/suppliers/:id', async (req, res) => {
  try {
    await connectToDatabase();
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: 'Supplier ID is required or invalid' });

    let supplier = await Supplier.findById(id).catch(() => null);
    if (!supplier) {
      supplier = await Supplier.findOne({ supplierId: id, isActive: true });
    }
    if (!supplier) return res.status(404).json({ message: `Supplier not found for ID: ${id}` });
    return res.status(200).json(supplier);
  } catch (error: any) {
    console.error('Fetch Supplier Error:', error);
    return res.status(500).json({ message: error?.message || 'Internal Server Error' });
  }
});

app.put('/api/suppliers/:id', async (req, res) => {
  try {
    await connectToDatabase();
    const id = req.params.id;
    const body = req.body ?? {};
    if (!id) return res.status(400).json({ message: 'Supplier ID is required or invalid' });

    if (body.supplierId) {
      const existingWithSameId = await Supplier.findOne({
        supplierId: body.supplierId,
        _id: { $ne: id },
        isActive: true,
      });
      if (existingWithSameId) return res.status(409).json({ message: 'already Exist' });
    }

    const updatedSupplier = await Supplier.findByIdAndUpdate(id, { $set: body }, { new: true, runValidators: true });
    if (!updatedSupplier) return res.status(404).json({ message: 'Supplier not found' });
    return res.status(200).json({ message: 'Supplier updated successfully', supplier: updatedSupplier });
  } catch (error: any) {
    console.error('Update Supplier Error:', error);
    return res.status(500).json({ message: error?.message || 'Internal Server Error' });
  }
});

app.delete('/api/suppliers/:id', async (req, res) => {
  try {
    await connectToDatabase();
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: 'Supplier ID is required or invalid' });

    const deletedSupplier = await Supplier.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!deletedSupplier) return res.status(404).json({ message: 'Supplier not found' });
    return res.status(200).json({ message: 'Supplier removed successfully' });
  } catch (error: any) {
    console.error('Delete Supplier Error:', error);
    return res.status(500).json({ message: error?.message || 'Internal Server Error' });
  }
});

// --- Milk collection ---
app.get('/api/milk/collection', async (_req, res) => {
  try {
    await connectToDatabase();
    const entries = await MilkEntry.find({}).sort({ date: -1, createdAt: -1 });
    return res.status(200).json(entries);
  } catch (error: any) {
    console.error('Fetch Milk Entries Error:', error);
    return res.status(500).json({ message: error?.message || 'Internal Server Error' });
  }
});

app.post('/api/milk/collection', async (req, res) => {
  try {
    await connectToDatabase();
    const body = req.body ?? {};
    const { userId, supplier, date, shift, source, customSource, fatType, snf, clr, quantity, costPerLiter, totalCost } =
      body;

    if (!userId || !supplier || !date || !shift || !source || !fatType || !quantity || !costPerLiter || !totalCost) {
      return res.status(400).json({ message: 'Missing required fields' });
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
    return res.status(201).json({ message: 'Milk entry saved successfully', entry: newEntry });
  } catch (error: any) {
    console.error('Save Milk Entry Error:', error);
    return res.status(500).json({ message: error?.message || 'Internal Server Error' });
  }
});

app.delete('/api/milk/collection/:id', async (req, res) => {
  try {
    await connectToDatabase();
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: 'Milk Entry ID is required' });

    const deletedEntry = await MilkEntry.findByIdAndDelete(id);
    if (!deletedEntry) return res.status(404).json({ error: 'Milk Entry not found' });
    return res.status(200).json({ message: 'Milk Entry deleted successfully' });
  } catch (error: any) {
    console.error('DELETE Milk Entry Error:', error);
    return res.status(500).json({ error: error?.message || 'Internal Server Error' });
  }
});

// --- Products / Production ---
app.get('/api/products/production', async (req, res) => {
  try {
    await connectToDatabase();
    const source = typeof req.query.source === 'string' ? req.query.source : null;
    const userId = typeof req.query.userId === 'string' ? req.query.userId : null;

    if (source && userId) {
      const collectedMilk = await MilkEntry.aggregate([
        { $match: { userId, source } },
        { $group: { _id: null, total: { $sum: '$quantity' } } },
      ]);
      const totalCollected = collectedMilk.length > 0 ? collectedMilk[0].total : 0;

      const usedMilk = await ProductionEntry.aggregate([
        { $match: { userId, source } },
        { $group: { _id: null, total: { $sum: '$milkUsedLiters' } } },
      ]);
      const totalUsed = usedMilk.length > 0 ? usedMilk[0].total : 0;

      return res.status(200).json({ availableStock: totalCollected - totalUsed, totalCollected, totalUsed });
    }

    const filter = userId ? { userId } : {};
    const entries = await ProductionEntry.find(filter).sort({ date: -1, createdAt: -1 });
    return res.status(200).json(entries);
  } catch (error: any) {
    console.error('Error fetching production/stock:', error);
    return res.status(500).json({ message: 'Error checking stock' });
  }
});

app.post('/api/products/production', async (req, res) => {
  try {
    await connectToDatabase();
    const body = req.body ?? {};
    const { userId, date, productType, source, fatType, milkUsedLiters, quantityProduced } = body;

    const missingFields: string[] = [];
    if (!userId) missingFields.push('userId');
    if (!date) missingFields.push('date');
    if (!productType) missingFields.push('productType');
    if (!source) missingFields.push('source');
    if (!fatType) missingFields.push('fatType');
    if (milkUsedLiters === undefined || Number.isNaN(Number(milkUsedLiters))) missingFields.push('milkUsedLiters');
    if (quantityProduced === undefined || Number.isNaN(Number(quantityProduced))) missingFields.push('quantityProduced');

    if (missingFields.length > 0) {
      return res.status(400).json({ message: `Missing required fields: ${missingFields.join(', ')}` });
    }

    const collectedMilk = await MilkEntry.aggregate([
      { $match: { userId, source } },
      { $group: { _id: null, total: { $sum: '$quantity' } } },
    ]);
    const totalCollected = collectedMilk.length > 0 ? collectedMilk[0].total : 0;

    const usedMilk = await ProductionEntry.aggregate([
      { $match: { userId, source } },
      { $group: { _id: null, total: { $sum: '$milkUsedLiters' } } },
    ]);
    const totalUsed = usedMilk.length > 0 ? usedMilk[0].total : 0;

    const availableStock = totalCollected - totalUsed;
    const requested = Number(milkUsedLiters);
    if (requested > availableStock) {
      return res.status(422).json({
        message: `Insufficient milk stock. You only have ${availableStock.toFixed(2)}L of ${source} milk available in your collection.`,
      });
    }

    const newEntry = new ProductionEntry({
      userId,
      date,
      productType,
      source,
      fatType,
      milkUsedLiters: requested,
      quantityProduced: Number(quantityProduced),
    });
    await newEntry.save();

    return res.status(201).json({
      message: 'Production entry saved successfully!',
      entry: newEntry,
      remainingStock: availableStock - requested,
    });
  } catch (error: any) {
    console.error('Save Production Entry Error:', error);
    return res.status(500).json({ message: error?.message || 'Internal Server Error' });
  }
});

// --- Milk Separation (Production) ---
app.get('/api/production/milk-summary', async (req, res) => {
  try {
    await connectToDatabase();
    const userId = typeof req.query.userId === 'string' ? req.query.userId : null;
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    const { ObjectId } = mongoose.Types;
    const matchUserId = ObjectId.isValid(userId) ? { $in: [userId, new ObjectId(userId)] } : userId;

    // Sum of all milk collections
    const collectedMilk = await MilkEntry.aggregate([
      { $match: { userId: matchUserId } },
      { $group: { _id: null, total: { $sum: '$quantity' } } },
    ]);
    const totalCollected = collectedMilk.length > 0 ? collectedMilk[0].total : 0;

    // Sum of all milk used in separation
    const usedMilk = await MilkProduction.aggregate([
      { $match: { userId: matchUserId } },
      { $group: { _id: null, total: { $sum: '$separationMilk' } } },
    ]);
    const totalUsed = usedMilk.length > 0 ? usedMilk[0].total : 0;

    return res.status(200).json({
      availableMilk: totalCollected - totalUsed,
      totalCollected,
      totalUsed
    });
  } catch (error: any) {
    console.error('Milk Summary Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.post('/api/production/separation', async (req, res) => {
  try {
    await connectToDatabase();
    const { userId, date, totalMilk, separationMilk, wholeMilk, skimMilk, creamMilk } = req.body ?? {};

    if (!userId || !date || totalMilk === undefined || separationMilk === undefined || wholeMilk === undefined || skimMilk === undefined || creamMilk === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newSeparation = new MilkProduction({
      userId,
      date,
      totalMilk,
      separationMilk,
      wholeMilk,
      skimMilk,
      creamMilk
    });

    await newSeparation.save();
    return res.status(201).json({ message: 'Separation record saved successfully', data: newSeparation });
  } catch (error: any) {
    console.error('Save Separation Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.get('/api/production/separation', async (req, res) => {
  try {
    await connectToDatabase();
    const userId = typeof req.query.userId === 'string' ? req.query.userId : null;
    const filter = userId ? { userId } : {};
    const history = await MilkProduction.find(filter).sort({ date: -1, createdAt: -1 });
    return res.status(200).json(history);
  } catch (error: any) {
    console.error('Fetch Separation History Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// --- Sales ---
app.get('/api/sales', async (req, res) => {
  try {
    await connectToDatabase();
    const productType = typeof req.query.productType === 'string' ? req.query.productType : null;
    if (productType) {
      const productionResult = await ProductionEntry.aggregate([
        { $match: { productType } },
        { $group: { _id: null, totalProduced: { $sum: '$quantityProduced' } } },
      ]);
      const salesResult = await SaleEntry.aggregate([
        { $match: { productType } },
        { $group: { _id: null, totalSold: { $sum: '$quantity' } } },
      ]);
      const totalProduced = productionResult[0]?.totalProduced || 0;
      const totalSold = salesResult[0]?.totalSold || 0;
      return res.status(200).json({ availableStock: totalProduced - totalSold });
    }

    const sales = await SaleEntry.find({}).sort({ date: -1, createdAt: -1 });
    return res.status(200).json(sales);
  } catch (error: any) {
    console.error('Sales GET Error:', error);
    return res.status(500).json({ message: error?.message || 'Internal Server Error' });
  }
});

app.post('/api/sales', async (req, res) => {
  try {
    await connectToDatabase();
    const body = req.body ?? {};
    const { userId, date, customerName, productType, quantity, pricePerUnit, totalAmount, paymentMode } = body;

    if (!userId || !date || !productType || quantity === undefined || pricePerUnit === undefined || totalAmount === undefined || !paymentMode) {
      return res.status(400).json({ message: 'Missing mandatory fields' });
    }

    const parsedQuantity = Number(quantity);
    if (parsedQuantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be greater than zero' });
    }

    const productionResult = await ProductionEntry.aggregate([
      { $match: { productType } },
      { $group: { _id: null, totalProduced: { $sum: '$quantityProduced' } } },
    ]);
    const salesResult = await SaleEntry.aggregate([
      { $match: { productType } },
      { $group: { _id: null, totalSold: { $sum: '$quantity' } } },
    ]);

    const totalProduced = productionResult[0]?.totalProduced || 0;
    const totalSold = salesResult[0]?.totalSold || 0;
    const availableStock = totalProduced - totalSold;

    if (availableStock < parsedQuantity) {
      return res.status(422).json({
        message: `Insufficient stock! You only have ${availableStock.toFixed(2)} units of ${productType} available.`,
        availableStock,
      });
    }

    const newSale = new SaleEntry({
      userId,
      date,
      customerName,
      productType,
      quantity: parsedQuantity,
      pricePerUnit: Number(pricePerUnit),
      totalAmount: Number(totalAmount),
      paymentMode,
    });
    await newSale.save();

    return res.status(201).json({
      message: 'Sale recorded successfully',
      sale: newSale,
      remainingStock: availableStock - parsedQuantity,
    });
  } catch (error: any) {
    console.error('Create Sale Error:', error);
    return res.status(500).json({ message: error?.message || 'Internal Server Error' });
  }
});

// --- Reports ---
app.get('/api/reports/detailed', async (req, res) => {
  try {
    await connectToDatabase();
    
    // Fetch all entries from different collections
    const [milkEntries, saleEntries, productionEntries] = await Promise.all([
      MilkEntry.find({}).sort({ date: -1 }),
      SaleEntry.find({}).sort({ date: -1 }),
      ProductionEntry.find({}).sort({ date: -1 }),
    ]);

    // Format all entries into a unified ReportEntry format
    const reportEntries = [
      ...milkEntries.map(e => ({
        _id: e._id,
        date: e.date,
        type: 'Milk Collection',
        category: e.source,
        details: `${e.supplier} (${e.shift})`,
        quantity: e.quantity,
        amount: e.totalCost,
        currency: 'INR',
        unit: 'Liters'
      })),
      ...saleEntries.map(e => ({
        _id: e._id,
        date: e.date,
        type: 'Sale',
        category: e.productType,
        details: `${e.customerName || 'Walk-in'} (${e.paymentMode})`,
        quantity: e.quantity,
        amount: e.totalAmount,
        currency: 'INR',
        unit: 'Units'
      })),
      ...productionEntries.map(e => ({
        _id: e._id,
        date: e.date,
        type: 'Production',
        category: e.productType,
        details: `${e.source} (${e.milkUsedLiters}L used)`,
        quantity: e.quantityProduced,
        amount: 0,
        currency: 'INR',
        unit: 'Units'
      }))
    ];

    // Sort all combined entries by date descending
    reportEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return res.status(200).json(reportEntries);
  } catch (error: any) {
    console.error('Fetch Detailed Reports Error:', error);
    return res.status(500).json({ message: error?.message || 'Internal Server Error' });
  }
});

app.get('/api/reports', async (req, res) => {
  try {
    await connectToDatabase();
    const filter = typeof req.query.filter === 'string' ? req.query.filter : 'all';

    const now = new Date();
    let startDate = new Date(0);
    if (filter === 'month') startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    else if (filter === 'today') startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const dateQuery = filter === 'all' ? {} : { createdAt: { $gte: startDate } };
    const milkDateQuery = filter === 'all' ? {} : { date: { $gte: startDate } };

    const salesResult = await SaleEntry.aggregate([
      { $match: dateQuery },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' }, totalTransactions: { $sum: 1 } } },
    ]);
    const sales = { revenue: salesResult[0]?.totalRevenue || 0, transactions: salesResult[0]?.totalTransactions || 0 };

    const milkResult = await MilkEntry.aggregate([
      { $match: milkDateQuery },
      { $group: { _id: null, totalCost: { $sum: '$totalCost' }, totalLiters: { $sum: '$quantity' } } },
    ]);
    const milkCollection = { cost: milkResult[0]?.totalCost || 0, liters: milkResult[0]?.totalLiters || 0 };

    const productsResult = await ProductionEntry.aggregate([
      { $match: dateQuery },
      { $group: { _id: null, totalProduced: { $sum: '$quantityProduced' }, totalBatches: { $sum: 1 } } },
    ]);
    const products = { produced: productsResult[0]?.totalProduced || 0, batches: productsResult[0]?.totalBatches || 0 };

    const activeSuppliers = await Supplier.countDocuments(dateQuery as any);
    const totalSuppliers = await Supplier.countDocuments();

    return res.status(200).json({
      sales,
      milkCollection,
      products,
      suppliers: { active: activeSuppliers, total: totalSuppliers },
    });
  } catch (error: any) {
    console.error('Fetch Reports Error:', error);
    return res.status(500).json({ message: error?.message || 'Internal Server Error' });
  }
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});

