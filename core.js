const video = document.getElementById('video');
const categoriesEl = document.getElementById('categories');
let hls = null;

// ---------- Função para reproduzir stream ----------
function playStream(url) {
    if (!url) return alert('URL inválida');

    if (hls) {
        try { hls.destroy(); } catch(e) {}
        hls = null;
    }

    if (Hls.isSupported()) {
        hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(()=>{}));
        hls.on(Hls.Events.ERROR, (event, data) => console.warn('HLS error', data));
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        video.addEventListener('loadedmetadata', ()=> video.play().catch(()=>{}), {once:true});
    } else {
        alert('HLS não suportado neste navegador');
    }
}

// ---------- Função para renderizar categorias ----------
function renderCategories(data) {
    categoriesEl.innerHTML = '';
    for (const category in data) {
        const catDiv = document.createElement('div');
        catDiv.className = 'categorySection';

        const catTitle = document.createElement('h2');
        catTitle.textContent = category;
        catDiv.appendChild(catTitle);

        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'category';
        
        data[category].forEach(item => {
            const card = document.createElement('div');
            card.className = 'card';
            
            const img = document.createElement('img');
            img.src = item.thumb || 'https://via.placeholder.com/120x80?text=No+Image';
            img.alt = item.name;
            card.appendChild(img);
            
            const name = document.createElement('div');
            name.textContent = item.name;
            name.className = 'cardName';
            card.appendChild(name);
            
            const btn = document.createElement('button');
            btn.textContent = '▶ Assistir';
            btn.addEventListener('click', () => playStream(item.url));
            card.appendChild(btn);

            cardsContainer.appendChild(card);
        });

        catDiv.appendChild(cardsContainer);
        categoriesEl.appendChild(catDiv);
    }
}

// ---------- JSON de exemplo ----------
const sampleData = {
    "TV": [
        {"name": "Canal Teste 1", "url": "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", "thumb": "https://via.placeholder.com/120x80?text=Canal+1"},
        {"name": "Canal Teste 2", "url": "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", "thumb": "https://via.placeholder.com/120x80?text=Canal+2"}
    ],
    "Filmes": [
        {"name": "Filme Teste 1", "url": "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", "thumb": "https://via.placeholder.com/120x80?text=Filme+1"},
        {"name": "Filme Teste 2", "url": "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", "thumb": "https://via.placeholder.com/120x80?text=Filme+2"}
    ]
};

// ---------- Renderiza a amostra ----------
renderCategories(sampleData);
