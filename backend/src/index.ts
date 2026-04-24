import bcrypt from 'bcryptjs';
import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';

import { connectToDatabase } from './db';
import { MilkEntry } from './models/MilkEntry';
import { MilkProduction } from './models/MilkProduction';
import { ProductProduction } from './models/ProductProduction';
import { SaleEntry } from './models/SaleEntry';
import { Supplier } from './models/Supplier';
import { User } from './models/User';

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// --- Auth ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body ?? {};
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
      role: role || 'user',
      modules: ['collection', 'history', 'production', 'suppliers', 'sales', 'reports', 'quality'],
    });

    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: (newUser.role === 'admin' || newUser.role === 'super-admin') ? newUser._id : (newUser.adminId || newUser._id),
        profileId: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        modules: newUser.modules
      },
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
      user: {
        id: (user.role === 'admin' || user.role === 'super-admin') ? user._id : (user.adminId || user._id),
        profileId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        modules: user.modules
      },
    });
  } catch (error: any) {
    console.error('Login Error:', error);
    return res.status(500).json({ error: error?.message || 'Internal Server Error' });
  }
});

app.post('/api/auth/change-password', async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body ?? {};
    if (!email || !oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Email, old password and new password are required' });
    }

    await connectToDatabase();

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let isMatch = false;
    if (user.passwordHash) {
      isMatch = await bcrypt.compare(String(oldPassword), user.passwordHash);
    } else if ((user as any).password) {
      isMatch = (user as any).password === oldPassword;
    }

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid old password' });
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(String(newPassword), salt);

    user.passwordHash = newPasswordHash;
    // Clearing the plain text password if it exists (legacy)
    if ((user as any).password) {
      (user as any).password = undefined;
    }
    
    await user.save();

    return res.status(200).json({ message: 'your password successfull update' });
  } catch (error: any) {
    console.error('Change Password Error:', error);
    return res.status(500).json({ error: error?.message || 'Internal Server Error' });
  }
});

