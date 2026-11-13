// Inisialisasi Ikon Lucide
lucide.createIcons();

// Elemen DOM
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const recipeGrid = document.getElementById('recipe-grid');
const sectionTitle = document.getElementById('section-title');
const loader = document.getElementById('loader');
const emptyState = document.getElementById('empty-state');
const catChips = document.querySelectorAll('.cat-chip');
const btnRandom = document.getElementById('btn-random');
const btnFavorites = document.getElementById('btn-favorites');
const favCountEl = document.getElementById('fav-count');

// Elemen Modal
const modal = document.getElementById('recipe-modal');
const closeModalBtn = document.getElementById('close-modal');
const modalImg = document.getElementById('modal-img');
const modalTitle = document.getElementById('modal-title');
const modalCategory = document.getElementById('modal-category');
const modalArea = document.getElementById('modal-area');
const modalIngredients = document.getElementById('modal-ingredients');
const modalInstructions = document.getElementById('modal-instructions');
const modalYoutube = document.getElementById('modal-youtube');
const modalFavBtn = document.getElementById('modal-fav-btn');

// State Aplikasi
const API_BASE = 'https://www.themealdb.com/api/json/v1/1';
let favorites = JSON.parse(localStorage.getItem('dapurkita_favorites')) || [];
let currentModalMeal = null;

// Jalankan saat halaman pertama kali dimuat
document.addEventListener('DOMContentLoaded', () => {
    updateFavBadge();
    fetchMealsBySearch('Chicken'); // Tampilan awal default
});

// Event Listener Pencarian
searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (query) {
        clearActiveChips();
        sectionTitle.textContent = `Hasil Pencarian: "${query}"`;
        fetchMealsBySearch(query);
    }
});

// Event Listener Kategori Cepat
catChips.forEach(chip => {
    chip.addEventListener('click', () => {
        clearActiveChips();
        chip.classList.add('active');
        const category = chip.dataset.query;
        searchInput.value = '';
        sectionTitle.textContent = `Kategori: ${chip.textContent}`;
        fetchMealsByCategory(category);
    });
});

// Event Listener Tombol Acak Resep
btnRandom.addEventListener('click', async () => {
    clearActiveChips();
    showLoader(true);
    try {
        const res = await fetch(`${API_BASE}/random.php`);
        const data = await res.json();
        if (data.meals) {
            openRecipeModal(data.meals[0]);
        }
    } catch (error) {
        console.error('Gagal memuat resep acak:', error);
    } finally {
        showLoader(false);
    }
});

// Event Listener Tombol Lihat Favorit
btnFavorites.addEventListener('click', () => {
    clearActiveChips();
    sectionTitle.textContent = `Resep Favorit Tersimpan (${favorites.length})`;
    renderRecipes(favorites);
});

// Fungsi Reset ke Awal
function resetApp() {
    searchInput.value = '';
    clearActiveChips();
    sectionTitle.textContent = 'Rekomendasi Pilihan';
    fetchMealsBySearch('Chicken');
}

function clearActiveChips() {
    catChips.forEach(c => c.classList.remove('active'));
}

// Fetch Resep Berdasarkan Kata Kunci
async function fetchMealsBySearch(query) {
    showLoader(true);
    try {
        const res = await fetch(`${API_BASE}/search.php?s=${encodeURIComponent(query)}`);
        const data = await res.json();
        renderRecipes(data.meals || []);
    } catch (error) {
        console.error('Error:', error);
        renderRecipes([]);
    } finally {
        showLoader(false);
    }
}

// Fetch Resep Berdasarkan Kategori
async function fetchMealsByCategory(category) {
    showLoader(true);
    try {
        const res = await fetch(`${API_BASE}/filter.php?c=${encodeURIComponent(category)}`);
        const data = await res.json();
        renderRecipes(data.meals || []);
    } catch (error) {
        console.error('Error:', error);
        renderRecipes([]);
    } finally {
        showLoader(false);
    }
}

