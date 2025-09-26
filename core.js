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

// ---------- Função para atualizar nota ----------
function setNote(msg) {
    const note = document.querySelector('header small') || document.createElement('small');
    note.textContent = msg;
}

// ---------- Parse M3U ----------
function parseM3U(text) {
    const lines = text.split(/\r?\n/).map(l => l.trim());
    const list = [];
    for (let i=0; i<lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('#EXTINF')) {
            const commaIdx = line.indexOf(',');
            const name = commaIdx > -1 ? line.substring(commaIdx+1).trim() : line;
            let j = i + 1;
            while (j < lines.length && lines[j].startsWith('#')) j++;
            if (j < lines.length && lines[j]) {
                list.push({name, url: lines[j]});
                i = j;
            }
        }
    }
    return list;
}

// ---------- Mapear canais para categorias e capas ----------
function mapChannelsToCategories(list) {
    const categories = { "TV": [], "Filmes": [], "Séries": [], "Outros": [] };

    list.forEach(item => {
        const nameLower = item.name.toLowerCase();
        let category = "Outros";

        if (nameLower.match(/movie|filme/)) category = "Filmes";
        else if (nameLower.match(/serie|show/)) category = "Séries";
        else if (nameLower.match(/tv|canal|news/)) category = "TV";

        const thumb = "https://via.placeholder.com/120x80?text=" + encodeURIComponent(item.name);
        categories[category].push({ name: item.name, url: item.url, thumb });
    });

    return categories;
}

// ---------- Renderizar categorias e cards ----------
function renderCategories(data) {
    categoriesEl.innerHTML = '';
    for (const category in data) {
        if (!data[category].length) continue;

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
            img.src = item.thumb;
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

// ---------- Carregar M3U via URL ----------
function loadM3UFromURL(url) {
    if (!url) return alert('Cole a URL do M3U');
    setNote('Carregando playlist...');
    fetch(url)
        .then(r => r.text())
        .then(text => {
            const list = parseM3U(text);
            const categorized = mapChannelsToCategories(list);
            renderCategories(categorized);
            setNote('Playlist carregada via URL e organizada em categorias.');
        })
        .catch(err => {
            console.error(err);
            alert('Erro ao carregar M3U: ' + err.message);
        });
}

// ---------- Exemplo de uso ----------
// Você pode chamar loadM3UFromURL('https://link-da-sua-playlist.m3u') no console ou integrar com input