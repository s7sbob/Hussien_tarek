// POS System JavaScript
class POSSystem {
    constructor() {
        this.tables = [];
        this.currentOrder = null;
        this.selectedTable = null;
        this.receipts = new Map(); // Map of tableId -> array of receipts
        
        this.init();
        this.loadSampleData();
        this.bindEvents();
    }

    init() {
        this.renderTables();
    }

    // Load sample data for demonstration
    loadSampleData() {
        // Sample tables data
        this.tables = [
            { id: 1, number: 1, status: 'available', receipts: [] },
            { id: 2, number: 2, status: 'occupied', receipts: [
                {
                    id: 'R001',
                    items: [
                        { id: 1, name: 'كريب نوتيلا', quantity: 2, price: 25.00 },
                        { id: 2, name: 'بيتزا مارجريتا', quantity: 1, price: 45.00 },
                        { id: 3, name: 'بطاطس مقلية', quantity: 3, price: 15.00 }
                    ],
                    total: 140.00
                }
            ]},
            { id: 3, number: 3, status: 'occupied', receipts: [
                {
                    id: 'R002',
                    items: [
                        { id: 4, name: 'شاورما دجاج', quantity: 2, price: 30.00 },
                        { id: 5, name: 'سلطة خضراء', quantity: 1, price: 20.00 }
                    ],
                    total: 80.00
                },
                {
                    id: 'R003',
                    items: [
                        { id: 6, name: 'عصير برتقال', quantity: 2, price: 12.00 }
                    ],
                    total: 24.00
                }
            ]},
            { id: 4, number: 4, status: 'available', receipts: [] },
            { id: 5, number: 5, status: 'available', receipts: [] },
            { id: 6, number: 6, status: 'available', receipts: [] },
        ];

        // Store receipts in the map
        this.tables.forEach(table => {
            if (table.receipts.length > 0) {
                this.receipts.set(table.id, table.receipts);
            }
        });
    }