// --- Suppliers ---
app.get('/api/suppliers', async (req, res) => {
  try {
    await connectToDatabase();
    const userId = typeof req.query.userId === 'string' ? req.query.userId : null;
    const status = typeof req.query.status === 'string' ? req.query.status : 'active';
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    const query: any = { userId };
    if (status !== 'all') {
      query.isActive = true;
    }

    const suppliers = await Supplier.find(query).sort({ createdAt: -1 });
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
    const userId = typeof req.query.userId === 'string' ? req.query.userId : null;
    if (!id) return res.status(400).json({ message: 'Supplier ID is required or invalid' });

    let query: any = { _id: id, isActive: true };
    if (userId) query.userId = userId;

    let supplier = await Supplier.findOne(query).catch(() => null);
    if (!supplier) {
      query = { supplierId: id, isActive: true };
      if (userId) query.userId = userId;
      supplier = await Supplier.findOne(query);
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
    if (!body.userId) return res.status(400).json({ message: 'userId is required' });

    if (body.supplierId) {
      const existingWithSameId = await Supplier.findOne({
        userId: body.userId,
        supplierId: body.supplierId,
        _id: { $ne: id },
        isActive: true,
      });
      if (existingWithSameId) return res.status(409).json({ message: 'already Exist' });
    }

    const updatedSupplier = await Supplier.findOneAndUpdate(
      { _id: id, userId: body.userId },
      { $set: body },
      { new: true, runValidators: true }
    );
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

    const userId = typeof req.query.userId === 'string' ? req.query.userId : null;
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    const deletedSupplier = await Supplier.findOneAndUpdate({ _id: id, userId }, { isActive: false }, { new: true });
    if (!deletedSupplier) return res.status(404).json({ message: 'Supplier not found' });
    return res.status(200).json({ message: 'Supplier removed successfully' });
  } catch (error: any) {
    console.error('Delete Supplier Error:', error);
    return res.status(500).json({ message: error?.message || 'Internal Server Error' });
  }
});

// --- Milk collection ---
app.get('/api/milk/collection', async (req, res) => {
  try {
    await connectToDatabase();
    const userId = typeof req.query.userId === 'string' ? req.query.userId : null;
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    const entries = await MilkEntry.find({ userId }).sort({ date: -1, createdAt: -1 }).lean();

    // Dynamically populate missing supplierId for older records or missing fields
    // Include inactive suppliers to improve historical data resolution
    const suppliers = await Supplier.find({ userId }).select('name supplierId').lean();
    const supplierMap: Record<string, string> = {};
    suppliers.forEach(s => { 
      if (s.name) {
        // Robust normalization: trim and lowercase
        const normalized = s.name.trim().toLowerCase();
        supplierMap[normalized] = s.supplierId; 
      }
    });

    const enrichedEntries = entries.map(entry => {
      const nameKey = entry.supplier ? entry.supplier.trim().toLowerCase() : '';
      return {
        ...entry,
        supplierId: entry.supplierId || supplierMap[nameKey] || 'N/A'
      };
    });

    return res.status(200).json(enrichedEntries);
  } catch (error: any) {
    console.error('Fetch Milk Entries Error:', error);
    return res.status(500).json({ message: error?.message || 'Internal Server Error' });
  }
});

app.post('/api/milk/collection', async (req, res) => {
  try {
    await connectToDatabase();
    const body = req.body ?? {};
    const { userId, supplier, supplierId, date, shift, source, customSource, fatType, snf, clr, lr, temp, ts, quantity, costPerLiter, totalCost, mbrt, mbrtTime, cob } =
      body;

    if (!userId || !supplier || !date || !shift || !source || !quantity || !costPerLiter || !totalCost) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newEntry = new MilkEntry({
      userId,
      supplier,
      supplierId,
      date,
      shift,
      source,
      customSource,
      fatType,
      snf,
      clr,
      lr,
      temp,
      ts,
      quantity,
      costPerLiter,
      totalCost,
      mbrt,
      mbrtTime,
      cob,
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
    const userId = typeof req.query.userId === 'string' ? req.query.userId : null;
    if (!id) return res.status(400).json({ error: 'Milk Entry ID is required' });
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const deletedEntry = await MilkEntry.findOneAndDelete({ _id: id, userId });
    if (!deletedEntry) return res.status(404).json({ error: 'Milk Entry not found' });
    return res.status(200).json({ message: 'Milk Entry deleted successfully' });
  } catch (error: any) {
    console.error('DELETE Milk Entry Error:', error);
    return res.status(500).json({ error: error?.message || 'Internal Server Error' });
  }
});

app.put('/api/milk/collection/:id', async (req, res) => {
  try {
    await connectToDatabase();
    const id = req.params.id;
    const body = req.body ?? {};
    const { userId } = body;

    if (!id) return res.status(400).json({ message: 'Milk Entry ID is required' });
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    // recalculate totalCost if quantity or costPerLiter is provided
    if (body.quantity !== undefined || body.costPerLiter !== undefined) {
      const current = await MilkEntry.findById(id);
      if (current) {
        const q = body.quantity !== undefined ? body.quantity : current.quantity;
        const c = body.costPerLiter !== undefined ? body.costPerLiter : current.costPerLiter;
        body.totalCost = q * c;
      }
    }

    const updatedEntry = await MilkEntry.findOneAndUpdate(
      { _id: id, userId },
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!updatedEntry) return res.status(404).json({ message: 'Milk Entry not found' });
    return res.status(200).json({ message: 'Milk Entry updated successfully', entry: updatedEntry });
  } catch (error: any) {
    console.error('Update Milk Entry Error:', error);
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
    const totalSeparated = usedMilk.length > 0 ? usedMilk[0].total : 0;

    const usedWholeInProducts = await ProductProduction.aggregate([
      { $match: { userId: matchUserId } },
      { $group: { 
          _id: null, 
          total: { $sum: '$milkUsed.wholeMilk' },
          cow: { $sum: '$sourceWholeUsed.cow' },
          buff: { $sum: '$sourceWholeUsed.buff' },
          goat: { $sum: '$sourceWholeUsed.goat' },
          other: { $sum: '$sourceWholeUsed.other' },
      } }
    ]);
    const wholeUsedSummary = usedWholeInProducts[0] || { total: 0, cow: 0, buff: 0, goat: 0, other: 0 };
    const totalWholeUsed = wholeUsedSummary.total;

    // Sum of all direct raw milk sales
    const rawSales = await SaleEntry.aggregate([
      { $match: { userId: matchUserId, productType: { $in: ['Cow Milk', 'Buffalo Milk', 'Goat Milk', 'Other Milk', 'Mixed Milk'] } } },
      { $group: { _id: '$productType', total: { $sum: '$quantity' } } }
    ]);
    const salesTotalMap: Record<string, number> = {};
    let totalDirectSold = 0;
    rawSales.forEach(s => {
      salesTotalMap[s._id] = s.total;
      totalDirectSold += s.total;
    });

    // Calculate before today for Opening Balance
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTodayISO = startOfToday.toISOString(); 

    const collectedBeforeToday = await MilkEntry.aggregate([
      { $match: { userId: matchUserId, date: { $lt: startOfToday } } },
      { $group: { _id: null, total: { $sum: '$quantity' } } },
    ]);
    const totalCollectedBeforeToday = collectedBeforeToday.length > 0 ? collectedBeforeToday[0].total : 0;

    const separatedBeforeToday = await MilkProduction.aggregate([
      { $match: { userId: matchUserId, date: { $lt: startOfToday } } },
      { $group: { _id: null, total: { $sum: '$separationMilk' } } },
    ]);
    const totalSeparatedBeforeToday = separatedBeforeToday.length > 0 ? separatedBeforeToday[0].total : 0;

    const wholeUsedBeforeToday = await ProductProduction.aggregate([
      { $match: { userId: matchUserId, date: { $lt: startOfToday } } },
      { $group: { _id: null, total: { $sum: '$milkUsed.wholeMilk' } } }
    ]);
    const totalWholeUsedBeforeToday = wholeUsedBeforeToday.length > 0 ? wholeUsedBeforeToday[0].total : 0;

    const wholeUsedSummaryBeforeToday = await ProductProduction.aggregate([
      { $match: { userId: matchUserId, date: { $lt: startOfToday } } },
      { $group: { 
          _id: null, 
          cow: { $sum: '$sourceWholeUsed.cow' },
          buff: { $sum: '$sourceWholeUsed.buff' },
          goat: { $sum: '$sourceWholeUsed.goat' },
          other: { $sum: '$sourceWholeUsed.other' },
      } }
    ]);
    const wUsedBeforeToday = wholeUsedSummaryBeforeToday[0] || { cow: 0, buff: 0, goat: 0, other: 0 };

    const sourceCountsBeforeToday = await MilkEntry.aggregate([
      { $match: { userId: matchUserId, date: { $lt: startOfToday } } },
      { $group: { _id: '$source', total: { $sum: '$quantity' } } },
    ]);
    const sourceTotalsBeforeToday: Record<string, number> = { Cow: 0, Buffalo: 0, Goat: 0, Other: 0 };
    sourceCountsBeforeToday.forEach((s: any) => {
      if (s._id in sourceTotalsBeforeToday) sourceTotalsBeforeToday[s._id] = s.total;
      else sourceTotalsBeforeToday.Other += s.total;
    });

    const sourceProducedBeforeToday = await MilkProduction.aggregate([
      { $match: { userId: matchUserId, date: { $lt: startOfToday } } },
      { $group: {
          _id: null,
          totalCow: { $sum: '$sourceSeparation.cow' },
          totalBuffalo: { $sum: '$sourceSeparation.buffalo' },
          totalGoat: { $sum: '$sourceSeparation.goat' },
          totalOther: { $sum: '$sourceSeparation.other' },
      }}
    ]);
    const separatedMapBeforeToday = sourceProducedBeforeToday[0] || { totalCow: 0, totalBuffalo: 0, totalGoat: 0, totalOther: 0 };

    const rawSalesBeforeToday = await SaleEntry.aggregate([
      { $match: { userId: matchUserId, date: { $lt: startOfTodayISO }, productType: { $in: ['Cow Milk', 'Buffalo Milk', 'Goat Milk', 'Other Milk', 'Mixed Milk'] } } },
      { $group: { _id: '$productType', total: { $sum: '$quantity' } } }
    ]);
    const salesBeforeTodayMap: Record<string, number> = {};
    let totalDirectSoldBeforeToday = 0;
    rawSalesBeforeToday.forEach(s => {
      salesBeforeTodayMap[s._id] = s.total;
      totalDirectSoldBeforeToday += s.total;
    });

    // Calculate today's collections and used
    const collectedTodayAggr = await MilkEntry.aggregate([
      { $match: { userId: matchUserId, date: { $gte: startOfToday } } },
      { $group: { _id: null, total: { $sum: '$quantity' } } },
    ]);
    const todayCollected = collectedTodayAggr.length > 0 ? collectedTodayAggr[0].total : 0;

    const separatedTodayAggr = await MilkProduction.aggregate([
      { $match: { userId: matchUserId, date: { $gte: startOfToday } } },
      { $group: { _id: null, total: { $sum: '$separationMilk' } } },
    ]);
    const todaySeparated = separatedTodayAggr.length > 0 ? separatedTodayAggr[0].total : 0;

    const wholeUsedTodayAggr = await ProductProduction.aggregate([
      { $match: { userId: matchUserId, date: { $gte: startOfToday } } },
      { $group: { _id: null, total: { $sum: '$milkUsed.wholeMilk' } } }
    ]);
    const todayWholeUsed = wholeUsedTodayAggr.length > 0 ? wholeUsedTodayAggr[0].total : 0;

    const directSalesTodayAggr = await SaleEntry.aggregate([
      { $match: { userId: matchUserId, date: { $gte: startOfTodayISO }, productType: { $in: ['Cow Milk', 'Buffalo Milk', 'Goat Milk', 'Other Milk', 'Mixed Milk'] } } },
      { $group: { _id: null, total: { $sum: '$quantity' } } }
    ]);
    const todayDirectSold = directSalesTodayAggr.length > 0 ? directSalesTodayAggr[0].total : 0;

    const todayUsed = todaySeparated + todayWholeUsed + todayDirectSold;

    const sourceCounts = await MilkEntry.aggregate([
      { $match: { userId: matchUserId } },
      { $group: { _id: '$source', total: { $sum: '$quantity' } } },
    ]);

    const sourceTotals: Record<string, number> = { Cow: 0, Buffalo: 0, Goat: 0, Other: 0 };
    sourceCounts.forEach((s: any) => {
      if (s._id in sourceTotals) sourceTotals[s._id] = s.total;
      else sourceTotals.Other += s.total;
    });

    const sourceProduced = await MilkProduction.aggregate([
      { $match: { userId: matchUserId } },
      { $group: {
          _id: null,
          totalCow: { $sum: '$sourceSeparation.cow' },
          totalBuffalo: { $sum: '$sourceSeparation.buffalo' },
          totalGoat: { $sum: '$sourceSeparation.goat' },
          totalOther: { $sum: '$sourceSeparation.other' },
      }}
    ]);

    const separatedMap = sourceProduced[0] || { totalCow: 0, totalBuffalo: 0, totalGoat: 0, totalOther: 0 };

    const sourceOpeningBalance = {
      Cow: Math.max(0, sourceTotalsBeforeToday.Cow - separatedMapBeforeToday.totalCow - wUsedBeforeToday.cow - (salesBeforeTodayMap['Cow Milk'] || 0)),
      Buffalo: Math.max(0, sourceTotalsBeforeToday.Buffalo - separatedMapBeforeToday.totalBuffalo - wUsedBeforeToday.buff - (salesBeforeTodayMap['Buffalo Milk'] || 0)),
      Goat: Math.max(0, sourceTotalsBeforeToday.Goat - separatedMapBeforeToday.totalGoat - wUsedBeforeToday.goat - (salesBeforeTodayMap['Goat Milk'] || 0)),
      Other: Math.max(0, sourceTotalsBeforeToday.Other - separatedMapBeforeToday.totalOther - wUsedBeforeToday.other - (salesBeforeTodayMap['Other Milk'] || 0)),
    };

    const inconsistencies: string[] = [];
    const checkNeg = (val: number, label: string) => {
      if (val < -0.001) inconsistencies.push(`${label} is logically negative (${val.toFixed(2)})`);
    };

    const availableMilkRaw = totalCollected - totalSeparated - totalWholeUsed - totalDirectSold;
    checkNeg(availableMilkRaw, 'Overall Available Milk');
    
    const openingBalanceRaw = totalCollectedBeforeToday - totalSeparatedBeforeToday - totalWholeUsedBeforeToday - totalDirectSoldBeforeToday;
    checkNeg(openingBalanceRaw, 'Opening Balance');

    const closingBalanceRaw = totalCollected - totalSeparated - totalWholeUsed - totalDirectSold;
    checkNeg(closingBalanceRaw, 'Closing Balance');

    const cowAvail = sourceTotals.Cow - separatedMap.totalCow - wholeUsedSummary.cow - (salesTotalMap['Cow Milk'] || 0);
    const buffAvail = sourceTotals.Buffalo - separatedMap.totalBuffalo - wholeUsedSummary.buff - (salesTotalMap['Buffalo Milk'] || 0);
    const goatAvail = sourceTotals.Goat - separatedMap.totalGoat - wholeUsedSummary.goat - (salesTotalMap['Goat Milk'] || 0);
    const otherAvail = sourceTotals.Other - separatedMap.totalOther - wholeUsedSummary.other - (salesTotalMap['Other Milk'] || 0);

    checkNeg(cowAvail, 'Cow Milk');
    checkNeg(buffAvail, 'Buffalo Milk');
    checkNeg(goatAvail, 'Goat Milk');
    checkNeg(otherAvail, 'Other Milk');

    const sourceAvailable = {
      Cow: Math.max(0, cowAvail),
      Buffalo: Math.max(0, buffAvail),
      Goat: Math.max(0, goatAvail),
      Other: Math.max(0, otherAvail),
    };

    const openingBalance = Math.max(0, openingBalanceRaw);
    const closingBalance = Math.max(0, closingBalanceRaw);

    const [lastMilkEntry, lastSeparation, lastProduct] = await Promise.all([
      MilkEntry.findOne({ userId: matchUserId as any }).sort({ date: -1 }).select('date'),
      MilkProduction.findOne({ userId: matchUserId as any }).sort({ date: -1 }).select('date'),
      ProductProduction.findOne({ userId: matchUserId as any, 'milkUsed.wholeMilk': { $gt: 0 } }).sort({ date: -1 }).select('date')
    ]);

    const dates = [
      lastMilkEntry?.date,
      lastSeparation?.date,
      lastProduct?.date
    ].filter(d => !!d).map(d => new Date(d!).getTime());

    const lastActiveDate = dates.length > 0 ? new Date(Math.max(...dates)) : null;

    return res.status(200).json({
      availableMilk: Math.max(0, availableMilkRaw),
      openingBalance,
      closingBalance,
      closingBalanceDate: lastActiveDate,
      totalCollected,
      totalUsed: totalSeparated + totalWholeUsed,
      todayCollected,
      todayUsed,
      sourceTotals,
      sourceOpeningBalance,
      sourceAvailable,
      inconsistencies: inconsistencies.length > 0 ? inconsistencies : undefined
    });
  } catch (error: any) {
    console.error('Milk Summary Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.post('/api/production/separation', async (req, res) => {
  try {
    await connectToDatabase();
    const { userId, date, totalMilk, separationMilk, wholeMilk, skimMilk, creamMilk, mixedMilk, sourceSeparation } = req.body ?? {};

    if (!userId || !date || totalMilk === undefined || separationMilk === undefined || wholeMilk === undefined || skimMilk === undefined || creamMilk === undefined || mixedMilk === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newSeparation = new MilkProduction({
      userId,
      date,
      totalMilk,
      separationMilk,
      sourceSeparation: sourceSeparation || { cow: 0, buffalo: 0, goat: 0, other: 0 },
      wholeMilk,
      skimMilk,
      creamMilk,
      mixedMilk
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
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    const filter = { userId };
    const history = await MilkProduction.find(filter).sort({ date: -1, createdAt: -1 });
    return res.status(200).json(history);
  } catch (error: any) {
    console.error('Fetch Separation History Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.get('/api/production/inventory', async (req, res) => {
  try {
    await connectToDatabase();
    const userId = typeof req.query.userId === 'string' ? req.query.userId : null;
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    const { ObjectId } = mongoose.Types;
    const matchUserId = ObjectId.isValid(userId) ? { $in: [userId, new ObjectId(userId)] } : userId;

    const collectedMilk = await MilkEntry.aggregate([
      { $match: { userId: matchUserId } },
      { $group: { _id: null, total: { $sum: '$quantity' } } },
    ]);
    const totalCollected = collectedMilk.length > 0 ? collectedMilk[0].total : 0;

    // 1. Total produced from separation
    const production = await MilkProduction.aggregate([
      { $match: { userId: matchUserId } },
      {
        $group: {
          _id: null,
          totalSeparated: { $sum: '$separationMilk' },
          totalSkim: { $sum: '$skimMilk' },
          totalCream: { $sum: '$creamMilk' },
          totalMixed: { $sum: '$mixedMilk' },
        },
      },
    ]);

    // 2. Total used in products
    const used = await ProductProduction.aggregate([
      { $match: { userId: matchUserId } },
      {
        $group: {
          _id: null,
          usedWhole: { $sum: '$milkUsed.wholeMilk' },
          usedSkim: { $sum: '$milkUsed.skimMilk' },
          usedCream: { $sum: '$milkUsed.creamMilk' },
          usedMixed: { $sum: '$milkUsed.mixedMilk' },
          cow: { $sum: '$sourceWholeUsed.cow' },
          buff: { $sum: '$sourceWholeUsed.buff' },
          goat: { $sum: '$sourceWholeUsed.goat' },
          other: { $sum: '$sourceWholeUsed.other' },
        },
      },
    ]);

    // 3. Subtract direct sales of raw/intermediate milk
    const rawSales = await SaleEntry.aggregate([
      { $match: { userId: matchUserId } },
      { $group: { _id: '$productType', total: { $sum: '$quantity' } } },
    ]);
    const salesMap: Record<string, number> = {};
    let totalDirectSold = 0;
    const rawTypes = ['Cow Milk', 'Buffalo Milk', 'Goat Milk', 'Other Milk', 'Mixed Milk'];
    rawSales.forEach((s: any) => { 
      salesMap[s._id] = s.total;
      if (rawTypes.includes(s._id)) totalDirectSold += s.total;
    });

    const sourceCounts = await MilkEntry.aggregate([
      { $match: { userId: matchUserId } },
      { $group: { _id: '$source', total: { $sum: '$quantity' } } },
    ]);
    const sourceTotals: Record<string, number> = { Cow: 0, Buffalo: 0, Goat: 0, Other: 0 };
    sourceCounts.forEach((s: any) => {
      if (s._id in sourceTotals) sourceTotals[s._id] = s.total;
      else sourceTotals.Other += s.total;
    });

    const sourceProduced = await MilkProduction.aggregate([
      { $match: { userId: matchUserId } },
      { $group: {
          _id: null,
          totalCow: { $sum: '$sourceSeparation.cow' },
          totalBuffalo: { $sum: '$sourceSeparation.buffalo' },
          totalGoat: { $sum: '$sourceSeparation.goat' },
          totalOther: { $sum: '$sourceSeparation.other' },
      }}
    ]);
    const separatedMap = sourceProduced[0] || { totalCow: 0, totalBuffalo: 0, totalGoat: 0, totalOther: 0 };

    const prod = production[0] || { totalSeparated: 0, totalSkim: 0, totalCream: 0, totalMixed: 0 };
    const use = used[0] || { usedWhole: 0, usedSkim: 0, usedCream: 0, usedMixed: 0, cow: 0, buff: 0, goat: 0, other: 0 };

    const inconsistencies: string[] = [];
    const checkNeg = (val: number, label: string) => {
      if (val < -0.001) inconsistencies.push(`${label} is logically negative (${val.toFixed(2)})`);
    };

    const wholeMilkRaw = totalCollected - prod.totalSeparated - use.usedWhole - totalDirectSold;
    checkNeg(wholeMilkRaw, 'Whole Milk');

    const skimAvail = prod.totalSkim - use.usedSkim - (salesMap['Skim Milk'] || 0);
    const creamAvail = prod.totalCream - use.usedCream - (salesMap['Cream'] || 0);
    const mixedAvail = prod.totalMixed - use.usedMixed - (salesMap['Mixed Milk'] || 0);

    checkNeg(skimAvail, 'Skim Milk');
    checkNeg(creamAvail, 'Cream');
    checkNeg(mixedAvail, 'Mixed Milk');

    const cowAvail = sourceTotals.Cow - separatedMap.totalCow - use.cow - (salesMap['Cow Milk'] || 0);
    const buffAvail = sourceTotals.Buffalo - separatedMap.totalBuffalo - use.buff - (salesMap['Buffalo Milk'] || 0);
    const goatAvail = sourceTotals.Goat - separatedMap.totalGoat - use.goat - (salesMap['Goat Milk'] || 0);
    const otherAvail = sourceTotals.Other - separatedMap.totalOther - use.other - (salesMap['Other Milk'] || 0);

    checkNeg(cowAvail, 'Cow Milk');
    checkNeg(buffAvail, 'Buffalo Milk');
    checkNeg(goatAvail, 'Goat Milk');
    checkNeg(otherAvail, 'Other Milk');

    const sourceAvailable = {
      Cow: Math.max(0, cowAvail),
      Buffalo: Math.max(0, buffAvail),
      Goat: Math.max(0, goatAvail),
      Other: Math.max(0, otherAvail),
    };

    return res.status(200).json({
      wholeMilk: Math.max(0, wholeMilkRaw),
      skimMilk: Math.max(0, skimAvail),
      creamMilk: Math.max(0, creamAvail),
      mixedMilk: Math.max(0, mixedAvail),
      sourceAvailable,
      inconsistencies: inconsistencies.length > 0 ? inconsistencies : undefined
    });
  } catch (error: any) {
    console.error('Production Inventory Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.post('/api/production/make-product', async (req, res) => {
  try {
    await connectToDatabase();
    const { userId, date, productName, quantityProduced, unit, milkUsed, sourceWholeUsed } = req.body ?? {};

    if (!userId || !date || !productName || quantityProduced === undefined || !milkUsed) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newProduct = new ProductProduction({
      userId,
      date,
      productName,
      quantityProduced,
      unit: unit || 'kg',
      milkUsed,
      sourceWholeUsed: sourceWholeUsed || { cow: 0, buff: 0, goat: 0, other: 0 }
    });

    await newProduct.save();
    return res.status(201).json({ message: 'Product created successfully', product: newProduct });
  } catch (error: any) {
    console.error('Make Product Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.get('/api/production/separation-history', async (req, res) => {
  try {
    await connectToDatabase();
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ message: 'userId is required' });
    const history = await MilkProduction.find({ userId }).sort({ date: -1, createdAt: -1 });
    return res.status(200).json(history);
  } catch (error) {
    console.error('Separation History Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.get('/api/production/product-history', async (req, res) => {
  try {
    await connectToDatabase();
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ message: 'userId is required' });
    const history = await ProductProduction.find({ userId }).sort({ date: -1, createdAt: -1 });
    return res.status(200).json(history);
  } catch (error) {
    console.error('Product History Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// --- Sales ---
app.get('/api/sales/product-stock', async (req, res) => {
  try {
    await connectToDatabase();
    const userId = typeof req.query.userId === 'string' ? req.query.userId : null;
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    const { ObjectId } = mongoose.Types;
    const matchUserId = ObjectId.isValid(userId) ? { $in: [userId, new ObjectId(userId)] } : userId;

    // 1. Get standard products from ProductProduction
    const produced = await ProductProduction.aggregate([
      { $match: { userId: matchUserId } },
      { $group: { _id: '$productName', total: { $sum: '$quantityProduced' } } }
    ]);

    // 2. Get total sold per product type
    const sold = await SaleEntry.aggregate([
      { $match: { userId: matchUserId } },
      { $group: { _id: '$productType', total: { $sum: '$quantity' } } }
    ]);
    const soldMap: Record<string, number> = {};
    sold.forEach((s: any) => { soldMap[s._id] = s.total; });

    // 3. Get Raw & Intermediate Milk Stock (Same logic as production/inventory)
    const collectedMilk = await MilkEntry.aggregate([
      { $match: { userId: matchUserId } },
      { $group: { _id: null, total: { $sum: '$quantity' } } },
    ]);
    const totalCollected = collectedMilk.length > 0 ? collectedMilk[0].total : 0;

    const production = await MilkProduction.aggregate([
      { $match: { userId: matchUserId } },
      { $group: { _id: null, totalSeparated: { $sum: '$separationMilk' }, totalSkim: { $sum: '$skimMilk' }, totalCream: { $sum: '$creamMilk' }, totalMixed: { $sum: '$mixedMilk' } } },
    ]);
    const prod = production[0] || { totalSeparated: 0, totalSkim: 0, totalCream: 0, totalMixed: 0 };

    const used = await ProductProduction.aggregate([
      { $match: { userId: matchUserId } },
      { $group: { _id: null, usedWhole: { $sum: '$milkUsed.wholeMilk' }, usedSkim: { $sum: '$milkUsed.skimMilk' }, usedCream: { $sum: '$milkUsed.creamMilk' }, usedMixed: { $sum: '$milkUsed.mixedMilk' }, cow: { $sum: '$sourceWholeUsed.cow' }, buff: { $sum: '$sourceWholeUsed.buff' }, goat: { $sum: '$sourceWholeUsed.goat' }, other: { $sum: '$sourceWholeUsed.other' } } },
    ]);
    const use = used[0] || { usedWhole: 0, usedSkim: 0, usedCream: 0, usedMixed: 0, cow: 0, buff: 0, goat: 0, other: 0 };

    const sourceCounts = await MilkEntry.aggregate([
      { $match: { userId: matchUserId } },
      { $group: { _id: '$source', total: { $sum: '$quantity' } } },
    ]);
    const sourceTotals: Record<string, number> = { Cow: 0, Buffalo: 0, Goat: 0, Other: 0 };
    sourceCounts.forEach((s: any) => {
      if (s._id in sourceTotals) sourceTotals[s._id] = s.total;
      else sourceTotals.Other += s.total;
    });

    const sourceProduced = await MilkProduction.aggregate([
      { $match: { userId: matchUserId } },
      { $group: { _id: null, totalCow: { $sum: '$sourceSeparation.cow' }, totalBuffalo: { $sum: '$sourceSeparation.buffalo' }, totalGoat: { $sum: '$sourceSeparation.goat' }, totalOther: { $sum: '$sourceSeparation.other' } }}
    ]);
    const separatedMap = sourceProduced[0] || { totalCow: 0, totalBuffalo: 0, totalGoat: 0, totalOther: 0 };

    const inconsistencies: string[] = [];
    const checkNeg = (val: number, label: string) => {
      if (val < -0.001) inconsistencies.push(`${label} stock is logically negative (${val.toFixed(2)})`);
    };

    // Final Stock Map
    const stock: Record<string, any> = {};
    
    // Add standard products
    produced.forEach((p: any) => {
      const pStock = p.total - (soldMap[p._id] || 0);
      checkNeg(pStock, p._id);
      stock[p._id] = Math.max(0, pStock);
    });

    // Add Raw Milk Types
    const cowVal = sourceTotals.Cow - separatedMap.totalCow - use.cow - (soldMap['Cow Milk'] || 0);
    const buffVal = sourceTotals.Buffalo - separatedMap.totalBuffalo - use.buff - (soldMap['Buffalo Milk'] || 0);
    const goatVal = sourceTotals.Goat - separatedMap.totalGoat - use.goat - (soldMap['Goat Milk'] || 0);
    const otherVal = sourceTotals.Other - separatedMap.totalOther - use.other - (soldMap['Other Milk'] || 0);

    checkNeg(cowVal, 'Cow Milk');
    checkNeg(buffVal, 'Buffalo Milk');
    checkNeg(goatVal, 'Goat Milk');
    checkNeg(otherVal, 'Other Milk');

    stock['Cow Milk'] = Math.max(0, cowVal);
    stock['Buffalo Milk'] = Math.max(0, buffVal);
    stock['Goat Milk'] = Math.max(0, goatVal);
    stock['Other Milk'] = Math.max(0, otherVal);

    // Add Intermediate Products
    const skimVal = prod.totalSkim - use.usedSkim - (soldMap['Skim Milk'] || 0);
    const creamVal = prod.totalCream - use.usedCream - (soldMap['Cream'] || 0);
    const mixedVal = prod.totalMixed - use.usedMixed - (soldMap['Mixed Milk'] || 0);

    checkNeg(skimVal, 'Skim Milk');
    checkNeg(creamVal, 'Cream');
    checkNeg(mixedVal, 'Mixed Milk');

    stock['Skim Milk'] = Math.max(0, skimVal);
    stock['Cream'] = Math.max(0, creamVal);
    stock['Mixed Milk'] = Math.max(0, mixedVal);

    if (inconsistencies.length > 0) {
      stock.inconsistencies = inconsistencies;
    }

    return res.status(200).json(stock);
  } catch (error: any) {
    console.error('Product Stock Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.get('/api/sales', async (req, res) => {
  try {
    await connectToDatabase();
    const userId = typeof req.query.userId === 'string' ? req.query.userId : null;
    if (!userId) return res.status(400).json({ message: 'userId is required' });
    const sales = await SaleEntry.find({ userId }).sort({ date: -1, createdAt: -1 });
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

    // Check available stock
    let availableStock = 0;
    const rawTypes = ['Cow Milk', 'Buffalo Milk', 'Goat Milk', 'Other Milk'];
    const intermediateTypes = ['Skim Milk', 'Cream', 'Mixed Milk'];

    if (rawTypes.includes(productType) || intermediateTypes.includes(productType)) {
      // Logic for raw/intermediate milk stock
      const { ObjectId } = mongoose.Types;
      const matchUserId = ObjectId.isValid(userId) ? { $in: [userId, new ObjectId(userId)] } : userId;

      const collected = await MilkEntry.aggregate([
        { $match: { userId: matchUserId } },
        { $group: { _id: '$source', total: { $sum: '$quantity' } } },
      ]);
      const sourceTotals: Record<string, number> = { Cow: 0, Buffalo: 0, Goat: 0, Other: 0 };
      collected.forEach((s: any) => {
        if (s._id in sourceTotals) sourceTotals[s._id] = s.total;
        else sourceTotals.Other += s.total;
      });

      const separated = await MilkProduction.aggregate([
        { $match: { userId: matchUserId } },
        { $group: {
            _id: null,
            totalCow: { $sum: '$sourceSeparation.cow' },
            totalBuffalo: { $sum: '$sourceSeparation.buffalo' },
            totalGoat: { $sum: '$sourceSeparation.goat' },
            totalOther: { $sum: '$sourceSeparation.other' },
            totalSkim: { $sum: '$skimMilk' },
            totalCream: { $sum: '$creamMilk' },
            totalMixed: { $sum: '$mixedMilk' }
        }}
      ]);
      const sep = separated[0] || { totalCow: 0, totalBuffalo: 0, totalGoat: 0, totalOther: 0, totalSkim: 0, totalCream: 0, totalMixed: 0 };

      const usedInProducts = await ProductProduction.aggregate([
        { $match: { userId: matchUserId } },
        { $group: { _id: null, usedSkim: { $sum: '$milkUsed.skimMilk' }, usedCream: { $sum: '$milkUsed.creamMilk' }, usedMixed: { $sum: '$milkUsed.mixedMilk' }, cow: { $sum: '$sourceWholeUsed.cow' }, buff: { $sum: '$sourceWholeUsed.buff' }, goat: { $sum: '$sourceWholeUsed.goat' }, other: { $sum: '$sourceWholeUsed.other' } } },
      ]);
      const use = usedInProducts[0] || { usedSkim: 0, usedCream: 0, usedMixed: 0, cow: 0, buff: 0, goat: 0, other: 0 };

      const soldItems = await SaleEntry.aggregate([
        { $match: { userId: matchUserId, productType } },
        { $group: { _id: null, total: { $sum: '$quantity' } } }
      ]);
      const sold = soldItems[0]?.total || 0;

      if (productType === 'Cow Milk') availableStock = sourceTotals.Cow - sep.totalCow - use.cow - sold;
      else if (productType === 'Buffalo Milk') availableStock = sourceTotals.Buffalo - sep.totalBuffalo - use.buff - sold;
      else if (productType === 'Goat Milk') availableStock = sourceTotals.Goat - sep.totalGoat - use.goat - sold;
      else if (productType === 'Other Milk') availableStock = sourceTotals.Other - sep.totalOther - use.other - sold;
      else if (productType === 'Skim Milk') availableStock = sep.totalSkim - use.usedSkim - sold;
      else if (productType === 'Cream') availableStock = sep.totalCream - use.usedCream - sold;
      else if (productType === 'Mixed Milk') availableStock = sep.totalMixed - use.usedMixed - sold;
    } else {
      // Logic for regular products
      const produced = await ProductProduction.aggregate([
        { $match: { userId, productName: productType } },
        { $group: { _id: null, total: { $sum: '$quantityProduced' } } }
      ]);
      const soldSoFar = await SaleEntry.aggregate([
        { $match: { userId, productType } },
        { $group: { _id: null, total: { $sum: '$quantity' } } }
      ]);
      availableStock = (produced[0]?.total || 0) - (soldSoFar[0]?.total || 0);
    }

    if (parsedQuantity > availableStock + 0.001) {
      return res.status(400).json({
        message: `Insufficient stock! Only ${Math.max(0, availableStock).toFixed(2)} units of ${productType} available.`,
        availableStock
      });
    }

    const newSale = new SaleEntry({
      userId, date, customerName, productType,
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
    const userId = typeof req.query.userId === 'string' ? req.query.userId : null;
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    // Fetch all entries from milk collection and sales for THIS user
    const [milkEntries, saleEntries] = await Promise.all([
      MilkEntry.find({ userId }).sort({ date: -1 }),
      SaleEntry.find({ userId }).sort({ date: -1 }),
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
      }))
    ];

    // Sort all combined entries by date descending
    reportEntries.sort((a, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return res.status(200).json(reportEntries);
  } catch (error: any) {
    console.error('Fetch Detailed Reports Error:', error);
    return res.status(500).json({ message: error?.message || 'Internal Server Error' });
  }
});



////////////////////////////////////


app.get('/api/reports/complete', async (req, res) => {
  try {
    await connectToDatabase();
    const userId = typeof req.query.userId === 'string' ? req.query.userId : null;
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    const milkEntries = await MilkEntry.find({ userId });
    const milkProductions = await MilkProduction.find({ userId });
    const productProductions = await ProductProduction.find({ userId });
    const saleEntries = await SaleEntry.find({ userId });

    const dailyData: Record<string, any> = {};

    const getDayStr = (d: any) => {
      if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d)) {
        return d.substring(0, 10);
      }
      const dt = new Date(d);
      // Force Asia/Kolkata (IST) offset (+5:30) for consistent grouping regardless of server timezone
      const istTime = new Date(dt.getTime() + (5.5 * 60 * 60 * 1000));
      const y = istTime.getUTCFullYear();
      const m = String(istTime.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(istTime.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${dd}`;
    };

    const allDates = new Set<string>();
    allDates.add(getDayStr(new Date())); // Always include today
    [...milkEntries, ...milkProductions, ...productProductions, ...saleEntries].forEach((r: any) => {
      if (r.date) allDates.add(getDayStr(r.date));
    });

    const categories = [
      'Paneer', 'Ghee', 'Butter', 'Curd', 'Khoa', 'Fl. milk', 'Std. Milk', 
      'Toned Milk', 'D.Toned Milk', 'Icecream', 'Yoghurt', 'Srikhand', 
      'Rasgolla', 'Gulabjamun', 'Rabbari', 'Skim Milk', 'Cream', 'Mixed Milk'
    ];

    allDates.forEach(day => {
      dailyData[day] = {
        date: day,
        milk: {
          ob: 0,
          collections: {},
          sourceTotals: { Cow: 0, Buffalo: 0, Goat: 0 },
          totalIn: 0,
          totalAvailable: 0,
          cardSales: 0,
          cashSales: 0,
          prod: {},
          cb: 0
        },
        products: {}
      };
      categories.forEach(cat => {
        dailyData[day].products[cat.toLowerCase()] = { ob: 0, prod: 0, total: 0, sale: 0, cb: 0 };
      });
    });

    // Populate Collections
    milkEntries.forEach((r: any) => {
      const day = getDayStr(r.date);
      const supplierName = r.supplier || 'Other';

      if (!dailyData[day].milk.collections[supplierName]) {
        dailyData[day].milk.collections[supplierName] = 0;
      }
      dailyData[day].milk.collections[supplierName] += r.quantity;

      const source = r.source;
      if (source && source !== 'Other') {
        if (!dailyData[day].milk.sourceTotals[source]) {
          dailyData[day].milk.sourceTotals[source] = 0;
        }
        dailyData[day].milk.sourceTotals[source] += r.quantity;
      }

      dailyData[day].milk.totalIn += r.quantity;
    });

    // Populate Milk Productions (Separation)
    milkProductions.forEach((r: any) => {
      const day = getDayStr(r.date);
      dailyData[day].milk.prod.separation = (dailyData[day].milk.prod.separation || 0) + r.separationMilk;
      
      const setProd = (p: string, val: number) => {
        const pk = p.toLowerCase();
        if (!dailyData[day].products[pk]) dailyData[day].products[pk] = { ob: 0, prod: 0, total: 0, sale: 0, cb: 0 };
        dailyData[day].products[pk].prod += val;
      };

      setProd('skim milk', r.skimMilk);
      setProd('cream', r.creamMilk);
      setProd('mixed milk', r.mixedMilk || 0);
    });

    // Populate Product Productions
    productProductions.forEach((r: any) => {
      const day = getDayStr(r.date);
      const category = r.productName.toLowerCase();
      if (!dailyData[day].products[category]) {
        dailyData[day].products[category] = { ob: 0, prod: 0, total: 0, sale: 0, cb: 0 };
      }
      dailyData[day].products[category].prod += r.quantityProduced;

      if (r.milkUsed?.wholeMilk) dailyData[day].milk.prod[category] = (dailyData[day].milk.prod[category] || 0) + r.milkUsed.wholeMilk;

      const reduceProd = (p: string, val: number) => {
        const pk = p.toLowerCase();
        if (!dailyData[day].products[pk]) dailyData[day].products[pk] = { ob: 0, prod: 0, total: 0, sale: 0, cb: 0 };
        dailyData[day].products[pk].prod -= val;
      };

      if (r.milkUsed?.skimMilk) reduceProd('skim milk', r.milkUsed.skimMilk);
      if (r.milkUsed?.creamMilk) reduceProd('cream', r.milkUsed.creamMilk);
      if (r.milkUsed?.mixedMilk) reduceProd('mixed milk', r.milkUsed.mixedMilk);
    });

    // Populate Sales
    saleEntries.forEach((r: any) => {
      const day = getDayStr(r.date);
      const product = r.productType;
      const isCard = r.paymentMode === 'UPI' || r.paymentMode === 'Credit';

      if (product === 'Cow Milk' || product === 'Raw Milk' || product === 'Buffalo Milk' || product === 'Goat Milk') {
        if (isCard) dailyData[day].milk.cardSales += r.quantity;
        else dailyData[day].milk.cashSales += r.quantity;
      } else {
        const prodKey = product.toLowerCase();
        if (!dailyData[day].products[prodKey]) {
          dailyData[day].products[prodKey] = { ob: 0, prod: 0, total: 0, sale: 0, cb: 0 };
        }
        dailyData[day].products[prodKey].sale += r.quantity;
      }
    });

    const sortedDates = Array.from(allDates).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    // Calculate Running Balances
    let milkRunning = 0;
    const prodRunning: Record<string, number> = {};

    const result = sortedDates.map(date => {
      const d = (dailyData as any)[date];

      // Consolidated Milk
      d.milk.ob = milkRunning;
      d.milk.totalAvailable = d.milk.ob + d.milk.totalIn;
      const milkProdTotal = (Object.values(d.milk.prod || {}) as any[]).reduce((a, b) => a + b, 0);
      d.milk.cb = d.milk.totalAvailable - d.milk.cardSales - d.milk.cashSales - milkProdTotal;
      milkRunning = d.milk.cb;

      // Products
      Object.keys(d.products).forEach(p => {
        if (prodRunning[p] === undefined) prodRunning[p] = 0;
        d.products[p].ob = prodRunning[p];
        d.products[p].total = d.products[p].ob + d.products[p].prod;
        d.products[p].cb = d.products[p].total - d.products[p].sale;
        prodRunning[p] = d.products[p].cb;
      });

      // Maintain overall keys for compatibility
      return {
        ...d,
        openingBalance: d.milk.ob,
        milkCollection: d.milk.totalIn,
        availableMilk: d.milk.totalAvailable,
        productionUse: (Object.values(d.milk.prod || {}) as any[]).reduce((a, b) => a + b, 0),
        sales: d.milk.cardSales + d.milk.cashSales,
        closingBalance: d.milk.cb
      };
    });

    result.reverse();
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Fetch Complete Analysis Error:', error);
    return res.status(500).json({ message: error?.message || 'Internal Server Error' });
  }
});

app.get('/api/reports', async (req, res) => {
  try {
    await connectToDatabase();
    const filter = typeof req.query.filter === 'string' ? req.query.filter : 'all';
    const userId = typeof req.query.userId === 'string' ? req.query.userId : null;

    if (!userId) return res.status(400).json({ message: 'userId is required' });

    const now = new Date();
    let startDate = new Date(0);
    if (filter === 'month') startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    else if (filter === 'today') startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const dateQuery: any = filter === 'all' ? { userId } : { userId, createdAt: { $gte: startDate } };
    const milkDateQuery: any = filter === 'all' ? { userId } : { userId, date: { $gte: startDate } };

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

    const productResult = await ProductProduction.aggregate([
      { $match: milkDateQuery },
      { $group: { _id: null, totalProduced: { $sum: '$quantityProduced' }, totalBatches: { $sum: 1 } } }
    ]);
    const products = { produced: productResult[0]?.totalProduced || 0, batches: productResult[0]?.totalBatches || 0 };

    const activeSuppliers = await Supplier.countDocuments({ userId, isActive: true });
    const totalSuppliers = await Supplier.countDocuments({ userId });

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

// --- Admin Endpoints ---

// Middeleware placeholder: Assuming admin checks are either here or on frontend.
// For now, we will just securely return the data. We should probably require an `adminId` query or body param for safety.
// Middleware for super-admin
const requireSuperAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const superAdminId = req.query.superAdminId || req.body.superAdminId;
  if (!superAdminId) return res.status(401).json({ error: 'Unauthorized: superAdminId required' });
  await connectToDatabase();
  const superUser = await User.findById(superAdminId);
  if (!superUser || superUser.role !== 'super-admin') {
    return res.status(403).json({ error: 'Forbidden: Super Admin access only' });
  }
  next();
};

const requireAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const adminId = req.query.adminId || req.body.adminId;
  if (!adminId) return res.status(401).json({ error: 'Unauthorized: adminId required' });
  await connectToDatabase();
  const adminUser = await User.findById(adminId);
  if (!adminUser || (adminUser.role !== 'admin' && adminUser.role !== 'super-admin')) {
    return res.status(403).json({ error: 'Forbidden: Admin access only' });
  }
  next();
};

app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    await connectToDatabase();
    // In our logic, the caller is the admin, so find users where adminId is the caller's ID
    const adminId = String(req.query.adminId || req.body.adminId);
    if (!adminId || adminId === 'undefined') return res.status(400).json({ error: 'adminId required' });
    const users = await User.find({ adminId }).select('-passwordHash -password').sort({ createdAt: -1 });
    return res.status(200).json(users);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    await connectToDatabase();
    const { name, email, password, role, modules } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Required fields missing' });

    const existingUser = await User.findOne({ email: String(email).toLowerCase() });
    if (existingUser) return res.status(409).json({ error: 'Email already exists' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(String(password), salt);

    const newUser = await User.create({
      name,
      email: String(email).toLowerCase(),
      passwordHash,
      role: role || 'user',
      modules: modules || ['collection', 'history', 'production', 'suppliers', 'sales', 'reports', 'quality'],
      adminId: String(req.query.adminId || req.body.adminId || ''),
    });

    return res.status(201).json({
      message: 'User created successfully',
      user: {
        id: (newUser.role === 'admin' || newUser.role === 'super-admin') ? newUser._id : (newUser.adminId || newUser._id),
        profileId: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        modules: newUser.modules
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    await connectToDatabase();
    const id = req.params.id;
    const { name, email, role, modules, password } = req.body;

    let updateData: any = { name, email: String(email).toLowerCase(), role, modules };

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(String(password), salt);
    }

    const updatedUser = await User.findByIdAndUpdate(id, { $set: updateData }, { new: true }).select('-passwordHash -password');
    if (!updatedUser) return res.status(404).json({ error: 'User not found' });

    return res.status(200).json({ message: 'User updated successfully', user: updatedUser });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    await connectToDatabase();
    const id = req.params.id;
    await User.findByIdAndDelete(id);
    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// --- Super Admin Endpoints ---
app.get('/api/super-admin/admins', requireSuperAdmin, async (req, res) => {
  try {
    await connectToDatabase();
    const superAdminId = String(req.query.superAdminId || req.body.superAdminId);
    const admins = await User.find({ adminId: superAdminId, role: 'admin' }).select('-passwordHash -password').sort({ createdAt: -1 }).lean();

    const adminsWithCounts = await Promise.all(admins.map(async (admin: any) => {
      const count = await User.countDocuments({ adminId: String(admin._id) });
      return { ...admin, userCount: count };
    }));

    return res.status(200).json(adminsWithCounts);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/super-admin/admins', requireSuperAdmin, async (req, res) => {
  try {
    await connectToDatabase();
    const { name, email, password, modules } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Required fields missing' });

    const existingUser = await User.findOne({ email: String(email).toLowerCase() });
    if (existingUser) return res.status(409).json({ error: 'Email already exists' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(String(password), salt);

    const superAdminId = String(req.query.superAdminId || req.body.superAdminId);

    const newAdmin = await User.create({
      name,
      email: String(email).toLowerCase(),
      passwordHash,
      role: 'admin',
      modules: modules || ['collection', 'history', 'production', 'suppliers', 'sales', 'reports', 'quality'],
      adminId: superAdminId,
    });

    return res.status(201).json({ message: 'Admin created successfully', user: newAdmin });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.delete('/api/super-admin/admins/:id', requireSuperAdmin, async (req, res) => {
  try {
    await connectToDatabase();
    const id = req.params.id;
    const admin = await User.findById(id);
    if (!admin || admin.role !== 'admin') {
      return res.status(404).json({ error: 'Admin not found' });
    }
    await User.findByIdAndDelete(id);
    return res.status(200).json({ message: 'Admin deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/super-admin/admins/:adminId/users', requireSuperAdmin, async (req, res) => {
  try {
    await connectToDatabase();
    const adminId = req.params.adminId;
    const users = await User.find({ adminId }).select('-passwordHash -password').sort({ createdAt: -1 });
    return res.status(200).json(users);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/super-admin/admins/:adminId/users', requireSuperAdmin, async (req, res) => {
  try {
    await connectToDatabase();
    const adminId = req.params.adminId;
    const { name, email, password, modules } = req.body;

    if (!name || !email || !password) return res.status(400).json({ error: 'Required fields missing' });

    const existingUser = await User.findOne({ email: String(email).toLowerCase() });
    if (existingUser) return res.status(409).json({ error: 'Email already exists' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(String(password), salt);

    const newUser = await User.create({
      name,
      email: String(email).toLowerCase(),
      passwordHash,
      role: 'user',
      modules: modules || ['collection', 'history', 'production', 'suppliers', 'sales', 'reports', 'quality'],
      adminId: adminId,
    });

    return res.status(201).json({ message: 'User created successfully', user: newUser });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

const port = Number(process.env.PORT || 3000);
connectToDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
  });
}).catch(err => {
  console.error('Failed to connect to database:', err);
  process.exit(1);
});

