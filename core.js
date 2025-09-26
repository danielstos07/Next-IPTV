const video = document.getElementById('video');
const categoriesEl = document.getElementById('categories');
let hls = null;

// ---------- Reproduzir stream ----------
function playStream(url) {
    if (!url) return alert('URL inválida');

    if (hls) { try { hls.destroy(); } catch(e) {} hls = null; }

    if (Hls.isSupported()) {
        hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(()=>{}));
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        video.addEventListener('loadedmetadata', ()=> video.play().catch(()=>{}), {once:true});
    } else { alert('HLS não suportado neste navegador'); }
}

// ---------- Nota ----------
function setNote(msg) {
    const note = document.querySelector('header small') || document.createElement('small');
    note.textContent = msg;
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

// ---------- Parse M3U Plus avançado ----------
function parseM3UPlusAdvanced(text) {
    const lines = text.split(/\r?\n/).map(l => l.trim());
    const list = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line || line.startsWith('#EXTM3U')) continue;

        if (line.startsWith("#EXTINF")) {
            const logoMatch = line.match(/tvg-logo="([^"]+)"/);
            const thumb = logoMatch ? logoMatch[1] : "https://via.placeholder.com/120x80?text=Canal";

            const groupMatch = line.match(/group-title="([^"]+)"/);
            let category = groupMatch ? groupMatch[1] : "Outros";

            const commaIndex = line.indexOf(',');
            const name = commaIndex > -1 ? line.substring(commaIndex + 1).trim() : line;

            let j = i + 1;
            while (j < lines.length && lines[j].startsWith('#')) j++;
            if (j < lines.length && lines[j]) {
                const urls = [lines[j].trim()];
                list.push({ name, urls, thumb, category });
                i = j;
            }
        }
    }

    const categories = {};
    list.forEach(item => {
        if (!categories[item.category]) categories[item.category] = [];
        categories[item.category].push({ name: item.name, url: item.urls[0], thumb: item.thumb });
    });

    return categories;
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

// ---------- Carregar M3U Plus via URL com proxy CORS ----------
function loadM3UPlusFromURL(url) {
    if (!url) return alert('Cole a URL do M3U');
    const corsProxy = "https://cors-anywhere.herokuapp.com/";
    setNote('Carregando playlist...');
    fetch(corsProxy + url)
        .then(r => r.text())
        .then(text => {
            const categorized = parseM3UPlusAdvanced(text);
            renderCategories(categorized);
            setNote('Playlist carregada!');
        })
        .catch(err => {
            console.error(err);
            alert('Erro ao carregar M3U: ' + err.message);
        });
}