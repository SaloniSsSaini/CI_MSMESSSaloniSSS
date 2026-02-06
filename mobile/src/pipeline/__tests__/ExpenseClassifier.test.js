/**
 * ExpenseClassifier Test Suite
 * Comprehensive tests for expense classification covering all categories and edge cases
 */

import {
    classifyExpense,
    parseUPITransaction,
    extractExpenseAmount,
    getExpenseCategoryInfo,
    ExpenseClassifier,
    ExpenseCategory,
    ExpenseSubcategory,
} from '../ExpenseClassifier';

import {
    isDLTHeader,
    isPersonalNumber,
    createSpamDetector,
} from '../index';

describe('ExpenseClassifier', () => {
    // ============= Amount Extraction Tests =============
    describe('extractExpenseAmount', () => {
        test('extracts amount with Rs. prefix', () => {
            const result = extractExpenseAmount('Payment of Rs.500 received');
            expect(result).toEqual({ value: 500, currency: 'INR' });
        });

        test('extracts amount with Rs prefix (no dot)', () => {
            const result = extractExpenseAmount('Rs 1,500.00 debited');
            expect(result).toEqual({ value: 1500, currency: 'INR' });
        });

        test('extracts amount with ₹ symbol', () => {
            const result = extractExpenseAmount('₹2500.50 credited');
            expect(result).toEqual({ value: 2500.50, currency: 'INR' });
        });

        test('extracts amount with INR prefix', () => {
            const result = extractExpenseAmount('INR 10,000 transferred');
            expect(result).toEqual({ value: 10000, currency: 'INR' });
        });

        test('extracts amount from debited pattern', () => {
            const result = extractExpenseAmount('Your account has been debited with 5000');
            expect(result).toEqual({ value: 5000, currency: 'INR' });
        });

        test('returns null for empty text', () => {
            const result = extractExpenseAmount('');
            expect(result).toBeNull();
        });

        test('returns null for text without amount', () => {
            const result = extractExpenseAmount('Your order has been confirmed');
            expect(result).toBeNull();
        });

        test('extracts large amounts with commas', () => {
            const result = extractExpenseAmount('Rs.1,25,000.00 transferred');
            expect(result).toEqual({ value: 125000, currency: 'INR' });
        });
    });

    // ============= UPI Transaction Parsing Tests =============
    describe('parseUPITransaction', () => {
        test('parses standard UPI debit message', () => {
            const text = 'Rs.500.00 debited from A/c XX1234 to SWIGGY@ybl on 31-01-26. UPI Ref: 123456789012';
            const result = parseUPITransaction(text);
            
            expect(result.isUPI).toBe(true);
            expect(result.transactionType).toBe('debit');
            expect(result.upiRef).toBe('123456789012');
            expect(result.upiId).toBe('swiggy@ybl');
        });

        test('parses UPI credit message', () => {
            const text = 'Rs.1000.00 credited to A/c XX5678 from JOHN@okaxis on 31-01-26. UPI Ref: 987654321012';
            const result = parseUPITransaction(text);
            
            expect(result.isUPI).toBe(true);
            expect(result.transactionType).toBe('credit');
            expect(result.upiId).toBe('john@okaxis');
        });

        test('detects payment app - GPay', () => {
            const text = 'Payment of Rs.350 via GPay successful. Ref: 505050505050';
            const result = parseUPITransaction(text);
            
            expect(result.isUPI).toBe(true);
            expect(result.paymentApp).toBe('gpay');
        });

        test('detects payment app - PhonePe', () => {
            const text = 'PhonePe: Rs.200 paid to merchant@upi';
            const result = parseUPITransaction(text);
            
            expect(result.isUPI).toBe(true);
            expect(result.paymentApp).toBe('phonepe');
        });

        test('detects payment app - Paytm', () => {
            const text = 'Paytm payment of Rs.100 successful';
            const result = parseUPITransaction(text);
            
            expect(result.isUPI).toBe(true);
            expect(result.paymentApp).toBe('paytm');
        });

        test('extracts merchant name from UPI ID', () => {
            const text = 'Payment to zomato.food@ybl';
            const result = parseUPITransaction(text);
            
            expect(result.upiId).toBe('zomato.food@ybl');
            expect(result.merchantName).toBe('zomato food');
        });

        test('detects bank in message', () => {
            const text = 'HDFC Bank: Rs.500 debited via UPI';
            const result = parseUPITransaction(text);
            
            expect(result.bank).toBe('hdfc');
        });

        test('extracts account number', () => {
            const text = 'A/c XX1234 debited Rs.500';
            const result = parseUPITransaction(text);
            
            expect(result.accountNumber).toBe('1234');
        });

        test('returns non-UPI for regular message', () => {
            const text = 'Your order has been shipped';
            const result = parseUPITransaction(text);
            
            expect(result.isUPI).toBe(false);
        });
    });

    // ============= Food Category Classification Tests =============
    describe('Food Category Classification', () => {
        test('classifies Swiggy as food.delivery', () => {
            const result = classifyExpense('Rs.350 debited for Swiggy order');
            
            expect(result.category).toBe(ExpenseCategory.FOOD);
            expect(result.subcategory).toBe(ExpenseSubcategory.DELIVERY);
            expect(result.merchant).toBe('swiggy');
        });

        test('classifies Zomato as food.delivery', () => {
            const result = classifyExpense('Payment of Rs.450 to Zomato successful');
            
            expect(result.category).toBe(ExpenseCategory.FOOD);
            expect(result.subcategory).toBe(ExpenseSubcategory.DELIVERY);
            expect(result.merchant).toBe('zomato');
        });

        test('classifies BigBasket as food.grocery', () => {
            const result = classifyExpense('Rs.1200 debited for BigBasket order');
            
            expect(result.category).toBe(ExpenseCategory.FOOD);
            expect(result.subcategory).toBe(ExpenseSubcategory.GROCERY);
            expect(result.merchant).toBe('bigbasket');
        });

        test('classifies Blinkit as food.grocery', () => {
            const result = classifyExpense('Blinkit payment of Rs.300 successful');
            
            expect(result.category).toBe(ExpenseCategory.FOOD);
            expect(result.subcategory).toBe(ExpenseSubcategory.GROCERY);
        });

        test('classifies Zepto as food.grocery', () => {
            const result = classifyExpense('Your Zepto order Rs.250 delivered');
            
            expect(result.category).toBe(ExpenseCategory.FOOD);
            expect(result.subcategory).toBe(ExpenseSubcategory.GROCERY);
        });

        test('classifies Dominos as food.delivery', () => {
            const result = classifyExpense('Rs.599 debited for Dominos order');
            
            expect(result.category).toBe(ExpenseCategory.FOOD);
            expect(result.subcategory).toBe(ExpenseSubcategory.DELIVERY);
        });

        test('classifies Starbucks as food.restaurant', () => {
            const result = classifyExpense('Payment at Starbucks Rs.450');
            
            expect(result.category).toBe(ExpenseCategory.FOOD);
            expect(result.subcategory).toBe(ExpenseSubcategory.RESTAURANT);
        });
    });

    // ============= Transport Category Classification Tests =============
    describe('Transport Category Classification', () => {
        test('classifies Uber as transport.cab', () => {
            const result = classifyExpense('Rs.250 debited for Uber trip');
            
            expect(result.category).toBe(ExpenseCategory.TRANSPORT);
            expect(result.subcategory).toBe(ExpenseSubcategory.CAB);
            expect(result.merchant).toBe('uber');
        });

        test('classifies Ola as transport.cab', () => {
            const result = classifyExpense('Ola ride payment Rs.180 successful');
            
            expect(result.category).toBe(ExpenseCategory.TRANSPORT);
            expect(result.subcategory).toBe(ExpenseSubcategory.CAB);
        });

        test('classifies Rapido as transport.cab', () => {
            const result = classifyExpense('Rapido auto Rs.50 paid');
            
            expect(result.category).toBe(ExpenseCategory.TRANSPORT);
            expect(result.subcategory).toBe(ExpenseSubcategory.CAB);
        });

        test('classifies IOCL as transport.fuel', () => {
            const result = classifyExpense('Rs.2000 debited at IOCL petrol pump for 25L');
            
            expect(result.category).toBe(ExpenseCategory.TRANSPORT);
            expect(result.subcategory).toBe(ExpenseSubcategory.FUEL);
        });

        test('classifies HPCL as transport.fuel', () => {
            const result = classifyExpense('Payment Rs.1500 at HPCL fuel station');
            
            expect(result.category).toBe(ExpenseCategory.TRANSPORT);
            expect(result.subcategory).toBe(ExpenseSubcategory.FUEL);
        });

        test('classifies FASTag as transport.toll', () => {
            const result = classifyExpense('FASTag: Rs.150 toll deducted');
            
            expect(result.category).toBe(ExpenseCategory.TRANSPORT);
            expect(result.subcategory).toBe(ExpenseSubcategory.TOLL);
        });

        test('classifies Metro as transport.public', () => {
            const result = classifyExpense('DMRC Metro card recharged Rs.500');
            
            expect(result.category).toBe(ExpenseCategory.TRANSPORT);
            expect(result.subcategory).toBe(ExpenseSubcategory.PUBLIC);
        });

        test('classifies IRCTC as transport.public', () => {
            const result = classifyExpense('IRCTC ticket booking Rs.1200 confirmed');
            
            expect(result.category).toBe(ExpenseCategory.TRANSPORT);
            expect(result.subcategory).toBe(ExpenseSubcategory.PUBLIC);
        });

        test('classifies IndiGo as transport.flight', () => {
            const result = classifyExpense('IndiGo flight booking Rs.5500 confirmed');
            
            expect(result.category).toBe(ExpenseCategory.TRANSPORT);
            expect(result.subcategory).toBe(ExpenseSubcategory.FLIGHT);
        });
    });

    // ============= Energy Category Classification Tests =============
    describe('Energy Category Classification', () => {
        test('classifies BESCOM as energy.electricity', () => {
            const result = classifyExpense('BESCOM bill Rs.2500 paid successfully');
            
            expect(result.category).toBe(ExpenseCategory.ENERGY);
            expect(result.subcategory).toBe(ExpenseSubcategory.ELECTRICITY);
        });

        test('classifies electricity bill keyword as energy.electricity', () => {
            const result = classifyExpense('Your electricity bill of Rs.1800 is due');
            
            expect(result.category).toBe(ExpenseCategory.ENERGY);
            expect(result.subcategory).toBe(ExpenseSubcategory.ELECTRICITY);
        });

        test('classifies Tata Power as energy.electricity', () => {
            const result = classifyExpense('Tata Power bill payment Rs.3200 received');
            
            expect(result.category).toBe(ExpenseCategory.ENERGY);
            expect(result.subcategory).toBe(ExpenseSubcategory.ELECTRICITY);
        });

        test('classifies gas bill as energy.gas', () => {
            const result = classifyExpense('Your gas bill of Rs.800 has been paid');
            
            expect(result.category).toBe(ExpenseCategory.ENERGY);
            expect(result.subcategory).toBe(ExpenseSubcategory.GAS);
        });

        test('classifies Indane as energy.gas', () => {
            const result = classifyExpense('Indane LPG cylinder booking Rs.900');
            
            expect(result.category).toBe(ExpenseCategory.ENERGY);
            expect(result.subcategory).toBe(ExpenseSubcategory.GAS);
        });

        test('classifies water bill as energy.water', () => {
            const result = classifyExpense('Water bill payment Rs.350 successful');
            
            expect(result.category).toBe(ExpenseCategory.ENERGY);
            expect(result.subcategory).toBe(ExpenseSubcategory.WATER);
        });
    });

    // ============= Shopping Category Classification Tests =============
    describe('Shopping Category Classification', () => {
        test('classifies Amazon as shopping.online', () => {
            const result = classifyExpense('Amazon order Rs.2500 confirmed');
            
            expect(result.category).toBe(ExpenseCategory.SHOPPING);
            expect(result.subcategory).toBe(ExpenseSubcategory.ONLINE);
        });

        test('classifies Flipkart as shopping.online', () => {
            const result = classifyExpense('Flipkart payment Rs.3500 successful');
            
            expect(result.category).toBe(ExpenseCategory.SHOPPING);
            expect(result.subcategory).toBe(ExpenseSubcategory.ONLINE);
        });

        test('classifies Myntra as shopping.clothing', () => {
            const result = classifyExpense('Myntra order Rs.1500 shipped');
            
            expect(result.category).toBe(ExpenseCategory.SHOPPING);
            expect(result.subcategory).toBe(ExpenseSubcategory.CLOTHING);
        });

        test('classifies Croma as shopping.electronics', () => {
            const result = classifyExpense('Payment at Croma Rs.25000 successful');
            
            expect(result.category).toBe(ExpenseCategory.SHOPPING);
            expect(result.subcategory).toBe(ExpenseSubcategory.ELECTRONICS);
        });

        test('classifies Reliance Digital as shopping.electronics', () => {
            const result = classifyExpense('Reliance Digital purchase Rs.15000');
            
            expect(result.category).toBe(ExpenseCategory.SHOPPING);
            expect(result.subcategory).toBe(ExpenseSubcategory.ELECTRONICS);
        });
    });

    // ============= Bills Category Classification Tests =============
    describe('Bills Category Classification', () => {
        test('classifies Jio as bills.mobile', () => {
            const result = classifyExpense('Jio recharge of Rs.239 successful');
            
            expect(result.category).toBe(ExpenseCategory.BILLS);
            expect(result.subcategory).toBe(ExpenseSubcategory.MOBILE);
        });

        test('classifies Airtel as bills.mobile', () => {
            const result = classifyExpense('Airtel prepaid recharge Rs.299 done');
            
            expect(result.category).toBe(ExpenseCategory.BILLS);
            expect(result.subcategory).toBe(ExpenseSubcategory.MOBILE);
        });

        test('classifies Tata Sky as bills.dth', () => {
            const result = classifyExpense('Tata Sky recharge Rs.350 successful');
            
            expect(result.category).toBe(ExpenseCategory.BILLS);
            expect(result.subcategory).toBe(ExpenseSubcategory.DTH);
        });

        test('classifies ACT Fibernet as bills.broadband', () => {
            const result = classifyExpense('ACT Fibernet bill Rs.999 paid');
            
            expect(result.category).toBe(ExpenseCategory.BILLS);
            expect(result.subcategory).toBe(ExpenseSubcategory.BROADBAND);
        });

        test('classifies mobile recharge keyword as bills.mobile', () => {
            const result = classifyExpense('Your mobile recharge of Rs.199 is successful');
            
            expect(result.category).toBe(ExpenseCategory.BILLS);
            expect(result.subcategory).toBe(ExpenseSubcategory.MOBILE);
        });
    });

    // ============= Finance Category Classification Tests =============
    describe('Finance Category Classification', () => {
        test('classifies EMI as finance.emi', () => {
            const result = classifyExpense('EMI of Rs.5000 debited from your account');
            
            expect(result.category).toBe(ExpenseCategory.FINANCE);
            expect(result.subcategory).toBe(ExpenseSubcategory.EMI);
        });

        test('classifies loan EMI as finance.emi', () => {
            const result = classifyExpense('Home Loan EMI Rs.25000 auto-debited');
            
            expect(result.category).toBe(ExpenseCategory.FINANCE);
            expect(result.subcategory).toBe(ExpenseSubcategory.EMI);
        });

        test('classifies LIC as finance.insurance', () => {
            const result = classifyExpense('LIC premium Rs.10000 debited');
            
            expect(result.category).toBe(ExpenseCategory.FINANCE);
            expect(result.subcategory).toBe(ExpenseSubcategory.INSURANCE);
        });

        test('classifies insurance premium as finance.insurance', () => {
            const result = classifyExpense('Your insurance premium of Rs.5000 is due');
            
            expect(result.category).toBe(ExpenseCategory.FINANCE);
            expect(result.subcategory).toBe(ExpenseSubcategory.INSURANCE);
        });

        test('classifies Zerodha as finance.investment', () => {
            const result = classifyExpense('Zerodha: Rs.10000 added to your trading account');
            
            expect(result.category).toBe(ExpenseCategory.FINANCE);
            expect(result.subcategory).toBe(ExpenseSubcategory.INVESTMENT);
        });

        test('classifies SIP as finance.investment', () => {
            const result = classifyExpense('SIP investment of Rs.5000 successful');
            
            expect(result.category).toBe(ExpenseCategory.FINANCE);
            expect(result.subcategory).toBe(ExpenseSubcategory.INVESTMENT);
        });

        test('classifies credit card bill as finance.credit_card', () => {
            const result = classifyExpense('Credit card bill Rs.15000 is due');
            
            expect(result.category).toBe(ExpenseCategory.FINANCE);
            expect(result.subcategory).toBe(ExpenseSubcategory.CREDIT_CARD);
        });
    });

    // ============= Healthcare Category Classification Tests =============
    describe('Healthcare Category Classification', () => {
        test('classifies Apollo Pharmacy as healthcare.pharmacy', () => {
            const result = classifyExpense('Apollo Pharmacy purchase Rs.500');
            
            expect(result.category).toBe(ExpenseCategory.HEALTHCARE);
            expect(result.subcategory).toBe(ExpenseSubcategory.PHARMACY);
        });

        test('classifies 1mg as healthcare.pharmacy', () => {
            const result = classifyExpense('1mg order Rs.350 delivered');
            
            expect(result.category).toBe(ExpenseCategory.HEALTHCARE);
            expect(result.subcategory).toBe(ExpenseSubcategory.PHARMACY);
        });

        test('classifies PharmEasy as healthcare.pharmacy', () => {
            const result = classifyExpense('PharmEasy payment Rs.800 successful');
            
            expect(result.category).toBe(ExpenseCategory.HEALTHCARE);
            expect(result.subcategory).toBe(ExpenseSubcategory.PHARMACY);
        });

        test('classifies hospital payment as healthcare.hospital', () => {
            const result = classifyExpense('Hospital bill payment Rs.5000');
            
            expect(result.category).toBe(ExpenseCategory.HEALTHCARE);
            expect(result.subcategory).toBe(ExpenseSubcategory.HOSPITAL);
        });

        test('classifies diagnostic lab as healthcare.diagnostic', () => {
            const result = classifyExpense('Blood test at diagnostic lab Rs.1500');
            
            expect(result.category).toBe(ExpenseCategory.HEALTHCARE);
            expect(result.subcategory).toBe(ExpenseSubcategory.DIAGNOSTIC);
        });

        test('classifies Practo as healthcare.consultation', () => {
            const result = classifyExpense('Practo consultation fee Rs.500 paid');
            
            expect(result.category).toBe(ExpenseCategory.HEALTHCARE);
            expect(result.subcategory).toBe(ExpenseSubcategory.CONSULTATION);
        });
    });

    // ============= Entertainment Category Classification Tests =============
    describe('Entertainment Category Classification', () => {
        test('classifies Netflix as entertainment.ott', () => {
            const result = classifyExpense('Netflix subscription Rs.199 charged');
            
            expect(result.category).toBe(ExpenseCategory.ENTERTAINMENT);
            expect(result.subcategory).toBe(ExpenseSubcategory.OTT);
        });

        test('classifies Hotstar as entertainment.ott', () => {
            const result = classifyExpense('Hotstar premium Rs.299 renewed');
            
            expect(result.category).toBe(ExpenseCategory.ENTERTAINMENT);
            expect(result.subcategory).toBe(ExpenseSubcategory.OTT);
        });

        test('classifies Spotify as entertainment.ott', () => {
            const result = classifyExpense('Spotify subscription Rs.119 charged');
            
            expect(result.category).toBe(ExpenseCategory.ENTERTAINMENT);
            expect(result.subcategory).toBe(ExpenseSubcategory.OTT);
        });

        test('classifies PVR as entertainment.movies', () => {
            const result = classifyExpense('PVR movie ticket booking Rs.350');
            
            expect(result.category).toBe(ExpenseCategory.ENTERTAINMENT);
            expect(result.subcategory).toBe(ExpenseSubcategory.MOVIES);
        });

        test('classifies BookMyShow as entertainment.movies', () => {
            const result = classifyExpense('BookMyShow ticket Rs.500 confirmed');
            
            expect(result.category).toBe(ExpenseCategory.ENTERTAINMENT);
            expect(result.subcategory).toBe(ExpenseSubcategory.MOVIES);
        });
    });

    // ============= Education Category Classification Tests =============
    describe('Education Category Classification', () => {
        test('classifies Udemy as education.courses', () => {
            const result = classifyExpense('Udemy course purchase Rs.499');
            
            expect(result.category).toBe(ExpenseCategory.EDUCATION);
            expect(result.subcategory).toBe(ExpenseSubcategory.COURSES);
        });

        test('classifies Coursera as education.courses', () => {
            const result = classifyExpense('Coursera subscription Rs.2500');
            
            expect(result.category).toBe(ExpenseCategory.EDUCATION);
            expect(result.subcategory).toBe(ExpenseSubcategory.COURSES);
        });

        test('classifies school fee as education.fees', () => {
            const result = classifyExpense('School fee payment Rs.15000 received');
            
            expect(result.category).toBe(ExpenseCategory.EDUCATION);
            expect(result.subcategory).toBe(ExpenseSubcategory.FEES);
        });

        test('classifies tuition fee as education.fees', () => {
            const result = classifyExpense('Tuition fee Rs.5000 debited');
            
            expect(result.category).toBe(ExpenseCategory.EDUCATION);
            expect(result.subcategory).toBe(ExpenseSubcategory.FEES);
        });
    });

    // ============= Transfer Category Classification Tests =============
    describe('Transfer Category Classification', () => {
        test('classifies UPI P2P transfer', () => {
            const result = classifyExpense('Rs.1000 sent to JOHN@ybl via UPI');
            
            expect(result.category).toBe(ExpenseCategory.TRANSFER);
            expect(result.subcategory).toBe(ExpenseSubcategory.P2P);
        });

        test('classifies salary credit as transfer.salary', () => {
            const result = classifyExpense('Salary of Rs.50000 credited to your account');
            
            expect(result.category).toBe(ExpenseCategory.TRANSFER);
            expect(result.subcategory).toBe(ExpenseSubcategory.SALARY);
        });

        test('classifies generic credit as transfer', () => {
            const result = classifyExpense('Rs.5000 credited to A/c XX1234');
            
            expect(result.category).toBe(ExpenseCategory.TRANSFER);
        });
    });

    // ============= Edge Cases Tests =============
    describe('Edge Cases', () => {
        test('handles empty string', () => {
            const result = classifyExpense('');
            
            expect(result.category).toBe(ExpenseCategory.OTHER);
            expect(result.reasonCodes).toContain('empty_message');
        });

        test('handles null input', () => {
            const result = classifyExpense(null);
            
            expect(result.category).toBe(ExpenseCategory.OTHER);
        });

        test('handles message with multiple keywords', () => {
            // Swiggy should take priority as merchant detection is first
            const result = classifyExpense('Swiggy food delivery order Rs.500 via Uber Eats');
            
            expect(result.category).toBe(ExpenseCategory.FOOD);
            expect(result.merchant).toBe('swiggy');
        });

        test('handles Amazon Fresh as food.grocery not shopping', () => {
            const result = classifyExpense('Amazon Fresh grocery order Rs.800');
            
            expect(result.category).toBe(ExpenseCategory.FOOD);
            expect(result.subcategory).toBe(ExpenseSubcategory.GROCERY);
        });

        test('handles ambiguous message with low confidence', () => {
            const result = classifyExpense('Payment successful Rs.500');
            
            expect(result.category).toBe(ExpenseCategory.OTHER);
            expect(result.confidence).toBeLessThan(0.5);
        });

        test('handles regional/abbreviated merchant names', () => {
            const result = classifyExpense('MCD order Rs.350 delivered');
            
            expect(result.category).toBe(ExpenseCategory.FOOD);
            expect(result.subcategory).toBe(ExpenseSubcategory.DELIVERY);
        });

        test('handles case insensitive merchant matching', () => {
            const result = classifyExpense('SWIGGY ORDER rs.400 CONFIRMED');
            
            expect(result.category).toBe(ExpenseCategory.FOOD);
            expect(result.merchant).toBe('swiggy');
        });

        test('handles UPI message without clear merchant', () => {
            const result = classifyExpense('Rs.200 sent to random@upi via UPI');
            
            expect(result.category).toBe(ExpenseCategory.TRANSFER);
            expect(result.subcategory).toBe(ExpenseSubcategory.P2P);
            expect(result.upiDetails?.isUPI).toBe(true);
        });

        test('handles non-standard UPI message format', () => {
            const result = classifyExpense('UPI txn of Rs.300 successful ref 123456789012');
            
            expect(result.upiDetails?.isUPI).toBe(true);
            expect(result.upiDetails?.upiRef).toBe('123456789012');
        });
    });

    // ============= Category Info Tests =============
    describe('getExpenseCategoryInfo', () => {
        test('returns correct info for food category', () => {
            const info = getExpenseCategoryInfo('food', 'delivery');
            
            expect(info.label).toBe('Delivery');
            expect(info.icon).toBeTruthy();
            expect(info.color).toBe('#FF6B6B');
        });

        test('returns correct info for transport.cab', () => {
            const info = getExpenseCategoryInfo('transport', 'cab');
            
            expect(info.label).toBe('Cab');
            expect(info.categoryLabel).toBe('Transport');
        });

        test('returns fallback for unknown category', () => {
            const info = getExpenseCategoryInfo('unknown_category');
            
            expect(info.label).toBe('Other');
        });

        test('returns category info when no subcategory provided', () => {
            const info = getExpenseCategoryInfo('shopping');
            
            expect(info.label).toBe('Shopping');
            expect(info.icon).toBe('🛍️');
        });
    });

    // ============= ExpenseClassifier Class Tests =============
    describe('ExpenseClassifier class methods', () => {
        test('classify method works correctly', () => {
            const result = ExpenseClassifier.classify('Swiggy order Rs.400');
            
            expect(result.category).toBe(ExpenseCategory.FOOD);
        });

        test('parseUPI method works correctly', () => {
            const result = ExpenseClassifier.parseUPI('UPI Ref: 123456789012');
            
            expect(result.isUPI).toBe(true);
            expect(result.upiRef).toBe('123456789012');
        });

        test('extractAmount method works correctly', () => {
            const result = ExpenseClassifier.extractAmount('Rs.500 debited');
            
            expect(result?.value).toBe(500);
        });

        test('getCategoryInfo method works correctly', () => {
            const info = ExpenseClassifier.getCategoryInfo('energy', 'electricity');
            
            expect(info.label).toBe('Electricity');
        });
    });

    // ============= Real-world SMS Samples Tests =============
    describe('Real-world SMS Samples', () => {
        test('classifies HDFC bank debit SMS', () => {
            const sms = 'Rs.2,500.00 debited from A/c XX1234 on 31-01-26. Info: UPI-SWIGGY@ybl. Avl Bal: Rs.45,000.00-HDFC Bank';
            const result = classifyExpense(sms);
            
            expect(result.category).toBe(ExpenseCategory.FOOD);
            expect(result.amount?.value).toBe(2500);
            expect(result.upiDetails?.isUPI).toBe(true);
        });

        test('classifies SBI electricity bill SMS', () => {
            const sms = 'Your BESCOM electricity bill of Rs.1,850 has been paid via BHIM SBI Pay. Ref: 505050505050';
            const result = classifyExpense(sms);
            
            expect(result.category).toBe(ExpenseCategory.ENERGY);
            expect(result.subcategory).toBe(ExpenseSubcategory.ELECTRICITY);
        });

        test('classifies ICICI credit card SMS', () => {
            // Note: Credit card transactions are classified as finance.credit_card 
            // because the message explicitly mentions "Credit Card"
            const sms = 'Your ICICI Credit Card XX5678 has been used for Rs.3,500 at AMAZON on 31-Jan-26';
            const result = classifyExpense(sms);
            
            expect(result.category).toBe(ExpenseCategory.FINANCE);
            expect(result.subcategory).toBe(ExpenseSubcategory.CREDIT_CARD);
            expect(result.amount?.value).toBe(3500);
        });

        test('classifies Axis Bank EMI SMS', () => {
            const sms = 'EMI of Rs.12,500 for Loan A/c XX9876 debited from your Axis Bank A/c. Next EMI due: 28-Feb-26';
            const result = classifyExpense(sms);
            
            expect(result.category).toBe(ExpenseCategory.FINANCE);
            expect(result.subcategory).toBe(ExpenseSubcategory.EMI);
        });

        test('classifies Paytm wallet recharge', () => {
            const sms = 'Paytm: Rs.1,000 added to your wallet via UPI. New balance: Rs.1,500';
            const result = classifyExpense(sms);
            
            expect(result.upiDetails?.isUPI).toBe(true);
            expect(result.upiDetails?.paymentApp).toBe('paytm');
        });
    });
});

