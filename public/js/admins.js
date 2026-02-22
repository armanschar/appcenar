
function confirmarInactivar(id, nombre) {
    document.getElementById('confirmModalTitle').textContent = 'Confirmar Inactivación';
    document.getElementById('confirmModalBody').textContent = `¿Está seguro que desea inactivar al administrador ${nombre}?`;
    document.getElementById('confirmForm').action = `/admin/administradores/inactivar/${id}`;
    document.getElementById('confirmModal').classList.remove('hidden');
}

function confirmarActivar(id, nombre) {
    document.getElementById('confirmModalTitle').textContent = 'Confirmar Activación';
    document.getElementById('confirmModalBody').textContent = `¿Está seguro que desea activar al administrador ${nombre}?`;
    document.getElementById('confirmForm').action = `/admin/administradores/activar/${id}`;
    document.getElementById('confirmModal').classList.remove('hidden');
}

function cerrarModal() {
    document.getElementById('confirmModal').classList.add('hidden');
}