// Render Kartu Resep ke Grid
function renderRecipes(meals) {
    recipeGrid.innerHTML = '';

    if (!meals || meals.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');

    meals.forEach(meal => {
        const isFav = favorites.some(fav => fav.idMeal === meal.idMeal);
        const card = document.createElement('div');
        card.className = 'recipe-card bg-white rounded-2xl overflow-hidden border border-slate-200/80 flex flex-col cursor-pointer group';
        
        card.innerHTML = `
            <div class="relative h-48 overflow-hidden bg-slate-100">
                <img src="${meal.strMealThumb}" alt="${meal.strMeal}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                <button 
                    class="fav-card-btn absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-sm hover:scale-110 transition-transform ${isFav ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'}"
                    title="Simpan ke Favorit"
                >
                    <i data-lucide="heart" class="w-4 h-4 ${isFav ? 'fill-rose-500' : ''}"></i>
                </button>
                ${meal.strCategory ? `<span class="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900/75 text-white backdrop-blur-sm">${meal.strCategory}</span>` : ''}
            </div>
            <div class="p-4 flex-1 flex flex-col justify-between">
                <div>
                    <h3 class="font-bold text-slate-900 text-base line-clamp-2 group-hover:text-orange-600 transition-colors">${meal.strMeal}</h3>
                    ${meal.strArea ? `<p class="text-xs text-slate-500 mt-1 flex items-center gap-1"><i data-lucide="map-pin" class="w-3 h-3"></i> Masakan ${meal.strArea}</p>` : ''}
                </div>
                <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-orange-600">
                    <span>Lihat Resep</span>
                    <i data-lucide="arrow-right" class="w-4 h-4 group-hover:translate-x-1 transition-transform"></i>
                </div>
            </div>
        `;

        // Klik kartu untuk membuka detail modal
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.fav-card-btn')) {
                getMealDetails(meal.idMeal);
            }
        });

        // Klik ikon hati langsung di kartu
        const favBtn = card.querySelector('.fav-card-btn');
        favBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(meal);
            // Refresh tampilan jika sedang di tab Favorit
            if (sectionTitle.textContent.includes('Favorit')) {
                renderRecipes(favorites);
                sectionTitle.textContent = `Resep Favorit Tersimpan (${favorites.length})`;
            } else {
                const nowFav = favorites.some(f => f.idMeal === meal.idMeal);
                favBtn.className = `fav-card-btn absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-sm hover:scale-110 transition-transform ${nowFav ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'}`;
                favBtn.innerHTML = `<i data-lucide="heart" class="w-4 h-4 ${nowFav ? 'fill-rose-500' : ''}"></i>`;
                lucide.createIcons();
            }
        });

        recipeGrid.appendChild(card);
    });

    lucide.createIcons();
}

// Ambil Detail Lengkap Resep berdasarkan ID
async function getMealDetails(id) {
    try {
        const res = await fetch(`${API_BASE}/lookup.php?i=${id}`);
        const data = await res.json();
        if (data.meals && data.meals[0]) {
            openRecipeModal(data.meals[0]);
        }
    } catch (error) {
        console.error('Gagal mengambil detail resep:', error);
    }
}

// Buka Modal & Tampilkan Data Resep
function openRecipeModal(meal) {
    currentModalMeal = meal;
    modalImg.src = meal.strMealThumb;
    modalTitle.textContent = meal.strMeal;
    modalCategory.textContent = meal.strCategory || 'Umum';
    modalArea.textContent = meal.strArea ? `Kuliner ${meal.strArea}` : 'Internasional';
    modalInstructions.textContent = meal.strInstructions;

    // Link YouTube
    if (meal.strYoutube) {
        modalYoutube.href = meal.strYoutube;
        modalYoutube.classList.remove('hidden');
    } else {
        modalYoutube.classList.add('hidden');
    }

    // Ekstrak Daftar Bahan & Takaran (API menyimpan strIngredient1..20)
    modalIngredients.innerHTML = '';
    for (let i = 1; i <= 20; i++) {
        const ingredient = meal[`strIngredient${i}`];
        const measure = meal[`strMeasure${i}`];

        if (ingredient && ingredient.trim() !== '') {
            const li = document.createElement('li');
            li.className = 'flex items-center justify-between bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-100 text-sm';
            li.innerHTML = `
                <span class="font-medium text-slate-800">${ingredient}</span>
                <span class="text-slate-500 font-semibold text-xs bg-white px-2 py-1 rounded-md border border-slate-200/60">${measure || ''}</span>
            `;
            modalIngredients.appendChild(li);
        }
    }

    updateModalFavButton();
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden'; // Kunci scroll latar belakang
}

// Tutup Modal
function closeModal() {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = '';
}

closeModalBtn.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeModal();
});

// Simpan / Hapus Favorit
modalFavBtn.addEventListener('click', () => {
    if (currentModalMeal) {
        toggleFavorite(currentModalMeal);
        updateModalFavButton();
    }
});

function toggleFavorite(meal) {
    const index = favorites.findIndex(item => item.idMeal === meal.idMeal);
    if (index === -1) {
        favorites.push({
            idMeal: meal.idMeal,
            strMeal: meal.strMeal,
            strMealThumb: meal.strMealThumb,
            strCategory: meal.strCategory || '',
            strArea: meal.strArea || ''
        });
    } else {
        favorites.splice(index, 1);
    }
    localStorage.setItem('dapurkita_favorites', JSON.stringify(favorites));
    updateFavBadge();
}

function updateFavBadge() {
    favCountEl.textContent = favorites.length;
}

function updateModalFavButton() {
    const isFav = favorites.some(item => item.idMeal === currentModalMeal.idMeal);
    if (isFav) {
        modalFavBtn.className = 'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-rose-50 text-rose-600 border border-rose-200 transition-colors cursor-pointer';
        modalFavBtn.innerHTML = `<i data-lucide="heart" class="w-4 h-4 fill-rose-500"></i><span>Tersimpan di Favorit</span>`;
    } else {
        modalFavBtn.className = 'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-700 transition-colors cursor-pointer';
        modalFavBtn.innerHTML = `<i data-lucide="heart" class="w-4 h-4"></i><span>Simpan ke Favorit</span>`;
    }
    lucide.createIcons();
}

// Tampilkan/Sembunyikan Loading
function showLoader(status) {
    if (status) {
        loader.classList.remove('hidden');
        recipeGrid.classList.add('hidden');
        emptyState.classList.add('hidden');
    } else {
        loader.classList.add('hidden');
        recipeGrid.classList.remove('hidden');
    }
}
