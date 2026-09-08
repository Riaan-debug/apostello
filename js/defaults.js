'use strict';

const DEFAULT_SETTINGS = {
  businessName: 'Apostellō Café',
  slogan: 'not just served, Sent.',
  location: 'CMV Business Park',
  tradingHours: '06:30 – 15:30',
  operatingDays: 5,
  dailyCupTarget: 100,
  loyaltyFreeAt: 10,
  staffPin: '',
  googleBizUrl: 'https://business.google.com',
  yocoUrl: 'https://portal.yoco.com',
  instagramUrl: '',
  whatsappUrl: '',
};

const MENU_DEFAULTS = [
  { id: 'm1', name: 'Espresso', cat: 'Espresso', active: true,
    sizes: [{ sz: 'S', label: 'Single', price: 25 }, { sz: 'M', label: 'Double', price: 32 }] },
  { id: 'm2', name: 'Americano', cat: 'Espresso', active: true,
    sizes: [{ sz: 'S', label: 'Small', price: 30 }, { sz: 'M', label: 'Medium', price: 35 }, { sz: 'L', label: 'Large', price: 40 }] },
  { id: 'm3', name: 'Cappuccino', cat: 'Milk-based', active: true,
    sizes: [{ sz: 'S', label: 'Small (8oz)', price: 35 }, { sz: 'M', label: 'Medium (12oz)', price: 40 }, { sz: 'L', label: 'Large (16oz)', price: 46 }] },
  { id: 'm4', name: 'Latte', cat: 'Milk-based', active: true,
    sizes: [{ sz: 'S', label: 'Small (8oz)', price: 36 }, { sz: 'M', label: 'Medium (12oz)', price: 42 }, { sz: 'L', label: 'Large (16oz)', price: 48 }] },
  { id: 'm5', name: 'Flat White', cat: 'Milk-based', active: true,
    sizes: [{ sz: 'M', label: 'Standard', price: 38 }] },
  { id: 'm6', name: 'Mocha', cat: 'Speciality', active: true,
    sizes: [{ sz: 'S', label: 'Small (8oz)', price: 40 }, { sz: 'M', label: 'Medium (12oz)', price: 46 }, { sz: 'L', label: 'Large (16oz)', price: 52 }] },
  { id: 'm7', name: 'Hot Chocolate', cat: 'Speciality', active: true,
    sizes: [{ sz: 'S', label: 'Small (8oz)', price: 38 }, { sz: 'M', label: 'Medium (12oz)', price: 44 }, { sz: 'L', label: 'Large (16oz)', price: 50 }] },
  { id: 'm8', name: 'Cold Brew', cat: 'Cold', active: true,
    sizes: [{ sz: 'M', label: 'Regular', price: 45 }, { sz: 'L', label: 'Large', price: 52 }] },
];

const STOCK_DEFAULTS = [
  { id: 's1', name: 'Coffee beans', cat: 'Coffee', unit: 'g', reorder: 100, count: 500 },
  { id: 's2', name: 'Full cream milk', cat: 'Dairy', unit: 'L', reorder: 2, count: 8 },
  { id: 's3', name: 'Low fat milk', cat: 'Dairy', unit: 'L', reorder: 1, count: 4 },
  { id: 's4', name: 'Oat milk', cat: 'Dairy alt', unit: 'L', reorder: 1, count: 2 },
  { id: 's5', name: 'Chocolate powder', cat: 'Dry goods', unit: 'g', reorder: 50, count: 200 },
  { id: 's6', name: 'Vanilla syrup', cat: 'Syrups', unit: 'ml', reorder: 100, count: 300 },
  { id: 's7', name: 'Caramel syrup', cat: 'Syrups', unit: 'ml', reorder: 100, count: 300 },
  { id: 's8', name: 'Croissants', cat: 'Bakery', unit: 'each', reorder: 4, count: 12 },
  { id: 's9', name: 'Banana bread', cat: 'Bakery', unit: 'each', reorder: 3, count: 10 },
  { id: 's10', name: 'Muffins', cat: 'Bakery', unit: 'each', reorder: 2, count: 8 },
  { id: 's11', name: 'Cups small (8oz)', cat: 'Packaging', unit: 'each', reorder: 20, count: 100 },
  { id: 's12', name: 'Cups medium (12oz)', cat: 'Packaging', unit: 'each', reorder: 20, count: 100 },
  { id: 's13', name: 'Cups large (16oz)', cat: 'Packaging', unit: 'each', reorder: 20, count: 100 },
  { id: 's14', name: 'Cup lids', cat: 'Packaging', unit: 'each', reorder: 40, count: 200 },
  { id: 's15', name: 'Gas (LPG)', cat: 'Energy', unit: 'cyl', reorder: 1, count: 2 },
];
