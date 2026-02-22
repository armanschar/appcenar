// Selección de direcciones para pedido
document.addEventListener('DOMContentLoaded', function() {
    const addressOptions = document.querySelectorAll('.address-option input[type="radio"]');
    const continueBtn = document.getElementById('continue-btn');
    
    function updateContinueButton() {
        const selectedAddress = document.querySelector('input[name="addressId"]:checked');
        if (selectedAddress) {
            continueBtn.disabled = false;
            continueBtn.classList.remove('bg-gray-400', 'cursor-not-allowed');
            continueBtn.classList.add('bg-orange-600', 'hover:bg-orange-700');
        } else {
            continueBtn.disabled = true;
            continueBtn.classList.add('bg-gray-400', 'cursor-not-allowed');
            continueBtn.classList.remove('bg-orange-600', 'hover:bg-orange-700');
        }
    }
    
    addressOptions.forEach(option => {
        option.addEventListener('change', function() {
            document.querySelectorAll('.address-option').forEach(label => {
                label.classList.remove('border-orange-500', 'bg-orange-50');
                label.classList.add('border-gray-200');
            });
            
            // Actualizar estilos
            if (this.checked) {
                const label = this.closest('.address-option');
                label.classList.remove('border-gray-200');
                label.classList.add('border-orange-500', 'bg-orange-50');
            }
            
            updateContinueButton();
        });
    });
    
    updateContinueButton();
});
