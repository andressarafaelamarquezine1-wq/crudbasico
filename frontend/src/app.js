import { renderUsers } from './scripts/dom/render.js';

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/users';
//nao realizamos commit em env, pois é um arquivo de texto simples usado para armazenar variáveis de ambiente e informações sigilosas de forma isolada do código-fonte da aplicação!!

// Quando o DOM estiver pronto, renderiza a lista

//esse async é uma função assíncrona, ou seja, a gente não sabe quanto tempo demora pra ela carregar,aí usamos o await para rodar sem demorar tanto

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await renderUsers(apiUrl);
    } catch (error) {
        // Na Etapa 5 trocamos isso por uma mensagem na tela
        console.error(error);
    }
});

// Adicione ao app.js:
const form = document.getElementById('create-user-form');
const formError = document.getElementById('form-error');

function showError(message) {
    formError.textContent = message;
    formError.classList.remove('d-none');
}

function hideError() {
    formError.classList.add('d-none');
    formError.textContent = '';
}
// No topo do app.js:
import { createUser } from './scripts/api/create.js';

// Listener de submit:
form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = document.getElementById('name').value;
    const age = document.getElementById('age').value;
    const email = document.getElementById('email').value;

    hideError();

    try {
        // Por enquanto, só criação:
        await createUser(apiUrl, { name, age, email });

        form.reset();
        await renderUsers(apiUrl);
    } catch (error) {
        showError(error.message);
    }
});
// Atualize o import do render.js e importe o delete.js:
import { renderUsers, findUserById } from './scripts/dom/render.js';
import { deleteUser } from './scripts/api/delete.js';

// Função auxiliar:
function getUserFromCard(button) {
    const card = button.closest('.user-card');
    return findUserById(Number(card.id));
}
const usersSection = document.getElementById('users');

usersSection.addEventListener('click', async (event) => {
    const { target } = event;

    if (target.dataset.action === 'delete') {
        const user = getUserFromCard(target);

        if (!confirm('Are you sure you want to delete this user?')) return;

        try {
            await deleteUser(apiUrl, user.id);
            await renderUsers(apiUrl);
        } catch (error) {
            showError(error.message);
        }
    }
});
// No topo do app.js:
import { updateUser, patchUser } from './scripts/api/update.js';

// Referências do DOM:
const formTitle = document.getElementById('form-title');
const submitBtn = form.querySelector('button[type="submit"]');
const cancelBtn = document.getElementById('cancel-edit');

// Estado de edição:
let editingId = null;
let originalUser = null;

function enterEditMode(user) {
    editingId = user.id;
    originalUser = { ...user };

    document.getElementById('name').value = user.name;
    document.getElementById('age').value = user.age;
    document.getElementById('email').value = user.email;

    formTitle.textContent = 'Edit User';
    submitBtn.textContent = 'Update';
    cancelBtn.style.display = '';

    document.getElementById('name').focus();
}

function exitEditMode() {
    editingId = null;
    originalUser = null;
    formTitle.textContent = 'Create User';
    submitBtn.textContent = 'Create';
    cancelBtn.style.display = 'none';
    form.reset();
}

cancelBtn.addEventListener('click', exitEditMode);

usersSection.addEventListener('click', async (event) => {
    const { target } = event;

    // ← Adicione isto:
    if (target.dataset.action === 'edit') {
        enterEditMode(getUserFromCard(target));
    }

    if (target.dataset.action === 'delete') {
        // ... o código de delete que já existe
    }
});

try {
    if (editingId !== null) {
        // === MODO EDIÇÃO ===
        const changed = {};
        if (name !== originalUser.name) changed.name = name;
        if (Number(age) !== originalUser.age) changed.age = age;
        if (email !== originalUser.email) changed.email = email;

        // Nada mudou? Sai da edição.
        if (Object.keys(changed).length === 0) {
            exitEditMode();
            return;
        }

        // Todos mudaram → PUT; alguns → PATCH
        const allChanged = Object.keys(changed).length === 3;

        if (allChanged) {
            await updateUser(apiUrl, editingId, { name, age, email });
        } else {
            await patchUser(apiUrl, editingId, changed);
        }
    } else {
        // === MODO CRIAÇÃO ===
        await createUser(apiUrl, { name, age, email });
    }

    exitEditMode();
    await renderUsers(apiUrl);
} catch (error) {
    showError(error.message);
}

// Dentro do bloco de delete:
try {
    await deleteUser(apiUrl, user.id);

    // ← Adicione esta verificação:
    if (editingId === user.id) exitEditMode();

    await renderUsers(apiUrl);
} catch (error) {
    showError(error.message);
}