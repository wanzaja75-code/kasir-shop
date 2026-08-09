// ============================================
// SHARED ALPINE COMPONENT - Digunakan di semua halaman
// ============================================

function kasirApp() {
    return {
        // ===== STATE =====
        darkMode: localStorage.getItem('theme') === 'dark',
        datetime: '',
        showBarcodeModal: false,
        waNumber: '',
        waHistory: JSON.parse(localStorage.getItem('waHistory') || '[]'),
        
        // Method
        methods: [
            { id: 'manual', icon: 'fa-keyboard', label: 'Manual' },
            { id: 'upload', icon: 'fa-upload', label: 'Upload' },
            { id: 'camera', icon: 'fa-camera', label: 'Kamera' }
        ],
        activeMethod: 'manual',
        
        // Status
        status: { icon: 'fa-info-circle', message: 'Pilih metode scan di bawah', type: 'info' },
        
        // Input
        barcodeInput: '',
        searchQuery: '',
        
        // Categories
        categories: [
            { id: 'all', icon: 'fa-boxes', label: 'Semua' },
            { id: 'Makanan', icon: 'fa-utensils', label: 'Makanan' },
            { id: 'Minuman', icon: 'fa-mug-saucer', label: 'Minuman' },
            { id: 'Snack', icon: 'fa-cookie-bite', label: 'Snack' },
            { id: 'Rokok', icon: 'fa-smoking', label: 'Rokok' },
            { id: 'Lainnya', icon: 'fa-box', label: 'Lainnya' }
        ],
        activeCategory: 'all',
        
        // Products
        productDB: JSON.parse(localStorage.getItem('productDB')) || {
            "8991234567890": { name: "Indomie Goreng", price: 3500, category: "Makanan", stock: 50, unit: "Pcs" },
            "8991234567891": { name: "Indomie Kuah", price: 3500, category: "Makanan", stock: 40, unit: "Pcs" },
            "8991234567892": { name: "Teh Pucuk 350ml", price: 4500, category: "Minuman", stock: 30, unit: "Pcs" },
            "8991234567893": { name: "Aqua 600ml", price: 3000, category: "Minuman", stock: 25, unit: "Pcs" },
            "8991234567894": { name: "Roti Tawar", price: 12000, category: "Makanan", stock: 15, unit: "Pack" },
            "8991234567895": { name: "Mie Sedap Goreng", price: 3200, category: "Makanan", stock: 45, unit: "Pcs" },
            "8991234567896": { name: "Mie Sedap Kuah", price: 3200, category: "Makanan", stock: 35, unit: "Pcs" },
            "8991234567897": { name: "Chitato 68g", price: 8500, category: "Snack", stock: 20, unit: "Pcs" },
            "8991234567898": { name: "Pocky Strawberry", price: 9500, category: "Snack", stock: 18, unit: "Box" },
            "8991234567899": { name: "Pocky Chocolate", price: 9500, category: "Snack", stock: 22, unit: "Box" },
            "1234567890123": { name: "Coca Cola 1.5L", price: 15000, category: "Minuman", stock: 12, unit: "Pcs" },
            "9876543210987": { name: "Pepsi 1.5L", price: 14000, category: "Minuman", stock: 10, unit: "Pcs" },
            "1111111111111": { name: "Sprite 1.5L", price: 14000, category: "Minuman", stock: 8, unit: "Pcs" },
            "7777777777777": { name: "Fanta 1.5L", price: 14000, category: "Minuman", stock: 5, unit: "Pcs" },
            "8888888888888": { name: "Marlboro Red", price: 28000, category: "Rokok", stock: 30, unit: "Pack" },
            "9999999999999": { name: "Sampoerna Mild", price: 26000, category: "Rokok", stock: 25, unit: "Pack" },
        },
        
        // Cart
        cart: JSON.parse(localStorage.getItem('cart')) || [],
        
        // Discount & Payment
        discount: 0,
        payment: 0,
        
        // New Product
        newProduct: { barcode: '', name: '', category: 'Makanan', unit: 'Pcs', price: '', stock: 0 },
        
        // Upload
        uploadResult: { message: '', type: '' },
        
        // Camera
        cameraActive: false,
        cameraStream: null,
        scanTimeout: null,
        
        // History
        history: JSON.parse(localStorage.getItem('kasirHistory') || '[]'),
        
        // ===== COMPUTED =====
        get subtotal() {
            return this.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        },
        get discountAmount() {
            return (this.subtotal * (parseFloat(this.discount) || 0)) / 100;
        },
        get grandTotal() {
            return this.subtotal - this.discountAmount;
        },
        get change() {
            return (parseFloat(this.payment) || 0) - this.grandTotal;
        },
        get quickProductsList() {
            let products = Object.entries(this.productDB).map(([code, p]) => ({ code, ...p }));
            if (this.activeCategory !== 'all') {
                products = products.filter(p => p.category === this.activeCategory);
            }
            return products.slice(0, 12);
        },
        get totalSales() {
            return this.history.reduce((sum, t) => sum + t.total, 0);
        },
        get averageSales() {
            return this.history.length > 0 ? this.totalSales / this.history.length : 0;
        },
        get totalItemsSold() {
            let total = 0;
            this.history.forEach(t => {
                t.items.forEach(item => total += item.qty);
            });
            return total;
        },
        get topProducts() {
            const products = {};
            this.history.forEach(t => {
                t.items.forEach(item => {
                    if (!products[item.name]) products[item.name] = { qty: 0, total: 0 };
                    products[item.name].qty += item.qty;
                    products[item.name].total += item.price * item.qty;
                });
            });
            return Object.entries(products)
                .map(([name, data]) => ({ name, ...data }))
                .sort((a, b) => b.qty - a.qty)
                .slice(0, 5);
        },
        get dailySales() {
            const daily = {};
            this.history.forEach(t => {
                const date = new Date(t.date).toLocaleDateString('id-ID');
                daily[date] = (daily[date] || 0) + t.total;
            });
            const sorted = Object.entries(daily).slice(-7).map(([date, total]) => ({
                date,
                total,
                percent: Math.min((total / this.totalSales) * 100, 100)
            }));
            return sorted.reverse();
        },
        
        // ===== INIT =====
        init() {
            this.updateDateTime();
            setInterval(() => this.updateDateTime(), 30000);
            if (this.darkMode) {
                document.documentElement.classList.add('dark');
            }
        },
        
        updateDateTime() {
            const now = new Date();
            this.datetime = now.toLocaleDateString('id-ID', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            }) + ' pukul ' + now.toLocaleTimeString('id-ID', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        },
        
        toggleTheme() {
            this.darkMode = !this.darkMode;
            localStorage.setItem('theme', this.darkMode ? 'dark' : 'light');
            document.documentElement.classList.toggle('dark');
        },
        
        setStatus(icon, message, type = 'info') {
            this.status = { icon, message, type };
        },
        
        switchMethod(method) {
            this.activeMethod = method;
            if (method !== 'camera' && this.cameraActive) {
                this.stopCamera();
            }
            this.setStatus('fa-info-circle', 'Mode: ' + (method === 'manual' ? 'Manual Input' : method === 'upload' ? 'Upload Foto' : 'Kamera Live'), 'info');
        },
        
        // ===== FORMAT =====
        formatNumber(num) {
            return Math.round(num || 0).toLocaleString();
        },
        
        // ===== PRODUCTS =====
        quickAdd(code) {
            this.barcodeInput = code;
            this.addItem();
        },
        
        addItem() {
            const code = this.barcodeInput.trim();
            if (!code) {
                this.setStatus('fa-exclamation-circle', 'Masukkan kode barcode', 'error');
                return;
            }
            
            const product = this.productDB[code];
            if (!product) {
                this.setStatus('fa-exclamation-circle', `Kode "${code}" tidak ditemukan`, 'error');
                this.barcodeInput = '';
                return;
            }
            
            if (product.stock !== undefined && product.stock <= 0) {
                this.setStatus('fa-exclamation-circle', `Stok ${product.name} habis!`, 'error');
                return;
            }
            
            const existing = this.cart.find(item => item.barcode === code);
            if (existing) {
                existing.qty += 1;
            } else {
                this.cart.push({
                    id: Date.now() + Math.random() * 1000,
                    barcode: code,
                    name: product.name,
                    price: product.price,
                    qty: 1,
                    unit: product.unit || 'Pcs'
                });
            }
            
            if (product.stock !== undefined) {
                product.stock -= 1;
            }
            
            this.barcodeInput = '';
            this.setStatus('fa-check-circle', `${product.name} ditambahkan!`, 'success');
            this.saveAll();
        },
        
        removeItem(id) {
            const item = this.cart.find(i => i.id === id);
            if (item) {
                const product = this.productDB[item.barcode];
                if (product && product.stock !== undefined) {
                    product.stock += item.qty;
                }
            }
            this.cart = this.cart.filter(item => item.id !== id);
            this.saveAll();
        },
        
        changeQty(id, delta) {
            const item = this.cart.find(i => i.id === id);
            if (!item) return;
            const newQty = item.qty + delta;
            if (newQty <= 0) {
                this.removeItem(id);
                return;
            }
            
            const product = this.productDB[item.barcode];
            if (product && product.stock !== undefined) {
                if (delta > 0 && product.stock < 1) {
                    this.setStatus('fa-exclamation-circle', `Stok ${product.name} habis!`, 'error');
                    return;
                }
                product.stock -= delta;
            }
            
            item.qty = newQty;
            this.saveAll();
        },
        
        clearCart() {
            if (this.cart.length === 0) return;
            if (confirm('Yakin kosongkan keranjang?')) {
                this.cart.forEach(item => {
                    const product = this.productDB[item.barcode];
                    if (product && product.stock !== undefined) {
                        product.stock += item.qty;
                    }
                });
                this.cart = [];
                this.saveAll();
            }
        },
        
        addNewProduct() {
            const { barcode, name, category, unit, price, stock } = this.newProduct;
            if (!barcode || !name || !price || isNaN(price) || price <= 0) {
                this.setStatus('fa-exclamation-circle', 'Isi semua data dengan benar!', 'error');
                return;
            }
            if (this.productDB[barcode]) {
                this.setStatus('fa-exclamation-circle', `Kode "${barcode}" sudah ada!`, 'error');
                return;
            }
            this.productDB[barcode] = { 
                name, 
                price: parseInt(price), 
                category, 
                unit: unit || 'Pcs',
                stock: parseInt(stock) || 0
            };
            this.newProduct = { barcode: '', name: '', category: 'Makanan', unit: 'Pcs', price: '', stock: 0 };
            this.setStatus('fa-check-circle', `"${name}" berhasil ditambahkan!`, 'success');
            this.saveAll();
        },
        
        deleteProduct(code) {
            if (confirm(`Hapus produk "${this.productDB[code]?.name}"?`)) {
                delete this.productDB[code];
                this.saveAll();
                this.setStatus('fa-check-circle', 'Produk dihapus!', 'success');
            }
        },
        
        searchProduct() {},
        
        filterCategory(category) {
            this.activeCategory = category;
        },
        
        // ===== UPLOAD =====
        handleUpload(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    
                    try {
                        const code = jsQR(imageData.data, imageData.width, imageData.height, {
                            inversionAttempts: "dontInvert",
                        });
                        if (code && code.data) {
                            this.barcodeInput = code.data;
                            const product = this.productDB[code.data];
                            if (product) {
                                this.uploadResult = { 
                                    message: `✅ ${product.name} - Rp ${product.price.toLocaleString()} (Stok: ${product.stock || 0})`, 
                                    type: 'success' 
                                };
                            } else {
                                this.uploadResult = { 
                                    message: `📝 Kode "${code.data}" - Silakan isi nama & harga di halaman Produk`, 
                                    type: 'info' 
                                };
                            }
                            setTimeout(() => this.addItem(), 300);
                        } else {
                            this.uploadResult = { message: '❌ Tidak ada barcode/QR terdeteksi', type: 'error' };
                        }
                    } catch (err) {
                        this.uploadResult = { message: '❌ Gagal membaca gambar', type: 'error' };
                    }
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
            event.target.value = '';
        },
        
        // ===== CAMERA =====
        async toggleCamera() {
            if (this.cameraActive) {
                this.stopCamera();
            } else {
                await this.startCamera();
            }
        },
        
        async startCamera() {
            try {
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    this.setStatus('fa-exclamation-circle', 'Browser tidak support kamera', 'error');
                    return;
                }
                
                this.setStatus('fa-camera', 'Mengakses kamera...', 'info');
                
                this.cameraStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
                    audio: false
                });
                
                const video = document.getElementById('video');
                video.srcObject = this.cameraStream;
                await video.play();
                
                this.cameraActive = true;
                this.setStatus('fa-camera', 'Kamera aktif - Arahkan ke barcode/QR', 'active');
                
                this.scanLoop();
                
                this.scanTimeout = setTimeout(() => {
                    if (this.cameraActive) {
                        this.setStatus('fa-clock', 'Waktu habis, scan ulang', 'info');
                        this.stopCamera();
                    }
                }, 15000);
                
            } catch (err) {
                let msg = 'Gagal akses kamera: ';
                if (err.name === 'NotAllowedError') msg += 'Izin ditolak.';
                else if (err.name === 'NotFoundError') msg += 'Tidak ada kamera.';
                else msg += err.message;
                this.setStatus('fa-exclamation-circle', msg, 'error');
                this.stopCamera();
            }
        },
        
        stopCamera() {
            this.cameraActive = false;
            if (this.cameraStream) {
                this.cameraStream.getTracks().forEach(t => t.stop());
                this.cameraStream = null;
            }
            const video = document.getElementById('video');
            video.srcObject = null;
            if (this.scanTimeout) {
                clearTimeout(this.scanTimeout);
                this.scanTimeout = null;
            }
            this.setStatus('fa-camera', 'Kamera dimatikan', 'info');
        },
        
        scanLoop() {
            if (!this.cameraActive) return;
            
            const video = document.getElementById('video');
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            try {
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert",
                });
                if (code && code.data) {
                    const barcode = code.data.trim();
                    this.barcodeInput = barcode;
                    const product = this.productDB[barcode];
                    if (product) {
                        this.setStatus('fa-check-circle', `${product.name} - Rp ${product.price.toLocaleString()} (Stok: ${product.stock || 0})`, 'success');
                        if (navigator.vibrate) navigator.vibrate(100);
                    } else {
                        this.setStatus('fa-exclamation-circle', `Kode "${barcode}" tidak ditemukan`, 'error');
                    }
                    this.stopCamera();
                    setTimeout(() => this.addItem(), 300);
                    return;
                }
            } catch (e) {}
            
            requestAnimationFrame(() => this.scanLoop());
        },
        
        // ===== SAVE ALL =====
        saveAll() {
            localStorage.setItem('cart', JSON.stringify(this.cart));
            localStorage.setItem('productDB', JSON.stringify(this.productDB));
            localStorage.setItem('kasirHistory', JSON.stringify(this.history));
        },
        
        saveData() {
            this.saveAll();
            this.setStatus('fa-check-circle', 'Semua data tersimpan!', 'success');
        },
        
        loadData() {
            const cart = localStorage.getItem('cart');
            const products = localStorage.getItem('productDB');
            const history = localStorage.getItem('kasirHistory');
            
            if (cart) this.cart = JSON.parse(cart);
            if (products) this.productDB = JSON.parse(products);
            if (history) this.history = JSON.parse(history);
            
            this.setStatus('fa-check-circle', 'Data berhasil dimuat!', 'success');
        },
        
        // ===== BACKUP =====
        exportBackup() {
            const data = {
                products: this.productDB,
                history: this.history,
                timestamp: new Date().toISOString()
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup_kasir_${new Date().toISOString().slice(0,10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            this.setStatus('fa-check-circle', 'Backup berhasil!', 'success');
        },
        
        importBackup() {
            document.getElementById('importFile')?.click();
        },
        
        handleImport(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (data.products) this.productDB = data.products;
                    if (data.history) this.history = data.history;
                    this.saveAll();
                    this.setStatus('fa-check-circle', 'Restore berhasil!', 'success');
                } catch (err) {
                    this.setStatus('fa-exclamation-circle', 'File tidak valid!', 'error');
                }
            };
            reader.readAsText(file);
            event.target.value = '';
        },
        
        resetAll() {
            if (confirm('⚠️ Yakin reset semua data? (Tidak bisa dibatalkan!)')) {
                if (confirm('Konfirmasi terakhir: Hapus semua data?')) {
                    localStorage.clear();
                    location.reload();
                }
            }
        },
        
        // ===== HISTORY =====
        viewHistory() {
            if (this.history.length === 0) {
                alert('📭 Belum ada riwayat transaksi');
                return;
            }
            let msg = '📊 RIWAYAT TRANSAKSI\n' + '='.repeat(40) + '\n\n';
            this.history.slice(-10).reverse().forEach((t, i) => {
                const date = new Date(t.date).toLocaleString('id-ID');
                msg += `${i+1}. ${date}\n   Total: Rp ${Math.round(t.total).toLocaleString()}\n   Items: ${t.items.length}\n\n`;
            });
            msg += '='.repeat(40) + '\nTotal Transaksi: ' + this.history.length;
            alert(msg);
        },
        
        saveTransaction() {
            if (this.cart.length === 0) return;
            this.history.push({
                id: Date.now(),
                date: new Date().toISOString(),
                items: JSON.parse(JSON.stringify(this.cart)),
                subtotal: this.subtotal,
                discount: parseFloat(this.discount) || 0,
                discountAmount: this.discountAmount,
                total: this.grandTotal
            });
            this.saveAll();
        },
        
        // ===== PRINT =====
        printReceipt() {
            if (this.cart.length === 0) {
                alert('Belum ada barang!');
                return;
            }
            
            this.saveTransaction();
            
            const now = new Date();
            const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
            const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            
            let html = `
                <div id="receiptPrint" style="font-family: 'Inter', monospace; padding: 24px; max-width: 340px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.1);">
                    <div style="text-align: center; border-bottom: 2px dashed #e2e8f0; padding-bottom: 12px;">
                        <h2 style="font-size: 20px; font-weight: 700; color: #0f2a44;">🧾 STRUK BELANJA</h2>
                        <p style="font-size: 11px; color: #94a3b8; margin-top: 2px;">${dateStr} ${timeStr}</p>
                    </div>
                    <div style="padding: 12px 0;">
            `;
            
            this.cart.forEach(item => {
                html += `
                    <div style="display: flex; justify-content: space-between; padding: 3px 0; font-size: 13px;">
                        <span>${item.name} x${item.qty}</span>
                        <span style="font-weight: 600;">Rp ${(item.price * item.qty).toLocaleString()}</span>
                    </div>
                `;
            });
            
            html += `
                    </div>
                    <div style="border-top: 2px dashed #e2e8f0; padding-top: 10px;">
                        <div style="display: flex; justify-content: space-between; font-size: 13px;">
                            <span>Subtotal</span>
                            <span>Rp ${this.subtotal.toLocaleString()}</span>
                        </div>
                        ${this.discount > 0 ? `
                        <div style="display: flex; justify-content: space-between; font-size: 12px; color: #94a3b8;">
                            <span>Diskon (${this.discount}%)</span>
                            <span>-Rp ${Math.round(this.discountAmount).toLocaleString()}</span>
                        </div>
                        ` : ''}
                        <div style="display: flex; justify-content: space-between; font-size: 20px; font-weight: 700; color: #0f2a44; margin-top: 6px; padding-top: 6px; border-top: 2px solid #e2e8f0;">
                            <span>TOTAL</span>
                            <span>Rp ${Math.round(this.grandTotal).toLocaleString()}</span>
                        </div>
                        ${this.payment > 0 ? `
                        <div style="display: flex; justify-content: space-between; font-size: 13px; margin-top: 4px;">
                            <span>Uang Bayar</span>
                            <span>Rp ${Number(this.payment).toLocaleString()}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 700; color: #22a65a;">
                            <span>Kembalian</span>
                            <span>Rp ${this.change >= 0 ? this.change.toLocaleString() : '0'}</span>
                        </div>
                        ` : ''}
                    </div>
                    <div style="text-align: center; font-size: 11px; color: #94a3b8; margin-top: 12px; padding-top: 12px; border-top: 2px dashed #e2e8f0;">
                        Terima kasih 🙏
                    </div>
                </div>
            `;
            
            const win = window.open('', '_blank', 'width=400,height=600');
            win.document.write(`<html><head><title>Struk</title></head><body style="margin:0; background:#f1f5f9; display:flex; align-items:center; justify-content:center; min-height:100vh;">${html}</body></html>`);
            win.document.close();
            setTimeout(() => win.print(), 500);
        },
        
        // ===== WHATSAPP =====
        sendWhatsAppDirect() {
            if (this.cart.length === 0) {
                alert('Keranjang kosong!');
                return;
            }
            
            const nomor = this.waNumber.replace(/[^0-9]/g, '');
            if (nomor.length < 8) {
                alert('Masukkan nomor yang valid!');
                return;
            }
            
            let pesan = '🧾 *STRUK BELANJA*\n';
            pesan += '='.repeat(30) + '\n\n';
            
            this.cart.forEach(item => {
                pesan += `${item.name} x${item.qty} = Rp ${(item.price * item.qty).toLocaleString()}\n`;
            });
            
            pesan += '\n' + '='.repeat(30) + '\n';
            pesan += `Subtotal  : Rp ${this.subtotal.toLocaleString()}\n`;
            if (this.discount > 0) {
                pesan += `Diskon    : ${this.discount}%\n`;
                pesan += `Potongan  : -Rp ${Math.round(this.discountAmount).toLocaleString()}\n`;
            }
            pesan += `*TOTAL    : Rp ${Math.round(this.grandTotal).toLocaleString()}*\n`;
            
            if (this.payment > 0) {
                pesan += `Bayar     : Rp ${Number(this.payment).toLocaleString()}\n`;
                pesan += `Kembali   : Rp ${this.change >= 0 ? this.change.toLocaleString() : '0'}\n`;
            }
            
            pesan += '\nTerima kasih 🙏';
            
            // Simpan riwayat WA
            const waData = {
                nomor: nomor,
                tanggal: new Date().toLocaleString('id-ID'),
                total: this.grandTotal
            };
            this.waHistory.push(waData);
            localStorage.setItem('waHistory', JSON.stringify(this.waHistory));
            
            // Kirim ke WhatsApp
            const url = `https://wa.me/62${nomor}?text=${encodeURIComponent(pesan)}`;
            window.open(url, '_blank');
            this.setStatus('fa-check-circle', 'Pesan WhatsApp terkirim!', 'success');
        },
        
        sendWhatsApp() {
            // Redirect ke halaman WA
            window.location.href = 'wa.html';
        },
        
        // ===== BARCODE GENERATOR =====
        generateBarcode() {
            this.showBarcodeModal = true;
            setTimeout(() => {
                if (this.barcodeInput) {
                    this.generateBarcodeImage();
                }
            }, 100);
        },
        
        generateSingleBarcode(code) {
            this.barcodeInput = code;
            this.showBarcodeModal = true;
            setTimeout(() => {
                this.generateBarcodeImage();
            }, 100);
        },
        
        generateBarcodeImage() {
            const code = this.barcodeInput || '1234567890123';
            try {
                JsBarcode("#barcodeSVG", code, {
                    format: "EAN-13",
                    width: 2,
                    height: 80,
                    displayValue: true,
                    fontSize: 16,
                    font: "monospace",
                    background: "#ffffff",
                    lineColor: "#000000",
                    margin: 10
                });
                this.setStatus('fa-check-circle', 'Barcode berhasil dibuat!', 'success');
            } catch (e) {
                try {
                    JsBarcode("#barcodeSVG", code, {
                        format: "CODE128",
                        width: 2,
                        height: 80,
                        displayValue: true,
                        fontSize: 16,
                        font: "monospace",
                        background: "#ffffff",
                        lineColor: "#000000",
                        margin: 10
                    });
                    this.setStatus('fa-check-circle', 'Barcode berhasil dibuat!', 'success');
                } catch (err) {
                    this.setStatus('fa-exclamation-circle', 'Gagal membuat barcode', 'error');
                }
            }
        },
        
        downloadBarcode() {
            const svg = document.getElementById('barcodeSVG');
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const svgData = new XMLSerializer().serializeToString(svg);
            const img = new Image();
            img.onload = () => {
                canvas.width = img.width + 40;
                canvas.height = img.height + 40;
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 20, 20);
                const link = document.createElement('a');
                link.download = `barcode_${this.barcodeInput || 'kode'}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            };
            img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);
        }
    }
}