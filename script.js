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

// Elemen Theme Toggle
const themeToggleBtn = document.getElementById('theme-toggle');

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
let favorites = JSON.parse(localStorage.getItem('recipio_favorites')) || [];
let currentModalMeal = null;

// Jalankan saat halaman pertama kali dimuat
document.addEventListener('DOMContentLoaded', () => {
    updateThemeIcon();
    updateFavBadge();
    fetchMealsBySearch('Chicken'); // Tampilan awal default
});

// Logika Dark / Light Mode
themeToggleBtn.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('recipio_theme', isDark ? 'dark' : 'light');
    updateThemeIcon();
});

function updateThemeIcon() {
    const isDark = document.documentElement.classList.contains('dark');
    themeToggleBtn.innerHTML = isDark 
        ? `<i data-lucide="sun" class="w-4 h-4 text-amber-400"></i>` 
        : `<i data-lucide="moon" class="w-4 h-4 text-slate-600"></i>`;
    lucide.createIcons();
}

// Event Listener Pencarian
searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (query) {
        clearActiveChips();
        sectionTitle.textContent = `Hasil Pencarian: "\${query}"`;
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
        sectionTitle.textContent = `Kategori: ${chip.textContent}`; fetchMealsByCategory(category); }); });  // Event Listener Tombol Acak Resep btnRandom.addEventListener('click', async () => { clearActiveChips(); showLoader(true); try { const res = await fetch(`${API_BASE}/random.php`);
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
    sectionTitle.textContent = `Resep Favorit Tersimpan (\${favorites.length})`;
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
        card.className = 'recipe-card bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 flex flex-col cursor-pointer group';
        
        card.innerHTML = `
            <div class="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img src="${meal.strMealThumb}" alt="${meal.strMeal}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                <button 
                    class="fav-card-btn absolute top-3 right-3 p-2 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm shadow-sm hover:scale-110 transition-transform \${isFav ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'}"
                    title="Simpan ke Favorit"
                >
                    <i data-lucide="heart" class="w-4 h-4 \${isFav ? 'fill-rose-500' : ''}"></i>
                </button>
                \${meal.strCategory ? `<span class="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900/75 text-white backdrop-blur-sm">${meal.strCategory}</span>` : ''}
            </div>
            <div class="p-4 flex-1 flex flex-col justify-between">
                <div>
                    <h3 class="font-bold text-slate-900 dark:text-slate-100 text-base line-clamp-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">${meal.strMeal}</h3>${meal.strArea ? `<p class="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1"><i data-lucide="map-pin" class="w-3 h-3"></i> Masakan ${meal.strArea}</p>` : ''}
                </div>
                <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-orange-600 dark:text-orange-400">
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
            if (sectionTitle.textContent.includes('Favorit')) {
                renderRecipes(favorites);
                sectionTitle.textContent = `Resep Favorit Tersimpan (\${favorites.length})`;
            } else {
                const nowFav = favorites.some(f => f.idMeal === meal.idMeal);
                favBtn.className = `fav-card-btn absolute top-3 right-3 p-2 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm shadow-sm hover:scale-110 transition-transform \${nowFav ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'}`;
                favBtn.innerHTML = `<i data-lucide="heart" class="w-4 h-4 ${nowFav ? 'fill-rose-500' : ''}"></i>`; lucide.createIcons(); } });  recipeGrid.appendChild(card); });  lucide.createIcons(); }  // Ambil Detail Lengkap Resep berdasarkan ID async function getMealDetails(id) { try { const res = await fetch(`${API
