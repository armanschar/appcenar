// Manejo del carrito en el catalogo
document.addEventListener('DOMContentLoaded', function() {
    let cart = [];
    
    const cartItems = document.querySelectorAll('.cart-item');
    cartItems.forEach(item => {
        const productId = parseInt(item.dataset.productId);
        const productData = extractProductDataFromCartItem(item);
        if (productData) {
            cart.push(productData);
        }
    });

    // Funcionalidad agregar al carrito
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('add-to-cart-btn')) {
            e.preventDefault();
            
            // Validar que todos los datos estén presentes
            const button = e.target;
            if (!button.dataset.productId || !button.dataset.productName || !button.dataset.productPrice) {
                console.error('Missing product data attributes');
                alert('Error: No se pudieron obtener los datos del producto');
                return;
            }
            
            const productData = {
                id: parseInt(button.dataset.productId) || 0,
                name: button.dataset.productName || '',
                price: parseFloat(button.dataset.productPrice) || 0,
                image: button.dataset.productImage || '',
                description: button.dataset.productDescription || ''
            };
            
            // Validar datos básicos
            if (productData.id === 0 || productData.name === '' || productData.price === 0) {
                console.error('Invalid product data:', productData);
                alert('Error: Datos del producto inválidos');
                return;
            }
            
            addToCart(productData, button);
        }
    });

    // Funcionalidad quitar del carrito
    document.addEventListener('click', function(e) {
        if (e.target.closest('.remove-from-cart')) {
            e.preventDefault();
            const button = e.target.closest('.remove-from-cart');
            const productId = parseInt(button.dataset.productId);
            removeFromCart(productId);
        }
    });

    document.getElementById('continue-btn')?.addEventListener('click', function() {
        if (cart.length > 0) {
            // el carrito ya está guardado en la sesión
            // Solo redirigir a la selección de direcciones
            window.location.href = `/client/order-addresses?commerceId=${getCommerceId()}`;
        }
    });

    function addToCart(product, button) {
        // chequear si el producto ya está en el carrito
        const existingProduct = cart.find(item => item.id === product.id);
        if (existingProduct) {
            alert('Este producto ya está en tu carrito');
            return;
        }

        // Agregar al carrito
        cart.push(product);

        // actualizar UI de inmediato
        updateCartDisplay();
        updateProductButton(product.id, true);

        showAddToCartFeedback(button);

        fetch('/client/cart/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product: product })
        })
        .catch(error => {
            console.error('Error adding to cart:', error);
            cart = cart.filter(item => item.id !== product.id);
            updateCartDisplay();
            updateProductButton(product.id, false);
        });
    }

    function removeFromCart(productId) {
        cart = cart.filter(item => item.id !== productId);

        updateCartDisplay();
        updateProductButton(productId, false);

        fetch('/client/cart/remove', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: productId })
        })
        .catch(error => console.error('Error removing from cart:', error));
    }

    function updateCartDisplay() {
        const cartContainer = document.getElementById('cart-items');
        const cartCount = document.querySelector('.cart-count');
        const subtotalAmount = document.getElementById('subtotal-amount');
        const continueBtn = document.getElementById('continue-btn');
        const emptyCart = document.querySelector('.empty-cart');

        cartCount.textContent = cart.length;

        const subtotal = cart.reduce((sum, item) => sum + parseFloat(item.price), 0);
        subtotalAmount.textContent = subtotal.toFixed(2);

        if (cart.length === 0) {
            cartContainer.innerHTML = `
                <div class="text-center py-8 text-gray-500 empty-cart">
                    <svg class="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 5h9m-9-5h9"></path>
                    </svg>
                    <p class="text-sm">Tu carrito está vacío</p>
                    <p class="text-xs text-gray-400">Agrega productos para continuar</p>
                </div>
            `;
            continueBtn.classList.add('hidden');
            continueBtn.disabled = true;
        } else {
            // Crear elementos DOM de forma segura
            cartContainer.innerHTML = '';
            
            cart.forEach(item => {
                const cartItemDiv = document.createElement('div');
                cartItemDiv.className = 'cart-item border-b border-gray-200 pb-3';
                cartItemDiv.dataset.productId = item.id;
                
                const flexDiv = document.createElement('div');
                flexDiv.className = 'flex items-center space-x-3';
                
                // Imagen del producto
                const img = document.createElement('img');
                img.src = item.image || '';
                img.alt = item.name || '';
                img.className = 'w-12 h-12 rounded object-cover bg-gray-100';
                
                // Contenedor del producto
                const productDiv = document.createElement('div');
                productDiv.className = 'flex-1';
                
                const nameH4 = document.createElement('h4');
                nameH4.className = 'font-medium text-gray-900 text-sm';
                nameH4.textContent = item.name || '';
                
                const priceP = document.createElement('p');
                priceP.className = 'text-orange-600 font-semibold text-sm';
                priceP.textContent = `RD$ ${item.price || '0'}`;
                
                productDiv.appendChild(nameH4);
                productDiv.appendChild(priceP);
                
                // Botón remover
                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-from-cart text-red-500 hover:text-red-700 transition-colors';
                removeBtn.dataset.productId = item.id;
                removeBtn.innerHTML = `
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                `;
                
                flexDiv.appendChild(img);
                flexDiv.appendChild(productDiv);
                flexDiv.appendChild(removeBtn);
                cartItemDiv.appendChild(flexDiv);
                cartContainer.appendChild(cartItemDiv);
            });
            
            continueBtn.classList.remove('hidden');
            continueBtn.disabled = false;
        }
    }

    function updateProductButton(productId, inCart) {
        const productCard = document.querySelector(`[data-product-id="${productId}"]`);
        if (!productCard) return;

        const button = productCard.querySelector('.add-to-cart-btn');
        if (!button) return;

        if (inCart) {
            button.style.display = 'none';
        } else {
            button.style.display = 'block';
            button.textContent = 'Agregar';
            button.classList.remove('bg-green-500');
            button.classList.add('bg-orange-500');
        }
    }

    function showAddToCartFeedback(button) {
        const originalText = button.textContent;
        const originalClasses = button.className;
        
        button.textContent = '¡Agregado!';
        button.classList.add('bg-green-500');
        button.classList.remove('bg-orange-500');
        
    }

    function extractProductDataFromCartItem(item) {
        const img = item.querySelector('img');
        const nameEl = item.querySelector('h4');
        const priceEl = item.querySelector('.text-orange-600');
        
        if (!img || !nameEl || !priceEl) return null;

        // Extraer precio de forma segura
        const priceText = priceEl.textContent.replace('RD$ ', '').trim();
        const price = parseFloat(priceText) || 0;

        return {
            id: parseInt(item.dataset.productId) || 0,
            name: nameEl.textContent.trim() || '',
            price: price,
            image: img.src || '',
            description: img.alt || ''
        };
    }

    function getCommerceId() {

        const pathParts = window.location.pathname.split('/');

        const commerceIndex = pathParts.indexOf('commerce');
        if (commerceIndex !== -1 && commerceIndex + 1 < pathParts.length) {
            return pathParts[commerceIndex + 1];
        }
        
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('commerceId');
    }

    cart.forEach(item => {
        updateProductButton(item.id, true);
    });
});