// ============= DLT Header Detection Tests =============
describe('DLT Header Detection', () => {
    describe('isDLTHeader', () => {
        test('recognizes standard DLT headers', () => {
            expect(isDLTHeader('HDFCBK')).toBe(true);
            expect(isDLTHeader('SBIINB')).toBe(true);
            expect(isDLTHeader('IKIBNK')).toBe(true);
            expect(isDLTHeader('SWIGGY')).toBe(true);
            expect(isDLTHeader('ZOMATO')).toBe(true);
        });

        test('recognizes DLT headers with prefix', () => {
            expect(isDLTHeader('XX-HDFCBK')).toBe(true);
            expect(isDLTHeader('VM-SWIGGY')).toBe(true);
            expect(isDLTHeader('AD-ICICIB')).toBe(true);
            expect(isDLTHeader('JK-PYTMSG')).toBe(true);
            expect(isDLTHeader('BP-SBIBNK')).toBe(true);
        });

        test('recognizes bank headers', () => {
            expect(isDLTHeader('HDFCBANK')).toBe(true);
            expect(isDLTHeader('ICICIB')).toBe(true);
            expect(isDLTHeader('AXISBK')).toBe(true);
            expect(isDLTHeader('KOTAKB')).toBe(true);
        });

        test('rejects personal mobile numbers', () => {
            expect(isDLTHeader('9876543210')).toBe(false);
            expect(isDLTHeader('+919876543210')).toBe(false);
            expect(isDLTHeader('919876543210')).toBe(false);
            expect(isDLTHeader('+91-9876543210')).toBe(false);
            expect(isDLTHeader('+91 9876543210')).toBe(false);
        });

        test('rejects various phone number formats', () => {
            expect(isDLTHeader('8765432109')).toBe(false);
            expect(isDLTHeader('7654321098')).toBe(false);
            expect(isDLTHeader('6543210987')).toBe(false);
            expect(isDLTHeader('+918765432109')).toBe(false);
        });

        test('handles null/empty sender', () => {
            expect(isDLTHeader(null)).toBe(false);
            expect(isDLTHeader('')).toBe(false);
            expect(isDLTHeader(undefined)).toBe(false);
        });
    });

    describe('isPersonalNumber', () => {
        test('identifies personal mobile numbers', () => {
            expect(isPersonalNumber('9876543210')).toBe(true);
            expect(isPersonalNumber('+919876543210')).toBe(true);
            expect(isPersonalNumber('919876543210')).toBe(true);
            expect(isPersonalNumber('+91-9876543210')).toBe(true);
        });

        test('identifies numbers starting with 6,7,8,9', () => {
            expect(isPersonalNumber('6123456789')).toBe(true);
            expect(isPersonalNumber('7123456789')).toBe(true);
            expect(isPersonalNumber('8123456789')).toBe(true);
            expect(isPersonalNumber('9123456789')).toBe(true);
        });

        test('rejects DLT headers', () => {
            expect(isPersonalNumber('HDFCBK')).toBe(false);
            expect(isPersonalNumber('XX-SBIBNK')).toBe(false);
            expect(isPersonalNumber('SWIGGY')).toBe(false);
        });

        test('treats null/empty as personal (unknown)', () => {
            expect(isPersonalNumber(null)).toBe(true);
            expect(isPersonalNumber('')).toBe(true);
            expect(isPersonalNumber(undefined)).toBe(true);
        });
    });

    describe('Spam Detection with Sender Check', () => {
        const spamDetector = createSpamDetector();

        test('marks personal number messages as spam', () => {
            const result = spamDetector.predict(
                'Rs.500 debited from your account',
                '9876543210'
            );
            
            expect(result.isSpam).toBe(true);
            expect(result.reasonCodes).toContain('personal_number');
        });

        test('allows DLT header messages to be transactions', () => {
            const result = spamDetector.predict(
                'Rs.500 debited from A/c XX1234. UPI Ref: 123456789012',
                'HDFCBK'
            );
            
            expect(result.isSpam).toBe(false);
            expect(result.reasonCodes).toContain('dlt_header');
            expect(result.isTransactional).toBe(true);
        });

        test('marks +91 prefixed numbers as spam', () => {
            const result = spamDetector.predict(
                'Hey, please send me Rs.500',
                '+919876543210'
            );
            
            expect(result.isSpam).toBe(true);
            expect(result.reasonCodes).toContain('personal_number');
        });

        test('allows XX-PREFIX DLT headers', () => {
            const result = spamDetector.predict(
                'Rs.1000 credited to A/c XX5678',
                'XX-SBIINB'
            );
            
            expect(result.isSpam).toBe(false);
            expect(result.isTransactional).toBe(true);
        });

        test('marks null sender as spam', () => {
            const result = spamDetector.predict(
                'Some random message',
                null
            );
            
            expect(result.isSpam).toBe(true);
        });

        test('classifies OTP from DLT as spam', () => {
            const result = spamDetector.predict(
                'Your OTP is 123456. Do not share with anyone.',
                'HDFCBK'
            );
            
            expect(result.isSpam).toBe(true);
            expect(result.reasonCodes).toContain('otp');
        });

        test('classifies promo from DLT as spam', () => {
            const result = spamDetector.predict(
                'Get 50% off on your next order! Shop now.',
                'VM-AMAZN'
            );
            
            expect(result.isSpam).toBe(true);
            expect(result.reasonCodes).toContain('promotional');
        });
    });
});
