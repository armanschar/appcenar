// funcionalidad de favorito
async function toggleFavorite(commerceId, button) {
    try {
        const response = await fetch('/client/toggle-favorite', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ commerceId: commerceId })
        });

        const result = await response.json();

        if (result.success) {
            const isFavoritesPage = window.location.pathname === '/client/favorites';
            
            if (result.isFavorite) {
                // Agregar a favoritos
                const heartIcon = button.querySelector('svg');
                
                // Animación
                button.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    button.style.transform = 'scale(1)';
                }, 150);
                
                button.className = button.className.replace(/bg-white text-gray-400 hover:bg-gray-50 hover:text-gray-600/g, 'bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600');
                button.setAttribute('title', 'Quitar de favoritos');
                
                heartIcon.innerHTML = '<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>';
                heartIcon.setAttribute('fill', 'currentColor');
                heartIcon.setAttribute('class', 'w-6 h-6 transition-transform duration-200 hover:scale-110');
                button.setAttribute('data-is-favorite', 'true');
            } else {
                if (isFavoritesPage) {
                    const card = button.closest('.bg-white.rounded-xl');
                    if (card) {
                        card.style.transition = 'all 0.3s ease-out';
                        card.style.transform = 'scale(0.95)';
                        card.style.opacity = '0';
                        
                        setTimeout(() => {
                            card.remove();
                            updateFavoriteCount();
                        }, 300);
                    }
                } else {
                    // Quitar de favoritos
                    const heartIcon = button.querySelector('svg');
                    
                    // Animación
                    button.style.transform = 'scale(1.2)';
                    setTimeout(() => {
                        button.style.transform = 'scale(1)';
                    }, 150);
                    
                    button.className = button.className.replace(/bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600/g, 'bg-white text-gray-400 hover:bg-gray-50 hover:text-gray-600');
                    button.setAttribute('title', 'Agregar a favoritos');
                    
                    heartIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>';
                    heartIcon.setAttribute('fill', 'none');
                    heartIcon.setAttribute('stroke', 'currentColor');
                    heartIcon.setAttribute('class', 'w-6 h-6 transition-transform duration-200 hover:scale-110');
                    button.setAttribute('data-is-favorite', 'false');
                }
            }
        }
    } catch (error) {
        console.error('Error toggling favorite:', error);
    }
}

function updateFavoriteCount() {
    const favoriteCards = document.querySelectorAll('.bg-white.rounded-xl').length;
    const countElement = document.querySelector('.font-bold.text-orange-600');
    
    if (countElement) {
        countElement.textContent = favoriteCards;
    }
    
    if (favoriteCards === 0) {
        const gridContainer = document.querySelector('.grid');
        if (gridContainer) {
            gridContainer.innerHTML = `
                <div class="col-span-full bg-white rounded-xl shadow-lg p-12 text-center">
                    <div class="text-6xl text-gray-300 mb-6">💔</div>
                    <h3 class="text-2xl font-bold text-gray-800 mb-4">
                        No tienes favoritos aún
                    </h3>
                    <p class="text-gray-600 mb-8">
                        Explora los diferentes tipos de comercios y marca tus favoritos para encontrarlos fácilmente aquí.
                    </p>
                    <a 
                        href="/client/home" 
                        class="bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200"
                    >
                        Explorar Comercios
                    </a>
                </div>
            `;
        }
    }
}