    bindEvents() {
        // Table transfer modal events
        document.getElementById('table-transfer-btn').addEventListener('click', () => {
            this.showTransferModal();
        });

        document.getElementById('close-transfer-modal').addEventListener('click', () => {
            this.hideTransferModal();
        });

        document.getElementById('cancel-transfer-btn').addEventListener('click', () => {
            this.hideTransferModal();
        });

        document.getElementById('confirm-transfer-btn').addEventListener('click', () => {
            this.confirmTransfer();
        });

        // Table split modal events
        document.getElementById('table-split-btn').addEventListener('click', () => {
            this.showSplitModal();
        });

        document.getElementById('close-split-modal').addEventListener('click', () => {
            this.hideSplitModal();
        });

        document.getElementById('cancel-split-btn').addEventListener('click', () => {
            this.hideSplitModal();
        });

        document.getElementById('confirm-split-btn').addEventListener('click', () => {
            this.confirmSplit();
        });

        document.getElementById('add-receipt-btn').addEventListener('click', () => {
            this.addNewReceipt();
        });

        // Receipt selection modal events
        document.getElementById('close-receipt-selection-modal').addEventListener('click', () => {
            this.hideReceiptSelectionModal();
        });

        // Order section events
        document.getElementById('close-order-btn').addEventListener('click', () => {
            this.closeCurrentOrder();
        });

        document.getElementById('save-order-btn').addEventListener('click', () => {
            this.saveCurrentOrder();
        });

        // Modal background click to close
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('show');
                }
            });
        });
    }

    renderTables() {
        const tablesGrid = document.getElementById('tables-grid');
        tablesGrid.innerHTML = '';

        this.tables.forEach(table => {
            const tableCard = document.createElement('div');
            tableCard.className = `table-card ${table.status}`;
            
            if (table.receipts.length > 1) {
                tableCard.classList.add('multiple-receipts');
            }

            tableCard.innerHTML = `
                <div class="table-number">طاولة ${table.number}</div>
                <div class="table-status">${this.getStatusText(table.status)}</div>
                ${table.receipts.length > 1 ? `<div class="receipts-count">${table.receipts.length}</div>` : ''}
            `;

            tableCard.addEventListener('click', () => {
                this.selectTable(table);
            });

            tablesGrid.appendChild(tableCard);
        });
    }

    getStatusText(status) {
        const statusMap = {
            'available': 'متاحة',
            'occupied': 'مشغولة'
        };
        return statusMap[status] || status;
    }

    selectTable(table) {
        this.selectedTable = table;

        // If table has multiple receipts, show selection modal
        if (table.receipts.length > 1) {
            this.showReceiptSelectionModal(table);
        } else if (table.receipts.length === 1) {
            // Show the single receipt
            this.showOrder(table.receipts[0], table);
        } else {
            // Create new receipt for empty table
            this.createNewReceipt(table);
        }
    }

    showReceiptSelectionModal(table) {
        const modal = document.getElementById('receipt-selection-modal');
        const receiptsList = document.getElementById('receipts-list');
        
        receiptsList.innerHTML = '';

        table.receipts.forEach((receipt, index) => {
            const receiptCard = document.createElement('div');
            receiptCard.className = 'receipt-card';
            receiptCard.innerHTML = `
                <div class="receipt-info">
                    <div class="receipt-number">ريسيت #${receipt.id}</div>
                    <div class="receipt-total">${receipt.total.toFixed(2)} ج.م</div>
                </div>
                <div class="receipt-items-count">${receipt.items.length} صنف</div>
            `;

            receiptCard.addEventListener('click', () => {
                this.showOrder(receipt, table);
                this.hideReceiptSelectionModal();
            });

            receiptsList.appendChild(receiptCard);
        });

        modal.classList.add('show');
    }

    hideReceiptSelectionModal() {
        document.getElementById('receipt-selection-modal').classList.remove('show');
    }

    createNewReceipt(table) {
        const newReceipt = {
            id: this.generateReceiptId(),
            items: [],
            total: 0.00
        };

        table.receipts.push(newReceipt);
        table.status = 'occupied';
        
        this.showOrder(newReceipt, table);
        this.renderTables();
    }

    showOrder(receipt, table) {
        this.currentOrder = { receipt, table };
        
        document.getElementById('order-title').textContent = `طلب الطاولة ${table.number} - ريسيت #${receipt.id}`;
        document.getElementById('current-order-section').style.display = 'block';
        
        this.renderOrderItems();
        this.updateOrderSummary();
    }

    renderOrderItems() {
        const orderItems = document.getElementById('order-items');
        orderItems.innerHTML = '';

        if (!this.currentOrder || !this.currentOrder.receipt.items.length) {
            orderItems.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 2rem;">لا توجد أصناف في هذا الطلب</p>';
            return;
        }

        this.currentOrder.receipt.items.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'order-item';
            itemElement.draggable = true;
            itemElement.dataset.itemIndex = index;
            
            itemElement.innerHTML = `
                <div class="item-info">
                    <div class="item-name">${item.name}</div>
                    <div class="item-details">سعر الوحدة: ${item.price.toFixed(2)} ج.م</div>
                </div>
                <div class="item-quantity">${item.quantity}</div>
                <div class="item-price">${(item.quantity * item.price).toFixed(2)} ج.م</div>
            `;

            // Add click event to select/deselect item
            itemElement.addEventListener('click', () => {
                itemElement.classList.toggle('selected');
            });

            orderItems.appendChild(itemElement);
        });
    }

    updateOrderSummary() {
        if (!this.currentOrder) return;

        const subtotal = this.currentOrder.receipt.items.reduce((sum, item) => 
            sum + (item.quantity * item.price), 0);
        const tax = subtotal * 0.14; // 14% tax
        const total = subtotal + tax;

        document.getElementById('subtotal').textContent = `${subtotal.toFixed(2)} ج.م`;
        document.getElementById('tax').textContent = `${tax.toFixed(2)} ج.م`;
        document.getElementById('total').textContent = `${total.toFixed(2)} ج.م`;

        // Update receipt total
        this.currentOrder.receipt.total = total;
    }

    closeCurrentOrder() {
        document.getElementById('current-order-section').style.display = 'none';
        this.currentOrder = null;
        this.selectedTable = null;
    }

    saveCurrentOrder() {
        if (!this.currentOrder) return;

        // Update the table data
        const tableIndex = this.tables.findIndex(t => t.id === this.currentOrder.table.id);
        if (tableIndex !== -1) {
            this.tables[tableIndex] = this.currentOrder.table;
        }

        this.renderTables();
        alert('تم حفظ الطلب بنجاح!');
    }

    // Table Transfer Functions
    showTransferModal() {
        const modal = document.getElementById('transfer-modal');
        const fromSelect = document.getElementById('from-table-select');
        const toSelect = document.getElementById('to-table-select');

        // Populate from table select (occupied tables only)
        fromSelect.innerHTML = '<option value="">اختر الطاولة</option>';
        this.tables.filter(t => t.status === 'occupied').forEach(table => {
            const option = document.createElement('option');
            option.value = table.id;
            option.textContent = `طاولة ${table.number}`;
            fromSelect.appendChild(option);
        });

        // Populate to table select (available tables only)
        toSelect.innerHTML = '<option value="">اختر الطاولة</option>';
        this.tables.filter(t => t.status === 'available').forEach(table => {
            const option = document.createElement('option');
            option.value = table.id;
            option.textContent = `طاولة ${table.number}`;
            toSelect.appendChild(option);
        });

        modal.classList.add('show');
    }

    hideTransferModal() {
        document.getElementById('transfer-modal').classList.remove('show');
    }

    confirmTransfer() {
        const fromTableId = parseInt(document.getElementById('from-table-select').value);
        const toTableId = parseInt(document.getElementById('to-table-select').value);

        if (!fromTableId || !toTableId) {
            alert('يرجى اختيار الطاولات');
            return;
        }

        if (fromTableId === toTableId) {
            alert('لا يمكن نقل الطاولة لنفسها');
            return;
        }

        const fromTable = this.tables.find(t => t.id === fromTableId);
        const toTable = this.tables.find(t => t.id === toTableId);

        if (!fromTable || !toTable) {
            alert('خطأ في بيانات الطاولات');
            return;
        }

        // Transfer all receipts from source to destination
        toTable.receipts = [...toTable.receipts, ...fromTable.receipts];
        toTable.status = 'occupied';

        // Clear source table
        fromTable.receipts = [];
        fromTable.status = 'available';

        // Update receipts map
        this.receipts.delete(fromTableId);
        if (toTable.receipts.length > 0) {
            this.receipts.set(toTableId, toTable.receipts);
        }

        this.renderTables();
        this.hideTransferModal();
        
        alert(`تم نقل طلبات الطاولة ${fromTable.number} إلى الطاولة ${toTable.number} بنجاح!`);
    }

    // Table Split Functions
    showSplitModal() {
        if (!this.selectedTable || !this.selectedTable.receipts.length) {
            alert('يرجى اختيار طاولة تحتوي على طلبات أولاً');
            return;
        }

        // For simplicity, we'll split the first receipt if multiple exist
        const receiptToSplit = this.selectedTable.receipts[0];
        
        if (!receiptToSplit.items.length) {
            alert('لا توجد أصناف لفصلها');
            return;
        }

        const modal = document.getElementById('split-modal');
        this.renderSplitModal(receiptToSplit);
        modal.classList.add('show');
    }

    renderSplitModal(receipt) {
        const originalItems = document.getElementById('original-items');
        const splitOrders = document.getElementById('split-orders');

        // Render original items
        originalItems.innerHTML = '';
        receipt.items.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'order-item draggable-item';
            itemElement.draggable = true;
            itemElement.dataset.itemIndex = index;
            
            itemElement.innerHTML = `
                <div class="item-info">
                    <div class="item-name">${item.name}</div>
                    <div class="item-details">سعر الوحدة: ${item.price.toFixed(2)} ج.م</div>
                </div>
                <div class="item-quantity">${item.quantity}</div>
                <div class="item-price">${(item.quantity * item.price).toFixed(2)} ج.م</div>
            `;

            // Add drag events
            this.addDragEvents(itemElement);
            originalItems.appendChild(itemElement);
        });

        // Clear and initialize split orders area
        splitOrders.innerHTML = '';
        
        // Initialize with one empty split order
        this.addNewReceipt();
    }

    addNewReceipt() {
        const splitOrders = document.getElementById('split-orders');
        const receiptCount = splitOrders.children.length + 1;
        
        const splitOrder = document.createElement('div');
        splitOrder.className = 'split-order';
        splitOrder.innerHTML = `
            <h4>ريسيت جديد #${receiptCount}</h4>
            <div class="drop-zone" data-receipt-index="${receiptCount}">
                اسحب الأصناف هنا لإنشاء ريسيت جديد
            </div>
            <div class="split-items"></div>
            <div class="split-total">المجموع: 0.00 ج.م</div>
        `;

        this.addDropEvents(splitOrder.querySelector('.drop-zone'));
        splitOrders.appendChild(splitOrder);
    }

    addDragEvents(element) {
        element.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', e.target.dataset.itemIndex);
            e.target.style.opacity = '0.5';
        });

        element.addEventListener('dragend', (e) => {
            e.target.style.opacity = '1';
        });
    }

    addDropEvents(dropZone) {
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            
            const itemIndex = e.dataTransfer.getData('text/plain');
            this.moveItemToSplit(itemIndex, dropZone);
        });
    }

    moveItemToSplit(itemIndex, dropZone) {
        const originalItems = document.getElementById('original-items');
        const itemElement = originalItems.querySelector(`[data-item-index="${itemIndex}"]`);
        
        if (!itemElement) return;

        const splitOrder = dropZone.closest('.split-order');
        const splitItems = splitOrder.querySelector('.split-items');
        
        // Move the item visually
        splitItems.appendChild(itemElement);
        splitOrder.classList.add('has-items');
        
        // Hide the drop zone and show items
        dropZone.style.display = 'none';
        splitItems.style.display = 'block';
        
        // Update split total
        this.updateSplitTotal(splitOrder);
    }

    updateSplitTotal(splitOrder) {
        const items = splitOrder.querySelectorAll('.order-item');
        let total = 0;
        
        items.forEach(item => {
            const priceText = item.querySelector('.item-price').textContent;
            const price = parseFloat(priceText.replace(' ج.م', ''));
            total += price;
        });
        
        splitOrder.querySelector('.split-total').textContent = `المجموع: ${total.toFixed(2)} ج.م`;
    }

    hideSplitModal() {
        document.getElementById('split-modal').classList.remove('show');
    }

    confirmSplit() {
        const splitOrders = document.getElementById('split-orders');
        const splitOrderElements = splitOrders.querySelectorAll('.split-order.has-items');
        
        if (splitOrderElements.length === 0) {
            alert('يرجى إنشاء ريسيت واحد على الأقل');
            return;
        }

        // Create new receipts for each split
        const newReceipts = [];
        
        splitOrderElements.forEach((splitOrder, index) => {
            const items = [];
            const itemElements = splitOrder.querySelectorAll('.order-item');
            
            itemElements.forEach(itemEl => {
                const itemIndex = parseInt(itemEl.dataset.itemIndex);
                const originalItem = this.selectedTable.receipts[0].items[itemIndex];
                if (originalItem) {
                    items.push({ ...originalItem });
                }
            });
            
            if (items.length > 0) {
                const newReceipt = {
                    id: this.generateReceiptId(),
                    items: items,
                    total: items.reduce((sum, item) => sum + (item.quantity * item.price), 0)
                };
                newReceipts.push(newReceipt);
            }
        });

        // Update the original receipt to remove moved items
        const remainingItems = [];
        const originalItems = document.getElementById('original-items').querySelectorAll('.order-item');
        
        originalItems.forEach(itemEl => {
            const itemIndex = parseInt(itemEl.dataset.itemIndex);
            const originalItem = this.selectedTable.receipts[0].items[itemIndex];
            if (originalItem) {
                remainingItems.push({ ...originalItem });
            }
        });

        // Update the table's receipts
        if (remainingItems.length > 0) {
            this.selectedTable.receipts[0].items = remainingItems;
            this.selectedTable.receipts[0].total = remainingItems.reduce((sum, item) => 
                sum + (item.quantity * item.price), 0);
        } else {
            // Remove the original receipt if empty
            this.selectedTable.receipts.shift();
        }

        // Add new receipts
        this.selectedTable.receipts.push(...newReceipts);

        // Update table status
        if (this.selectedTable.receipts.length === 0) {
            this.selectedTable.status = 'available';
        }

        this.renderTables();
        this.hideSplitModal();
        
        alert(`تم فصل الريسيت بنجاح! تم إنشاء ${newReceipts.length} ريسيت جديد`);
    }

    generateReceiptId() {
        return 'R' + Date.now().toString().slice(-6);
    }
}

// Initialize the POS system when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new POSSystem();
});