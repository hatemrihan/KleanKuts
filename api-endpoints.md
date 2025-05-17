# E-commerce API Endpoints and Fix Scripts

## API Endpoints

### Inventory Management
- `POST /api/inventory/update-from-order`: Updates inventory based on an order ID
- `POST /api/inventory/sync-all-orders`: Synchronizes inventory across all orders

### Order Management
- `POST /api/orders`: Creates a new order
- `GET /api/orders/[id]`: Gets an order by ID
- `POST /api/orders/[id]/update`: Updates an order
- `POST /api/orders/[id]/items/update`: Updates specific items in an order

## Fix Scripts

### Update Order Fields (`scripts/update-order-fields.js`)
This script fixes two common issues in the database:
1. Payment method discrepancies (e.g., orders with screenshots showing as "Cash on Delivery" instead of "instaPay")
2. Inventory flags not being properly updated (`inventoryUpdated` staying false even when `inventoryProcessed` is true)

To run this script:
```bash
# Make sure you're in the seif directory
cd seif

# Run the script
node scripts/update-order-fields.js
```

### Fix Payment Status (`scripts/fix-payment-status.js`)
This script fixes various payment-related fields in existing orders:
- Adds missing `paymentMethod` field
- Sets correct `paymentVerified` field for instaPay orders
- Initializes missing inventory flags

To run this script:
```bash
# Make sure you're in the seif directory
cd seif

# Run the script
node scripts/fix-payment-status.js
```

## Troubleshooting

### Orders not showing correctly in admin panel
If orders are not displaying the correct payment method or screenshots in the admin panel:
1. Run the `update-order-fields.js` script to fix database issues
2. Check MongoDB directly to verify the fields were updated
3. Reload the admin panel

### Inventory not updating after orders
If inventory is not being reduced after orders:
1. Check MongoDB to see if `inventoryProcessed` and `inventoryUpdated` flags are set correctly
2. Run the fix scripts if needed
3. Use the Inventory Management page in the admin dashboard to sync inventory manually 